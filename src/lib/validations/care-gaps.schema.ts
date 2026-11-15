import { z } from "zod";

export const careGapCategories = [
  "medication",
  "responsibility",
  "appointment",
  "instruction_continuity",
  "notification",
] as const;

export const careGapTypes = [
  // Medication gaps
  "missed_medication_event",
  "overdue_unconfirmed_event",
  "skipped_event_requiring_acknowledgement",
  "medication_awaiting_verification",
  "medication_continuity_review_pending",
  // Responsibility gaps
  "unassigned_care_task",
  "assignment_awaiting_acceptance",
  "overdue_task",
  "task_without_appropriate_owner",
  "unacknowledged_shift_handover",
  // Appointment gaps
  "appointment_prep_overdue",
  "followup_task_incomplete",
  "appointment_awaiting_confirmation",
  "appointment_instruction_awaiting_verification",
  // Instruction & Continuity gaps
  "instruction_awaiting_verification",
  "instruction_missing_source",
  "continuity_review_awaiting_reviewer",
  "continuity_review_needs_clarification",
  "approved_continuity_update_pending_implementation",
  "failed_continuity_implementation",
  // Notification gaps
  "notification_delivery_failed",
  "notification_stale_processing",
  "notification_suppressed_by_preferences",
  "critical_event_no_delivery_attempt",
] as const;

export const careGapPriorities = [
  "informational",
  "routine",
  "attention_required",
  "high_priority",
] as const;

export const careGapStatuses = [
  "open",
  "assigned",
  "acknowledged",
  "in_progress",
  "awaiting_clarification",
  "resolved",
  "dismissed",
  "reopened",
] as const;

export const createCareGapSchema = z.object({
  patientId: z.string().default("patient-profile-001"),
  category: z.enum(careGapCategories),
  gapType: z.enum(careGapTypes),
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  explanation: z.string().min(5, "Explanation must be at least 5 characters").max(1000),
  priority: z.enum(careGapPriorities),
  priorityReason: z.string().min(5, "Priority reason must be at least 5 characters").max(500),
  relatedRecordType: z.string().min(1, "Related record type is required"),
  relatedRecordId: z.string().min(1, "Related record ID is required"),
  relatedRecordTitle: z.string().min(1, "Related record title is required"),
  sourceModule: z.string().min(1, "Source module is required"),
  actionRoute: z.string().min(1, "Action route is required"),
  actionLabel: z.string().min(1, "Action label is required"),
  dueDate: z.string().optional(),
});

export type CreateCareGapInput = z.infer<typeof createCareGapSchema>;

export const assignCareGapSchema = z.object({
  gapId: z.string().min(1, "Gap ID is required"),
  assignedToId: z.string().min(1, "Assigned member ID is required"),
  assignedToName: z.string().min(2, "Assigned member name is required"),
  assignedToRole: z.string().min(2, "Assigned member role is required"),
  note: z.string().max(500).optional(),
});

export type AssignCareGapInput = z.infer<typeof assignCareGapSchema>;

export const respondToAssignmentSchema = z.object({
  gapId: z.string().min(1, "Gap ID is required"),
  action: z.enum(["accept", "decline"]),
  reason: z.string().max(500).optional(),
});

export type RespondToAssignmentInput = z.infer<typeof respondToAssignmentSchema>;

export const resolveCareGapSchema = z.object({
  gapId: z.string().min(1, "Gap ID is required"),
  resolutionAction: z
    .string()
    .min(3, "Documented resolution action must be at least 3 characters")
    .max(200),
  resolutionDetails: z
    .string()
    .min(5, "Documented resolution details must be at least 5 characters")
    .max(1000),
  resolvedByName: z.string().min(2, "Resolver name is required"),
});

export type ResolveCareGapInput = z.infer<typeof resolveCareGapSchema>;

export const dismissCareGapSchema = z.object({
  gapId: z.string().min(1, "Gap ID is required"),
  dismissedReason: z
    .string()
    .min(5, "Documented dismissal reason of at least 5 characters is mandatory")
    .max(1000),
  dismissedByName: z.string().min(2, "Dismissing member name is required"),
});

export type DismissCareGapInput = z.infer<typeof dismissCareGapSchema>;

export const updateCareGapStatusSchema = z.object({
  gapId: z.string().min(1, "Gap ID is required"),
  status: z.enum(careGapStatuses),
  note: z.string().max(500).optional(),
  clarificationRequest: z.string().max(500).optional(),
});

export type UpdateCareGapStatusInput = z.infer<typeof updateCareGapStatusSchema>;

export const detectCareGapsQuerySchema = z.object({
  patientId: z.string().default("patient-profile-001"),
  category: z.enum([...careGapCategories, "all"]).default("all"),
});

export type DetectCareGapsQuery = z.infer<typeof detectCareGapsQuerySchema>;
