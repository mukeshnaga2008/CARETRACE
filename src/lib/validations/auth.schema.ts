import { z } from "zod";

/**
 * Authentication and Access Control Validation Schemas
 * CARETRACE — Intelligent Healthcare Continuity Network
 * Strictly follows NIST and OWASP guidance for healthcare SaaS.
 */

// Login Validation Schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address")
    .max(255, "Email address is too long"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters"),
  rememberMe: z.boolean().default(true),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Registration Validation Schema
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must not exceed 100 characters")
      .regex(/^[a-zA-Z\s.'-]+$/, "Full name can only contain letters, spaces, hyphens, and apostrophes"),
    email: z
      .string()
      .min(1, "Email address is required")
      .email("Please enter a valid email address")
      .max(255, "Email address is too long"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role: z
      .enum(["patient", "family", "caregiver"], {
        errorMap: () => ({ message: "Please select a valid role" }),
      })
      .default("patient"),
    acceptTerms: z.literal(true, {
      errorMap: () => ({
        message: "You must accept the Terms of Service and Privacy Notice to continue",
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// Forgot Password Validation Schema
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address")
    .max(255, "Email address is too long"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// Reset Password Validation Schema
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Care Circle Invitation Schema
export const careCircleInvitationSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID format"),
  inviteeName: z
    .string()
    .min(2, "Invitee name must be at least 2 characters")
    .max(100, "Invitee name is too long"),
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  role: z.enum(["family", "caregiver"], {
    errorMap: () => ({ message: "Invitation role must be family or caregiver" }),
  }),
  relationship: z
    .string()
    .min(2, "Relationship description is required (e.g., Daughter, Visiting Nurse)")
    .max(60),
  permissionTier: z.enum(
    ["full_admin", "caregiver_editor", "family_viewer", "emergency_only"],
    {
      errorMap: () => ({ message: "Please specify a valid permission tier" }),
    }
  ),
});

export type CareCircleInvitationInput = z.infer<typeof careCircleInvitationSchema>;

// Invitation Acceptance Schema
export const acceptInvitationSchema = z.object({
  invitationToken: z
    .string()
    .min(16, "Invitation token is invalid or corrupted")
    .max(128, "Invitation token format error"),
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

// Consent Record Creation Schema
export const consentRecordSchema = z.object({
  patientId: z.string().uuid("Invalid patient identifier"),
  recipientId: z.string().uuid("Invalid recipient identifier").optional(),
  scope: z.enum([
    "full_medical",
    "medication_only",
    "emergency_summary",
    "care_circle_coordination",
  ]),
  purpose: z
    .string()
    .min(5, "Purpose description must be at least 5 characters")
    .max(300, "Purpose description is too long"),
  expiresAt: z.string().datetime("Expiry must be a valid ISO datetime").optional(),
});

export type ConsentRecordInput = z.infer<typeof consentRecordSchema>;

// Consent Revocation Schema
export const consentRevocationSchema = z.object({
  consentId: z.string().uuid("Invalid consent record identifier"),
  reason: z
    .string()
    .min(5, "A reason for revocation is required for clinical audit compliance")
    .max(500, "Revocation reason must not exceed 500 characters"),
});

export type ConsentRevocationInput = z.infer<typeof consentRevocationSchema>;
