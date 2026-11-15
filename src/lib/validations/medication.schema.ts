import { z } from "zod";

/**
 * Validation Schemas for Medication Lifecycle Manager
 * CARETRACE — PromptWars × Catalyst 2026
 *
 * Implements strict clinical safety: validates provenance, instructions,
 * adherence reporting, and versioning rationales without autonomous prescribing.
 */

// Time format regex (HH:MM in 24h)
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
// Date format regex (YYYY-MM-DD)
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createMedicationSchema = z.object({
  displayName: z
    .string()
    .min(2, "Medication name must be at least 2 characters")
    .max(100, "Medication name must not exceed 100 characters"),
  genericName: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),
  strengthText: z
    .string()
    .min(1, "Strength/dosage text is required (e.g. 10mg, 2000 IU)")
    .max(60),
  form: z.enum([
    "Tablet",
    "Capsule",
    "Liquid",
    "Injection",
    "Patch",
    "Drops",
    "Inhaler",
    "Other",
  ], {
    errorMap: () => ({ message: "Please select a valid medication form" }),
  }),
  routeText: z.string().default("Oral"),
  prescribedInstructions: z
    .string()
    .min(3, "Exact instructions as provided by the clinical source are required")
    .max(500, "Instructions cannot exceed 500 characters"),
  prescribingProvider: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),
  pharmacy: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),
  rxNumber: z
    .string()
    .max(50)
    .optional()
    .or(z.literal("")),
  refillsRemaining: z
    .number()
    .int()
    .min(0, "Refills cannot be negative")
    .default(0),
  refillDueDate: z
    .string()
    .regex(dateRegex, "Refill date must be YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  effectiveStartDate: z
    .string()
    .regex(dateRegex, "Start date must be in YYYY-MM-DD format"),
  effectiveEndDate: z
    .string()
    .regex(dateRegex, "End date must be in YYYY-MM-DD format")
    .optional()
    .or(z.literal("")),
  sourceType: z.enum([
    "patient_provided",
    "family_entered",
    "caregiver_entered",
    "physician_prescribed",
    "imported_external",
  ], {
    errorMap: () => ({ message: "A valid source provenance is required" }),
  }),
  scheduledTimes: z
    .array(z.string().regex(timeRegex, "Time must be HH:MM format"))
    .min(1, "At least one scheduled time must be specified"),
  daysOfWeek: z
    .array(z.number().int().min(0).max(6))
    .default([0, 1, 2, 3, 4, 5, 6]),
  notes: z
    .string()
    .max(500)
    .optional()
    .or(z.literal("")),
  assignedMemberName: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),
});

export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;

// Edit Medication Schema with Mandatory Change Rationale
export const editMedicationSchema = createMedicationSchema.partial().extend({
  changeReason: z
    .string()
    .min(5, "A clear explanation of why this instruction changed is required for audit history")
    .max(300, "Change explanation cannot exceed 300 characters"),
  status: z
    .enum(["active", "paused", "completed", "discontinued", "awaiting_verification"])
    .optional(),
});

export type EditMedicationInput = z.infer<typeof editMedicationSchema>;

// Adherence Action Reporting Schema
export const recordAdherenceSchema = z.object({
  doseEventId: z.string().min(1, "Dose Event ID required"),
  medicationId: z.string().optional(),
  action: z.enum([
    "report_taken",
    "report_skipped",
    "record_missed",
    "mark_awaiting_confirmation",
  ], {
    errorMap: () => ({ message: "Select a valid adherence action" }),
  }),
  reasonCode: z
    .string()
    .max(60)
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(300, "Notes cannot exceed 300 characters")
    .optional()
    .or(z.literal("")),
});

export type RecordAdherenceInput = z.infer<typeof recordAdherenceSchema>;

// Medication Review & Verification Schema
export const reviewMedicationSchema = z.object({
  medicationId: z.string().min(1, "Medication ID required"),
  decision: z.enum(["verified", "needs_clarification"], {
    errorMap: () => ({ message: "Review decision must be verified or needs_clarification" }),
  }),
  clarificationNotes: z
    .string()
    .max(500)
    .optional()
    .or(z.literal("")),
});

export type ReviewMedicationInput = z.infer<typeof reviewMedicationSchema>;
