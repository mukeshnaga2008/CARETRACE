import { z } from "zod";

export const notificationCategories = [
  "medication",
  "appointment",
  "care_circle",
  "instructions",
  "care_gap",
  "account_security",
] as const;

export const notificationChannels = ["in_app", "email", "sms", "push"] as const;

export const notificationDeliveryStatuses = [
  "draft",
  "scheduled",
  "queued",
  "processing",
  "sent_to_provider",
  "delivered",
  "failed",
  "cancelled",
  "expired",
  "suppressed",
] as const;

export const notificationReadStatuses = ["unread", "read", "archived"] as const;

export const notificationAcknowledgementStatuses = ["not_required", "pending", "acknowledged"] as const;

export const createNotificationSchema = z.object({
  recipientId: z.string().min(1, "Recipient ID is required"),
  recipientName: z.string().min(1, "Recipient name is required"),
  recipientRole: z.string().optional(),
  patientId: z.string().min(1, "Patient ID is required"),
  category: z.enum(notificationCategories),
  eventType: z.string().min(1, "Event type is required"),
  title: z.string().min(2, "Title must be at least 2 characters").max(140, "Title cannot exceed 140 characters"),
  previewText: z.string().max(200, "Preview text cannot exceed 200 characters").optional(),
  body: z.string().min(5, "Body must be at least 5 characters").max(2000, "Body cannot exceed 2000 characters"),
  deliveryChannel: z.enum(notificationChannels).default("in_app"),
  requiresAcknowledgement: z.boolean().default(false),
  scheduledFor: z.string().optional(),
  relatedRecordType: z.string().optional(),
  relatedRecordId: z.string().optional(),
  actionUrl: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

export const updateNotificationPreferencesSchema = z.object({
  inAppEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be HH:MM format (24-hour)")
    .optional(),
  quietHoursEnd: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be HH:MM format (24-hour)")
    .optional(),
  timezone: z.string().min(1, "Timezone is required").optional(),
  enabledCategories: z
    .object({
      medication: z.boolean().optional(),
      appointment: z.boolean().optional(),
      care_circle: z.boolean().optional(),
      instructions: z.boolean().optional(),
      care_gap: z.boolean().optional(),
      account_security: z.boolean().optional(),
    })
    .optional(),
  reminderLeadMinutes: z
    .object({
      medication: z.number().int().min(0).max(1440).optional(),
      appointment: z.number().int().min(0).max(10080).optional(),
      task: z.number().int().min(0).max(1440).optional(),
    })
    .optional(),
  dailySummaryEnabled: z.boolean().optional(),
  dailySummaryTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Summary time must be HH:MM format (24-hour)")
    .optional(),
  nonSensitivePreviewsOnly: z.boolean().optional(),
});

export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;

export const acknowledgeNotificationSchema = z.object({
  notificationId: z.string().min(1, "Notification ID is required"),
  acknowledgedById: z.string().min(1, "Acknowledging user ID is required"),
  acknowledgedByName: z.string().min(1, "Acknowledging user name is required"),
  acknowledgedByRole: z.string().optional(),
  note: z.string().max(500, "Acknowledgement note cannot exceed 500 characters").optional(),
});

export type AcknowledgeNotificationInput = z.infer<typeof acknowledgeNotificationSchema>;

export const scheduleReminderSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  recipientId: z.string().min(1, "Recipient ID is required"),
  recipientName: z.string().min(1, "Recipient name is required"),
  recipientRole: z.string().optional(),
  category: z.enum(notificationCategories),
  eventType: z.string().min(1, "Event type is required"),
  title: z.string().min(2, "Title must be at least 2 characters").max(140),
  body: z.string().min(5, "Body must be at least 5 characters").max(2000),
  scheduledFor: z.string().min(1, "Scheduled timestamp is required"),
  relatedRecordType: z.string().optional(),
  relatedRecordId: z.string().optional(),
  actionUrl: z.string().optional(),
  idempotencyKey: z.string().min(1, "Idempotency key is required"),
  requiresAcknowledgement: z.boolean().default(false),
});

export type ScheduleReminderInput = z.infer<typeof scheduleReminderSchema>;

export const processQueueSchema = z.object({
  dryRun: z.boolean().optional().default(false),
  currentTime: z.string().optional(),
});

export type ProcessQueueInput = z.infer<typeof processQueueSchema>;
