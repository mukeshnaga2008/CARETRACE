import { describe, it, expect } from "vitest";
import {
  patientProfileEditSchema,
  emergencyContactSchema,
  emergencyContactReorderSchema,
  patientPreferencesSchema,
} from "@/lib/validations/patient-profile.schema";
import {
  INITIAL_PATIENT_PROFILE,
  INITIAL_EMERGENCY_CONTACTS,
  INITIAL_PATIENT_PREFERENCES,
  INITIAL_HEALTH_SOURCES,
  getMaskedPatientProfile,
} from "@/lib/data/patient-profile-data";
import fs from "fs";
import path from "path";

describe("Phase 5: Elderly Patient Profile & Health Identity", () => {
  /* -------------------------------------------------------------------------- */
  /* 1. Patient Profile Schema Validation                                       */
  /* -------------------------------------------------------------------------- */
  describe("Patient Profile Validation", () => {
    const validEditInput = {
      fullName: "Margaret Eleanor Sullivan",
      preferredName: "Peggy",
      phoneNumber: "+1 (555) 234-8901",
      email: "margaret.sullivan@caretrace.internal",
      addressLine1: "742 Evergreen Terrace, Apt 3B",
      addressCity: "Springfield",
      addressState: "IL",
      addressZip: "62704",
      preferredLanguage: "en",
      bloodType: "O+" as const,
      primaryDoctorName: "Dr. Eleanor Vance, MD",
      primaryClinic: "St. Jude Geriatric & Cardiology Associates",
    };

    it("should accept valid profile edits", () => {
      const result = patientProfileEditSchema.safeParse(validEditInput);
      expect(result.success).toBe(true);
    });

    it("should reject invalid names with forbidden characters", () => {
      const result = patientProfileEditSchema.safeParse({
        ...validEditInput,
        fullName: "Margaret <script>alert(1)</script>",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid blood type", () => {
      const result = patientProfileEditSchema.safeParse({
        ...validEditInput,
        bloodType: "C+",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid phone format", () => {
      const result = patientProfileEditSchema.safeParse({
        ...validEditInput,
        phoneNumber: "not-a-phone",
      });
      expect(result.success).toBe(false);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. Privacy & Sensitive Data Masking                                        */
  /* -------------------------------------------------------------------------- */
  describe("Sensitive Personal Information Masking", () => {
    it("should provide full unmasked profile for patient themselves", () => {
      const unmasked = getMaskedPatientProfile(INITIAL_PATIENT_PROFILE, "patient", "full_admin");
      expect(unmasked.dateOfBirth).toBe("1948-03-24");
      expect(unmasked.addressLine1).toBe("742 Evergreen Terrace, Apt 3B");
      expect(unmasked.phoneNumber).toBe("+1 (555) 234-8901");
    });

    it("should provide full unmasked profile for full_admin tier", () => {
      const unmasked = getMaskedPatientProfile(INITIAL_PATIENT_PROFILE, "family", "full_admin");
      expect(unmasked.dateOfBirth).toBe("1948-03-24");
      expect(unmasked.addressLine1).toBe("742 Evergreen Terrace, Apt 3B");
    });

    it("should mask DOB, street address, and phone number for family viewer tier", () => {
      const masked = getMaskedPatientProfile(INITIAL_PATIENT_PROFILE, "family", "family_viewer");
      expect(masked.dateOfBirth).toContain("Age 78");
      expect(masked.dateOfBirth).not.toBe("1948-03-24");
      expect(masked.addressLine1).toContain("Restricted");
      expect(masked.phoneNumber).toContain("***-****");
    });

    it("should mask sensitive identifiers for caregivers", () => {
      const masked = getMaskedPatientProfile(INITIAL_PATIENT_PROFILE, "caregiver", "caregiver_editor");
      expect(masked.dateOfBirth).toContain("Age 78");
      expect(masked.addressLine1).toContain("Restricted");
      expect(masked.phoneNumber).toContain("***-****");
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. Emergency Contacts Validation & Priority                                */
  /* -------------------------------------------------------------------------- */
  describe("Emergency Contact Management", () => {
    it("validates emergency contact schema", () => {
      const valid = emergencyContactSchema.safeParse({
        contactName: "David Sullivan",
        relationship: "Son & Primary Care Coordinator",
        phoneNumber: "+1 (555) 432-1098",
        email: "david.sullivan@caretrace.internal",
        priorityOrder: 1,
        isAuthorizedCaregiver: true,
        notes: "First emergency call for all urgent transport.",
      });
      expect(valid.success).toBe(true);
    });

    it("CRITICAL RULE: emergency contact must NOT default to authorized caregiver", () => {
      const defaultContact = emergencyContactSchema.parse({
        contactName: "Arthur Pendelton",
        relationship: "Neighbor",
        phoneNumber: "+1 (555) 345-6789",
        priorityOrder: 3,
      });
      expect(defaultContact.isAuthorizedCaregiver).toBe(false);
    });

    it("rejects priority orders outside 1-10 range", () => {
      const invalid = emergencyContactSchema.safeParse({
        contactName: "Invalid Contact",
        relationship: "Friend",
        phoneNumber: "+1 (555) 123-4567",
        priorityOrder: 15,
      });
      expect(invalid.success).toBe(false);
    });

    it("validates emergency contact reordering payload", () => {
      const valid = emergencyContactReorderSchema.safeParse({
        contacts: [
          { id: "550e8400-e29b-41d4-a716-446655440001", priorityOrder: 1 },
          { id: "550e8400-e29b-41d4-a716-446655440002", priorityOrder: 2 },
        ],
      });
      expect(valid.success).toBe(true);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. Patient Preferences Validation                                          */
  /* -------------------------------------------------------------------------- */
  describe("Patient Communication & Accessibility Preferences", () => {
    it("validates preferences with accessible defaults for elderly users", () => {
      const result = patientPreferencesSchema.safeParse({
        preferredName: "Peggy",
        preferredLanguage: "en",
        preferredCommunicationMethod: "phone",
        timeFormat: "12h",
        largerText: true,
        highContrast: false,
        reducedMotion: false,
        voiceReadoutEnabled: true,
        timezone: "America/Chicago",
        accessibilityNotes: "Mild hearing reduction in left ear.",
        notificationPreferences: {
          medicationReminders: true,
          appointmentReminders: true,
          careGapAlerts: true,
          quietHoursEnabled: true,
          quietHoursStart: "21:30",
          quietHoursEnd: "07:30",
        },
      });
      expect(result.success).toBe(true);
    });

    it("rejects malformed quiet hours time format", () => {
      const invalid = patientPreferencesSchema.safeParse({
        preferredName: "Peggy",
        notificationPreferences: {
          medicationReminders: true,
          appointmentReminders: true,
          careGapAlerts: true,
          quietHoursEnabled: true,
          quietHoursStart: "25:99", // invalid
          quietHoursEnd: "07:30",
        },
      });
      expect(invalid.success).toBe(false);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 5. Health Information Provenance & Verification Tracking                   */
  /* -------------------------------------------------------------------------- */
  describe("Provenance & Verification Integrity", () => {
    it("never presents unverified records as verified", () => {
      const unverified = INITIAL_HEALTH_SOURCES.find((s) => s.verificationStatus === "pending_review");
      expect(unverified).toBeDefined();
      expect(unverified?.verificationStatus).toBe("pending_review");
      expect(unverified?.verifiedAt).toBeUndefined();
    });

    it("verified clinician records include verifiedBy and verification timestamp", () => {
      const verified = INITIAL_HEALTH_SOURCES.find((s) => s.verificationStatus === "verified");
      expect(verified).toBeDefined();
      expect(verified?.verifiedAt).toBeDefined();
      expect(verified?.verifiedByName).toContain("Dr. Eleanor Vance");
      expect(verified?.sourceType).toBe("clinical_summary");
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 6. Database Migration & RLS Policy Integrity                               */
  /* -------------------------------------------------------------------------- */
  describe("Database Migration 2 Schema & RLS", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20260215000002_patient_profile_identity.sql"
    );

    it("migration file exists and enables RLS on all 4 new tables", () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
      const sql = fs.readFileSync(migrationPath, "utf-8");

      expect(sql).toContain("ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;");
      expect(sql).toContain("ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;");
      expect(sql).toContain("ALTER TABLE patient_preferences ENABLE ROW LEVEL SECURITY;");
      expect(sql).toContain("ALTER TABLE health_information_sources ENABLE ROW LEVEL SECURITY;");

      // Verify sensitive data helper function
      expect(sql).toContain("can_view_sensitive_patient_data");

      // Verify unique priority constraint
      expect(sql).toContain("CONSTRAINT uq_patient_priority UNIQUE (patient_id, priority_order)");
    });
  });
});
