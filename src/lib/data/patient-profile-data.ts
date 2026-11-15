/**
 * Patient Health Profile & Health Identity Data Store
 * CARETRACE — Intelligent Healthcare Continuity Network
 * PromptWars × Catalyst 2026
 *
 * Implements full clinical identity, provenance tracking, and data masking.
 */

import { 
  EmergencyContact, 
  PatientPreferences, 
  HealthInformationSource, 
  VerificationStatus, 
  InformationProvenance,
  UserRole,
  PermissionTier
} from "@/types/caretrace";

export interface FullPatientHealthProfile {
  id: string;
  patientId: string;
  fullName: string;
  preferredName: string;
  dateOfBirth: string; // YYYY-MM-DD
  age: number;
  bloodType: string;
  profilePhotoUrl?: string;
  phoneNumber: string;
  email: string;
  addressLine1: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  preferredLanguage: string;
  primaryDoctorName: string;
  primaryClinic: string;
  profileCompletionPercentage: number;
  verificationStatus: VerificationStatus;
  lastReviewedAt: string;
  lastReviewedByName: string;
  lastReviewedByRole: string;
  advanceDirectivesStatus: string;
  healthcareProxyName: string;
  healthcareProxyPhone: string;
}

// Baseline Patient Health Profile for Margaret Eleanor Sullivan (78y)
export const INITIAL_PATIENT_PROFILE: FullPatientHealthProfile = {
  id: "patient-profile-001",
  patientId: "profile-margaret-001",
  fullName: "Margaret Eleanor Sullivan",
  preferredName: "Peggy",
  dateOfBirth: "1948-03-24",
  age: 78,
  bloodType: "O+",
  phoneNumber: "+1 (555) 234-8901",
  email: "margaret.sullivan@caretrace.internal",
  addressLine1: "742 Evergreen Terrace, Apt 3B",
  addressCity: "Springfield",
  addressState: "IL",
  addressZip: "62704",
  preferredLanguage: "en",
  primaryDoctorName: "Dr. Eleanor Vance, MD",
  primaryClinic: "St. Jude Geriatric & Cardiology Associates",
  profileCompletionPercentage: 92,
  verificationStatus: "verified",
  lastReviewedAt: "2026-02-12T14:30:00Z",
  lastReviewedByName: "Dr. Eleanor Vance, MD",
  lastReviewedByRole: "Attending Cardiologist",
  advanceDirectivesStatus: "POLST & Medical Power of Attorney on File",
  healthcareProxyName: "David Sullivan (Son)",
  healthcareProxyPhone: "+1 (555) 432-1098",
};

// Baseline Priority-Ordered Emergency Contacts
export const INITIAL_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: "contact-001",
    patientId: "patient-profile-001",
    contactName: "David Sullivan",
    relationship: "Son & Primary Care Coordinator",
    phoneNumber: "+1 (555) 432-1098",
    email: "david.sullivan@caretrace.internal",
    priorityOrder: 1,
    isAuthorizedCaregiver: true,
    notes: "First emergency call for all urgent transport, clinical questions, and hospital admissions. Holds Medical Power of Attorney.",
    createdAt: "2026-01-10T09:00:00Z",
    updatedAt: "2026-02-10T11:00:00Z",
  },
  {
    id: "contact-002",
    patientId: "patient-profile-001",
    contactName: "Clara Sullivan-Zhang",
    relationship: "Daughter",
    phoneNumber: "+1 (555) 876-5432",
    email: "clara.sz@example.com",
    priorityOrder: 2,
    isAuthorizedCaregiver: false,
    notes: "Lives in Chicago (3 hours away). Call if David is unreachable. Not currently managing daily medications.",
    createdAt: "2026-01-10T09:00:00Z",
    updatedAt: "2026-02-05T16:20:00Z",
  },
  {
    id: "contact-003",
    patientId: "patient-profile-001",
    contactName: "Arthur Pendelton",
    relationship: "Neighbor & Building Superintendent",
    phoneNumber: "+1 (555) 345-6789",
    email: "arthur.p@terraceapts.org",
    priorityOrder: 3,
    isAuthorizedCaregiver: false,
    notes: "Holds spare apartment key. Physical access assistance only. STRICT PRIVACY RULE: Not authorized to view or receive personal medical information.",
    createdAt: "2026-01-15T14:00:00Z",
    updatedAt: "2026-01-15T14:00:00Z",
  },
];

