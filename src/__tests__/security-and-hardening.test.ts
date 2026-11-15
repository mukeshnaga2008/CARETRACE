import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  hasPermission,
  isConsentScopeGranted,
  verifyPatientScope,
  canModifyRoleOrTier,
  safeCompare,
  hashToken,
  generateInvitationToken,
  ROLE_DEFAULT_PERMISSIONS,
  TIER_PERMISSIONS,
  UserCareContext,
} from '@/lib/auth/permissions';
import {
  validateUploadedFile,
  sanitizeFileName,
  generateSecureStoragePath,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from '@/lib/security/file-validation';
import {
  checkRateLimit,
  resetRateLimit,
} from '@/lib/security/rate-limiter';
import {
  redactString,
  sanitizeForLog,
} from '@/lib/security/phi-sanitizer';
import { generateSafePreview } from '@/lib/services/notification-transport';
import { isSafeRedirect } from '@/lib/auth/redirects';

describe('CARETRACE Security, Privacy & Quality Assurance (Prompt 14)', () => {
  /* -------------------------------------------------------------------------- */
  /* 1. Authentication & Session Security                                      */
  /* -------------------------------------------------------------------------- */
  describe('1. Authentication & Session Security', () => {
    it('generates cryptographically secure invitation tokens and valid SHA-256 hashes', () => {
      const { rawToken, tokenHash } = generateInvitationToken();
      expect(rawToken).toHaveLength(64); // 32 bytes hex = 64 chars
      expect(tokenHash).toHaveLength(64);
      expect(hashToken(rawToken)).toBe(tokenHash);
    });

    it('performs constant-time string comparisons defending against timing attacks', () => {
      const secret = 'caretrace-cron-secret-2026';
      expect(safeCompare(secret, 'caretrace-cron-secret-2026')).toBe(true);
      expect(safeCompare(secret, 'wrong-secret')).toBe(false);
      expect(safeCompare(secret, 'caretrace-cron-secret-2027')).toBe(false);
      expect(safeCompare('', '')).toBe(true);
      expect(safeCompare('a', '')).toBe(false);
    });

    it('validates safe redirects and rejects open-redirect phishing vectors', () => {
      // Safe internal redirects
      expect(isSafeRedirect('/dashboard')).toBe(true);
      expect(isSafeRedirect('/medications/schedule')).toBe(true);
      expect(isSafeRedirect('/care-passport/preview')).toBe(true);

      // Malicious external / open redirect vectors
      expect(isSafeRedirect('https://malicious-site.com')).toBe(false);
      expect(isSafeRedirect('http://attacker.com/steal-cookie')).toBe(false);
      expect(isSafeRedirect('//evil.com/phish')).toBe(false);
      expect(isSafeRedirect('javascript:alert(1)')).toBe(false);
      expect(isSafeRedirect('')).toBe(false);
      expect(isSafeRedirect(null as any)).toBe(false);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. Patient Isolation & Authorization Hardening                            */
  /* -------------------------------------------------------------------------- */
  describe('2. Patient Isolation & Authorization Hardening', () => {
    it('allows patient themselves to access their own records', () => {
      const context: UserCareContext = {
        userId: 'patient-profile-001',
        role: 'patient',
        isPatientThemselves: true,
        relationshipStatus: 'active',
      };
      const scopeCheck = verifyPatientScope('patient-profile-001', context);
      expect(scopeCheck.isAllowed).toBe(true);
    });

    it('strictly denies cross-patient access when an authorized member attempts to view another patient', () => {
      const caregiverContext: UserCareContext & { authorizedPatientId: string } = {
        userId: 'caregiver-user-002',
        role: 'caregiver',
        isPatientThemselves: false,
        relationshipStatus: 'active',
        authorizedPatientId: 'patient-profile-001',
      };

      // Attempting to query patient-profile-999 (different patient)
      const scopeCheck = verifyPatientScope('patient-profile-999', caregiverContext);
      expect(scopeCheck.isAllowed).toBe(false);
      expect(scopeCheck.reason).toContain('Cross-patient access denied');
    });

    it('strictly denies all access when relationship is revoked or suspended', () => {
      const revokedContext: UserCareContext = {
        userId: 'former-nurse-003',
        role: 'caregiver',
        isPatientThemselves: false,
        relationshipStatus: 'revoked',
        permissionTier: 'full_admin',
      };

      // Scope check fails
      const scopeCheck = verifyPatientScope('patient-profile-001', revokedContext);
      expect(scopeCheck.isAllowed).toBe(false);
      expect(scopeCheck.reason).toContain('revoked');

      // Individual permission actions fail closed
      expect(hasPermission('view_medications', revokedContext)).toBe(false);
      expect(hasPermission('view_care_tasks', revokedContext)).toBe(false);
      expect(hasPermission('export_care_passport', revokedContext)).toBe(false);
    });

    it('prevents unauthorized privilege self-escalation by non-admin members', () => {
      const standardCaregiver: UserCareContext = {
        userId: 'cg-001',
        role: 'caregiver',
        isPatientThemselves: false,
        relationshipStatus: 'active',
        permissionTier: 'caregiver_editor',
      };

      // Caregiver attempts to elevate themselves to full_admin
      const canElevateSelf = canModifyRoleOrTier(standardCaregiver, 'cg-001', 'full_admin');
      expect(canElevateSelf).toBe(false);

      // Full admin can update other members
      const adminContext: UserCareContext = {
        userId: 'admin-001',
        role: 'family',
        isPatientThemselves: false,
        relationshipStatus: 'active',
        permissionTier: 'full_admin',
      };
      const canAdminUpdateOther = canModifyRoleOrTier(adminContext, 'cg-001', 'caregiver_editor');
      expect(canAdminUpdateOther).toBe(true);
    });

    it('enforces role-based permission tiers consistently', () => {
      const viewerContext: UserCareContext = {
        userId: 'fam-002',
        role: 'family',
        isPatientThemselves: false,
        relationshipStatus: 'active',
        permissionTier: 'family_viewer',
      };

      // Family viewer can view records but cannot edit medications or approve continuity
      expect(hasPermission('view_medications', viewerContext)).toBe(true);
      expect(hasPermission('view_appointments', viewerContext)).toBe(true);
      expect(hasPermission('edit_medications', viewerContext)).toBe(false);
      expect(hasPermission('approve_continuity_changes', viewerContext)).toBe(false);
    });

    it('respects consent scopes (medication_only, full_medical, emergency_summary)', () => {
      expect(isConsentScopeGranted('medication_only', ['medication_only'])).toBe(true);
      expect(isConsentScopeGranted('full_medical', ['medication_only'])).toBe(false);
      expect(isConsentScopeGranted('emergency_summary', ['full_medical'])).toBe(true);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. API Protection & Rate Limiting                                         */
  /* -------------------------------------------------------------------------- */
  describe('3. API Protection & Rate Limiting', () => {
    it('allows requests within limit and throttles requests exceeding threshold', () => {
      const testId = 'test_user_rate_limit';
      resetRateLimit(testId);

      // 5 allowed requests
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(testId, 5, 10000);
        expect(result.allowed).toBe(true);
      }

      // 6th request is throttled
      const throttled = checkRateLimit(testId, 5, 10000);
      expect(throttled.allowed).toBe(false);
      expect(throttled.remaining).toBe(0);
      expect(throttled.resetSeconds).toBeGreaterThan(0);

      resetRateLimit(testId);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. File Upload Security & Path Traversal Prevention                       */
  /* -------------------------------------------------------------------------- */
  describe('4. File Upload Security & Path Traversal Prevention', () => {
    it('accepts valid PDF, PNG, JPEG, and WebP files under 10MB', () => {
      const validPdf = validateUploadedFile('discharge_summary.pdf', 'application/pdf', 2 * 1024 * 1024);
      expect(validPdf.isValid).toBe(true);
      expect(validPdf.sanitizedFileName).toBe('discharge_summary.pdf');

      const validImg = validateUploadedFile('lab_scan.png', 'image/png', 500 * 1024);
      expect(validImg.isValid).toBe(true);
    });

    it('rejects disallowed executable or script file types', () => {
      const exe = validateUploadedFile('malware.exe', 'application/x-msdownload', 1024);
      expect(exe.isValid).toBe(false);
      expect(exe.error).toContain('Disallowed file type');

      const script = validateUploadedFile('payload.html', 'text/html', 1024);
      expect(script.isValid).toBe(false);
    });

    it('rejects files exceeding maximum size limit (10MB)', () => {
      const oversized = validateUploadedFile('huge_scan.pdf', 'application/pdf', 15 * 1024 * 1024);
      expect(oversized.isValid).toBe(false);
      expect(oversized.error).toContain('exceeds maximum limit');
    });

    it('detects and neutralizes malicious path traversal sequences in file names', () => {
      // Direct path traversal sequence check
      const traversal = validateUploadedFile('../../etc/passwd.pdf', 'application/pdf', 1024);
      expect(traversal.isValid).toBe(false);
      expect(traversal.error).toContain('path traversal');

      // Sanitizer neutralizes directory escapes
      const clean = sanitizeFileName('../../../secret/report.pdf');
      expect(clean).toBe('report.pdf');
      expect(clean).not.toContain('..');
      expect(clean).not.toContain('/');
    });

    it('generates unguessable, patient-isolated storage paths', () => {
      const path1 = generateSecureStoragePath('patient-profile-001', 'passport_exports', 'pdf');
      expect(path1).toMatch(/^patients\/patient-profile-001\/passport_exports\/[a-f0-9\-]+\.pdf$/);

      // Ensures patientId cannot escape directory
      const path2 = generateSecureStoragePath('../../escape-patient', 'instructions', '.pdf');
      expect(path2).not.toContain('..');
      expect(path2).toMatch(/^patients\/escape-patient\/instructions\/[a-f0-9\-]+\.pdf$/);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 5. Privacy, PHI Redaction & Safe Previews                                 */
  /* -------------------------------------------------------------------------- */
  describe('5. Privacy, PHI Redaction & Safe Previews', () => {
    it('redacts sensitive credentials, tokens, and email addresses from text strings', () => {
      const raw = 'User david@caretrace.health logged in with Bearer secret-token-xyz123 and phone 555-234-5678';
      const redacted = redactString(raw);
      expect(redacted).not.toContain('david@caretrace.health');
      expect(redacted).not.toContain('secret-token-xyz123');
      expect(redacted).toContain('[REDACTED_EMAIL]');
      expect(redacted).toContain('[REDACTED_TOKEN]');
      expect(redacted).toContain('[REDACTED_PHONE]');
    });

    it('deeply sanitizes log objects masking password, token, and secret fields', () => {
      const payload = {
        userId: 'usr-123',
        password: 'SuperSecretPassword123!',
        apiKey: 'key-9876543210abcdef',
        metadata: {
          authorization: 'Bearer jwt.token.here',
          email: 'patient@example.com',
        },
      };

      const sanitized = sanitizeForLog(payload);
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.metadata.authorization).toBe('[REDACTED]');
      expect(sanitized.metadata.email).toBe('[REDACTED_EMAIL]');
      expect(sanitized.userId).toBe('usr-123'); // Safe identifier preserved
    });

    it('generates non-sensitive notification previews stripping specific medication and diagnosis terms', () => {
      const safePreview = generateSafePreview(
        'medication',
        'Lisinopril 10mg Morning Dose Scheduled',
        'Take 1 tablet of Lisinopril 10mg with breakfast and water.'
      );

      expect(typeof safePreview).toBe('string');
      expect(safePreview).toContain('Care reminder');
      expect(safePreview).not.toContain('Lisinopril');
      expect(safePreview).not.toContain('10mg');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 6. Database Migration 11: Security Hardening & Immutability              */
  /* -------------------------------------------------------------------------- */
  describe('6. Database Migration 11: Security Hardening & Immutability', () => {
    it('verifies 20260215000011_security_hardening_rls.sql defines private storage, attachment RLS, and anti-tampering triggers', () => {
      const migrationPath = path.join(
        process.cwd(),
        'supabase',
        'migrations',
        '20260215000011_security_hardening_rls.sql'
      );
      expect(fs.existsSync(migrationPath)).toBe(true);

      const content = fs.readFileSync(migrationPath, 'utf-8');
      expect(content).toContain('care_documents');
      expect(content).toContain('public = false'); // Private bucket
      expect(content).toContain('instruction_attachments');
      expect(content).toContain('care_passport_exports');
      expect(content).toContain('notification_acknowledgements');
      expect(content).toContain('check_care_circle_privilege_escalation');
      expect(content).toContain('trg_prevent_privilege_escalation');
    });
  });
});
