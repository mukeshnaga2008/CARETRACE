import { z } from "zod";

/**
 * Validation Schemas for Elderly Patient Profile & Health Identity
 * CARETRACE — PromptWars × Catalyst 2026
 * Follows healthcare privacy and accessibility standards.
 */

// Phone number regex allowing common international and national formats
const phoneRegex = /^(\+?[1-9]\d{0,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}$/;

// Edit Patient Health Profile Schema
export const patientProfileEditSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full legal name must be at least 2 characters")
    .max(100, "Full legal name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s.'-]+$/, "Full name contains invalid characters"),
  preferredName: z
    .string()
    .min(1, "Preferred name is required")
    .max(60, "Preferred name is too long"),
  phoneNumber: z
    .string()
    .regex(phoneRegex, "Please enter a valid phone number format")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  addressLine1: z
    .string()
    .max(120, "Address line 1 is too long")
    .optional()
    .or(z.literal("")),
  addressCity: z
    .string()
    .max(60, "City name is too long")
    .optional()
    .or(z.literal("")),
  addressState: z
    .string()
    .max(40, "State is too long")
    .optional()
    .or(z.literal("")),
  addressZip: z
    .string()
    .max(20, "Postal code is too long")
    .optional()
    .or(z.literal("")),
  preferredLanguage: z
    .string()
    .min(2, "Language code must be at least 2 characters")
    .max(10)
    .default("en"),
  bloodType: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"])
    .default("Unknown"),
  primaryDoctorName: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),
  primaryClinic: z
    .string()
    .max(120)
    .optional()
    .or(z.literal("")),
});

export type PatientProfileEditInput = z.infer<typeof patientProfileEditSchema>;

// Emergency Contact Schema
export const emergencyContactSchema = z.object({
  contactName: z
    .string()
    .min(2, "Contact name must be at least 2 characters")
    .max(100, "Contact name is too long"),
  relationship: z
    .string()
    .min(2, "Relationship description is required (e.g. Son, Daughter, Neighbor)")
    .max(60),
  phoneNumber: z
    .string()
    .min(7, "Phone number must be at least 7 digits")
    .regex(phoneRegex, "Please enter a valid phone number (e.g. +1 555-019-2834)"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  priorityOrder: z
    .number()
    .int("Priority must be an integer")
    .min(1, "Priority order starts at 1")
    .max(10, "Maximum of 10 emergency contacts permitted"),
  isAuthorizedCaregiver: z
    .boolean()
    .default(false), // Explicitly false by default per healthcare privacy rules
  notes: z
    .string()
    .max(500, "Notes cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

export type EmergencyContactInput = z.infer<typeof emergencyContactSchema>;

// Reorder Emergency Contacts Schema
export const emergencyContactReorderSchema = z.object({
  contacts: z
    .array(
      z.object({
        id: z.string().uuid("Invalid contact ID"),
        priorityOrder: z.number().int().min(1),
      })
    )
    .min(1, "At least one contact required for reordering"),
});

export type EmergencyContactReorderInput = z.infer<typeof emergencyContactReorderSchema>;

// Patient Preferences Schema
export const patientPreferencesSchema = z.object({
  preferredName: z
    .string()
    .min(1, "Preferred name is required")
    .max(60),
  preferredLanguage: z
    .string()
    .default("en"),
  preferredCommunicationMethod: z
    .enum(["phone", "sms", "email", "in_person"], {
      errorMap: () => ({ message: "Select a valid communication method" }),
    })
    .default("phone"),
  timeFormat: z
    .enum(["12h", "24h"])
    .default("12h"),
  largerText: z
    .boolean()
    .default(true),
  highContrast: z
    .boolean()
    .default(false),
  reducedMotion: z
    .boolean()
    .default(false),
  voiceReadoutEnabled: z
    .boolean()
    .default(true),
  timezone: z
    .string()
    .default("America/New_York"),
  accessibilityNotes: z
    .string()
    .max(500, "Accessibility notes cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
  notificationPreferences: z
    .object({
      medicationReminders: z.boolean().default(true),
      appointmentReminders: z.boolean().default(true),
      careGapAlerts: z.boolean().default(true),
      quietHoursEnabled: z.boolean().default(true),
      quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM").default("21:30"),
      quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM").default("07:30"),
    })
    .default({
      medicationReminders: true,
      appointmentReminders: true,
      careGapAlerts: true,
      quietHoursEnabled: true,
      quietHoursStart: "21:30",
      quietHoursEnd: "07:30",
    }),
});

export type PatientPreferencesInput = z.infer<typeof patientPreferencesSchema>;
