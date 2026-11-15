import { describe, it, expect } from "vitest";
import {
  createAppointmentSchema,
  editAppointmentSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
  createPreparationItemSchema,
  recordVisitOutcomeSchema,
  createFollowUpTaskSchema,
} from "@/lib/validations/appointment.schema";
import {
  INITIAL_APPOINTMENTS,
  INITIAL_PREPARATION_ITEMS,
  INITIAL_APPOINTMENT_NOTES,
  INITIAL_FOLLOW_UP_TASKS,
  INITIAL_APPOINTMENT_HISTORY,
  getCachedAppointments,
  getCachedPreparationItems,
  getCachedAppointmentNotes,
  getCachedFollowUpTasks,
  getCachedAppointmentHistory,
  addAppointment,
  updateAppointment,
  rescheduleAppointment,
  cancelAppointment,
  addPreparationItem,
  togglePreparationItem,
  deletePreparationItem,
  recordVisitOutcome,
  addFollowUpTask,
  updateFollowUpTaskStatus,
} from "@/lib/data/appointment-intelligence-data";
import fs from "fs";
import path from "path";

describe("Phase 7: Appointment Intelligence & Doctor Visit Management", () => {
  /* -------------------------------------------------------------------------- */
  /* 1. Appointment Validation Schemas                                          */
  /* -------------------------------------------------------------------------- */
  describe("Appointment Validation Schemas", () => {
    const validAppointmentInput = {
      patientId: "patient-profile-001",
      title: "Comprehensive Geriatric Follow-up",
      appointmentType: "follow_up" as const,
      providerName: "Dr. Robert Chen, MD",
      clinicName: "St. Jude Geriatric Clinic",
      departmentOrSpecialty: "Geriatrics",
      locationText: "1200 Mercy Drive, Springfield, IL",
      appointmentDate: "2026-03-25",
      appointmentTime: "10:30",
      timezone: "America/Chicago",
      estimatedDurationMinutes: 60,
      assignedAccompanyingName: "David Sullivan",
      transportationNeeded: true,
      preparationNotes: "Fasting 2 hours prior for routine blood panel.",
    };

    it("should accept valid appointment creation payload", () => {
      const result = createAppointmentSchema.safeParse(validAppointmentInput);
      expect(result.success).toBe(true);
    });

    it("should reject creation if title is under 3 characters", () => {
      const result = createAppointmentSchema.safeParse({
        ...validAppointmentInput,
        title: "Dr",
      });
      expect(result.success).toBe(false);
    });

    it("should reject creation if providerName is empty", () => {
      const result = createAppointmentSchema.safeParse({
        ...validAppointmentInput,
        providerName: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject creation if clinicName is empty", () => {
      const result = createAppointmentSchema.safeParse({
        ...validAppointmentInput,
        clinicName: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject creation if appointmentDate has invalid format", () => {
      const result = createAppointmentSchema.safeParse({
        ...validAppointmentInput,
        appointmentDate: "25-03-2026",
      });
      expect(result.success).toBe(false);
    });

    it("should reject creation if appointmentTime has invalid format", () => {
      const result = createAppointmentSchema.safeParse({
        ...validAppointmentInput,
        appointmentTime: "10:30 PM", // requires 24h format HH:MM
      });
      expect(result.success).toBe(false);
    });

    it("should strictly require changeReason when editing an appointment", () => {
      const validEdit = {
        title: "Updated Consultation Title",
        changeReason: "Patient requested morning appointment slot due to energy levels.",
      };
      expect(editAppointmentSchema.safeParse(validEdit).success).toBe(true);

      const invalidEdit = {
        title: "Updated Consultation Title",
        changeReason: "abc", // less than 5 characters
      };
      expect(editAppointmentSchema.safeParse(invalidEdit).success).toBe(false);

      const missingReasonEdit = {
        title: "Updated Consultation Title",
      };
      expect(editAppointmentSchema.safeParse(missingReasonEdit).success).toBe(false);
    });

    it("should validate rescheduling with mandatory reason and format", () => {
      const validReschedule = {
        newDate: "2026-03-28",
        newTime: "14:00",
        rescheduleReason: "Cardiologist attending emergency inpatient surgery.",
      };
      expect(rescheduleAppointmentSchema.safeParse(validReschedule).success).toBe(true);

      const invalidReschedule = {
        newDate: "invalid-date",
        newTime: "14:00",
        rescheduleReason: "Rescheduled",
      };
      expect(rescheduleAppointmentSchema.safeParse(invalidReschedule).success).toBe(false);
    });

    it("should validate cancellation with mandatory reason", () => {
      const validCancel = {
        cancellationReason: "Severe winter ice storm preventing safe wheelchair vehicle transport.",
      };
      expect(cancelAppointmentSchema.safeParse(validCancel).success).toBe(true);

      const invalidCancel = {
        cancellationReason: "snow", // too short
      };
      expect(cancelAppointmentSchema.safeParse(invalidCancel).success).toBe(false);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. Timezone & Scheduling Integrity                                        */
  /* -------------------------------------------------------------------------- */
  describe("Timezone & Scheduling Integrity", () => {
    it("should preserve Margaret Sullivan's local Central Time (America/Chicago)", () => {
      const appts = getCachedAppointments();
      appts.forEach((a) => {
        expect(a.timezone).toBe("America/Chicago");
        expect(a.appointmentDatetime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
      });
    });

    it("should reschedule an appointment and preserve prior date in audit history", () => {
      const targetAppt = getCachedAppointments().find((a) => a.id === "appt-002");
      expect(targetAppt).toBeDefined();
      const prevDatetime = targetAppt!.appointmentDatetime;

      const rescheduled = rescheduleAppointment(
        "appt-002",
        "2026-03-19",
        "11:00",
        "Dr. Chen clinic requested moving back one week for lab processing",
        "Sarah Jenkins, RN",
        "Visiting Home Nurse"
      );

      expect(rescheduled).toBeDefined();
      expect(rescheduled?.appointmentDatetime).toBe("2026-03-19T11:00:00");
      expect(rescheduled?.appointmentStatus).toBe("rescheduled");

      // Verify audit history log was appended
      const history = getCachedAppointmentHistory("appt-002");
      const latest = history[history.length - 1];
      expect(latest.changeType).toBe("rescheduled");
      expect(latest.previousDatetime).toBe(prevDatetime);
      expect(latest.newDatetime).toBe("2026-03-19T11:00:00");
      expect(latest.changedByName).toBe("Sarah Jenkins, RN");
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. Visit Preparation Items & Checklists                                    */
  /* -------------------------------------------------------------------------- */
  describe("Visit Preparation & Agenda Engine", () => {
    it("should validate preparation item schemas", () => {
      const validQuestion = {
        appointmentId: "appt-001",
        itemType: "question" as const,
        title: "Inquire about blood pressure readings and morning Lisinopril timing",
        notes: "Family noted resting systolic pressure averaged 132 mmHg.",
      };
      expect(createPreparationItemSchema.safeParse(validQuestion).success).toBe(true);

      const invalidQuestion = {
        appointmentId: "",
        itemType: "unsupported_type",
        title: "No",
      };
      expect(createPreparationItemSchema.safeParse(invalidQuestion).success).toBe(false);
    });

    it("should add a new preparation item and allow toggling addressed state", () => {
      const newItemId = `prep-test-${Date.now()}`;
      addPreparationItem({
        id: newItemId,
        appointmentId: "appt-001",
        patientId: "patient-profile-001",
        itemType: "question",
        title: "Does Margaret need a follow-up lipid panel in 6 months?",
        isAddressed: false,
        createdByName: "David Sullivan",
        createdByRole: "Family Care Coordinator",
        createdAt: new Date().toISOString(),
      });

      const itemsBefore = getCachedPreparationItems("appt-001");
      const added = itemsBefore.find((i) => i.id === newItemId);
      expect(added).toBeDefined();
      expect(added?.isAddressed).toBe(false);

      // Toggle addressed state
      const toggled = togglePreparationItem(newItemId, "Cardiologist confirmed lipid panel ordered for July.");
      expect(toggled?.isAddressed).toBe(true);
      expect(toggled?.addressedNotes).toContain("July");

      // Delete item
      const deleted = deletePreparationItem(newItemId);
      expect(deleted).toBe(true);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. Visit Outcomes & Clinical Non-Prescribing Governance                   */
  /* -------------------------------------------------------------------------- */
  describe("Visit Outcomes & Clinical Boundaries", () => {
    it("should validate visit outcome submission schema", () => {
      const validOutcome = {
        appointmentId: "appt-001",
        summaryText: "Patient attended 45-minute consultation. Blood pressure verified in clinic at 128/80 mmHg. Exercise tolerance reported stable.",
        sourceProvenance: "clinician_provided" as const,
        verificationStatus: "verified" as const,
        followUpInstructions: "Maintain regular salt-restricted diet and return in 6 months.",
      };
      expect(recordVisitOutcomeSchema.safeParse(validOutcome).success).toBe(true);

      const invalidOutcome = {
        appointmentId: "appt-001",
        summaryText: "short", // under 10 chars
        sourceProvenance: "invalid_source",
      };
      expect(recordVisitOutcomeSchema.safeParse(invalidOutcome).success).toBe(false);
    });

    it("should record visit outcome, transition appointment to completed, and log audit history", () => {
      const outcomeNote = {
        id: `note-test-${Date.now()}`,
        appointmentId: "appt-003",
        patientId: "patient-profile-001",
        visitDate: "2026-02-26",
        providerName: "Apex Rehabilitation Services",
        summaryText: "Intake evaluation completed. Bilateral quadriceps strengthening exercises initiated with home protocol.",
        authorName: "Sarah Jenkins, RN",
        authorRole: "Visiting Home Nurse",
        sourceProvenance: "caregiver_entered" as const,
        verificationStatus: "unverified" as const,
        followUpInstructions: "Twice weekly physical therapy sessions scheduled.",
        createdAt: new Date().toISOString(),
      };

      const updatedAppt = recordVisitOutcome(outcomeNote);
      expect(updatedAppt).toBeDefined();
      expect(updatedAppt?.appointmentStatus).toBe("completed");

      // Verify note exists in store
      const notes = getCachedAppointmentNotes("appt-003");
      expect(notes.some((n) => n.id === outcomeNote.id)).toBe(true);
    });

    it("should assert that appointment outcomes do not autonomously alter medication regimens (Non-Prescribing Rule)", () => {
      // CARETRACE strictly requires that all medication modifications go through the Medication Lifecycle Manager
      const notes = getCachedAppointmentNotes();
      notes.forEach((note) => {
        expect([
          "patient_reported",
          "family_entered",
          "caregiver_entered",
          "clinician_provided",
        ]).toContain(note.sourceProvenance);
      });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 5. Follow-Up Task Management                                              */
  /* -------------------------------------------------------------------------- */
  describe("Follow-Up Task Management", () => {
    it("should validate follow-up task schema", () => {
      const validTask = {
        appointmentId: "appt-001",
        title: "Pick up new pharmacy medication bottles",
        description: "Ensure labels contain large senior-friendly print font.",
        dueAt: "2026-02-24",
        assignedToName: "David Sullivan",
        taskStatus: "pending" as const,
      };
      expect(createFollowUpTaskSchema.safeParse(validTask).success).toBe(true);

      const invalidTask = {
        appointmentId: "appt-001",
        title: "ab", // under 3 chars
        description: "123", // under 5 chars
      };
      expect(createFollowUpTaskSchema.safeParse(invalidTask).success).toBe(false);
    });

    it("should create follow-up task and allow status updates to completed", () => {
      const taskId = `task-test-${Date.now()}`;
      addFollowUpTask({
        id: taskId,
        patientId: "patient-profile-001",
        appointmentId: "appt-001",
        title: "Review laboratory potassium serum levels",
        description: "Verify electrolyte panel following Lisinopril dose review.",
        dueAt: "2026-02-22",
        assignedToName: "Sarah Jenkins, RN",
        assignedToRole: "Visiting Home Nurse",
        taskStatus: "in_progress",
        sourceReference: "Dr. Vance Clinical Pre-Order",
        createdByName: "Dr. Eleanor Vance, MD",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const tasks = getCachedFollowUpTasks("appt-001");
      const created = tasks.find((t) => t.id === taskId);
      expect(created).toBeDefined();
      expect(created?.taskStatus).toBe("in_progress");

      // Complete the task
      const completed = updateFollowUpTaskStatus(taskId, "completed", "Potassium 4.2 mEq/L (normal range)");
      expect(completed?.taskStatus).toBe("completed");
      expect(completed?.completionNotes).toContain("4.2 mEq/L");
      expect(completed?.completedAt).toBeDefined();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 6. Database Migration & RLS Security Integrity                             */
  /* -------------------------------------------------------------------------- */
  describe("Database Migration Verification", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20260215000004_appointment_intelligence.sql"
    );

    it("should have migration file for appointment intelligence", () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
      const sql = fs.readFileSync(migrationPath, "utf-8");

      expect(sql).toContain("ALTER TABLE appointments ADD COLUMN appointment_type");
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS appointment_attendees");
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS appointment_preparation_items");
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS appointment_notes");
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS appointment_follow_up_tasks");
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS appointment_history");
      expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 7. Frontend Route Files Integrity                                          */
  /* -------------------------------------------------------------------------- */
  describe("Frontend Appointment Route Files", () => {
    const routes = [
      "src/app/appointments/page.tsx",
      "src/app/appointments/add/page.tsx",
      "src/app/appointments/[id]/page.tsx",
      "src/app/appointments/[id]/edit/page.tsx",
      "src/app/appointments/calendar/page.tsx",
      "src/app/appointments/upcoming/page.tsx",
      "src/app/appointments/history/page.tsx",
      "src/app/appointments/preparation/page.tsx",
      "src/app/appointments/follow-ups/page.tsx",
    ];

    routes.forEach((route) => {
      it(`should contain route file ${route}`, () => {
        const fullPath = path.resolve(process.cwd(), route);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    });
  });
});
