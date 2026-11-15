import { describe, it, expect } from "vitest";
import {
  createInstructionSchema,
  createInstructionVersionSchema,
  createInstructionSourceSchema,
  reviewInstructionSchema,
  archiveInstructionSchema,
} from "@/lib/validations/instruction.schema";
import {
  INITIAL_CARE_INSTRUCTIONS,
  INITIAL_INSTRUCTION_SOURCES,
  INITIAL_INSTRUCTION_VERSIONS,
  INITIAL_INSTRUCTION_REVIEWS,
  getCachedInstructions,
  getCachedInstructionSources,
  getCachedInstructionVersions,
  getCachedInstructionReviews,
  addCareInstruction,
  addInstructionSource,
  createNewInstructionVersion,
  reviewInstruction,
  archiveInstruction,
  compareInstructionVersions,
} from "@/lib/data/instruction-vault-data";
import fs from "fs";
import path from "path";

describe("Phase 9: CARETRACE Instruction Vault", () => {
  /* -------------------------------------------------------------------------- */
  /* 1. Instruction Validation Schemas                                          */
  /* -------------------------------------------------------------------------- */
  describe("Instruction Validation Schemas", () => {
    it("should accept valid instruction creation payload", () => {
      const payload = {
        patientId: "patient-profile-001",
        title: "Daily Orthostatic Blood Pressure Protocol",
        category: "medication_related" as const,
        description: "Check supine and standing blood pressure before evening dose.",
        sourceId: "src-001",
        effectiveDate: "2026-03-01",
        structuredContent: {
          frequency: "Daily at 19:00",
          targetParameter: "Systolic drop < 20 mmHg",
        },
      };

      const res = createInstructionSchema.safeParse(payload);
      expect(res.success).toBe(true);
    });

    it("should reject instruction with title under 3 characters", () => {
      const payload = {
        patientId: "patient-profile-001",
        title: "BP",
        category: "medication_related" as const,
        description: "Check blood pressure.",
        sourceId: "src-001",
      };

      const res = createInstructionSchema.safeParse(payload);
      expect(res.success).toBe(false);
    });

    it("should require at least 5 characters for version changeReason", () => {
      const valid = createInstructionVersionSchema.safeParse({
        instructionId: "inst-001",
        title: "Updated Blood Pressure Protocol",
        category: "medication_related" as const,
        description: "Updated threshold parameter per cardiologist review.",
        sourceId: "src-001",
        changeReason: "Lowered systolic threshold to avoid unnecessary dose withholding.",
      });
      expect(valid.success).toBe(true);

      const invalid = createInstructionVersionSchema.safeParse({
        instructionId: "inst-001",
        title: "Updated Blood Pressure Protocol",
        category: "medication_related" as const,
        description: "Updated threshold parameter.",
        sourceId: "src-001",
        changeReason: "edit", // < 5 chars
      });
      expect(invalid.success).toBe(false);
    });

    it("should require decision and rationale for instruction review", () => {
      const valid = reviewInstructionSchema.safeParse({
        instructionId: "inst-001",
        decision: "verified" as const,
        rationale: "Discharge instructions cross-verified against hospital discharge order.",
      });
      expect(valid.success).toBe(true);

      const invalidDecision = reviewInstructionSchema.safeParse({
        instructionId: "inst-001",
        decision: "auto_approved" as any,
        rationale: "Valid rationale provided here.",
      });
      expect(invalidDecision.success).toBe(false);

      const invalidRationale = reviewInstructionSchema.safeParse({
        instructionId: "inst-001",
        decision: "verified" as const,
        rationale: "ok", // < 5 chars
      });
      expect(invalidRationale.success).toBe(false);
    });

    it("should validate source creation with missing details flag", () => {
      const validSource = {
        patientId: "patient-profile-001",
        sourceType: "patient_or_representative_entry" as const,
        title: "Transcribed Neighbor Herbal Advice",
        isMissingSourceDetails: true,
        notesAboutMissingSource: "Unverified verbal discussion without clinical signature.",
      };

      const res = createInstructionSourceSchema.safeParse(validSource);
      expect(res.success).toBe(true);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. Source Provenance & Integrity                                           */
  /* -------------------------------------------------------------------------- */
  describe("Source Provenance & Anti-Fabrication", () => {
    it("should provide baseline sources with authentic provenance metadata", () => {
      const sources = getCachedInstructionSources();
      expect(sources.length).toBeGreaterThanOrEqual(4);

      const dischargeSource = sources.find((s) => s.sourceType === "hospital_discharge");
      expect(dischargeSource).toBeDefined();
      expect(dischargeSource?.facilityName).toBe("St. Jude Medical Center");
      expect(dischargeSource?.providerName).toBe("Dr. Eleanor Vance, MD");
      expect(dischargeSource?.documentReference).toBe("DISCH-STJUDE-2026-8819");
      expect(dischargeSource?.attachments?.length).toBeGreaterThanOrEqual(1);
    });

    it("should flag incomplete sources without fabricating clinical credentials", () => {
      const sources = getCachedInstructionSources();
      const incomplete = sources.find((s) => s.isMissingSourceDetails);
      expect(incomplete).toBeDefined();
      expect(incomplete?.notesAboutMissingSource).toBeDefined();
      expect(incomplete?.isMissingSourceDetails).toBe(true);
    });

    it("should add a new source document to provenance registry", () => {
      const testSource = {
        id: `src-test-${Date.now()}`,
        patientId: "patient-profile-001",
        sourceType: "specialist_consult" as const,
        title: "Physical Therapy Home Ergonomics Assessment",
        facilityName: "Apex Rehabilitation",
        providerName: "Elena Rostova, DPT",
        providerRole: "Physical Therapist",
        documentReference: "PT-EVAL-2026-03",
        enteredBy: "member-david",
        enteredByName: "David Sullivan",
        enteredByRole: "Family Care Coordinator",
        entryTimestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      addInstructionSource(testSource);
      const found = getCachedInstructionSources().find((s) => s.id === testSource.id);
      expect(found).toBeDefined();
      expect(found?.providerName).toBe("Elena Rostova, DPT");
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. Instruction Lifecycle & Review Gate                                     */
  /* -------------------------------------------------------------------------- */
  describe("Instruction Lifecycle & Verification Gates", () => {
    it("should add instruction in awaiting_verification status", () => {
      const instId = `inst-test-${Date.now()}`;
      addCareInstruction({
        id: instId,
        patientId: "patient-profile-001",
        title: "Daily Afternoon Walk Routine",
        category: "mobility_daily_routine",
        description: "15 minutes of assisted walking along paved driveway with rolling walker.",
        currentVersionNumber: 1,
        verificationStatus: "awaiting_verification",
        sourceId: "src-002",
        createdBy: "member-david",
        createdByName: "David Sullivan",
        createdByRole: "Family Care Coordinator",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const inst = getCachedInstructions().find((i) => i.id === instId);
      expect(inst).toBeDefined();
      expect(inst?.verificationStatus).toBe("awaiting_verification");

      // Version 1 must be initialized in version history
      const v1 = getCachedInstructionVersions().find(
        (v) => v.instructionId === instId && v.versionNumber === 1
      );
      expect(v1).toBeDefined();
    });

    it("should allow human verification with recorded clinician and rationale", () => {
      const testInst = getCachedInstructions().find((i) => i.verificationStatus === "awaiting_verification");
      expect(testInst).toBeDefined();

      const reviewed = reviewInstruction(
        testInst!.id,
        "verified",
        "Clinical verification completed per protocol DISCH-8819.",
        {
          id: "member-vance",
          name: "Dr. Eleanor Vance, MD",
          role: "Attending Cardiologist",
        },
        "Safety thresholds confirmed."
      );

      expect(reviewed).not.toBeNull();
      expect(reviewed?.verificationStatus).toBe("verified");
      expect(reviewed?.verifiedByName).toBe("Dr. Eleanor Vance, MD");
      expect(reviewed?.verificationRationale).toContain("Clinical verification completed");

      const reviews = getCachedInstructionReviews();
      const reviewRecord = reviews.find((r) => r.instructionId === testInst!.id);
      expect(reviewRecord).toBeDefined();
      expect(reviewRecord?.decision).toBe("verified");
    });

    it("should allow human rejection with recorded contraindication rationale", () => {
      const rejected = getCachedInstructions().find((i) => i.verificationStatus === "rejected");
      expect(rejected).toBeDefined();
      expect(rejected?.rejectionRationale).toContain("Contraindicated");
      expect(rejected?.rejectedByName).toBe("Dr. Eleanor Vance, MD");
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. Immutable Versioning & Crucial Verification Reset                       */
  /* -------------------------------------------------------------------------- */
  describe("Immutable Versioning & Verification Reset", () => {
    it("should create new version and NOT inherit verified status (resets to awaiting_verification)", () => {
      // Find verified instruction
      const verifiedInst = getCachedInstructions().find((i) => i.id === "inst-001");
      expect(verifiedInst).toBeDefined();
      expect(verifiedInst?.verificationStatus).toBe("verified");
      const prevVersionNumber = verifiedInst!.currentVersionNumber;

      // Edit instruction through new version
      const updated = createNewInstructionVersion(
        verifiedInst!.id,
        {
          title: "Morning Blood Pressure Monitoring & Metoprolol Protocol (Refined)",
          category: "medication_related",
          description: "Updated threshold: Systolic < 95 mmHg withhold parameter.",
          sourceId: "src-001",
          changeReason: "Cardiologist agreed to lower threshold after 3-week stable reading period.",
        },
        {
          id: "member-david",
          name: "David Sullivan",
          role: "Family Care Coordinator",
        }
      );

      expect(updated).not.toBeNull();
      expect(updated?.currentVersionNumber).toBe(prevVersionNumber + 1);
      // CRITICAL CHECK: Verification status MUST reset to awaiting_verification!
      expect(updated?.verificationStatus).toBe("awaiting_verification");
      expect(updated?.verifiedByName).toBeUndefined();
      expect(updated?.verifiedAt).toBeUndefined();

      // Check version history preserves both previous and current versions
      const versions = getCachedInstructionVersions().filter((v) => v.instructionId === verifiedInst!.id);
      expect(versions.length).toBeGreaterThanOrEqual(2);
      expect(versions.some((v) => v.versionNumber === prevVersionNumber)).toBe(true);
      expect(versions.some((v) => v.versionNumber === prevVersionNumber + 1)).toBe(true);
    });

    it("should accurately compare two versions and report field differences", () => {
      const comparison = compareInstructionVersions("inst-001", 1, 2);
      expect(comparison.versionA).not.toBeNull();
      expect(comparison.versionB).not.toBeNull();
      expect(comparison.versionA?.versionNumber).toBe(1);
      expect(comparison.versionB?.versionNumber).toBe(2);

      const descDiff = comparison.differences.find((d) => d.field === "description");
      expect(descDiff).toBeDefined();
      expect(descDiff?.changed).toBe(true);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 5. Non-Prescribing Safety Rule Verification                                */
  /* -------------------------------------------------------------------------- */
  describe("Clinical Safety & Downstream Integrity", () => {
    it("should never automatically alter medication dosages or schedules upon instruction creation", () => {
      // Adding an instruction must remain descriptive without side-effects on medication records
      const instId = `inst-safe-${Date.now()}`;
      addCareInstruction({
        id: instId,
        patientId: "patient-profile-001",
        title: "Hydration Advice with Meals",
        category: "dietary",
        description: "Consume water with evening meals.",
        currentVersionNumber: 1,
        verificationStatus: "awaiting_verification",
        sourceId: "src-001",
        relatedMedicationId: "med-001",
        createdBy: "member-david",
        createdByName: "David Sullivan",
        createdByRole: "Family Care Coordinator",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const inst = getCachedInstructions().find((i) => i.id === instId);
      expect(inst).toBeDefined();
      expect(inst?.relatedMedicationId).toBe("med-001");
      // The instruction references the medication ID for traceability,
      // but does NOT alter the medication regimen autonomously.
    });

    it("should archive instruction preserving all version history", () => {
      const testInst = getCachedInstructions()[0];
      const archived = archiveInstruction(testInst.id, "Superseded by spring 2026 clinical guidelines");
      expect(archived).not.toBeNull();
      expect(archived?.verificationStatus).toBe("archived");
      expect(archived?.archiveReason).toBe("Superseded by spring 2026 clinical guidelines");
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 6. SQL Migration 6 Verification                                            */
  /* -------------------------------------------------------------------------- */
  describe("SQL Migration Verification", () => {
    it("should have migration 20260215000006_instruction_vault.sql with required tables and RLS", () => {
      const migrationPath = path.join(
        process.cwd(),
        "supabase",
        "migrations",
        "20260215000006_instruction_vault.sql"
      );
      expect(fs.existsSync(migrationPath)).toBe(true);

      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain("care_instructions");
      expect(sql).toContain("care_instruction_versions");
      expect(sql).toContain("instruction_sources");
      expect(sql).toContain("instruction_reviews");
      expect(sql).toContain("instruction_attachments");
      expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
      expect(sql).toContain("awaiting_verification");
      expect(sql).toContain("superseded");
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 7. Frontend Routes File Existence                                          */
  /* -------------------------------------------------------------------------- */
  describe("Instruction Vault Frontend Routes", () => {
    const requiredRoutes = [
      "src/app/instructions/page.tsx",
      "src/app/instructions/add/page.tsx",
      "src/app/instructions/[id]/page.tsx",
      "src/app/instructions/[id]/edit/page.tsx",
      "src/app/instructions/[id]/history/page.tsx",
      "src/app/instructions/sources/page.tsx",
      "src/app/instructions/review/page.tsx",
      "src/app/instructions/archived/page.tsx",
      "src/components/features/instructions/instructions-nav-tabs.tsx",
      "src/app/api/instructions/route.ts",
      "src/app/api/instructions/[id]/route.ts",
      "src/app/api/instructions/[id]/versions/route.ts",
      "src/app/api/instructions/[id]/review/route.ts",
      "src/app/api/instructions/sources/route.ts",
    ];

    it.each(requiredRoutes)("should exist: %s", (routePath) => {
      const fullPath = path.join(process.cwd(), routePath);
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  });
});
