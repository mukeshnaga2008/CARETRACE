/**
 * CARETRACE Notification Data Store & Reminder Engine
 * PromptWars × Catalyst 2026: Phase 12
 * 
 * Features:
 * - Deterministic deduplication via idempotency keys
 * - Multi-category proactive notification lifecycle
 * - Honest delivery state tracking (sent_to_provider != delivered)
 * - User-configurable quiet hours & channel suppression
 * - Non-sensitive preview stripping for privacy
 * - Explicit human acknowledgement workflows
 */

import {
  CareTraceNotification,
  NotificationCategory,
  NotificationDeliveryStatus,
  NotificationReadStatus,
  NotificationAcknowledgementStatus,
  NotificationPreference,
  NotificationDeliveryAttempt,
  NotificationAcknowledgement,
} from "@/types/caretrace";
import {
  generateSafePreview,
  isInQuietHours,
  dispatchNotificationChannel,
} from "@/lib/services/notification-transport";
import { getCachedAppointments } from "@/lib/data/appointment-intelligence-data";
import { getCachedDoseEvents, getCachedMedications } from "@/lib/data/medication-lifecycle-data";
import { getCachedTasks, getCachedHandovers } from "@/lib/data/care-circle-data";
import { getCachedInstructions } from "@/lib/data/instruction-vault-data";
import { getCachedContinuityReviews } from "@/lib/data/care-continuity-data";
import { getCachedCareGaps } from "@/lib/data/care-gap-intelligence-data";

/* -------------------------------------------------------------------------- */
/* 1. Baseline User Preferences                                               */
/* -------------------------------------------------------------------------- */

export const INITIAL_NOTIFICATION_PREFERENCES: Record<string, NotificationPreference> = {
  // Elderly Patient: Margaret Sullivan
  patient: {
    userId: "patient-profile-001",
    userRole: "Elder Patient",
    inAppEnabled: true,
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: false,
    quietHoursEnabled: true,
    quietHoursStart: "21:30",
    quietHoursEnd: "07:30",
    timezone: "America/Chicago",
    enabledCategories: {
      medication: true,
      appointment: true,
      care_circle: true,
      instructions: false,
      care_gap: true,
      account_security: true,
    },
    reminderLeadMinutes: {
      medication: 15,
      appointment: 120, // 2 hours
      task: 60,
    },
    dailySummaryEnabled: false,
    dailySummaryTime: "08:00",
    nonSensitivePreviewsOnly: true,
    updatedAt: "2026-02-15T08:00:00Z",
  },
  // Family Coordinator: David Sullivan
  family: {
    userId: "cc-mem-001",
    userRole: "Family Member",
    inAppEnabled: true,
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: false,
    quietHoursEnabled: true,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    timezone: "America/Chicago",
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
      appointment: 1440, // 24 hours
      task: 120,
    },
    dailySummaryEnabled: true,
    dailySummaryTime: "07:30",
    nonSensitivePreviewsOnly: false,
    updatedAt: "2026-02-15T08:00:00Z",
  },
  // Caregiver / Visiting Nurse: Sarah Jenkins, RN
  caregiver: {
    userId: "cc-mem-002",
    userRole: "Caregiver / Nurse",
    inAppEnabled: true,
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: false,
    quietHoursEnabled: false,
    quietHoursStart: "23:00",
    quietHoursEnd: "06:00",
    timezone: "America/Chicago",
    enabledCategories: {
      medication: true,
      appointment: true,
      care_circle: true,
      instructions: true,
      care_gap: true,
      account_security: true,
    },
    reminderLeadMinutes: {
      medication: 15,
      appointment: 60,
      task: 30,
    },
    dailySummaryEnabled: false,
    dailySummaryTime: "07:00",
    nonSensitivePreviewsOnly: false,
    updatedAt: "2026-02-15T08:00:00Z",
  },
};

let cachedPreferences: Record<string, NotificationPreference> = {
  ...INITIAL_NOTIFICATION_PREFERENCES,
};

/* -------------------------------------------------------------------------- */
/* 2. Baseline Notifications Repository                                       */
/* -------------------------------------------------------------------------- */

