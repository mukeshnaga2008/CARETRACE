import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const inviteMemberSchema = z.object({
  patientId: z.string().default("patient-profile-001"),
  email: z.string().email("A valid email address is required for sending the secure invite"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  relationship: z.string().min(2, "Relationship to patient is required").max(80),
  assignedRole: z.enum([
    "family_coordinator",
    "visiting_nurse",
    "caregiver",
    "specialist_physician",
    "family_member",
  ], {
    errorMap: () => ({ message: "Select a valid Care Circle role" }),
  }),
  permissionTier: z.enum([
    "full_admin",
    "caregiver_editor",
    "family_viewer",
    "emergency_only",
    "clinician_access",
  ], {
    errorMap: () => ({ message: "Select a valid permission tier" }),
  }),
  permissions: z.array(z.string()).default([]),
  initialNotes: z.string().max(300).optional().or(z.literal("")),
  personalNote: z.string().max(300).optional().or(z.literal("")),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateMemberRoleSchema = z.object({
  memberId: z.string().min(1, "Member ID required"),
  assignedRole: z.enum([
    "family_coordinator",
    "visiting_nurse",
    "caregiver",
    "specialist_physician",
    "family_member",
  ]).optional(),
  newRole: z.enum([
    "family_coordinator",
    "visiting_nurse",
    "caregiver",
    "specialist_physician",
    "family_member",
  ]).optional(),
  permissionTier: z.enum([
    "full_admin",
    "caregiver_editor",
    "family_viewer",
    "emergency_only",
    "clinician_access",
  ]).optional(),
  newTier: z.enum([
    "full_admin",
    "caregiver_editor",
    "family_viewer",
    "emergency_only",
    "clinician_access",
  ]).optional(),
  changeReason: z
    .string()
    .min(5, "A reason for changing role or permissions of at least 5 characters is mandatory")
    .max(300),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

export const suspendMemberSchema = z.object({
  memberId: z.string().min(1, "Member ID required"),
  suspensionReason: z
    .string()
    .min(5, "A reason for suspending access of at least 5 characters is mandatory")
    .max(300),
});

export type SuspendMemberInput = z.infer<typeof suspendMemberSchema>;

export const revokeMemberSchema = z.object({
  memberId: z.string().min(1, "Member ID required"),
  revocationReason: z
    .string()
    .min(5, "A reason for revoking membership of at least 5 characters is mandatory")
    .max(300),
});

export type RevokeMemberInput = z.infer<typeof revokeMemberSchema>;

export const createCareTaskSchema = z.object({
  patientId: z.string().default("patient-profile-001"),
  title: z
    .string()
    .min(3, "Task title must be at least 3 characters")
    .max(120),
  category: z.enum([
    "medication_refill",
    "medication_reminder",
    "appointment_preparation",
    "appointment_followup",
    "appointment_escort",
    "vitals_check",
    "exercise_pt",
    "exercise_routine",
    "dietary",
    "dietary_prep",
    "supplies",
    "doctor_followup",
    "companion_ride",
    "general_care_activity",
    "general_observation",
    "lab_draw",
    "documentation_review",
    "care_handover",
    "other",
  ]),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters")
    .max(500),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z.string().regex(dateRegex, "Due date must be YYYY-MM-DD"),
  dueTime: z.string().regex(timeRegex, "Time must be HH:MM").optional().or(z.literal("")),
  timezone: z.string().default("America/Chicago"),
  assignedMemberId: z.string().optional().or(z.literal("")),
  assignedMemberName: z.string().optional().or(z.literal("")),
  assignedMemberRole: z.string().optional().or(z.literal("")),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().max(80).optional().or(z.literal("")),
  relatedMedicationId: z.string().optional().or(z.literal("")),
  relatedAppointmentId: z.string().optional().or(z.literal("")),
});

export type CreateCareTaskInput = z.infer<typeof createCareTaskSchema>;

export const updateCareTaskStatusSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  status: z.enum([
    "unassigned",
    "assigned",
    "accepted",
    "pending",
    "in_progress",
    "completed",
    "overdue",
    "cancelled",
  ]),
  completionNotes: z.string().max(500).optional().or(z.literal("")),
});

export type UpdateCareTaskStatusInput = z.infer<typeof updateCareTaskStatusSchema>;

export const reassignTaskSchema = z.object({
  taskId: z.string().optional().default("task-default"),
  assignedMemberId: z.string().min(1, "New assignee ID required"),
  assignedMemberName: z.string().optional().default("Assigned Member"),
  assignedMemberRole: z.string().optional().default("caregiver"),
  reassignReason: z
    .string()
    .min(5, "A reason for reassignment of at least 5 characters is mandatory")
    .max(300),
});

export type ReassignTaskInput = z.infer<typeof reassignTaskSchema>;

export const createHandoverSchema = z.object({
  patientId: z.string().default("patient-profile-001"),
  outgoingMemberId: z.string().optional(),
  outgoingMemberName: z.string().default("Sarah Jenkins, RN"),
  outgoingMemberRole: z.string().default("Visiting Nurse"),
  incomingMemberId: z.string().optional(),
  incomingMemberName: z.string().default("David Sullivan"),
  incomingMemberRole: z.string().default("Family Care Coordinator"),
  shiftPeriod: z.string().optional().default("Day Shift"),
  handoverDatetime: z.string().default(() => new Date().toISOString()),
  timezone: z.string().default("America/Chicago"),
  relevantResponsibilities: z.array(z.string()).default([]),
  pendingTaskIds: z.array(z.string()).default([]),
  nonClinicalNotes: z
    .string()
    .min(10, "Handover notes must be at least 10 characters")
    .max(1000),
});

export type CreateHandoverInput = z.infer<typeof createHandoverSchema>;

export const acknowledgeHandoverSchema = z.object({
  handoverId: z.string().min(1, "Handover ID required"),
  acknowledgementNotes: z.string().max(500).optional().or(z.literal("")),
});

export type AcknowledgeHandoverInput = z.infer<typeof acknowledgeHandoverSchema>;

export const clarificationHandoverSchema = z.object({
  handoverId: z.string().min(1, "Handover ID required"),
  clarificationQuestion: z.string().min(5, "Clarification question must be at least 5 characters").max(500).optional(),
  question: z.string().min(5, "Question must be at least 5 characters").max(500).optional(),
}).refine(data => Boolean(data.clarificationQuestion || data.question), {
  message: "Clarification question of at least 5 characters is required",
});

export type ClarificationHandoverInput = z.infer<typeof clarificationHandoverSchema>;
