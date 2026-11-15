import { z } from "zod";

export const timelineCategories = [
  "medication",
  "appointment",
  "instruction",
  "continuity",
  "care_circle",
  "task",
  "care_gap",
  "notification",
  "security",
] as const;

export const analyticsDateRanges = ["7d", "30d", "90d", "all"] as const;

export const carePassportSectionKeys = [
  "patient_identity",
  "emergency_contacts",
  "conditions_and_allergies",
  "medication_regimen",
  "upcoming_appointments",
  "care_instructions",
  "care_circle",
  "pending_tasks",
  "advance_directives",
] as const;

export const timelineFilterSchema = z.object({
  patientId: z.string().optional(),
  category: z.string().optional(),
  sourceModule: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export type TimelineFilterInput = z.infer<typeof timelineFilterSchema>;

export const analyticsQuerySchema = z.object({
  range: z.enum(analyticsDateRanges).default("30d"),
  patientId: z.string().optional(),
});

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;

export const carePassportConfigSchema = z.object({
  sections: z.record(z.boolean()),
  includeAuditHash: z.boolean().default(true),
  includeVerificationHash: z.boolean().default(true).optional(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
  customNotes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

export type CarePassportConfigInput = z.infer<typeof carePassportConfigSchema>;

export const createPassportExportSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  includedSections: z
    .array(z.enum(carePassportSectionKeys))
    .min(1, "Select at least one section to include in the Care Passport"),
  reason: z.string().max(250, "Reason description cannot exceed 250 characters").optional(),
});

export type CreatePassportExportInput = z.infer<typeof createPassportExportSchema>;