export const INITIAL_NOTIFICATIONS: CareTraceNotification[] = [
  // 1. Medication - Missed Event
  {
    id: "notif-101",
    recipientId: "cc-mem-001",
    recipientName: "David Sullivan",
    recipientRole: "Family Member",
    patientId: "patient-profile-001",
    category: "medication",
    eventType: "dose_missed_or_skipped",
    title: "Missed Scheduled Dose: Metoprolol Succinate",
    previewText: "Care reminder: Scheduled medication coordination item requires attention.",
    body: "The 08:00 AM scheduled dose of Metoprolol Succinate 50mg was marked 'missed'. Clinical safety notice: Do NOT give an extra dose or alter the schedule. Check on Margaret's status.",
    internalEventRef: "dose-event-003",
    relatedRecordType: "dose_event",
    relatedRecordId: "dose-event-003",
    actionUrl: "/medications/adherence",
    deliveryChannel: "in_app",
    deliveryStatus: "delivered",
    readStatus: "unread",
    isRead: false,
    requiresAcknowledgement: true,
    acknowledgementStatus: "pending",
    deliveryAttemptCount: 1,
    lastDeliveryAttempt: "2026-02-15T08:45:00Z",
    providerReference: "in-app-notif-101",
    idempotencyKey: "med_missed_dose-event-003_david",
    createdAt: "2026-02-15T08:45:00Z",
    updatedAt: "2026-02-15T08:45:00Z",
  },
  // 2. Medication - Upcoming Scheduled Dose
  {
    id: "notif-102",
    recipientId: "patient-profile-001",
    recipientName: "Margaret Sullivan",
    recipientRole: "Elder Patient",
    patientId: "patient-profile-001",
    category: "medication",
    eventType: "upcoming_scheduled_dose",
    title: "Upcoming Afternoon Dose: Lisinopril 10mg",
    previewText: "Care reminder: Scheduled daily medication dose due.",
    body: "Your afternoon Lisinopril 10mg dose is scheduled in 15 minutes (14:00). Please take with water.",
    internalEventRef: "dose-event-004",
    relatedRecordType: "dose_event",
    relatedRecordId: "dose-event-004",
    actionUrl: "/medications",
    deliveryChannel: "in_app",
    deliveryStatus: "delivered",
    readStatus: "unread",
    isRead: false,
    requiresAcknowledgement: false,
    acknowledgementStatus: "not_required",
    deliveryAttemptCount: 1,
    lastDeliveryAttempt: "2026-02-15T13:45:00Z",
    providerReference: "in-app-notif-102",
    scheduledFor: "2026-02-15T13:45:00Z",
    idempotencyKey: "med_due_dose-event-004_margaret",
    createdAt: "2026-02-15T13:45:00Z",
    updatedAt: "2026-02-15T13:45:00Z",
  },
  // 3. Appointment - Upcoming Clinical Visit
  {
    id: "notif-103",
    recipientId: "cc-mem-001",
    recipientName: "David Sullivan",
    recipientRole: "Family Member",
    patientId: "patient-profile-001",
    category: "appointment",
    eventType: "upcoming_appointment_reminder",
    title: "Upcoming Visit: Dr. Eleanor Vance, MD (Cardiology)",
    previewText: "Appointment reminder: Upcoming clinical consultation scheduled.",
    body: "Consultation scheduled for Thursday, Feb 20, 2026, at 14:30 at Metropolitan Heart Centre. Transportation coordination confirmed.",
    internalEventRef: "appt-001",
    relatedRecordType: "appointment",
    relatedRecordId: "appt-001",
    actionUrl: "/appointments/appt-001",
    deliveryChannel: "email",
    deliveryStatus: "sent_to_provider",
    readStatus: "read",
    isRead: true,
    requiresAcknowledgement: false,
    acknowledgementStatus: "not_required",
    deliveryAttemptCount: 1,
    lastDeliveryAttempt: "2026-02-14T09:00:00Z",
    providerReference: "resend_msg_882947193",
    providerResponse: {
      statusCode: 202,
      statusText: "Accepted",
      message: "Resend accepted email dispatch job.",
      rawId: "resend_msg_882947193",
    },
    scheduledFor: "2026-02-14T09:00:00Z",
    sentAt: "2026-02-14T09:00:02Z",
    idempotencyKey: "appt_rem_appt-001_david_email",
    createdAt: "2026-02-14T09:00:00Z",
    updatedAt: "2026-02-14T09:05:00Z",
  },
  // 4. Appointment - Preparation Reminder (Fasting)
  {
    id: "notif-104",
    recipientId: "cc-mem-002",
    recipientName: "Sarah Jenkins, RN",
    recipientRole: "Caregiver / Nurse",
    patientId: "patient-profile-001",
    category: "appointment",
    eventType: "appointment_prep_reminder",
    title: "Pre-Visit Prep Required: 12-Hour Fasting Protocol",
    previewText: "Appointment reminder: Diagnostic fasting preparation required.",
    body: "Margaret has a fasting comprehensive metabolic lab panel scheduled for tomorrow at 08:30 AM. Ensure no food or caloric liquids after 20:30 tonight.",
    internalEventRef: "appt-002",
    relatedRecordType: "appointment",
    relatedRecordId: "appt-002",
    actionUrl: "/appointments/preparation",
    deliveryChannel: "in_app",
    deliveryStatus: "delivered",
    readStatus: "unread",
    isRead: false,
    requiresAcknowledgement: true,
    acknowledgementStatus: "pending",
    deliveryAttemptCount: 1,
    lastDeliveryAttempt: "2026-02-14T18:00:00Z",
    providerReference: "in-app-notif-104",
    idempotencyKey: "appt_prep_appt-002_sarah",
    createdAt: "2026-02-14T18:00:00Z",
    updatedAt: "2026-02-14T18:00:00Z",
  },
  // 5. Care Circle - Shift Handover Sign-off Request
  {
    id: "notif-105",
    recipientId: "cc-mem-002",
    recipientName: "Sarah Jenkins, RN",
    recipientRole: "Caregiver / Nurse",
    patientId: "patient-profile-001",
    category: "care_circle",
    eventType: "handover_ack_requested",
    title: "Shift Handover Awaiting Acknowledgement",
    previewText: "Care Circle update: Responsibility assignment or handover pending review.",
    body: "Shift handover report from Elena Rostova (Night Shift) is pending bilateral sign-off. Review vital sign logs and pending morning mobility checks.",
    internalEventRef: "handover-001",
    relatedRecordType: "shift_handover",
    relatedRecordId: "handover-001",
    actionUrl: "/care-circle/handover",
    deliveryChannel: "in_app",
    deliveryStatus: "delivered",
    readStatus: "unread",
    isRead: false,
    requiresAcknowledgement: true,
    acknowledgementStatus: "pending",
    deliveryAttemptCount: 1,
    lastDeliveryAttempt: "2026-02-15T07:15:00Z",
    providerReference: "in-app-notif-105",
    idempotencyKey: "care_handover_ack_handover-001_sarah",
    createdAt: "2026-02-15T07:15:00Z",
    updatedAt: "2026-02-15T07:15:00Z",
  },
  // 6. Care Circle - Task Assignment
  {
    id: "notif-106",
    recipientId: "cc-mem-001",
    recipientName: "David Sullivan",
    recipientRole: "Family Member",
    patientId: "patient-profile-001",
    category: "care_circle",
    eventType: "task_assigned",
    title: "Care Task Assigned: Coordinate Cardiology Transportation",
    previewText: "Care Circle update: New care coordination responsibility assigned.",
    body: "You have been assigned to provide companion transportation for Margaret's visit with Dr. Vance on Thursday at 14:00.",
    internalEventRef: "task-002",
    relatedRecordType: "care_task",
    relatedRecordId: "task-002",
    actionUrl: "/care-circle/tasks",
    deliveryChannel: "in_app",
    deliveryStatus: "delivered",
    readStatus: "read",
    isRead: true,
    requiresAcknowledgement: true,
    acknowledgementStatus: "acknowledged",
    acknowledgedAt: "2026-02-14T11:30:00Z",
    acknowledgedById: "cc-mem-001",
    acknowledgedByName: "David Sullivan",
    acknowledgementNote: "Confirmed. I will drive Margaret and arrive by 13:30.",
    deliveryAttemptCount: 1,
    lastDeliveryAttempt: "2026-02-14T10:00:00Z",
    providerReference: "in-app-notif-106",
    idempotencyKey: "care_task_assigned_task-002_david",
    createdAt: "2026-02-14T10:00:00Z",
    updatedAt: "2026-02-14T11:30:00Z",
  },
  // 7. Instructions - Instruction Diff Awaiting Verification
  {
    id: "notif-107",
    recipientId: "cc-mem-002",
    recipientName: "Sarah Jenkins, RN",
    recipientRole: "Caregiver / Nurse",
    patientId: "patient-profile-001",
    category: "instructions",
    eventType: "instruction_awaiting_verification",
    title: "Instruction Vault: Clinical Directive v2 Diff Awaiting Review",
    previewText: "Instruction Vault: Clinical care directive update requires human review.",
    body: "Cardiology discharge instructions updated with systolic withholding threshold (< 100 mmHg). Verification required before protocol approval.",
    internalEventRef: "inst-001",
    relatedRecordType: "instruction",
    relatedRecordId: "inst-001",
    actionUrl: "/instructions/review",
    deliveryChannel: "in_app",
    deliveryStatus: "delivered",
    readStatus: "unread",
    isRead: false,
    requiresAcknowledgement: true,
    acknowledgementStatus: "pending",
    deliveryAttemptCount: 1,
    lastDeliveryAttempt: "2026-02-13T14:00:00Z",
    providerReference: "in-app-notif-107",
    idempotencyKey: "inst_verify_inst-001_sarah",
    createdAt: "2026-02-13T14:00:00Z",
    updatedAt: "2026-02-13T14:00:00Z",
  },
  // 8. Care Continuity Engine - Clarification Requested
  {
    id: "notif-108",
    recipientId: "cc-mem-002",
    recipientName: "Sarah Jenkins, RN",
    recipientRole: "Caregiver / Nurse",
    patientId: "patient-profile-001",
    category: "instructions",
    eventType: "continuity_clarification_requested",
    title: "Care Continuity Review: Author Clarification Requested",
    previewText: "Instruction Vault: Continuity clarification requested by reviewer.",
    body: "Downstream synchronization for dose event prompts is paused pending clarification on morning vs evening resting BP measurement timing.",
    internalEventRef: "rev-002",
    relatedRecordType: "continuity_review",
    relatedRecordId: "rev-002",
    actionUrl: "/continuity/reviews/rev-002",
    deliveryChannel: "in_app",
    deliveryStatus: "delivered",
    readStatus: "unread",
    isRead: false,
    requiresAcknowledgement: false,
    acknowledgementStatus: "not_required",
    deliveryAttemptCount: 1,
    lastDeliveryAttempt: "2026-02-14T16:30:00Z",
    providerReference: "in-app-notif-108",
    idempotencyKey: "cont_clarif_rev-002_sarah",
    createdAt: "2026-02-14T16:30:00Z",
    updatedAt: "2026-02-14T16:30:00Z",
  },
  // 9. Care Gap Radar - High Priority Gap Detected
  {
    id: "notif-109",
    recipientId: "cc-mem-001",
    recipientName: "David Sullivan",
    recipientRole: "Family Member",
    patientId: "patient-profile-001",
    category: "care_gap",
    eventType: "care_gap_detected",
    title: "Care Gap Detected: Incomplete Pre-Visit Checklist",
    previewText: "Care Gap Radar: Coordination follow-up flagged for Care Circle response.",
    body: "Upcoming visit with Dr. Vance has 2 unaddressed preparation items (current OTC supplement list and medication reconciliation).",
    internalEventRef: "gap-003",
    relatedRecordType: "care_gap",
    relatedRecordId: "gap-003",
    actionUrl: "/care-gaps/gap-003",
    deliveryChannel: "in_app",
    deliveryStatus: "delivered",
    readStatus: "unread",
    isRead: false,
    requiresAcknowledgement: false,
    acknowledgementStatus: "not_required",
    deliveryAttemptCount: 1,
    lastDeliveryAttempt: "2026-02-15T09:10:00Z",
    providerReference: "in-app-notif-109",
    idempotencyKey: "gap_detected_gap-003_david",
    createdAt: "2026-02-15T09:10:00Z",
    updatedAt: "2026-02-15T09:10:00Z",
  },
  // 10. Failed Carrier Delivery - SMS Carrier Timeout
  {
    id: "notif-110",
    recipientId: "cc-mem-001",
    recipientName: "David Sullivan",
    recipientRole: "Family Member",
    patientId: "patient-profile-001",
    category: "medication",
    eventType: "dose_missed_or_skipped",
    title: "Carrier SMS Delivery Failed: Blood Pressure Alert",
    previewText: "Care reminder: Scheduled medication coordination item requires attention.",
    body: "SMS transmission failed. Upstream Carrier returned HTTP 504 Gateway Timeout after 3 retries. Notification preserved in In-App Centre.",
    internalEventRef: "dose-event-001",
    relatedRecordType: "dose_event",
    relatedRecordId: "dose-event-001",
    actionUrl: "/notifications/notif-110",
    deliveryChannel: "sms",
    deliveryStatus: "failed",
    readStatus: "unread",
    isRead: false,
    requiresAcknowledgement: false,
    acknowledgementStatus: "not_required",
    deliveryAttemptCount: 3,
    lastDeliveryAttempt: "2026-02-15T08:15:00Z",
    providerReference: "carrier-sms-err-004",
    providerResponse: {
      statusCode: 504,
      statusText: "Gateway Timeout",
      message: "SMS Gateway 504: Carrier cellular network unreachable for recipient phone.",
    },
    idempotencyKey: "sms_fail_alert_david_004",
    createdAt: "2026-02-15T08:15:00Z",
    updatedAt: "2026-02-15T08:18:00Z",
  },
  // 11. Quiet Hours Channel Suppression Record
  {
    id: "notif-111",
    recipientId: "patient-profile-001",
    recipientName: "Margaret Sullivan",
    recipientRole: "Elder Patient",
    patientId: "patient-profile-001",
    category: "care_circle",
    eventType: "task_assigned",
    title: "Weekly Grocery & Hydration Check",
    previewText: "Care reminder: Routine care task coordination update.",
    body: "Non-urgent hydration reminder logged. External SMS delivery suppressed during quiet hours (21:30 - 07:30).",
    internalEventRef: "task-005",
    relatedRecordType: "care_task",
    relatedRecordId: "task-005",
    actionUrl: "/care-circle/tasks",
    deliveryChannel: "sms",
    deliveryStatus: "suppressed",
    suppressionReason: "Channel delivery suppressed during configured quiet hours (21:30 - 07:30 America/Chicago). Retained in-app.",
    readStatus: "unread",
    isRead: false,
    requiresAcknowledgement: false,
    acknowledgementStatus: "not_required",
    deliveryAttemptCount: 0,
    idempotencyKey: "quiet_suppress_task-005_margaret",
    createdAt: "2026-02-14T23:15:00Z",
    updatedAt: "2026-02-14T23:15:00Z",
  },
  // 12. Account & Security - Proxy Access Confirmation
  {
    id: "notif-112",
    recipientId: "cc-mem-001",
    recipientName: "David Sullivan",
    recipientRole: "Family Member",
    patientId: "patient-profile-001",
    category: "account_security",
    eventType: "access_permission_changed",
    title: "Security Notice: Healthcare Proxy Access Confirmed",
    previewText: "Security notice: Account access or permission setting updated.",
    body: "Your healthcare proxy authorization and audit visibility consent for Margaret Sullivan was verified and activated.",
    internalEventRef: "sec-001",
    relatedRecordType: "security_event",
    relatedRecordId: "sec-001",
    actionUrl: "/profile/access",
    deliveryChannel: "in_app",
    deliveryStatus: "delivered",
    readStatus: "read",
    isRead: true,
    requiresAcknowledgement: false,
    acknowledgementStatus: "not_required",
    deliveryAttemptCount: 1,
    lastDeliveryAttempt: "2026-02-11T12:00:00Z",
    providerReference: "in-app-notif-112",
    idempotencyKey: "sec_proxy_verify_david_001",
    createdAt: "2026-02-11T12:00:00Z",
    updatedAt: "2026-02-11T12:05:00Z",
  },
];

