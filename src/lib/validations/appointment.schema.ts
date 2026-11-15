import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createAppointmentSchema = z.object({
  patientId: z.string().default("patient-profile-001"),
  title: z
    .string()
    .min(3, "Appointment title must be at least 3 characters")
    .max(120, "Appointment title cannot exceed 120 characters"),
  appointmentType: z.enum([
    "doctor_consultation",
    "follow_up",
    "diagnostic_visit",
    "therapy_appointment",
    "hospital_visit",
    "other",
  ], {
    errorMap: () => ({ message: "Please select a valid appointment category" }),
  }),
  providerName: z
    .string()
    .min(2, "Healthcare provider or doctor name is required")
    .max(100),
  clinicName: z
    .string()
    .min(2, "Clinic, practice, or hospital name is required")
    .max(120),
  departmentOrSpecialty: z
    .string()
    .max(80)
    .optional()
    .or(z.literal("")),
  locationText: z
    .string()
    .max(200)
    .optional()
    .or(z.literal("")),
  appointmentDate: z
    .string()
    .regex(dateRegex, "Appointment date must be in YYYY-MM-DD format"),
  appointmentTime: z
    .string()
    .regex(timeRegex, "Appointment time must be in HH:MM (24-hour) format"),
  timezone: z.string().default("America/Chicago"),
  estimatedDurationMinutes: z
    .number()
    .int()
    .min(5, "Duration must be at least 5 minutes")
    .max(360, "Duration cannot exceed 6 hours")
    .default(45),
  bookingReference: z
    .string()
    .max(60)
    .optional()
    .or(z.literal("")),
  contactInformation: z
    .string()
    .max(120)
    .optional()
    .or(z.literal("")),
  preparationNotes: z
    .string()
    .max(500)
    .optional()
    .or(z.literal("")),
  assignedAccompanyingName: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),
  assignedAccompanyingRole: z
    .string()
    .max(80)
    .optional()
    .or(z.literal("")),
  transportationNeeded: z.boolean().default(false),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const editAppointmentSchema = createAppointmentSchema.partial().extend({
  changeReason: z
    .string()
    .min(5, "A clinical change explanation of at least 5 characters is mandatory for audit logging")
    .max(300, "Reason cannot exceed 300 characters"),
  appointmentStatus: z
    .enum([
      "planned",
      "confirmed",
      "rescheduled",
      "completed",
      "cancelled",
      "missed",
      "awaiting_confirmation",
    ])
    .optional(),
});

export type EditAppointmentInput = z.infer<typeof editAppointmentSchema>;

export const rescheduleAppointmentSchema = z.object({
  newDate: z
    .string()
    .regex(dateRegex, "New appointment date must be YYYY-MM-DD"),
  newTime: z
    .string()
    .regex(timeRegex, "New appointment time must be HH:MM"),
  rescheduleReason: z
    .string()
    .min(5, "A reason for rescheduling of at least 5 characters is mandatory")
    .max(300),
});

export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;

export const cancelAppointmentSchema = z.object({
  cancellationReason: z
    .string()
    .min(5, "A cancellation reason of at least 5 characters is mandatory")
    .max(300),
});

export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;

export const createPreparationItemSchema = z.object({
  appointmentId: z.string().min(1, "Appointment ID is required"),
  itemType: z.enum([
    "question",
    "discussion_topic",
    "document_to_bring",
    "symptom_note",
  ], {
    errorMap: () => ({ message: "Select a valid preparation item type" }),
  }),
  title: z
    .string()
    .min(3, "Title or question must be at least 3 characters")
    .max(200),
  notes: z
    .string()
    .max(500)
    .optional()
    .or(z.literal("")),
});

export type CreatePreparationItemInput = z.infer<typeof createPreparationItemSchema>;

export const recordVisitOutcomeSchema = z.object({
  appointmentId: z.string().min(1, "Appointment ID is required"),
  summaryText: z
    .string()
    .min(10, "Visit summary must be at least 10 characters")
    .max(2000, "Summary cannot exceed 2000 characters"),
  sourceProvenance: z.enum([
    "patient_reported",
    "family_entered",
    "caregiver_entered",
    "clinician_provided",
  ]),
  verificationStatus: z.enum(["verified", "unverified", "awaiting_review"]).default("unverified"),
  followUpInstructions: z
    .string()
    .max(1000)
    .optional()
    .or(z.literal("")),
  documentsReference: z
    .string()
    .max(200)
    .optional()
    .or(z.literal("")),
});

export type RecordVisitOutcomeInput = z.infer<typeof recordVisitOutcomeSchema>;

export const createFollowUpTaskSchema = z.object({
  appointmentId: z.string().min(1, "Appointment ID is required"),
  title: z
    .string()
    .min(3, "Task title must be at least 3 characters")
    .max(120),
  description: z
    .string()
    .min(5, "Task description must be at least 5 characters")
    .max(500),
  dueAt: z
    .string()
    .regex(dateRegex, "Due date must be YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  assignedToName: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),
  assignedToRole: z
    .string()
    .max(80)
    .optional()
    .or(z.literal("")),
  taskStatus: z
    .enum(["pending", "assigned", "in_progress", "completed", "cancelled", "awaiting_clarification"])
    .default("pending"),
});

export type CreateFollowUpTaskInput = z.infer<typeof createFollowUpTaskSchema>;
