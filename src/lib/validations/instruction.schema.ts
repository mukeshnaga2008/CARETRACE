import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const instructionCategories = [
  "medication_related",
  "appointment_related",
  "general_care",
  "mobility_daily_routine",
  "dietary",
  "follow_up",
  "other",
] as const;

export const instructionSourceTypes = [
  "healthcare_professional_document",
  "patient_or_representative_entry",
  "caregiver_provided",
  "appointment_follow_up",
  "hospital_discharge",
  "lab_diagnostic_report",
  "specialist_consult",
  "primary_care_visit",
  "lab_result",
  "patient_self_report",
  "other_documented_source",
] as const;

export const instructionVerificationStatuses = [
  "draft",
  "awaiting_verification",
  "verified",
  "rejected",
  "superseded",
  "archived",
] as const;

export const structuredContentSchema = z.object({
  frequency: z.string().max(100).optional().or(z.literal("")),
  targetParameter: z.string().max(120).optional().or(z.literal("")),
  guidelines: z.array(z.string().max(200)).optional(),
  precautions: z.array(z.string().max(200)).optional(),
  actionItems: z.array(z.string().max(200)).optional(),
});

export const createInstructionSourceSchema = z.object({
  patientId: z.string().default("patient-profile-001"),
  sourceType: z.enum(instructionSourceTypes, {
    errorMap: () => ({ message: "Select a valid source type" }),
  }),
  title: z
    .string()
    .min(3, "Source title must be at least 3 characters")
    .max(150),
  facilityName: z.string().max(150).optional().or(z.literal("")),
  providerName: z.string().max(100).optional().or(z.literal("")),
  providerRole: z.string().max(100).optional().or(z.literal("")),
  documentReference: z.string().max(150).optional().or(z.literal("")),
  encounterDate: z.string().regex(dateRegex, "Date must be YYYY-MM-DD").optional().or(z.literal("")),
  rawNotes: z.string().max(2000).optional().or(z.literal("")),
  isMissingSourceDetails: z.boolean().default(false),
  notesAboutMissingSource: z.string().max(500).optional().or(z.literal("")),
});

export type CreateInstructionSourceInput = z.infer<typeof createInstructionSourceSchema>;

export const createInstructionSchema = z.object({
  patientId: z.string().default("patient-profile-001"),
  title: z
    .string()
    .min(3, "Instruction title must be at least 3 characters")
    .max(150),
  category: z.enum(instructionCategories, {
    errorMap: () => ({ message: "Select a valid instruction category" }),
  }),
  description: z
    .string()
    .min(5, "Plain-language description must be at least 5 characters")
    .max(2000),
  sourceId: z.string().min(1, "Source provenance record is required"),
  effectiveDate: z.string().regex(dateRegex, "Date must be YYYY-MM-DD").optional().or(z.literal("")),
  expirationDate: z.string().regex(dateRegex, "Date must be YYYY-MM-DD").optional().or(z.literal("")),
  tags: z.array(z.string().max(50)).optional(),
  relatedMedicationId: z.string().optional().or(z.literal("")),
  relatedAppointmentId: z.string().optional().or(z.literal("")),
  relatedTaskId: z.string().optional().or(z.literal("")),
  structuredContent: structuredContentSchema.optional(),
  submitForReview: z.boolean().default(true),
});

export type CreateInstructionInput = z.infer<typeof createInstructionSchema>;

export const createInstructionVersionSchema = z.object({
  instructionId: z.string().min(1, "Instruction ID is required"),
  title: z
    .string()
    .min(3, "Instruction title must be at least 3 characters")
    .max(150),
  category: z.enum(instructionCategories, {
    errorMap: () => ({ message: "Select a valid instruction category" }),
  }),
  description: z
    .string()
    .min(5, "Plain-language description must be at least 5 characters")
    .max(2000),
  sourceId: z.string().min(1, "Source provenance reference required"),
  changeReason: z
    .string()
    .min(5, "A documented clinical or operational change reason (min 5 chars) is mandatory")
    .max(500),
  effectiveDate: z.string().regex(dateRegex, "Date must be YYYY-MM-DD").optional().or(z.literal("")),
  expirationDate: z.string().regex(dateRegex, "Date must be YYYY-MM-DD").optional().or(z.literal("")),
  tags: z.array(z.string().max(50)).optional(),
  relatedMedicationId: z.string().optional().or(z.literal("")),
  relatedAppointmentId: z.string().optional().or(z.literal("")),
  relatedTaskId: z.string().optional().or(z.literal("")),
  structuredContent: structuredContentSchema.optional(),
});

export type CreateInstructionVersionInput = z.infer<typeof createInstructionVersionSchema>;

export const reviewInstructionSchema = z.object({
  instructionId: z.string().min(1, "Instruction ID required"),
  decision: z.enum(["verified", "rejected"], {
    errorMap: () => ({ message: "Review decision must be verified or rejected" }),
  }),
  rationale: z
    .string()
    .min(5, "A clinical or administrative review rationale (min 5 chars) is mandatory")
    .max(500),
  checklistNotes: z.string().max(500).optional().or(z.literal("")),
});

export type ReviewInstructionInput = z.infer<typeof reviewInstructionSchema>;

export const archiveInstructionSchema = z.object({
  instructionId: z.string().min(1, "Instruction ID required"),
  archiveReason: z
    .string()
    .min(5, "A reason for archiving of at least 5 characters is mandatory")
    .max(300),
});

export type ArchiveInstructionInput = z.infer<typeof archiveInstructionSchema>;