// Baseline Patient Preferences
export const INITIAL_PATIENT_PREFERENCES: PatientPreferences = {
  id: "pref-001",
  patientId: "patient-profile-001",
  preferredName: "Peggy",
  preferredLanguage: "en",
  preferredCommunicationMethod: "phone",
  timeFormat: "12h",
  largerText: true,
  highContrast: false,
  reducedMotion: false,
  voiceReadoutEnabled: true,
  timezone: "America/Chicago",
  accessibilityNotes: "Mild hearing reduction in left ear. Prefers telephone calls over text messages. Requires high-contrast large print on medication bottle instructions.",
  notificationPreferences: {
    medicationReminders: true,
    appointmentReminders: true,
    careGapAlerts: true,
    quietHoursEnabled: true,
    quietHoursStart: "21:30",
    quietHoursEnd: "07:30",
  },
  createdAt: "2026-01-10T09:00:00Z",
  updatedAt: "2026-02-11T10:15:00Z",
};

// Health Information Sources with Explicit Provenance and Verification Status
export const INITIAL_HEALTH_SOURCES: HealthInformationSource[] = [
  {
    id: "source-001",
    patientId: "patient-profile-001",
    category: "chronic_conditions",
    sourceType: "clinical_summary",
    enteredByName: "Dr. Eleanor Vance, MD",
    enteredByRole: "Attending Cardiologist",
    verificationStatus: "verified",
    verifiedAt: "2026-02-12T14:30:00Z",
    verifiedByName: "Dr. Eleanor Vance, MD",
    details: {
      conditions: [
        { name: "Primary Hypertension", icd10: "I10", diagnosed: 2014, status: "Active" },
        { name: "Osteoarthritis (Bilateral Knees)", icd10: "M17.0", diagnosed: 2018, status: "Managed" },
      ],
    },
    createdAt: "2026-02-12T14:30:00Z",
    updatedAt: "2026-02-12T14:30:00Z",
  },
  {
    id: "source-002",
    patientId: "patient-profile-001",
    category: "allergies",
    sourceType: "clinical_summary",
    enteredByName: "Dr. Eleanor Vance, MD",
    enteredByRole: "Attending Cardiologist",
    verificationStatus: "verified",
    verifiedAt: "2026-02-12T14:30:00Z",
    verifiedByName: "Dr. Eleanor Vance, MD",
    details: {
      allergies: [
        { substance: "Penicillin", severity: "Moderate", reaction: "Diffuse urticarial rash and facial pruritus" },
        { substance: "Shellfish / Iodine Radiocontrast", severity: "Severe", reaction: "Bronchospasm / Anaphylaxis" },
      ],
    },
    createdAt: "2026-02-12T14:30:00Z",
    updatedAt: "2026-02-12T14:30:00Z",
  },
  {
    id: "source-003",
    patientId: "patient-profile-001",
    category: "advance_directives",
    sourceType: "patient_provided",
    enteredByName: "Margaret Sullivan",
    enteredByRole: "Patient (Witnessed by David Sullivan, POA)",
    verificationStatus: "verified",
    verifiedAt: "2026-01-20T11:00:00Z",
    verifiedByName: "St. Jude Medical Records Dept",
    details: {
      dnr: false,
      polstOnFile: true,
      proxy: "David Sullivan",
      documentedLocation: "St. Jude Health Network Legal Archive #AD-2024-991",
    },
    createdAt: "2026-01-20T11:00:00Z",
    updatedAt: "2026-01-20T11:00:00Z",
  },
  {
    id: "source-004",
    patientId: "patient-profile-001",
    category: "medications",
    sourceType: "family_entered",
    enteredByName: "David Sullivan",
    enteredByRole: "Family Care Coordinator",
    verificationStatus: "pending_review",
    details: {
      note: "Over-the-counter CoQ10 100mg once daily added with breakfast. Awaiting cardiologist Dr. Vance confirmation at upcoming Feb 20 visit.",
    },
    createdAt: "2026-02-13T16:45:00Z",
    updatedAt: "2026-02-13T16:45:00Z",
  },
];

/**
 * Access-Control Data Masking Function
 * Ensures date of birth, street address, and personal phone number are NOT automatically
 * exposed to every care circle viewer or external member.
 */
export function getMaskedPatientProfile(
  profile: FullPatientHealthProfile,
  viewerRole: UserRole,
  permissionTier?: PermissionTier
): FullPatientHealthProfile {
  const isAuthorizedFullAdmin = viewerRole === 'patient' || permissionTier === 'full_admin' || viewerRole === 'admin';

  if (isAuthorizedFullAdmin) {
    return profile;
  }

  // Mask private contact details for viewers and basic caregivers
  return {
    ...profile,
    dateOfBirth: `****-**-** (Age ${profile.age})`,
    addressLine1: "•••••••••••• (Restricted to Authorized Admin)",
    phoneNumber: profile.phoneNumber.replace(/\d{3}-\d{4}$/, "***-****"),
  };
}
