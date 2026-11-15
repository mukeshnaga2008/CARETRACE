import { z } from "zod";

export * from "./auth.schema";
export * from "./patient-profile.schema";
export * from "./medication.schema";
export * from "./appointment.schema";
export * from "./care-circle.schema";
export * from "./instruction.schema";
export * from "./continuity.schema";
export * from "./care-gaps.schema";
export * from "./notifications.schema";
export * from "./timeline-passport.schema";

// Patient Profile Schema
export const patientProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(7, "Phone number too short").max(20).optional().or(z.literal("")),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format"),
  bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"]),
  primaryDoctorName: z.string().min(2, "Doctor name required"),
  primaryClinic: z.string().min(2, "Clinic name required"),
  preferredLanguage: z.string().default("en"),
});

// Medication Schema
export const medicationSchema = z.object({
  name: z.string().min(2, "Medication name is required"),
  genericName: z.string().optional(),
  dosage: z.string().min(1, "Dosage is required (e.g. 10mg)"),
  form: z.enum(["Tablet", "Capsule", "Liquid", "Injection", "Patch", "Inhaler", "Drops", "Other"]),
  route: z.string().default("Oral"),
  frequency: z.string().min(2, "Frequency is required (e.g. Once daily)"),
  scheduledTimes: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM format")).min(1, "At least one scheduled time is required"),
  prescribingDoctor: z.string().min(2, "Prescribing clinician required"),
  pharmacy: z.string().min(2, "Pharmacy name required"),
  rxNumber: z.string().min(2, "Prescription (Rx) number required"),
  refillsRemaining: z.number().int().nonnegative().default(0),
  refillDueDate: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().optional(),
  storageInstructions: z.string().optional(),
  foodInstructions: z.string().optional(),
  sideEffectWarnings: z.array(z.string()).default([]),
});

// Adherence Record Schema
export const adherenceLogSchema = z.object({
  doseEventId: z.string().uuid("Invalid dose event ID"),
  medicationId: z.string().uuid("Invalid medication ID"),
  status: z.enum(["taken", "missed", "skipped", "delayed"]),
  reasonCode: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// Appointment Schema
export const appointmentSchema = z.object({
  title: z.string().min(2, "Appointment title is required"),
  specialty: z.string().min(2, "Specialty is required"),
  providerName: z.string().min(2, "Provider name is required"),
  facility: z.string().min(2, "Facility is required"),
  locationAddress: z.string().min(5, "Address or telehealth link required"),
  appointmentDate: z.string().datetime("Must be a valid ISO datetime"),
  durationMinutes: z.number().int().positive().default(45),
  transportNeeded: z.boolean().default(false),
  companionMemberId: z.string().uuid().optional(),
  preparationInstructions: z.string().optional(),
  agendaQuestions: z.array(z.string()).default([]),
});

// Care Continuity Instruction Review Schema
export const changeReviewSchema = z.object({
  instructionVersionId: z.string().uuid("Valid instruction ID required"),
  decision: z.enum(["approved", "rejected"]),
  rationale: z.string().min(10, "A clear clinical rationale (at least 10 characters) is required for approval/rejection"),
  checklistVerification: z.array(z.object({
    item: z.string(),
    verified: z.boolean(),
  })).min(1, "At least one verification checklist item must be evaluated"),
});

// Care Task Schema
export const careTaskSchema = z.object({
  title: z.string().min(2, "Task title is required"),
  category: z.enum([
    "medication_refill",
    "vitals_check",
    "exercise_pt",
    "dietary",
    "supplies",
    "doctor_followup",
    "companion_ride"
  ]),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z.string().datetime("Must be a valid ISO datetime"),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
  assignedMemberId: z.string().uuid().optional(),
  acknowledgementRequired: z.boolean().default(false),
});

// Care Circle Member Invite Schema
export const careCircleInviteSchema = z.object({
  inviteeName: z.string().min(2, "Invitee name required"),
  email: z.string().email("Valid email required"),
  relationship: z.string().min(2, "Relationship required (e.g. Daughter, Visiting Nurse)"),
  permissionTier: z.enum(["full_admin", "caregiver_editor", "family_viewer", "emergency_only"]),
});
