// CARETRACE Constants & Architectural Configuration
// PromptWars × Catalyst 2026

export const APP_NAME = "CARETRACE";
export const APP_TAGLINE = "The Intelligent Healthcare Continuity Network";
export const APP_CORE_MOTTO = "Every instruction connected. Every responsibility visible. Every care transition accounted for.";
export const APP_VERSION = "1.0.0";

// Supported User Perspectives / Roles
export type AppRole = 'patient' | 'family' | 'caregiver';

export interface UserPerspective {
  key: AppRole;
  label: string;
  targetUser: string;
  roleDescription: string;
  sampleName: string;
  badgeLabel: string;
}

export const USER_PERSPECTIVES: Record<AppRole, UserPerspective> = {
  patient: {
    key: 'patient',
    label: 'Elder Patient',
    targetUser: 'Elderly individual at the centre of care',
    roleDescription: 'Direct daily schedule, simplified large touch controls, voice readouts',
    sampleName: 'Margaret Sullivan',
    badgeLabel: 'Patient Centred',
  },
  family: {
    key: 'family',
    label: 'Family Member',
    targetUser: 'Primary family coordinator and proxy',
    roleDescription: 'Coordination overview, ride scheduling, instruction review alerts, emergency contact',
    sampleName: 'David Sullivan (Son)',
    badgeLabel: 'Family Admin',
  },
  caregiver: {
    key: 'caregiver',
    label: 'Caregiver / Nurse',
    targetUser: 'Visiting nurse or professional care partner',
    roleDescription: 'Task acknowledgement, vitals logging, shift handovers, medication assistance',
    sampleName: 'Sarah Jenkins, RN',
    badgeLabel: 'Care Partner',
  },
};

export const USER_ROLES = {
  PATIENT: "patient",
  FAMILY: "family",
  CAREGIVER: "caregiver",
  DOCTOR: "doctor",
  ADMIN: "admin",
} as const;

export const PERMISSION_TIERS = {
  FULL_ADMIN: "full_admin",
  CAREGIVER_EDITOR: "caregiver_editor",
  FAMILY_VIEWER: "family_viewer",
  EMERGENCY_ONLY: "emergency_only",
} as const;

export const CARE_GAP_SEVERITIES = {
  CRITICAL: "critical",
  WARNING: "warning",
  ADVISORY: "advisory",
} as const;

export const NOTIFICATION_STATUS = {
  QUEUED: "queued",
  PROCESSING: "processing",
  SENT: "sent",
  DELIVERED: "delivered",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export const INSTRUCTION_STATUS = {
  DRAFT: "draft",
  PENDING_REVIEW: "pending_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  SUPERSEDED: "superseded",
} as const;

export const DEFAULT_ACCESSIBILITY_PREFERENCES = {
  fontSize: "large" as const,
  highContrast: false,
  reducedMotion: false,
  voiceReadoutEnabled: true,
  simplifiedNavigation: true,
  hapticFeedback: true,
};

export interface NavigationItem {
  href: string;
  label: string;
  icon: string;
  description: string;
  badge?: string;
  allowedRoles?: AppRole[];
}

export interface NavigationSection {
  group: 'CARE' | 'COORDINATION' | 'RECORDS' | 'ACCOUNT';
  label: string;
  items: NavigationItem[];
}

// 4 Exact Navigation Groups defined by Phase 3 Specification
export const NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    group: 'CARE',
    label: 'Care',
    items: [
      { 
        href: '/dashboard', 
        label: 'Overview', 
        icon: 'LayoutDashboard', 
        description: 'Today’s schedule, medications and tasks', 
        badge: 'Today' 
      },
      { 
        href: '/medications', 
        label: 'Medications', 
        icon: 'Pill', 
        description: 'Active prescriptions and adherence schedule', 
        badge: '3 Scheduled' 
      },
      { 
        href: '/appointments', 
        label: 'Appointments', 
        icon: 'Calendar', 
        description: 'Clinician visits, companions and notes' 
      },
    ],
  },
  {
    group: 'COORDINATION',
    label: 'Coordination',
    items: [
      { 
        href: '/care-circle', 
        label: 'Care Circle', 
        icon: 'Users', 
        description: 'Family members, nurses and physicians' 
      },
      { 
        href: '/instructions', 
        label: 'Instructions', 
        icon: 'FileText', 
        description: 'Discharge summaries and clinical notes' 
      },
      { 
        href: '/continuity', 
        label: 'Continuity Engine', 
        icon: 'GitBranch', 
        description: 'Care instruction diffs and human reviews', 
        badge: '1 Review' 
      },
      { 
        href: '/care-gaps', 
        label: 'Care Gap Radar', 
        icon: 'ShieldAlert', 
        description: 'Proactive adherence and follow-up scans', 
        badge: 'Warning' 
      },
    ],
  },
  {
    group: 'RECORDS',
    label: 'Records',
    items: [
      { 
        href: '/notifications', 
        label: 'Notifications', 
        icon: 'Bell', 
        description: 'Delivery tracking and schedule reminders' 
      },
      { 
        href: '/timeline', 
        label: 'Care Timeline', 
        icon: 'History', 
        description: 'Tamper-evident unified care history' 
      },
      { 
        href: '/care-passport', 
        label: 'Care Passport', 
        icon: 'FileCheck', 
        description: 'Authorised emergency summary and PDF' 
      },
    ],
  },
  {
    group: 'ACCOUNT',
    label: 'Account',
    items: [
      { 
        href: '/profile', 
        label: 'Patient Profile', 
        icon: 'User', 
        description: 'Health identity, contacts and care preferences' 
      },
      { 
        href: '/privacy', 
        label: 'Privacy & Access', 
        icon: 'Lock', 
        description: 'Consent scopes and break-glass overrides' 
      },
      { 
        href: '/settings', 
        label: 'Settings', 
        icon: 'Settings', 
        description: 'Accessibility and quiet hours preferences' 
      },
    ],
  },
];

export const NAVIGATION_LINKS: NavigationItem[] = NAVIGATION_SECTIONS.flatMap(group => group.items);
