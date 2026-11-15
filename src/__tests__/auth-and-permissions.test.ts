import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  careCircleInvitationSchema,
  acceptInvitationSchema,
  consentRecordSchema,
  consentRevocationSchema,
} from "@/lib/validations/auth.schema";
import {
  hasPermission,
  isConsentScopeGranted,
  isSafeRedirect,
  generateInvitationToken,
  hashToken,
  UserCareContext,
  ROLE_DEFAULT_PERMISSIONS,
  TIER_PERMISSIONS,
} from "@/lib/auth/permissions";
import fs from "fs";
import path from "path";

describe("Phase 4: Authentication, Access Control, Roles & Consent", () => {
  /* -------------------------------------------------------------------------- */
  /* 1. Registration Input Validation                                           */
  /* -------------------------------------------------------------------------- */
  describe("Registration Schema Validation", () => {
    const validRegistration = {
      fullName: "Margaret Sullivan",
      email: "margaret.sullivan@caretrace.internal",
      password: "CareTrace2026!",
      confirmPassword: "CareTrace2026!",
      role: "patient" as const,
      acceptTerms: true as const,
    };

    it("should accept valid registration data", () => {
      const result = registerSchema.safeParse(validRegistration);
      expect(result.success).toBe(true);
    });

    it("should reject short full names (<2 chars)", () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        fullName: "M",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.fullName).toBeDefined();
      }
    });

    it("should reject invalid email formats", () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        email: "not-an-email",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email).toBeDefined();
      }
    });

    it("should reject short passwords (<8 characters)", () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        password: "Pass1",
        confirmPassword: "Pass1",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.password).toBeDefined();
      }
    });

    it("should reject passwords without uppercase letter", () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        password: "caretrace2026!",
        confirmPassword: "caretrace2026!",
      });
      expect(result.success).toBe(false);
    });

    it("should reject passwords without a number", () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        password: "CareTraceSecret!",
        confirmPassword: "CareTraceSecret!",
      });
      expect(result.success).toBe(false);
    });

    it("should reject mismatched password confirmation", () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        confirmPassword: "DifferentPassword2026!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.confirmPassword).toBeDefined();
      }
    });

    it("should reject registration if terms are not accepted", () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        acceptTerms: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.acceptTerms).toBeDefined();
      }
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. Login Input Validation                                                  */
  /* -------------------------------------------------------------------------- */
  describe("Login Schema Validation", () => {
    it("should accept valid login credentials", () => {
      const result = loginSchema.safeParse({
        email: "david.sullivan@caretrace.internal",
        password: "FamilyPassword123!",
        rememberMe: true,
      });
      expect(result.success).toBe(true);
    });

    it("should reject malformed email", () => {
      const result = loginSchema.safeParse({
        email: "invalid-user",
        password: "Password123!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email).toBeDefined();
      }
    });

    it("should reject missing password", () => {
      const result = loginSchema.safeParse({
        email: "nurse.sarah@caretrace.internal",
        password: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.password).toBeDefined();
      }
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. Password Reset Flow Validation                                          */
  /* -------------------------------------------------------------------------- */
  describe("Password Reset Validation", () => {
    it("should validate forgot-password email", () => {
      const valid = forgotPasswordSchema.safeParse({
        email: "margaret.sullivan@caretrace.internal",
      });
      expect(valid.success).toBe(true);

      const invalid = forgotPasswordSchema.safeParse({ email: "invalid-email" });
      expect(invalid.success).toBe(false);
    });

    it("should validate new password reset requirements and confirmation", () => {
      const valid = resetPasswordSchema.safeParse({
        password: "NewSecurePassword2026!",
        confirmPassword: "NewSecurePassword2026!",
      });
      expect(valid.success).toBe(true);

      const mismatch = resetPasswordSchema.safeParse({
        password: "NewSecurePassword2026!",
        confirmPassword: "MismatchPassword2026!",
      });
      expect(mismatch.success).toBe(false);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. Role-Based Permissions & Relationship Model                             */
  /* -------------------------------------------------------------------------- */
  describe("Role and Permission Access Controls", () => {
    const patientContext: UserCareContext = {
      userId: "user-patient-101",
      role: "patient",
      isPatientThemselves: true,
      relationshipStatus: "active",
      permissionTier: "full_admin",
    };

    const familyContext: UserCareContext = {
      userId: "user-family-202",
      role: "family",
      isPatientThemselves: false,
      relationshipStatus: "active",
      permissionTier: "family_viewer",
    };

    const caregiverContext: UserCareContext = {
      userId: "user-caregiver-303",
      role: "caregiver",
      isPatientThemselves: false,
      relationshipStatus: "active",
      permissionTier: "caregiver_editor",
    };

    it("should allow patient to manage preferences and grant/revoke consent", () => {
      expect(hasPermission("manage_preferences", patientContext)).toBe(true);
      expect(hasPermission("grant_revoke_consent", patientContext)).toBe(true);
      expect(hasPermission("view_personal_records", patientContext)).toBe(true);
      expect(hasPermission("view_care_circle", patientContext)).toBe(true);
    });

    it("should allow family members to view care circle, view medications, and record adherence", () => {
      expect(hasPermission("view_care_circle", familyContext)).toBe(true);
      expect(hasPermission("view_medications", familyContext)).toBe(true);
      expect(hasPermission("record_adherence", familyContext)).toBe(true);
      expect(hasPermission("view_appointments", familyContext)).toBe(true);
    });

    it("should DENY family members with viewer tier from editing medications or granting consent", () => {
      expect(hasPermission("edit_medications", familyContext)).toBe(false);
      expect(hasPermission("grant_revoke_consent", familyContext)).toBe(false);
      expect(hasPermission("manage_care_circle", familyContext)).toBe(false);
    });

    it("should allow caregivers to record adherence and update assigned tasks", () => {
      expect(hasPermission("record_adherence", caregiverContext)).toBe(true);
      expect(hasPermission("update_assigned_tasks", caregiverContext)).toBe(true);
      expect(hasPermission("view_instructions", caregiverContext)).toBe(true);
    });

    it("should DENY caregivers from granting or revoking patient consent", () => {
      expect(hasPermission("grant_revoke_consent", caregiverContext)).toBe(false);
      expect(hasPermission("manage_preferences", caregiverContext)).toBe(false);
    });

    it("CRITICAL RULE: Revoked relationship grants ZERO permissions", () => {
      const revokedContext: UserCareContext = {
        userId: "user-revoked-999",
        role: "family",
        isPatientThemselves: false,
        relationshipStatus: "revoked",
        permissionTier: "full_admin", // Even if old tier was admin
      };

      expect(hasPermission("view_medications", revokedContext)).toBe(false);
      expect(hasPermission("view_care_circle", revokedContext)).toBe(false);
      expect(hasPermission("record_adherence", revokedContext)).toBe(false);
      expect(hasPermission("view_personal_records", revokedContext)).toBe(false);
      expect(hasPermission("manage_preferences", revokedContext)).toBe(false);
    });

    it("CRITICAL RULE: Expired relationship grants ZERO permissions", () => {
      const expiredContext: UserCareContext = {
        userId: "user-expired-888",
        role: "caregiver",
        isPatientThemselves: false,
        relationshipStatus: "expired",
        permissionTier: "caregiver_editor",
      };

      expect(hasPermission("record_adherence", expiredContext)).toBe(false);
      expect(hasPermission("view_medications", expiredContext)).toBe(false);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 5. Consent Scope Verification                                              */
  /* -------------------------------------------------------------------------- */
  describe("Consent Scopes & Access Verification", () => {
    it("full_medical scope satisfies all required scopes", () => {
      expect(isConsentScopeGranted("medication_only", ["full_medical"])).toBe(true);
      expect(isConsentScopeGranted("care_circle_coordination", ["full_medical"])).toBe(true);
      expect(isConsentScopeGranted("emergency_summary", ["full_medical"])).toBe(true);
    });

    it("medication_only scope satisfies only medication requests", () => {
      expect(isConsentScopeGranted("medication_only", ["medication_only"])).toBe(true);
      expect(isConsentScopeGranted("care_circle_coordination", ["medication_only"])).toBe(false);
    });

    it("empty granted scopes denies access", () => {
      expect(isConsentScopeGranted("medication_only", [])).toBe(false);
    });

    it("validates consent record schema", () => {
      const valid = consentRecordSchema.safeParse({
        patientId: "550e8400-e29b-41d4-a716-446655440000",
        scope: "medication_only",
        purpose: "Assisting Margaret with evening prescription schedule",
      });
      expect(valid.success).toBe(true);
    });

    it("validates consent revocation schema requires justification", () => {
      const valid = consentRevocationSchema.safeParse({
        consentId: "550e8400-e29b-41d4-a716-446655440000",
        reason: "Caregiver contract ended on 2026-02-15",
      });
      expect(valid.success).toBe(true);

      const invalid = consentRevocationSchema.safeParse({
        consentId: "550e8400-e29b-41d4-a716-446655440000",
        reason: "No", // too short (<5 chars)
      });
      expect(invalid.success).toBe(false);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 6. Cryptographic Invitation Token Hashing                                 */
  /* -------------------------------------------------------------------------- */
  describe("Care Circle Invitation Token Security", () => {
    it("generates 64-character raw hex token and 64-character SHA-256 hash", () => {
      const { rawToken, tokenHash } = generateInvitationToken();
      expect(rawToken).toHaveLength(64);
      expect(tokenHash).toHaveLength(64);
      expect(rawToken).not.toEqual(tokenHash);

      // Re-hashing the raw token must deterministically yield the same hash
      expect(hashToken(rawToken)).toBe(tokenHash);
    });

    it("validates invitation acceptance schema", () => {
      const { rawToken } = generateInvitationToken();
      const valid = acceptInvitationSchema.safeParse({
        invitationToken: rawToken,
      });
      expect(valid.success).toBe(true);

      const invalid = acceptInvitationSchema.safeParse({
        invitationToken: "short-token",
      });
      expect(invalid.success).toBe(false);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 7. Open Redirect Vulnerability Prevention                                   */
  /* -------------------------------------------------------------------------- */
  describe("Open Redirect Security", () => {
    it("allows safe internal relative paths", () => {
      expect(isSafeRedirect("/dashboard")).toBe(true);
      expect(isSafeRedirect("/medications")).toBe(true);
      expect(isSafeRedirect("/care-circle")).toBe(true);
      expect(isSafeRedirect("/continuity?version=v2.1")).toBe(true);
    });

    it("rejects absolute external URLs and protocol schemes", () => {
      expect(isSafeRedirect("https://malicious-site.com")).toBe(false);
      expect(isSafeRedirect("http://attacker.com/steal-session")).toBe(false);
      expect(isSafeRedirect("ftp://server.org")).toBe(false);
      expect(isSafeRedirect("javascript:alert(document.cookie)")).toBe(false);
    });

    it("rejects protocol-relative URLs", () => {
      expect(isSafeRedirect("//evil.com")).toBe(false);
      expect(isSafeRedirect("//google.com/test")).toBe(false);
    });

    it("rejects Windows backslash path traversal exploits", () => {
      expect(isSafeRedirect("/\\evil.com")).toBe(false);
      expect(isSafeRedirect("\\\\evil.com")).toBe(false);
    });

    it("handles null and undefined safely", () => {
      expect(isSafeRedirect(null)).toBe(false);
      expect(isSafeRedirect(undefined)).toBe(false);
      expect(isSafeRedirect("")).toBe(false);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 8. Database Migrations and Row Level Security (RLS) Inspection             */
  /* -------------------------------------------------------------------------- */
  describe("SQL Schema & RLS Policy Integrity", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20260215000001_auth_roles_consent.sql"
    );

    it("migration file exists and contains RLS policies", () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
      const sqlContent = fs.readFileSync(migrationPath, "utf-8");

      // Verify RLS enablement
      expect(sqlContent).toContain("ALTER TABLE care_circles ENABLE ROW LEVEL SECURITY;");
      expect(sqlContent).toContain("ALTER TABLE care_invitations ENABLE ROW LEVEL SECURITY;");
      expect(sqlContent).toContain("ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;");
      expect(sqlContent).toContain("ALTER TABLE access_grants ENABLE ROW LEVEL SECURITY;");

      // Verify immutable audit log trigger
      expect(sqlContent).toContain("CREATE TRIGGER trg_immutable_audit_events");
      expect(sqlContent).toContain("BEFORE UPDATE OR DELETE ON audit_events");
      expect(sqlContent).toContain("Audit events are immutable and cannot be updated or deleted");

      // Verify security definer functions for circle isolation
      expect(sqlContent).toContain("is_active_care_circle_member");
      expect(sqlContent).toContain("is_care_circle_admin");
    });
  });
});