let cachedNotifications: CareTraceNotification[] = [...INITIAL_NOTIFICATIONS];

/* -------------------------------------------------------------------------- */
/* 3. Baseline Delivery Attempts & Acknowledgements                           */
/* -------------------------------------------------------------------------- */

export const INITIAL_DELIVERY_ATTEMPTS: NotificationDeliveryAttempt[] = [
  {
    id: "att-001",
    notificationId: "notif-103",
    channel: "email",
    attemptNumber: 1,
    status: "sent_to_provider",
    providerName: "resend",
    providerResponseCode: "202",
    errorMessage: undefined,
    timestamp: "2026-02-14T09:00:02Z",
  },
  {
    id: "att-002",
    notificationId: "notif-110",
    channel: "sms",
    attemptNumber: 1,
    status: "failed",
    providerName: "carrier_sms_gateway",
    providerResponseCode: "504",
    errorMessage: "Gateway Timeout: Carrier network unreachable",
    timestamp: "2026-02-15T08:15:05Z",
  },
  {
    id: "att-003",
    notificationId: "notif-110",
    channel: "sms",
    attemptNumber: 2,
    status: "failed",
    providerName: "carrier_sms_gateway",
    providerResponseCode: "504",
    errorMessage: "Gateway Timeout: Retry 1 timed out",
    timestamp: "2026-02-15T08:16:30Z",
  },
  {
    id: "att-004",
    notificationId: "notif-110",
    channel: "sms",
    attemptNumber: 3,
    status: "failed",
    providerName: "carrier_sms_gateway",
    providerResponseCode: "504",
    errorMessage: "Gateway Timeout: Max retries (3) exhausted. Delivery failed.",
    timestamp: "2026-02-15T08:18:00Z",
  },
];

