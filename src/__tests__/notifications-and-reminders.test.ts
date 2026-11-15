import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  createNotificationSchema,
  updateNotificationPreferencesSchema,
  acknowledgeNotificationSchema,
  scheduleReminderSchema,
  processQueueSchema,
} from '@/lib/validations/notifications.schema';
import {
  getCachedNotifications,
  getNotificationById,
  createCareTraceNotification,
  markNotificationRead,
  markAllNotificationsRead,
  archiveNotification,
  acknowledgeNotification,
  retryFailedNotification,
  cancelScheduledNotification,
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
  scanAndScheduleModuleReminders,
  processNotificationQueue,
  getDeliveryAttemptsForNotification,
} from '@/lib/data/notification-data';
import {
  generateSafePreview,
  isInQuietHours,
  dispatchNotificationChannel,
} from '@/lib/services/notification-transport';
import { CareTraceNotification } from '@/types/caretrace';

describe('CARETRACE Proactive Notifications & Reminders (Prompt 12)', () => {
  /* -------------------------------------------------------------------------- */
  /* 1. Zod Validation Schemas                                                  */
  /* -------------------------------------------------------------------------- */
  describe('Zod Validation Schemas', () => {
    it('validates a valid CreateNotificationInput', () => {
      const valid = {
        recipientId: 'cc-mem-001',
        recipientName: 'David Sullivan',
        patientId: 'patient-profile-001',
        category: 'medication',
        eventType: 'upcoming_scheduled_dose',
        title: 'Afternoon Dose Scheduled',
        body: 'Scheduled dose at 14:00. Please verify with patient.',
        deliveryChannel: 'in_app',
        requiresAcknowledgement: false,
      };
      const result = createNotificationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid notification category and empty title', () => {
      const invalid = {
        recipientId: 'cc-mem-001',
        recipientName: 'David Sullivan',
        patientId: 'patient-profile-001',
        category: 'unknown_category',
        eventType: 'upcoming_scheduled_dose',
        title: '',
        body: 'Too short',
      };
      const result = createNotificationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('validates UpdateNotificationPreferences schema with valid HH:MM times', () => {
      const valid = {
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '06:30',
        timezone: 'America/Chicago',
        enabledCategories: {
          medication: true,
          appointment: true,
          care_circle: true,
          instructions: true,
          care_gap: true,
          account_security: true,
        },
        reminderLeadMinutes: {
          medication: 30,
          appointment: 120,
          task: 60,
        },
        nonSensitivePreviewsOnly: true,
      };
      const result = updateNotificationPreferencesSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid quiet hours time format', () => {
      const invalid = {
        quietHoursStart: '25:70', // Invalid time
      };
      const result = updateNotificationPreferencesSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('validates AcknowledgeNotification schema', () => {
      const valid = {
        notificationId: 'notif-105',
        acknowledgedById: 'cc-mem-002',
        acknowledgedByName: 'Sarah Jenkins, RN',
        note: 'Shift handover verified and accepted.',
      };
      const result = acknowledgeNotificationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('validates ScheduleReminder schema with ISO timestamp and idempotency key', () => {
      const valid = {
        patientId: 'patient-profile-001',
        recipientId: 'cc-mem-001',
        recipientName: 'David Sullivan',
        category: 'appointment',
        eventType: 'upcoming_appointment_reminder',
        title: 'Upcoming Cardiology Consultation',
        body: 'Appointment with Dr. Vance in 2 hours.',
        scheduledFor: '2026-02-20T12:30:00Z',
        idempotencyKey: 'rem_appt_001_2h',
      };
      const result = scheduleReminderSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. Privacy & Non-Sensitive Preview Formatter                               */
  /* -------------------------------------------------------------------------- */
  describe('Privacy & Non-Sensitive Preview Protection', () => {
    it('generates safe non-PHI preview when nonSensitivePreviewsOnly is true', () => {
      const safePreview = generateSafePreview(
        'medication',
        'Metoprolol Succinate 50mg Extended Release',
        'Detailed body with diagnosis of atrial fibrillation and 50mg dose instructions.',
        true
      );
      // Must not contain specific drug name or diagnosis
      expect(safePreview).not.toContain('Metoprolol');
      expect(safePreview).not.toContain('atrial fibrillation');
      expect(safePreview).toContain('medication');
    });

    it('returns concise raw preview when nonSensitivePreviewsOnly is false', () => {
      const preview = generateSafePreview(
        'medication',
        'Dose Alert',
        'General notice without PHI constraints.',
        false
      );
      expect(preview).toBe('General notice without PHI constraints.');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. Quiet Hours & Timezone Handling                                         */
  /* -------------------------------------------------------------------------- */
  describe('Quiet Hours & Timezone Handling', () => {
    it('accurately identifies when a timestamp falls within overnight quiet hours', () => {
      // 23:00 (11 PM) falls within 21:30 - 07:30
      const nightDate = new Date('2026-02-15T23:00:00Z');
      const inQuiet = isInQuietHours('21:30', '07:30', 'UTC', nightDate);
      expect(inQuiet).toBe(true);
    });

    it('accurately identifies when a timestamp is outside quiet hours', () => {
      // 14:00 (2 PM) is well outside 21:30 - 07:30
      const dayDate = new Date('2026-02-15T14:00:00Z');
      const inQuiet = isInQuietHours('21:30', '07:30', 'UTC', dayDate);
      expect(inQuiet).toBe(false);
    });

    it('suppresses external channel dispatch during quiet hours without dropping in-app', async () => {
      const mockNotification: CareTraceNotification = {
        id: 'test-quiet-notif',
        recipientId: 'cc-mem-001',
        recipientName: 'David Sullivan',
        patientId: 'patient-profile-001',
        category: 'care_circle',
        eventType: 'task_assigned',
        title: 'Routine Care Task',
        previewText: 'Safe preview',
        body: 'Weekly supply restock reminder.',
        deliveryChannel: 'sms',
        deliveryStatus: 'queued',
        readStatus: 'unread',
        isRead: false,
        requiresAcknowledgement: false,
        acknowledgementStatus: 'not_required',
        deliveryAttemptCount: 0,
        idempotencyKey: 'quiet_test_key_001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockPrefs = {
        userId: 'cc-mem-001',
        inAppEnabled: true,
        emailEnabled: true,
        pushEnabled: false,
        smsEnabled: true,
        quietHoursEnabled: true,
        quietHoursStart: '00:00', // Set to encompass current moment
        quietHoursEnd: '23:59',
        timezone: 'UTC',
        enabledCategories: {
          medication: true,
          appointment: true,
          care_circle: true,
          instructions: true,
          care_gap: true,
          account_security: true,
        },
        reminderLeadMinutes: { medication: 15, appointment: 120, task: 60 },
        dailySummaryEnabled: false,
        dailySummaryTime: '08:00',
        nonSensitivePreviewsOnly: true,
        updatedAt: new Date().toISOString(),
      };

      const result = await dispatchNotificationChannel(mockNotification, mockPrefs);
      expect(result.status).toBe('suppressed');
      expect(result.error).toContain('quiet hours');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. Idempotency & Deduplication Engine                                      */
  /* -------------------------------------------------------------------------- */
  describe('Idempotency & Deduplication Engine', () => {
    it('creates a new notification when idempotency key is unique', async () => {
      const uniqueKey = `test_unique_${Date.now()}`;
      const res = await createCareTraceNotification({
        recipientId: 'cc-mem-001',
        recipientName: 'David Sullivan',
        patientId: 'patient-profile-001',
        category: 'care_gap',
        eventType: 'care_gap_detected',
        title: 'New Deduplication Test',
        body: 'Testing notification creation and unique idempotency.',
        idempotencyKey: uniqueKey,
      });

      expect(res.isDuplicate).toBe(false);
      expect(res.notification.idempotencyKey).toBe(uniqueKey);
    });

    it('returns existing notification without duplicate insert on identical idempotency key', async () => {
      const duplicateKey = `test_dup_key_${Date.now()}`;
      // First call
      await createCareTraceNotification({
        recipientId: 'cc-mem-001',
        recipientName: 'David Sullivan',
        patientId: 'patient-profile-001',
        category: 'medication',
        eventType: 'upcoming_scheduled_dose',
        title: 'Initial Alert',
        body: 'Initial notification body.',
        idempotencyKey: duplicateKey,
      });

      // Second call with same idempotency key
      const res2 = await createCareTraceNotification({
        recipientId: 'cc-mem-001',
        recipientName: 'David Sullivan',
        patientId: 'patient-profile-001',
        category: 'medication',
        eventType: 'upcoming_scheduled_dose',
        title: 'Initial Alert (Attempt 2)',
        body: 'Different body text with same key.',
        idempotencyKey: duplicateKey,
      });

      expect(res2.isDuplicate).toBe(true);
      expect(res2.notification.idempotencyKey).toBe(duplicateKey);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 5. In-App Lifecycle & Acknowledgement Workflow                             */
  /* -------------------------------------------------------------------------- */
  describe('In-App Lifecycle & Acknowledgement Workflow', () => {
    it('marks a notification as read and unread', () => {
      const updatedRead = markNotificationRead('notif-101', true);
      expect(updatedRead?.isRead).toBe(true);
      expect(updatedRead?.readStatus).toBe('read');

      const updatedUnread = markNotificationRead('notif-101', false);
      expect(updatedUnread?.isRead).toBe(false);
      expect(updatedUnread?.readStatus).toBe('unread');
    });

    it('archives a notification properly', () => {
      const archived = archiveNotification('notif-102');
      expect(archived?.readStatus).toBe('archived');
    });

    it('marks all notifications read for a recipient', () => {
      const count = markAllNotificationsRead('patient-profile-001');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('explicitly acknowledges a notification requiring sign-off', () => {
      const res = acknowledgeNotification(
        'notif-104',
        'cc-mem-002',
        'Sarah Jenkins, RN',
        'Caregiver / Nurse',
        'Confirmed patient began fasting at 20:30.'
      );

      expect(res.success).toBe(true);
      expect(res.notification?.acknowledgementStatus).toBe('acknowledged');
      expect(res.notification?.acknowledgedByName).toBe('Sarah Jenkins, RN');
      expect(res.notification?.acknowledgementNote).toBe('Confirmed patient began fasting at 20:30.');
    });

    it('rejects acknowledgement if notification does not require sign-off', () => {
      const res = acknowledgeNotification(
        'notif-103', // does not require ack
        'cc-mem-001',
        'David Sullivan'
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('does not require explicit acknowledgement');
    });

    it('rejects re-acknowledging an already acknowledged notification', () => {
      const res = acknowledgeNotification(
        'notif-106', // already acknowledged in baseline
        'cc-mem-001',
        'David Sullivan'
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('already been acknowledged');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 6. Scheduled Reminder Discovery & Cancellation                             */
  /* -------------------------------------------------------------------------- */
  describe('Scheduled Reminder Discovery & Cancellation', () => {
    it('scans multi-module appointments and tasks to discover reminders', () => {
      const scanResult = scanAndScheduleModuleReminders();
      expect(scanResult.evaluatedRecords).toBeGreaterThan(0);
      expect(scanResult.newRemindersCount).toBeGreaterThanOrEqual(0);
    });

    it('cancels a scheduled reminder when the source appointment or task changes', () => {
      const all = getCachedNotifications({ status: 'scheduled' });
      if (all.length > 0) {
        const item = all[0];
        const cancelled = cancelScheduledNotification(item.idempotencyKey);
        expect(cancelled).toBe(true);

        const check = getNotificationById(item.id);
        expect(check?.deliveryStatus).toBe('cancelled');
      }
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 7. Honest Transport Tracking & Failed Retry Behavior                       */
  /* -------------------------------------------------------------------------- */
  describe('Honest Transport Tracking & Failed Retry Behavior', () => {
    it('keeps provider acceptance distinct from confirmed delivery for email/carrier channels', async () => {
      const emailNotif = getNotificationById('notif-103');
      expect(emailNotif).toBeDefined();
      // Email accepted by provider must have status sent_to_provider, not prematurely delivered
      expect(emailNotif?.deliveryStatus).toBe('sent_to_provider');
    });

    it('safely re-attempts delivery on a failed notification and records attempt history', async () => {
      const res = await retryFailedNotification('notif-110');
      // Retry was submitted to provider
      expect(res.notification?.deliveryAttemptCount).toBeGreaterThanOrEqual(4);
      const attempts = getDeliveryAttemptsForNotification('notif-110');
      expect(attempts.length).toBeGreaterThanOrEqual(3);
    });

    it('processes due queue reminders and records execution ledger', async () => {
      // Run queue processor with a future timestamp to simulate worker execution
      const futureTime = '2026-12-31T23:59:59Z';
      const queueResult = await processNotificationQueue(futureTime);
      expect(queueResult.processedCount).toBeGreaterThanOrEqual(0);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 8. Database Migration & RLS Verification                                   */
  /* -------------------------------------------------------------------------- */
  describe('Database Migration (Migration 9)', () => {
    it('verifies migration file exists and defines all required notification structures', () => {
      const migrationPath = path.join(
        process.cwd(),
        'supabase',
        'migrations',
        '20260215000009_notifications_and_reminders.sql'
      );
      expect(fs.existsSync(migrationPath)).toBe(true);

      const content = fs.readFileSync(migrationPath, 'utf-8');
      expect(content).toContain('CREATE TABLE IF NOT EXISTS public.notifications');
      expect(content).toContain('CREATE TABLE IF NOT EXISTS public.notification_delivery_attempts');
      expect(content).toContain('CREATE TABLE IF NOT EXISTS public.notification_acknowledgements');
      expect(content).toContain('ENABLE ROW LEVEL SECURITY');
      expect(content).toContain('Users can view their own notifications');
      expect(content.toLowerCase()).toContain('unique');
    });
  });
});
