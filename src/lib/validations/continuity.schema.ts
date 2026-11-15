import { z } from "zod";

export const continuityEventTypes = [
  "new_instruction_submitted",
  "new_version_created",
  "instruction_verified",
  "instruction_rejected",
  "instruction_superseded",
  "instruction_archived",
] as const;

export const continuityImpactClassifications = [
  "directly_linked",
  "potentially_related",
  "source_changed",
  "verification_changed",
  "requires_manual_assessment",
  "no_relationship_found",
] as const;

export const continuityRecordTypes = [
  "medication",
  "dose_event",
  "appointment",
  "followup_task",
  "care_task",
  "caregiver_responsibility",
  "shift_handover",
  "notification",
] as const;

export const continuityReviewStatuses = [
  "analysis_pending",
  "analysis_completed",
  "awaiting_human_review",
  "needs_clarification",
  "approved_for_downstream_update",
  "rejected",
  "cancelled",
  "implementation_pending",
  "implementation_completed",
  "implementation_failed",
] as const;

export const createContinuityAnalysisSchema = z.object({
  patientId: z.string().default("patient-profile-001"),
  instructionId: z.string().min(1, "Instruction ID is required"),
  eventType: z.enum(continuityEventTypes),
  currentVersionNumber: z.number().int().positive(),
  previousVersionNumber: z.number().int().positive().optional(),
});

export type CreateContinuityAnalysisInput = z.infer<typeof createContinuityAnalysisSchema>;

export const continuityReviewDecisionSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
  decision: z.enum(["approved", "rejected", "needs_clarification"], {
    errorMap: () => ({ message: "Decision must be approved, rejected, or needs_clarification" }),
  }),
  rationale: z
    .string()
    .min(5, "A documented clinical review rationale (min 5 characters) is mandatory")
    .max(1000),
  approvedRecordIds: z.array(z.string()).default([]),
  excludedRecords: z.array(
    z.object({
      recordId: z.string(),
      exclusionReason: z.string().min(5, "A reason for excluding this record of at least 5 characters is mandatory"),
    })
  ).default([]),
  reviewNotes: z.string().max(1000).optional().or(z.literal("")),
  optimisticVersionLock: z.number().int().default(1),
});

export type ContinuityReviewDecisionInput = z.infer<typeof continuityReviewDecisionSchema>;

export const excludeImpactRecordSchema = z.object({
  impactRecordId: z.string().min(1, "Impact record ID required"),
  exclusionReason: z
    .string()
    .min(5, "A documented reason for exclusion (min 5 characters) is required")
    .max(500),
});

export type ExcludeImpactRecordInput = z.infer<typeof excludeImpactRecordSchema>;

export const escalateReviewSchema = z.object({
  reviewId: z.string().min(1, "Review ID required"),
  escalateTo: z.string().min(2, "Name or role of the target reviewer is required"),
  escalationReason: z
    .string()
    .min(5, "A documented reason for escalation (min 5 characters) is mandatory")
    .max(500),
});

export type EscalateReviewInput = z.infer<typeof escalateReviewSchema>;

export const requestContinuityClarificationSchema = z.object({
  reviewId: z.string().min(1, "Review ID required"),
  question: z
    .string()
    .min(5, "A clarification question (min 5 characters) is mandatory")
    .max(500),
});

export type RequestContinuityClarificationInput = z.infer<typeof requestContinuityClarificationSchema>;

export const executeImplementationSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
  optimisticVersionLock: z.number().int().positive(),
  approvedRecordIds: z.array(z.string()).min(1, "At least one approved record is required for implementation"),
});

export type ExecuteImplementationInput = z.infer<typeof executeImplementationSchema>;