let cachedDeliveryAttempts: NotificationDeliveryAttempt[] = [...INITIAL_DELIVERY_ATTEMPTS];

export const INITIAL_ACKNOWLEDGEMENTS: NotificationAcknowledgement[] = [
  {
    id: "ack-001",
    notificationId: "notif-106",
    patientId: "patient-profile-001",
    sourceRecordType: "care_task",
    sourceRecordId: "task-002",
    acknowledgedById: "cc-mem-001",
    acknowledgedByName: "David Sullivan",
    acknowledgedByRole: "Family Member",
    previousStatus: "pending",
    newStatus: "acknowledged",
    note: "Confirmed. I will drive Margaret and arrive by 13:30.",
    acknowledgedAt: "2026-02-14T11:30:00Z",
  },
];

let cachedAcknowledgements: NotificationAcknowledgement[] = [...INITIAL_ACKNOWLEDGEMENTS];

/* -------------------------------------------------------------------------- */
/* 4. Repository Access & Query Operations                                    */
/* -------------------------------------------------------------------------- */

export function getCachedNotifications(filters?: {
  recipientId?: string;
  category?: string;
  status?: string;
  readStatus?: string;
  requiresAck?: boolean;
}): CareTraceNotification[] {
  let list = [...cachedNotifications];

  if (!filters) return list;

  if (filters.recipientId && filters.recipientId !== "all") {
    list = list.filter((n) => n.recipientId === filters.recipientId);
  }

  if (filters.category && filters.category !== "all") {
    list = list.filter((n) => n.category === filters.category);
  }

  if (filters.status && filters.status !== "all") {
    list = list.filter((n) => n.deliveryStatus === filters.status);
  }

  if (filters.readStatus && filters.readStatus !== "all") {
    list = list.filter((n) => n.readStatus === filters.readStatus);
  }

  if (filters.requiresAck !== undefined) {
    list = list.filter((n) => n.requiresAcknowledgement === filters.requiresAck);
  }

  // Sort newest first
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getNotificationById(id: string): CareTraceNotification | undefined {
  return cachedNotifications.find((n) => n.id === id);
}

export function getDeliveryAttemptsForNotification(notificationId: string): NotificationDeliveryAttempt[] {
  return cachedDeliveryAttempts
    .filter((a) => a.notificationId === notificationId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function getCachedDeliveryAttempts(): NotificationDeliveryAttempt[] {
  return cachedDeliveryAttempts;
}

export function getCachedAcknowledgements(): NotificationAcknowledgement[] {
  return cachedAcknowledgements;
}

export function getUserNotificationPreferences(userRoleOrKey: string = "family"): NotificationPreference {
  const pref = cachedPreferences[userRoleOrKey] || cachedPreferences.family;
  return { ...pref };
}

export function updateUserNotificationPreferences(
  userRoleOrKey: string,
  updates: Partial<NotificationPreference>
): NotificationPreference {
  const current = getUserNotificationPreferences(userRoleOrKey);
  const updated: NotificationPreference = {
    ...current,
    ...updates,
    enabledCategories: {
      ...current.enabledCategories,
      ...(updates.enabledCategories || {}),
    },
    reminderLeadMinutes: {
      ...current.reminderLeadMinutes,
      ...(updates.reminderLeadMinutes || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  cachedPreferences[userRoleOrKey] = updated;
  return updated;
}

/* -------------------------------------------------------------------------- */
/* 5. Notification Creation with Idempotency & Quiet Hours Deduplication      */
/* -------------------------------------------------------------------------- */

export async function createCareTraceNotification(
  input: {
    recipientId: string;
    recipientName: string;
    recipientRole?: string;
    patientId: string;
    category: NotificationCategory;
    eventType: any;
    title: string;
    previewText?: string;
    body: string;
    deliveryChannel?: any;
    requiresAcknowledgement?: boolean;
    scheduledFor?: string;
    relatedRecordType?: string;
    relatedRecordId?: string;
    actionUrl?: string;
    idempotencyKey?: string;
  },
  userRoleOrKey: string = "family"
): Promise<{ notification: CareTraceNotification; isDuplicate: boolean }> {
  const now = new Date().toISOString();
  const idempotencyKey =
    input.idempotencyKey ||
    `${input.category}_${input.eventType}_${input.recipientId}_${input.relatedRecordId || Date.now()}`;

  // 1. Idempotency Check: Return existing if key matches
  const existing = cachedNotifications.find((n) => n.idempotencyKey === idempotencyKey);
  if (existing) {
    return { notification: existing, isDuplicate: true };
  }

  const prefs = getUserNotificationPreferences(userRoleOrKey);
  const deliveryChannel = input.deliveryChannel || "in_app";

  // 2. Safe non-sensitive preview generation
  const preview =
    input.previewText ||
    generateSafePreview(input.category, input.title, input.body, prefs.nonSensitivePreviewsOnly);

  const newNotif: CareTraceNotification = {
    id: `notif-${Date.now()}`,
    recipientId: input.recipientId,
    recipientName: input.recipientName,
    recipientRole: input.recipientRole || "Care Circle Member",
    patientId: input.patientId,
    category: input.category,
    eventType: input.eventType,
    title: input.title,
    previewText: preview,
    body: input.body,
    internalEventRef: input.relatedRecordId,
    relatedRecordType: input.relatedRecordType,
    relatedRecordId: input.relatedRecordId,
    actionUrl: input.actionUrl,
    deliveryChannel,
    deliveryStatus: input.scheduledFor ? "scheduled" : "processing",
    readStatus: "unread",
    isRead: false,
    requiresAcknowledgement: !!input.requiresAcknowledgement,
    acknowledgementStatus: input.requiresAcknowledgement ? "pending" : "not_required",
    deliveryAttemptCount: 0,
    scheduledFor: input.scheduledFor,
    idempotencyKey,
    createdAt: now,
    updatedAt: now,
  };

  // If not scheduled for future, dispatch immediately
  if (!input.scheduledFor) {
    const dispatchResult = await dispatchNotificationChannel(newNotif, prefs);
    newNotif.deliveryStatus = dispatchResult.status;
    newNotif.deliveryAttemptCount = 1;
    newNotif.lastDeliveryAttempt = now;
    newNotif.providerReference = dispatchResult.providerReference;
    newNotif.providerResponse = dispatchResult.providerResponse;
    if (dispatchResult.error) {
      newNotif.suppressionReason = dispatchResult.error;
    }

    // Log attempt
    cachedDeliveryAttempts.push({
      id: `att-${Date.now()}`,
      notificationId: newNotif.id,
      channel: deliveryChannel,
      attemptNumber: 1,
      status: dispatchResult.status === "failed" ? "failed" : "sent_to_provider",
      providerName: deliveryChannel === "email" ? "resend" : deliveryChannel === "sms" ? "carrier_sms" : "in_app_broker",
      providerResponseCode: dispatchResult.providerResponse?.statusCode ? String(dispatchResult.providerResponse.statusCode) : undefined,
      errorMessage: dispatchResult.error,
      timestamp: now,
    });
  }

  cachedNotifications.unshift(newNotif);
  return { notification: newNotif, isDuplicate: false };
}

/* -------------------------------------------------------------------------- */
/* 6. Lifecycle Management: Read, Archive & Acknowledgement                  */
/* -------------------------------------------------------------------------- */

export function markNotificationRead(id: string, isRead: boolean = true): CareTraceNotification | undefined {
  const notif = cachedNotifications.find((n) => n.id === id);
  if (!notif) return undefined;

  notif.isRead = isRead;
  notif.readStatus = isRead ? "read" : "unread";
  notif.updatedAt = new Date().toISOString();
  return { ...notif };
}

export function markAllNotificationsRead(recipientId?: string): number {
  let count = 0;
  const now = new Date().toISOString();
  cachedNotifications.forEach((n) => {
    if (!recipientId || n.recipientId === recipientId) {
      if (!n.isRead) {
        n.isRead = true;
        n.readStatus = "read";
        n.updatedAt = now;
        count++;
      }
    }
  });
  return count;
}

export function archiveNotification(id: string): CareTraceNotification | undefined {
  const notif = cachedNotifications.find((n) => n.id === id);
  if (!notif) return undefined;

  notif.readStatus = "archived";
  notif.updatedAt = new Date().toISOString();
  return { ...notif };
}

export function acknowledgeNotification(
  id: string,
  acknowledgedById: string,
  acknowledgedByName: string,
  acknowledgedByRole: string = "Care Circle Member",
  note?: string
): { success: boolean; notification?: CareTraceNotification; error?: string } {
  const notif = cachedNotifications.find((n) => n.id === id);
  if (!notif) {
    return { success: false, error: "Notification not found" };
  }

  if (!notif.requiresAcknowledgement) {
    return { success: false, error: "This notification does not require explicit acknowledgement." };
  }

  if (notif.acknowledgementStatus === "acknowledged") {
    return { success: false, error: "This notification has already been acknowledged." };
  }

  const now = new Date().toISOString();
  const previousStatus = notif.acknowledgementStatus;

  notif.acknowledgementStatus = "acknowledged";
  notif.acknowledgedAt = now;
  notif.acknowledgedById = acknowledgedById;
  notif.acknowledgedByName = acknowledgedByName;
  notif.acknowledgementNote = note;
  notif.isRead = true;
  notif.readStatus = "read";
  notif.updatedAt = now;

  // Record immutable acknowledgement
  const ackRecord: NotificationAcknowledgement = {
    id: `ack-${Date.now()}`,
    notificationId: notif.id,
    patientId: notif.patientId,
    sourceRecordType: notif.relatedRecordType,
    sourceRecordId: notif.relatedRecordId,
    acknowledgedById,
    acknowledgedByName,
    acknowledgedByRole,
    previousStatus,
    newStatus: "acknowledged",
    note,
    acknowledgedAt: now,
  };
  cachedAcknowledgements.push(ackRecord);

  return { success: true, notification: { ...notif } };
}

/* -------------------------------------------------------------------------- */
/* 7. Failed Delivery Retry & Cancellation                                    */
/* -------------------------------------------------------------------------- */

export async function retryFailedNotification(
  id: string,
  userRoleOrKey: string = "family"
): Promise<{ success: boolean; notification?: CareTraceNotification; error?: string }> {
  const notif = cachedNotifications.find((n) => n.id === id);
  if (!notif) {
    return { success: false, error: "Notification not found." };
  }

  const prefs = getUserNotificationPreferences(userRoleOrKey);
  const now = new Date().toISOString();

  const dispatchResult = await dispatchNotificationChannel(notif, prefs);

  notif.deliveryStatus = dispatchResult.status;
  notif.deliveryAttemptCount += 1;
  notif.lastDeliveryAttempt = now;
  notif.providerReference = dispatchResult.providerReference || notif.providerReference;
  notif.providerResponse = dispatchResult.providerResponse || notif.providerResponse;
  notif.suppressionReason = dispatchResult.error;
  notif.updatedAt = now;

  cachedDeliveryAttempts.push({
    id: `att-${Date.now()}`,
    notificationId: notif.id,
    channel: notif.deliveryChannel,
    attemptNumber: notif.deliveryAttemptCount,
    status: dispatchResult.status === "failed" ? "failed" : "sent_to_provider",
    providerName: notif.deliveryChannel === "email" ? "resend" : "carrier_sms",
    providerResponseCode: dispatchResult.providerResponse?.statusCode ? String(dispatchResult.providerResponse.statusCode) : undefined,
    errorMessage: dispatchResult.error,
    timestamp: now,
  });

  return { success: dispatchResult.status !== "failed", notification: { ...notif } };
}

export function cancelScheduledNotification(idempotencyKey: string): boolean {
  const notif = cachedNotifications.find((n) => n.idempotencyKey === idempotencyKey);
  if (notif && notif.deliveryStatus === "scheduled") {
    notif.deliveryStatus = "cancelled";
    notif.updatedAt = new Date().toISOString();
    return true;
  }
  return false;
}

/* -------------------------------------------------------------------------- */
/* 8. Proactive Multi-Module Reminder Discovery & Queue Processing            */
/* -------------------------------------------------------------------------- */

export function scanAndScheduleModuleReminders(): { newRemindersCount: number; evaluatedRecords: number } {
  let count = 0;
  let evaluated = 0;

  // 1. Scan Appointments
  const appointments = getCachedAppointments();
  appointments.forEach((appt) => {
    evaluated++;
    const apptDateStr = appt.appointmentDatetime || `${appt.scheduledDate || "2026-02-20"}T${appt.scheduledTime || "14:00"}:00Z`;
    const apptTime = new Date(apptDateStr).getTime();
    const twoHoursBefore = new Date(apptTime - 2 * 3600 * 1000).toISOString();

    const key = `rem_appt_${appt.id}_2h`;
    const exists = cachedNotifications.some((n) => n.idempotencyKey === key);
    if (!exists) {
      const docName = appt.providerName || appt.doctorName || "Physician";
      const clinic = appt.clinicName || appt.facility || "Clinic";
      cachedNotifications.push({
        id: `notif-rem-appt-${appt.id}`,
        recipientId: "cc-mem-001",
        recipientName: "David Sullivan",
        recipientRole: "Family Member",
        patientId: appt.patientId || "patient-profile-001",
        category: "appointment",
        eventType: "upcoming_appointment_reminder",
        title: `Appointment in 2 Hours: ${docName}`,
        previewText: "Appointment reminder: Upcoming clinical consultation scheduled.",
        body: `Upcoming consultation with ${docName} at ${clinic} is scheduled in 2 hours. Ensure transportation and checklist items are ready.`,
        internalEventRef: appt.id,
        relatedRecordType: "appointment",
        relatedRecordId: appt.id,
        actionUrl: `/appointments/${appt.id}`,
        deliveryChannel: "in_app",
        deliveryStatus: "scheduled",
        readStatus: "unread",
        isRead: false,
        requiresAcknowledgement: false,
        acknowledgementStatus: "not_required",
        deliveryAttemptCount: 0,
        scheduledFor: twoHoursBefore,
        idempotencyKey: key,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      count++;
    }
  });

  // 2. Scan Care Tasks
  const tasks = getCachedTasks();
  tasks.forEach((task) => {
    evaluated++;
    if (task.status !== "completed" && task.status !== "cancelled") {
      const key = `rem_task_${task.id}_due`;
      const exists = cachedNotifications.some((n) => n.idempotencyKey === key);
      if (!exists && task.assignedToId) {
        cachedNotifications.push({
          id: `notif-rem-task-${task.id}`,
          recipientId: task.assignedToId,
          recipientName: task.assignedToName || "Caregiver",
          recipientRole: task.assignedToRole || "Care Circle Member",
          patientId: task.patientId,
          category: "care_circle",
          eventType: "task_assigned",
          title: `Task Reminder: ${task.title}`,
          previewText: "Care Circle update: Care coordination responsibility due.",
          body: `Reminder: Task "${task.title}" is due soon (${task.dueDate}). Please verify completion.`,
          internalEventRef: task.id,
          relatedRecordType: "care_task",
          relatedRecordId: task.id,
          actionUrl: `/care-circle/tasks/${task.id}`,
          deliveryChannel: "in_app",
          deliveryStatus: "scheduled",
          readStatus: "unread",
          isRead: false,
          requiresAcknowledgement: false,
          acknowledgementStatus: "not_required",
          deliveryAttemptCount: 0,
          scheduledFor: task.dueDate,
          idempotencyKey: key,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        count++;
      }
    }
  });

  return { newRemindersCount: count, evaluatedRecords: evaluated };
}

export async function processNotificationQueue(
  currentTime: string = new Date().toISOString()
): Promise<{ processedCount: number; errors: string[] }> {
  const currentMs = new Date(currentTime).getTime();
  let processed = 0;
  const errors: string[] = [];

  const dueNotifications = cachedNotifications.filter(
    (n) => n.deliveryStatus === "scheduled" && n.scheduledFor && new Date(n.scheduledFor).getTime() <= currentMs
  );

  for (const notif of dueNotifications) {
    try {
      notif.deliveryStatus = "processing";
      const prefs = getUserNotificationPreferences("family");
      const res = await dispatchNotificationChannel(notif, prefs);

      notif.deliveryStatus = res.status;
      notif.deliveryAttemptCount += 1;
      notif.lastDeliveryAttempt = currentTime;
      notif.providerReference = res.providerReference;
      notif.providerResponse = res.providerResponse;
      notif.suppressionReason = res.error;
      notif.updatedAt = currentTime;

      cachedDeliveryAttempts.push({
        id: `att-${Date.now()}-${processed}`,
        notificationId: notif.id,
        channel: notif.deliveryChannel,
        attemptNumber: notif.deliveryAttemptCount,
        status: res.status === "failed" ? "failed" : "sent_to_provider",
        providerName: notif.deliveryChannel === "email" ? "resend" : "in_app_broker",
        providerResponseCode: res.providerResponse?.statusCode ? String(res.providerResponse.statusCode) : undefined,
        errorMessage: res.error,
        timestamp: currentTime,
      });

      processed++;
    } catch (err: any) {
      notif.deliveryStatus = "failed";
      errors.push(`Failed dispatching ${notif.id}: ${err?.message}`);
    }
  }

  return { processedCount: processed, errors };
}
