/**
 * Central Typed Permission and Access Control Model
 * CARETRACE — Intelligent Healthcare Continuity Network
 * PromptWars × Catalyst 2026
 *
 * Implements strict role-based and relationship-based access controls.
 * Access is enforced by explicit verification, never assumed from a client-provided label.
 */

import { createHash, randomBytes } from "crypto";
export { isSafeRedirect } from "./redirects";

export type AppRole = "patient" | "family" | "caregiver" | "doctor" | "admin";

export type PermissionTier =
  | "full_admin"
  | "caregiver_editor"
  | "family_viewer"
  | "emergency_only";

export type RelationshipStatus = "pending" | "active" | "revoked" | "expired";

export type ConsentScope =
  | "full_medical"
  | "medication_only"
  | "emergency_summary"
  | "care_circle_coordination";

export type PermissionAction =
  | "view_personal_records"
  | "manage_preferences"
  | "grant_revoke_consent"
  | "view_care_circle"
  | "invite_care_circle"
  | "manage_care_circle"
  | "view_medications"
  | "record_adherence"
  | "edit_medications"
  | "view_appointments"
  | "schedule_appointments"
  | "view_instructions"
  | "review_continuity"
  | "approve_continuity_changes"
  | "view_care_tasks"
  | "update_assigned_tasks"
  | "create_care_tasks"
  | "export_care_passport"
  | "view_audit_trail"
  | "access_break_glass";

/**
 * Base permissions inherently granted by role.
 * Note: A role alone does not grant access across patients; active relationship is required.
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<AppRole, PermissionAction[]> = {
  patient: [
    "view_personal_records",
    "manage_preferences",
    "grant_revoke_consent",
    "view_care_circle",
    "invite_care_circle",
    "manage_care_circle",
    "view_medications",
    "record_adherence",
    "view_appointments",
    "schedule_appointments",
    "view_instructions",
    "view_care_tasks",
    "update_assigned_tasks",
    "export_care_passport",
    "view_audit_trail",
  ],
  family: [
    "view_care_circle",
    "view_medications",
    "record_adherence",
    "view_appointments",
    "schedule_appointments",
    "view_care_tasks",
    "update_assigned_tasks",
    "view_instructions",
  ],
  caregiver: [
    "view_care_circle",
    "view_medications",
    "record_adherence",
    "view_appointments",
    "view_care_tasks",
    "update_assigned_tasks",
    "view_instructions",
  ],
  doctor: [
    "view_medications",
    "view_appointments",
    "view_instructions",
    "review_continuity",
    "approve_continuity_changes",
    "export_care_passport",
    "view_audit_trail",
  ],
  admin: [
    "view_personal_records",
    "manage_preferences",
    "grant_revoke_consent",
    "view_care_circle",
    "invite_care_circle",
    "manage_care_circle",
    "view_medications",
    "record_adherence",
    "edit_medications",
    "view_appointments",
    "schedule_appointments",
    "view_instructions",
    "review_continuity",
    "approve_continuity_changes",
    "view_care_tasks",
    "update_assigned_tasks",
    "create_care_tasks",
    "export_care_passport",
    "view_audit_trail",
    "access_break_glass",
  ],
};

/**
 * Granular permissions granted by permission tier within a care circle
 */
export const TIER_PERMISSIONS: Record<PermissionTier, PermissionAction[]> = {
  full_admin: [
    "view_personal_records",
    "manage_preferences",
    "grant_revoke_consent",
    "view_care_circle",
    "invite_care_circle",
    "manage_care_circle",
    "view_medications",
    "record_adherence",
    "edit_medications",
    "view_appointments",
    "schedule_appointments",
    "view_instructions",
    "review_continuity",
    "approve_continuity_changes",
    "view_care_tasks",
    "update_assigned_tasks",
    "create_care_tasks",
    "export_care_passport",
    "view_audit_trail",
  ],
  caregiver_editor: [
    "view_care_circle",
    "view_medications",
    "record_adherence",
    "view_appointments",
    "view_care_tasks",
    "update_assigned_tasks",
    "create_care_tasks",
    "view_instructions",
  ],
  family_viewer: [
    "view_care_circle",
    "view_medications",
    "record_adherence",
    "view_appointments",
    "schedule_appointments",
    "view_care_tasks",
    "update_assigned_tasks",
    "view_instructions",
  ],
  emergency_only: [
    "view_medications",
    "view_appointments",
    "export_care_passport",
    "access_break_glass",
  ],
};

