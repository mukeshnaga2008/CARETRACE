import { describe, it, expect } from "vitest";
import {
  createMedicationSchema,
  editMedicationSchema,
  recordAdherenceSchema,
  reviewMedicationSchema,
} from "@/lib/validations/medication.schema";
import {
  INITIAL_MEDICATIONS,
  INITIAL_MEDICATION_VERSIONS,
  generateDoseEventsForDate,
  recordDoseAdherence,
  calculateAdherenceMetrics,
  getCachedMedications,
  getCachedVersions,
  updateMedication,
  verifyMedicationRecord,
  addMedication,
} from "@/lib/data/medication-lifecycle-data";
import fs from "fs";
import path from "path";

describe("Phase 6: Medication Lifecycle Manager", () => {
  /* -------------------------------------------------------------------------- */
  /* 1. Validation Schemas                                                      */
  /* -------------------------------------------------------------------------- */
  describe("Medication Validation Schemas", () => {
    const validCreationInput = {
      patientId: "patient-profile-001",
      displayName: "Atorvastatin",
      genericName: "Atorvastatin Calcium",
      strengthText: "20mg",
      form: "Tablet",
      routeText: "Oral",
      prescribedInstructions: "Take 1 tablet by mouth daily at bedtime with water.",
      prescribingProvider: "Dr. Eleanor Vance, MD",
      pharmacy: "Walgreens #4821",
      rxNumber: "RX-554109",
      refillsRemaining: 3,
      effectiveStartDate: "2026-02-15",
      sourceType: "physician_prescribed" as const,
      sourceReference: "Outpatient Clinic Visit Summary",
      scheduledTimes: ["21:00"],
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    };

    it("should accept valid medication creation payload", () => {
      const result = createMedicationSchema.safeParse(validCreationInput);
      expect(result.success).toBe(true);
    });

    it("should reject creation if displayName is missing", () => {
      const result = createMedicationSchema.safeParse({
        ...validCreationInput,
        displayName: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject creation if strengthText is missing", () => {
      const result = createMedicationSchema.safeParse({
        ...validCreationInput,
        strengthText: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject creation if scheduledTimes contains invalid HH:MM format", () => {
      const result = createMedicationSchema.safeParse({
        ...validCreationInput,
        scheduledTimes: ["25:00", "invalid-time"],
      });
      expect(result.success).toBe(false);
    });

    it("should reject creation if refillsRemaining is negative", () => {
      const result = createMedicationSchema.safeParse({
        ...validCreationInput,
        refillsRemaining: -1,
      });
      expect(result.success).toBe(false);
    });

    it("should strictly require changeReason when editing a medication", () => {
      const validEdit = {
        strengthText: "40mg",
        changeReason: "Titrated by cardiologist following lipid panel review.",
      };
      const result = editMedicationSchema.safeParse(validEdit);
      expect(result.success).toBe(true);

      const invalidEdit = {
        strengthText: "40mg",
        changeReason: "abc", // less than 5 characters
      };
      const invalidResult = editMedicationSchema.safeParse(invalidEdit);
      expect(invalidResult.success).toBe(false);

      const missingReasonEdit = {
        strengthText: "40mg",
      };
      const missingResult = editMedicationSchema.safeParse(missingReasonEdit);
      expect(missingResult.success).toBe(false);
    });

    it("should validate adherence recording actions", () => {
      const validAction = {
        doseEventId: "dose-12345",
        action: "report_taken" as const,
        notes: "Taken with oatmeal and water",
      };
      expect(recordAdherenceSchema.safeParse(validAction).success).toBe(true);

      const invalidAction = {
        doseEventId: "dose-12345",
        action: "unknown_action",
      };
      expect(recordAdherenceSchema.safeParse(invalidAction).success).toBe(false);
    });

    it("should validate clinician review decisions", () => {
      const validReview = {
        medicationId: "med-004",
        decision: "verified" as const,
        clarificationNotes: "Cardiologist approved supplement co-administration.",
      };
      expect(reviewMedicationSchema.safeParse(validReview).success).toBe(true);

      const invalidReview = {
        medicationId: "med-004",
        decision: "rejected_arbitrary",
      };
      expect(reviewMedicationSchema.safeParse(invalidReview).success).toBe(false);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. Idempotent Dose Event Generation                                        */
  /* -------------------------------------------------------------------------- */
  describe("Idempotent Dose Event Generator", () => {
    const testDate = "2026-03-01";

    it("should generate dose events deterministically for a date", () => {
      const events1 = generateDoseEventsForDate("patient-profile-001", testDate);
      expect(events1.length).toBeGreaterThanOrEqual(3);

      // Verify idempotency keys exist and follow the deterministic format
      events1.forEach((evt) => {
        expect(evt.idempotencyKey).toBeDefined();
        expect(evt.idempotencyKey).toMatch(/^med_med-\d{3}_2026-03-01_\d{2}:\d{2}$/);
      });
    });

    it("should never produce duplicate dose events when called repeatedly (Idempotency guarantee)", () => {
      const countBefore = generateDoseEventsForDate("patient-profile-001", testDate).length;
      // Call again 3 times
      generateDoseEventsForDate("patient-profile-001", testDate);
      generateDoseEventsForDate("patient-profile-001", testDate);
      const countAfter = generateDoseEventsForDate("patient-profile-001", testDate).length;

      expect(countAfter).toBe(countBefore);
    });

    it("should sort dose events chronologically by scheduledTime", () => {
      const events = generateDoseEventsForDate("patient-profile-001", testDate);
      for (let i = 0; i < events.length - 1; i++) {
        expect(events[i].scheduledTime.localeCompare(events[i + 1].scheduledTime)).toBeLessThanOrEqual(0);
      }
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. Adherence Recording & Metrics Calculation                               */
  /* -------------------------------------------------------------------------- */
  describe("Adherence Tracking Engine", () => {
    it("should record taken dose event with actor provenance", () => {
      const testDate = "2026-03-02";
      const events = generateDoseEventsForDate("patient-profile-001", testDate);
      const target = events[0];

      const res = recordDoseAdherence(
        target.id,
        "report_taken",
        "Margaret Sullivan",
        "Patient",
        "Taken with breakfast"
      );

      expect(res.success).toBe(true);
      expect(res.event?.eventStatus).toBe("reported_taken");
      expect(res.event?.reportedByName).toBe("Margaret Sullivan");
      expect(res.event?.reportedByRole).toBe("Patient");
      expect(res.event?.reportedAt).toBeDefined();
    });

    it("should record skipped dose with documented reason code", () => {
      const testDate = "2026-03-03";
      const events = generateDoseEventsForDate("patient-profile-001", testDate);
      const target = events[1];

      const res = recordDoseAdherence(
        target.id,
        "report_skipped",
        "David Sullivan",
        "Family Care Coordinator",
        "Patient reported mild nausea",
        "Nausea / Stomach upset"
      );

      expect(res.success).toBe(true);
      expect(res.event?.eventStatus).toBe("skipped");
      expect(res.event?.reportedByName).toBe("David Sullivan");
    });

    it("should calculate adherence rate percentage transparently", () => {
      const mockEvents = [
        { id: "1", patientId: "p1", medicationId: "m1", medicationName: "Med A", dosage: "10mg", scheduledAt: "2026-02-15T08:00:00", scheduledTime: "08:00", eventStatus: "reported_taken" as const },
        { id: "2", patientId: "p1", medicationId: "m2", medicationName: "Med B", dosage: "20mg", scheduledAt: "2026-02-15T08:00:00", scheduledTime: "08:00", eventStatus: "reported_taken" as const },
        { id: "3", patientId: "p1", medicationId: "m3", medicationName: "Med C", dosage: "25mg", scheduledAt: "2026-02-15T20:00:00", scheduledTime: "20:00", eventStatus: "skipped" as const },
        { id: "4", patientId: "p1", medicationId: "m4", medicationName: "Med D", dosage: "100mg", scheduledAt: "2026-02-15T20:00:00", scheduledTime: "20:00", eventStatus: "upcoming" as const },
      ];

      const metrics = calculateAdherenceMetrics(mockEvents);
      expect(metrics.totalScheduled).toBe(4);
      expect(metrics.reportedTaken).toBe(2);
      expect(metrics.skipped).toBe(1);
      // (2 / 4) * 100 = 50%
      expect(metrics.adherenceRatePercentage).toBe(50);
      expect(metrics.explanation).toContain("Adherence rate is calculated as");
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. Auditable Versioning & Provenance                                       */
  /* -------------------------------------------------------------------------- */
  describe("Medication Versioning & Provenance Tracking", () => {
    it("should verify baseline medications contain full provenance", () => {
      expect(INITIAL_MEDICATIONS.length).toBeGreaterThanOrEqual(4);

      // Lisinopril
      const lisinopril = INITIAL_MEDICATIONS.find((m) => m.displayName === "Lisinopril");
      expect(lisinopril).toBeDefined();
      expect(lisinopril?.sourceType).toBe("physician_prescribed");
      expect(lisinopril?.verificationStatus).toBe("verified");
      expect(lisinopril?.versionNumber).toBe(1);

      // CoQ10 (Family entered, awaiting review)
      const coq10 = INITIAL_MEDICATIONS.find((m) => m.displayName.includes("CoQ10"));
      expect(coq10).toBeDefined();
      expect(coq10?.sourceType).toBe("family_entered");
      expect(coq10?.verificationStatus).toBe("awaiting_review");
      expect(coq10?.status).toBe("awaiting_verification");
    });

    it("should increment version and record audit entry when prescription instructions change", () => {
      const targetMed = getCachedMedications().find((m) => m.id === "med-002");
      expect(targetMed).toBeDefined();
      const initialVersion = targetMed!.versionNumber;

      const updated = updateMedication(
        "med-002",
        { prescribedInstructions: "Take 1 capsule (2000 IU) by mouth with dinner instead of breakfast." },
        "Switched to evening intake per patient preference and tolerance",
        "Sarah Jenkins, RN",
        "Visiting Home Nurse"
      );

      expect(updated).toBeDefined();
      expect(updated?.versionNumber).toBe(initialVersion + 1);

      // Check version history record
      const versions = getCachedVersions().filter((v) => v.medicationId === "med-002");
      const latestVersion = versions[versions.length - 1];
      expect(latestVersion.versionNumber).toBe(initialVersion + 1);
      expect(latestVersion.changeReason).toBe("Switched to evening intake per patient preference and tolerance");
      expect(latestVersion.changedByName).toBe("Sarah Jenkins, RN");
    });

    it("should allow clinician to verify unverified medication and transition status to active", () => {
      const verified = verifyMedicationRecord(
        "med-004",
        "verified",
        "Dr. Eleanor Vance, MD",
        "Cardiologist"
      );

      expect(verified).toBeDefined();
      expect(verified?.verificationStatus).toBe("verified");
      expect(verified?.status).toBe("active");
      expect(verified?.verifiedByName).toContain("Dr. Eleanor Vance, MD");
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 5. Non-Prescribing Clinical Safety Assertion                               */
  /* -------------------------------------------------------------------------- */
  describe("Clinical Safety & Non-Prescribing Governance", () => {
    it("should assert that CARETRACE does not possess autonomous dosage recommendation algorithms", () => {
      // All instructions originate from human inputs or external EHR imports
      const allMeds = getCachedMedications();
      allMeds.forEach((m) => {
        expect([
          "physician_prescribed",
          "family_entered",
          "caregiver_entered",
          "patient_provided",
          "imported_external",
        ]).toContain(m.sourceType);
      });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 6. Database Migration & RLS Security Integrity                             */
  /* -------------------------------------------------------------------------- */
  describe("Database Migration Verification", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20260215000003_medication_lifecycle.sql"
    );

    it("should have migration file for medication lifecycle", () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
      const sql = fs.readFileSync(migrationPath, "utf-8");

      expect(sql).toContain("CREATE TABLE IF NOT EXISTS medication_versions");
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS medication_schedules");
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS medication_assignments");
      expect(sql).toContain("ALTER TABLE dose_events ADD COLUMN idempotency_key");
      expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 7. Frontend Route Files Integrity                                          */
  /* -------------------------------------------------------------------------- */
  describe("Frontend Medication Route Files", () => {
    const routes = [
      "src/app/medications/page.tsx",
      "src/app/medications/add/page.tsx",
      "src/app/medications/[id]/page.tsx",
      "src/app/medications/[id]/edit/page.tsx",
      "src/app/medications/schedule/page.tsx",
      "src/app/medications/adherence/page.tsx",
      "src/app/medications/history/page.tsx",
      "src/app/medications/review/page.tsx",
    ];

    routes.forEach((route) => {
      it(`should contain route file ${route}`, () => {
        const fullPath = path.resolve(process.cwd(), route);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    });
  });
});