export interface UserCareContext {
  userId: string;
  role: AppRole;
  isPatientThemselves: boolean;
  relationshipStatus: RelationshipStatus;
  permissionTier?: PermissionTier;
  grantedScopes?: ConsentScope[];
}

/**
 * Validates whether a specific action is permitted given a user's role, tier, and relationship status.
 * CRITICAL RULE: A revoked or expired relationship grants ZERO permissions.
 */
export function hasPermission(
  action: PermissionAction,
  context: UserCareContext
): boolean {
  // If the user is the patient themselves, verify patient permissions
  if (context.isPatientThemselves) {
    return ROLE_DEFAULT_PERMISSIONS.patient.includes(action);
  }

  // Revoked, pending or expired relationships are strictly denied
  if (context.relationshipStatus !== "active") {
    return false;
  }

  // Tier-based permission takes precedence if defined
  if (context.permissionTier) {
    const tierPerms = TIER_PERMISSIONS[context.permissionTier];
    if (tierPerms && tierPerms.includes(action)) {
      return true;
    }
  }

  // Fallback to role-level defaults
  const rolePerms = ROLE_DEFAULT_PERMISSIONS[context.role];
  return rolePerms ? rolePerms.includes(action) : false;
}

/**
 * Checks whether access to a given data scope is authorized by active consent records.
 */
export function isConsentScopeGranted(
  requiredScope: ConsentScope,
  grantedScopes: ConsentScope[] = []
): boolean {
  if (grantedScopes.includes("full_medical")) {
    return true;
  }
  return grantedScopes.includes(requiredScope);
}


/**
 * Generate a secure cryptographically random invitation token and its SHA-256 hash.
 * The plaintext token is sent to the invitee; only the hash is stored in the database.
 */
export function generateInvitationToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };
}

/**
 * Securely hashes a token with SHA-256 for persistent database comparison.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Constant-time string comparison to defend against timing attacks
 * on CRON_SECRET, auth tokens, and cryptographic verification hashes.
 */
export function safeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

/**
 * Verifies that a user session has active authorization to access records for a specific patient.
 * Fails closed if the relationship is revoked, suspended, or nonexistent.
 */
export function verifyPatientScope(
  requestedPatientId: string,
  context: UserCareContext & { authorizedPatientId?: string }
): { isAllowed: boolean; reason?: string } {
  // If user is accessing their own records
  if (context.isPatientThemselves && context.userId === requestedPatientId) {
    return { isAllowed: true };
  }

  // Cross-patient boundary check
  if (context.authorizedPatientId && context.authorizedPatientId !== requestedPatientId) {
    return {
      isAllowed: false,
      reason: "Cross-patient access denied. User is not an authorized member for this patient profile.",
    };
  }

  // Active relationship requirement
  if (context.relationshipStatus !== "active") {
    return {
      isAllowed: false,
      reason: `Access denied. Care Circle membership status is ${context.relationshipStatus}.`,
    };
  }

  return { isAllowed: true };
}

/**
 * Prevents unauthorized privilege escalation.
 * Only full_admin members or the patient can alter another member's permission tier.
 * Users cannot elevate their own permission tier.
 */
export function canModifyRoleOrTier(
  actorContext: UserCareContext,
  targetUserId: string,
  desiredTier: PermissionTier
): boolean {
  // Self-elevation is strictly forbidden
  if (actorContext.userId === targetUserId && actorContext.permissionTier !== desiredTier) {
    return false;
  }

  // Patient can always manage their care circle
  if (actorContext.isPatientThemselves) {
    return true;
  }

  // Active full_admin can manage other members
  if (actorContext.relationshipStatus === "active" && actorContext.permissionTier === "full_admin") {
    return true;
  }

  return false;
}

