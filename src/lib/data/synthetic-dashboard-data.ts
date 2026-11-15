// CARETRACE Synthetic Demonstration Data
// Explicitly fictional healthcare coordination sample data for evaluation and interface testing.
// Never represents real patient information.

export interface SyntheticPatient {
  id: string;
  patientId: string;
  fullName: string;
  preferredName?: string;
  age: number;
  dateOfBirth: string;
  bloodType: string;
  allergies: Array<{ allergen: string; severity: string; reaction: string }>;
  conditions: string[];
  primaryDoctor: string;
  primaryClinic: string;
  preferredLanguage: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  advanceDirectivesStatus: string;
}

export interface SyntheticMetric {
  id: string;
  label: string;
  value: string | number;
  subValue: string;
  trendLabel?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  auditNote: string;
}

export type DoseStatusType = 'reported_taken' | 'upcoming' | 'awaiting_confirmation' | 'missed' | 'skipped';

export interface SyntheticMedicationDose {
  id: string;
  medicationName: string;
  dosage: string;
  form: string;
  scheduledTime: string;
  status: DoseStatusType;
  statusLabel: string;
  loggedAt?: string;
  loggedBy?: string;
  instructions: string;
  prescribingClinician: string;
  rxNumber: string;
}

export interface SyntheticAppointment {
  id: string;
  title: string;
  specialty: string;
  providerName: string;
  facility: string;
  dateTimeFormatted: string;
  durationMinutes: number;
  status: 'confirmed' | 'scheduled' | 'rescheduled' | 'needs_confirmation';
  companionName: string;
  companionRole: string;
  transportStatus: string;
  preparationNotice: string;
}

export interface SyntheticCareCircleMember {
  id: string;
  name: string;
  relationship: string;
  roleDescription: string;
  permissionTier: string;
  phone: string;
  email: string;
  emergencyPriority: number;
  assignedResponsibility: string;
  acknowledgementStatus: 'acknowledged' | 'pending';
  lastActive: string;
}

export interface SyntheticAlert {
  id: string;
  severity: 'warning' | 'info' | 'critical';
  title: string;
  description: string;
  actionRequired: string;
  timestamp: string;
  category: 'care_gap' | 'continuity' | 'task_acknowledgement';
}

export interface SyntheticTimelineEvent {
  id: string;
  title: string;
  timestamp: string;
  description: string;
  actorName: string;
  actorRole: string;
  category: string;
  badgeLabel: string;
}

export interface PatientDashboardBundle {
  patient: SyntheticPatient;
  metrics: SyntheticMetric[];
  medicationSchedule: SyntheticMedicationDose[];
  nextAppointment: SyntheticAppointment;
  careCircle: SyntheticCareCircleMember[];
  alerts: SyntheticAlert[];
  timelineEvents: SyntheticTimelineEvent[];
}

export const SYNTHETIC_PATIENTS_DATASET: Record<string, PatientDashboardBundle> = {
  // 1. Margaret Sullivan (DEMO-001)
  'DEMO-001': {
    patient: {
      id: 'DEMO-001',
      patientId: 'DEMO-001',
      fullName: 'Margaret Sullivan',
      preferredName: 'Margaret',
      age: 78,
      dateOfBirth: '1948-03-14',
      bloodType: 'O+',
      allergies: [
        { allergen: 'Penicillin', severity: 'Severe', reaction: 'Anaphylaxis / Hives' },
      ],
      conditions: ['Hypertension', 'Type 2 Diabetes', 'Mild Arrhythmia'],
      primaryDoctor: 'Dr. Robert Chen (fictional)',
      primaryClinic: 'St. Jude Geriatric & Primary Care (fictional)',
      preferredLanguage: 'English',
      emergencyContact: {
        name: 'David Sullivan',
        relationship: 'Son (Primary Family Admin)',
        phone: '+91-9000000001',
      },
      advanceDirectivesStatus: 'Documented & Signed (POLST on file, DNR Active)',
    },
    metrics: [
      {
        id: 'scheduled-doses',
        label: 'Scheduled Doses Today',
        value: '3 Doses',
        subValue: '2 reported taken, 1 pending',
        trendLabel: 'On Schedule',
        trendDirection: 'neutral',
        auditNote: 'Example medicine A & B from synthetic care plan.',
      },
      {
        id: 'reported-taken',
        label: 'Reported Taken Today',
        value: '2 of 3',
        subValue: 'Morning & midday doses reported',
        trendLabel: 'Verified Demo',
        trendDirection: 'up',
        auditNote: 'User-reported event (EVT-001); non-clinical sample.',
      },
      {
        id: 'upcoming-appointments',
        label: 'Upcoming Visits',
        value: '2 Visits',
        subValue: 'Cardiology on Nov 18',
        trendLabel: 'Ride Confirmed',
        trendDirection: 'neutral',
        auditNote: 'Companion David Sullivan assigned.',
      },
      {
        id: 'outstanding-tasks',
        label: 'Care Tasks Pending',
        value: '2 Tasks',
        subValue: 'Confirm review & visit prep',
        trendLabel: 'Normal Priority',
        trendDirection: 'neutral',
        auditNote: 'Assigned to David Sullivan & Sarah Jenkins.',
      },
    ],
    medicationSchedule: [
      {
        id: 'EVT-001',
        medicationName: 'Example medicine A (MED-001)',
        dosage: 'As recorded in care plan',
        form: 'Oral Tablet',
        scheduledTime: '08:00 AM',
        status: 'reported_taken',
        statusLabel: 'Reported Taken at 08:00 AM',
        loggedAt: '08:00 AM',
        loggedBy: 'Sarah Jenkins (MEM-002)',
        instructions: 'Morning, according to fictional care plan record.',
        prescribingClinician: 'Dr. Robert Chen (fictional)',
        rxNumber: 'SYN-MED-001',
      },
      {
        id: 'EVT-002',
        medicationName: 'Example medicine B (MED-002 - Midday)',
        dosage: 'As recorded in care plan',
        form: 'Oral Capsule',
        scheduledTime: '01:00 PM',
        status: 'reported_taken',
        statusLabel: 'Reported Taken at 01:00 PM',
        loggedAt: '01:00 PM',
        loggedBy: 'David Sullivan (MEM-001)',
        instructions: 'Afternoon, according to fictional care plan record.',
        prescribingClinician: 'Dr. Robert Chen (fictional)',
        rxNumber: 'SYN-MED-002',
      },
      {
        id: 'EVT-003',
        medicationName: 'Example medicine B (Evening)',
        dosage: 'As recorded in care plan',
        form: 'Oral Capsule',
        scheduledTime: '08:00 PM',
        status: 'upcoming',
        statusLabel: 'Upcoming (Due at 20:00)',
        instructions: 'Evening, according to fictional care plan record. Awaiting review.',
        prescribingClinician: 'Dr. Robert Chen (fictional)',
        rxNumber: 'SYN-MED-002',
      },
    ],
    nextAppointment: {
      id: 'APT-001',
      title: 'Annual Geriatric Wellness & Cardiology Assessment',
      specialty: 'Cardiology',
      providerName: 'Dr. Robert Chen (fictional)',
      facility: 'St. Jude Geriatric & Primary Care (fictional)',
      dateTimeFormatted: 'Wednesday, Nov 18, 2026 at 10:00 AM (60 mins)',
      durationMinutes: 60,
      status: 'confirmed',
      companionName: 'David Sullivan',
      companionRole: 'Family Escort & Driver',
      transportStatus: 'Personal vehicle ride confirmed',
      preparationNotice: 'Bring the current care summary and questions for the clinician.',
    },
    careCircle: [
      {
        id: 'MEM-001',
        name: 'David Sullivan',
        relationship: 'Son',
        roleDescription: 'Primary Family Admin & Healthcare Proxy',
        permissionTier: 'Full Admin',
        phone: '+91-9000000001',
        email: 'david.demo@example.test',
        emergencyPriority: 1,
        assignedResponsibility: 'Transport to Nov 18 Geriatric Assessment & Review INS-002',
        acknowledgementStatus: 'acknowledged',
        lastActive: 'Active now',
      },
      {
        id: 'MEM-002',
        name: 'Sarah Jenkins',
        relationship: 'Visiting Home Nurse',
        roleDescription: 'Visiting Home Nurse / Care Partner',
        permissionTier: 'Caregiver Editor',
        phone: '+91-9000000000',
        email: 'sarah.demo@example.test',
        emergencyPriority: 2,
        assignedResponsibility: 'Morning medicine A confirmation & shift handover to David',
        acknowledgementStatus: 'acknowledged',
        lastActive: 'Handover at 08:00 AM',
      },
      {
        id: 'MEM-003',
        name: 'Dr. Robert Chen',
        relationship: 'Attending Cardiologist',
        roleDescription: 'Attending Cardiologist (fictional)',
        permissionTier: 'Clinician Reviewer',
        phone: '+91-9000000099',
        email: 'chen.demo@example.test',
        emergencyPriority: 3,
        assignedResponsibility: 'Clinical review of INS-002 and cardiovascular therapy',
        acknowledgementStatus: 'acknowledged',
        lastActive: 'Active today',
      },
    ],
    alerts: [
      {
        id: 'GAP-001',
        severity: 'warning',
        title: 'Care Gap Radar: Care instruction awaiting review (INS-002)',
        description: 'Example medication-related instruction INS-002 has a pending review status and requires authorised verification.',
        actionRequired: 'David Sullivan (MEM-001) must review source provenance and confirm instruction.',
        timestamp: 'Detected Nov 15 at 09:05 AM',
        category: 'care_gap',
      },
      {
        id: 'CONT-001',
        severity: 'info',
        title: 'Care Continuity: Discharge medication discrepancy flagged',
        description: 'Care Continuity Engine detected an updated discharge summary awaiting review.',
        actionRequired: 'Review reconciled medications in Continuity Reviews.',
        timestamp: 'Detected Nov 15 at 08:30 AM',
        category: 'continuity',
      },
    ],
    timelineEvents: [
      {
        id: 'evt-01',
        title: 'Example medicine A Reported Taken (EVT-001)',
        timestamp: 'Nov 15, 2026 • 08:00 AM',
        description: 'Fictional demo event logged by Sarah Jenkins (MEM-002); user-reported only.',
        actorName: 'Sarah Jenkins',
        actorRole: 'Caregiver',
        category: 'adherence',
        badgeLabel: 'Reported Taken',
      },
      {
        id: 'evt-02',
        title: 'Care Handover Completed (HAND-001)',
        timestamp: 'Nov 15, 2026 • 08:15 AM',
        description: 'Care responsibility transitioned from Sarah Jenkins to David Sullivan with preparation summary.',
        actorName: 'David Sullivan',
        actorRole: 'Family Admin',
        category: 'handover',
        badgeLabel: 'Acknowledged',
      },
    ],
  },

  // 2. Arthur Bennett (DEMO-002)
  'DEMO-002': {
    patient: {
      id: 'DEMO-002',
      patientId: 'DEMO-002',
      fullName: 'Arthur Bennett',
      preferredName: 'Arthur',
      age: 88,
      dateOfBirth: '1938-11-02',
      bloodType: 'A+',
      allergies: [
        { allergen: 'Sulfa Drugs', severity: 'Moderate', reaction: 'Skin Rash' },
      ],
      conditions: ['Type 2 Diabetes', 'Peripheral Neuropathy', 'Presbycusis'],
      primaryDoctor: 'Dr. Priya Shah (fictional)',
      primaryClinic: 'Northside Family Clinic (fictional)',
      preferredLanguage: 'English',
      emergencyContact: {
        name: 'Helen Bennett',
        relationship: 'Daughter (Family Admin)',
        phone: '+91-9000000002',
      },
      advanceDirectivesStatus: 'Living Will on File',
    },
    metrics: [
      {
        id: 'scheduled-doses',
        label: 'Scheduled Doses Today',
        value: '1 Dose',
        subValue: 'Awaiting confirmation',
        trendLabel: 'Needs Review',
        trendDirection: 'neutral',
        auditNote: 'Example medicine C schedule unverified.',
      },
      {
        id: 'reported-taken',
        label: 'Adherence Status',
        value: 'Unconfirmed',
        subValue: 'Dose EVT-003 at 09:00 AM',
        trendLabel: 'Awaiting Review',
        trendDirection: 'down',
        auditNote: 'Needs authorised confirmation; no clinical inference.',
      },
      {
        id: 'upcoming-appointments',
        label: 'Upcoming Visits',
        value: '1 Visit',
        subValue: 'Routine Review on Nov 19',
        trendLabel: 'Needs Confirmation',
        trendDirection: 'neutral',
        auditNote: 'Doctor visit with Dr. Priya Shah.',
      },
      {
        id: 'outstanding-tasks',
        label: 'Care Tasks Pending',
        value: '1 Task',
        subValue: 'Confirm clinic details',
        trendLabel: 'Assigned to Helen',
        trendDirection: 'neutral',
        auditNote: 'TASK-003 due Nov 18.',
      },
    ],
    medicationSchedule: [
      {
        id: 'EVT-003',
        medicationName: 'Example medicine C (MED-003)',
        dosage: 'Not specified in demo',
        form: 'Oral Tablet',
        scheduledTime: '09:00 AM',
        status: 'awaiting_confirmation',
        statusLabel: 'Awaiting Confirmation (Due 09:00 AM)',
        instructions: 'Schedule not supplied in synthetic record. Source incomplete.',
        prescribingClinician: 'Dr. Priya Shah (fictional)',
        rxNumber: 'SYN-MED-003',
      },
    ],
    nextAppointment: {
      id: 'APT-003',
      title: 'Routine Care Review',
      specialty: 'Family Medicine & Primary Care',
      providerName: 'Dr. Priya Shah (fictional)',
      facility: 'Northside Family Clinic (fictional)',
      dateTimeFormatted: 'Thursday, Nov 19, 2026 at 09:30 AM (30 mins)',
      durationMinutes: 30,
      status: 'needs_confirmation',
      companionName: 'Helen Bennett',
      companionRole: 'Daughter / Family Coordinator',
      transportStatus: 'Family ride being arranged',
      preparationNotice: 'Confirm appointment details and clinic contact prior to visit.',
    },
    careCircle: [
      {
        id: 'MEM-003',
        name: 'Helen Bennett',
        relationship: 'Daughter',
        roleDescription: 'Primary Family Coordinator',
        permissionTier: 'Full Admin',
        phone: '+91-9000000002',
        email: 'helen.demo@example.test',
        emergencyPriority: 1,
        assignedResponsibility: 'Confirm appointment APT-003 & resolve incomplete instruction INS-003',
        acknowledgementStatus: 'acknowledged',
        lastActive: 'Active today',
      },
    ],
    alerts: [
      {
        id: 'GAP-002',
        severity: 'warning',
        title: 'Care Gap Radar: Care instruction source incomplete (INS-003)',
        description: 'Instruction source details are intentionally incomplete in dataset to highlight unverified state.',
        actionRequired: 'Helen Bennett (MEM-003) must contact provider to complete provenance data.',
        timestamp: 'Detected Nov 15 at 09:10 AM',
        category: 'care_gap',
      },
    ],
    timelineEvents: [
      {
        id: 'evt-b-01',
        title: 'Unconfirmed Dose Event Generated (EVT-003)',
        timestamp: 'Nov 15, 2026 • 09:00 AM',
        description: 'Dose event for Example medicine C requires confirmation.',
        actorName: 'System Scan',
        actorRole: 'Care Continuity Engine',
        category: 'medication',
        badgeLabel: 'Awaiting Review',
      },
    ],
  },

  // 3. Leela Raman (DEMO-003)
  'DEMO-003': {
    patient: {
      id: 'DEMO-003',
      patientId: 'DEMO-003',
      fullName: 'Leela Raman',
      preferredName: 'Leela',
      age: 81,
      dateOfBirth: '1945-07-23',
      bloodType: 'B+',
      allergies: [
        { allergen: 'Aspirin', severity: 'Mild', reaction: 'Stomach Upset' },
      ],
      conditions: ['Mild Cognitive Impairment', 'Osteoporosis', 'Cataract'],
      primaryDoctor: 'Dr. Ananya Iyer (fictional)',
      primaryClinic: 'Riverside Health Centre (fictional)',
      preferredLanguage: 'Tamil',
      emergencyContact: {
        name: 'Kavitha Raman',
        relationship: 'Daughter (Family Admin)',
        phone: '+91-9000000003',
      },
      advanceDirectivesStatus: 'Healthcare Proxy Designated to Kavitha',
    },
    metrics: [
      {
        id: 'scheduled-doses',
        label: 'Scheduled Doses Today',
        value: '1 Dose',
        subValue: 'Afternoon liquid dose',
        trendLabel: 'Skipped Reported',
        trendDirection: 'neutral',
        auditNote: 'Example medicine D user-reported event.',
      },
      {
        id: 'reported-taken',
        label: 'Adherence Status',
        value: 'Skipped',
        subValue: 'Reported by Kavitha',
        trendLabel: 'Logged at 14:00',
        trendDirection: 'neutral',
        auditNote: 'EVT-004 logged by daughter Kavitha Raman.',
      },
      {
        id: 'upcoming-appointments',
        label: 'Upcoming Visits',
        value: '1 Visit',
        subValue: 'Follow-up on Nov 24',
        trendLabel: 'Confirmed',
        trendDirection: 'neutral',
        auditNote: 'Doctor visit with Dr. Ananya Iyer.',
      },
      {
        id: 'outstanding-tasks',
        label: 'Care Tasks Pending',
        value: '1 Task',
        subValue: 'Acknowledge handover',
        trendLabel: 'TASK-004 Due 19:00',
        trendDirection: 'neutral',
        auditNote: 'Assigned to Kavitha Raman.',
      },
    ],
    medicationSchedule: [
      {
        id: 'EVT-004',
        medicationName: 'Example medicine D (MED-004)',
        dosage: 'As recorded in fictional care plan',
        form: 'Oral Liquid',
        scheduledTime: '02:00 PM',
        status: 'skipped',
        statusLabel: 'Reported Skipped at 02:00 PM',
        loggedAt: '02:00 PM',
        loggedBy: 'Kavitha Raman (MEM-004)',
        instructions: 'Afternoon, according to fictional care plan record.',
        prescribingClinician: 'Dr. Ananya Iyer (fictional)',
        rxNumber: 'SYN-MED-004',
      },
    ],
    nextAppointment: {
      id: 'APT-004',
      title: 'Follow-up Visit & Mobility Review',
      specialty: 'Primary Care & Geriatric Mobility',
      providerName: 'Dr. Ananya Iyer (fictional)',
      facility: 'Riverside Health Centre (fictional)',
      dateTimeFormatted: 'Tuesday, Nov 24, 2026 at 03:00 PM (45 mins)',
      durationMinutes: 45,
      status: 'confirmed',
      companionName: 'Kavitha Raman',
      companionRole: 'Daughter / Family Escort',
      transportStatus: 'Confirmed family ride',
      preparationNotice: 'Bring the latest verified instruction record (INS-004).',
    },
    careCircle: [
      {
        id: 'MEM-004',
        name: 'Kavitha Raman',
        relationship: 'Daughter',
        roleDescription: 'Primary Family Coordinator',
        permissionTier: 'Full Admin',
        phone: '+91-9000000003',
        email: 'kavitha.demo@example.test',
        emergencyPriority: 1,
        assignedResponsibility: 'Acknowledge shift handover & escort to Nov 24 follow-up',
        acknowledgementStatus: 'pending',
        lastActive: 'Active 1 hour ago',
      },
    ],
    alerts: [
      {
        id: 'HAND-002',
        severity: 'info',
        title: 'Care Circle: Fictional handover awaiting acknowledgement',
        description: 'Fictional shift handover for Leela Raman is awaiting recipient assignment and formal acknowledgement.',
        actionRequired: 'Kavitha Raman (MEM-004) to acknowledge pending shift handover.',
        timestamp: 'Issued Nov 15 at 12:00 PM',
        category: 'task_acknowledgement',
      },
    ],
    timelineEvents: [
      {
        id: 'evt-r-01',
        title: 'Example medicine D Reported Skipped (EVT-004)',
        timestamp: 'Nov 15, 2026 • 02:00 PM',
        description: 'Fictional user-reported event logged by Kavitha Raman (MEM-004).',
        actorName: 'Kavitha Raman',
        actorRole: 'Family Member',
        category: 'adherence',
        badgeLabel: 'Skipped Reported',
      },
    ],
  },

  // 4. Josephine Carter (DEMO-004)
  'DEMO-004': {
    patient: {
      id: 'DEMO-004',
      patientId: 'DEMO-004',
      fullName: 'Josephine Carter',
      preferredName: 'Josie',
      age: 86,
      dateOfBirth: '1940-01-09',
      bloodType: 'AB+',
      allergies: [],
      conditions: ['Congestive Heart Failure', 'Hypertension'],
      primaryDoctor: 'Dr. Marcus Vance (fictional)',
      primaryClinic: 'St. Jude Geriatric Clinic (fictional)',
      preferredLanguage: 'English',
      emergencyContact: {
        name: 'Michael Carter',
        relationship: 'Son (Family Coordinator)',
        phone: '+91-9000000004',
      },
      advanceDirectivesStatus: 'POLST Documented',
    },
    metrics: [
      {
        id: 'scheduled-doses',
        label: 'Scheduled Doses Today',
        value: '1 Dose',
        subValue: 'Needs schedule review',
        trendLabel: 'Pending Review',
        trendDirection: 'neutral',
        auditNote: 'Example medicine E schedule not supplied in synthetic record.',
      },
      {
        id: 'reported-taken',
        label: 'Adherence Status',
        value: 'Needs Review',
        subValue: 'Schedule unverified',
        trendLabel: 'Review Pending',
        trendDirection: 'down',
        auditNote: 'Verification pending by primary care provider.',
      },
      {
        id: 'upcoming-appointments',
        label: 'Upcoming Visits',
        value: 'Planned',
        subValue: 'Mobility Evaluation',
        trendLabel: 'In Scheduling',
        trendDirection: 'neutral',
        auditNote: 'Clinic referral pending.',
      },
      {
        id: 'outstanding-tasks',
        label: 'Care Tasks Pending',
        value: '1 Task',
        subValue: 'Clarify prescription schedule',
        trendLabel: 'Assigned to Michael',
        trendDirection: 'neutral',
        auditNote: 'Coordinate with clinic coordinator.',
      },
    ],
    medicationSchedule: [
      {
        id: 'MED-005',
        medicationName: 'Example medicine E (MED-005)',
        dosage: 'Not specified in demo',
        form: 'Oral Tablet',
        scheduledTime: 'Pending Review',
        status: 'awaiting_confirmation',
        statusLabel: 'Schedule Unsupplied (Pending Review)',
        instructions: 'Schedule not supplied in synthetic demo dataset; needs authorised review.',
        prescribingClinician: 'Dr. Marcus Vance (fictional)',
        rxNumber: 'SYN-MED-005',
      },
    ],
    nextAppointment: {
      id: 'APT-005',
      title: 'Mobility & Daily Living Consultation',
      specialty: 'Geriatric Rehabilitation',
      providerName: 'Alex Morgan (fictional)',
      facility: 'Community Mobility Centre (fictional)',
      dateTimeFormatted: 'Friday, Nov 27, 2026 at 11:00 AM (45 mins)',
      durationMinutes: 45,
      status: 'scheduled',
      companionName: 'Michael Carter',
      companionRole: 'Son / Family Coordinator',
      transportStatus: 'Transport planning active',
      preparationNotice: 'Review existing physical activity records prior to visit.',
    },
    careCircle: [
      {
        id: 'MEM-005',
        name: 'Michael Carter',
        relationship: 'Son',
        roleDescription: 'Primary Family Coordinator',
        permissionTier: 'Full Admin',
        phone: '+91-9000000004',
        email: 'michael.demo@example.test',
        emergencyPriority: 1,
        assignedResponsibility: 'Confirm prescription schedule with clinic & coordinate transportation',
        acknowledgementStatus: 'acknowledged',
        lastActive: 'Active today',
      },
    ],
    alerts: [
      {
        id: 'GAP-004',
        severity: 'warning',
        title: 'Care Gap Radar: Prescription schedule unsupplied (MED-005)',
        description: 'Example medicine E lacks schedule timing in synthetic record; human review required before dosing.',
        actionRequired: 'Michael Carter (MEM-005) to request schedule clarification.',
        timestamp: 'Detected Nov 15 at 10:00 AM',
        category: 'care_gap',
      },
    ],
    timelineEvents: [
      {
        id: 'evt-c-01',
        title: 'Prescription Staged Awaiting Review (MED-005)',
        timestamp: 'Nov 14, 2026 • 04:00 PM',
        description: 'Synthetic record imported with unverified schedule status.',
        actorName: 'System Import',
        actorRole: 'CARETRACE Ingestion Engine',
        category: 'medication',
        badgeLabel: 'Needs Review',
      },
    ],
  },

  // 5. Ravi Narayanan (DEMO-005)
  'DEMO-005': {
    patient: {
      id: 'DEMO-005',
      patientId: 'DEMO-005',
      fullName: 'Ravi Narayanan',
      preferredName: 'Ravi',
      age: 83,
      dateOfBirth: '1943-09-14',
      bloodType: 'O-',
      allergies: [
        { allergen: 'Iodinated Contrast', severity: 'Severe', reaction: 'Urticaria' },
      ],
      conditions: ['Coronary Artery Disease', 'Dyslipidemia'],
      primaryDoctor: 'Dr. Robert Chen (fictional)',
      primaryClinic: 'St. Jude Geriatric & Cardiology (fictional)',
      preferredLanguage: 'Tamil',
      emergencyContact: {
        name: 'Meena Narayanan',
        relationship: 'Daughter (Family Admin)',
        phone: '+91-9000000005',
      },
      advanceDirectivesStatus: 'Signed POLST & Healthcare Proxy',
    },
    metrics: [
      {
        id: 'scheduled-doses',
        label: 'Scheduled Doses Today',
        value: '1 Dose',
        subValue: 'Morning dose',
        trendLabel: 'Missed Unconfirmed',
        trendDirection: 'down',
        auditNote: 'Unconfirmed status for demonstration; not clinical proof.',
      },
      {
        id: 'reported-taken',
        label: 'Adherence Status',
        value: 'Unconfirmed',
        subValue: 'Dose EVT-005 at 08:30 AM',
        trendLabel: 'Review Required',
        trendDirection: 'down',
        auditNote: 'Care gap detected for unconfirmed dose.',
      },
      {
        id: 'upcoming-appointments',
        label: 'Upcoming Visits',
        value: '1 Visit',
        subValue: 'Cardiology Review on Nov 20',
        trendLabel: 'Confirmed',
        trendDirection: 'neutral',
        auditNote: 'Doctor visit with Dr. Robert Chen.',
      },
      {
        id: 'outstanding-tasks',
        label: 'Care Tasks Pending',
        value: '1 Task',
        subValue: 'Check unconfirmed event',
        trendLabel: 'Assigned to Meena',
        trendDirection: 'neutral',
        auditNote: 'Assigned to daughter Meena Narayanan.',
      },
    ],
    medicationSchedule: [
      {
        id: 'EVT-005',
        medicationName: 'Example medicine F (MED-006)',
        dosage: 'As recorded in fictional care plan',
        form: 'Oral Tablet',
        scheduledTime: '08:30 AM',
        status: 'missed',
        statusLabel: 'Missed / Unconfirmed at 08:30 AM',
        instructions: 'Morning, according to fictional care plan record.',
        prescribingClinician: 'Dr. Robert Chen (fictional)',
        rxNumber: 'SYN-MED-006',
      },
    ],
    nextAppointment: {
      id: 'APT-006',
      title: 'Cardiometabolic Wellness & Instruction Review',
      specialty: 'Cardiology & Preventive Care',
      providerName: 'Dr. Robert Chen (fictional)',
      facility: 'St. Jude Geriatric & Cardiology (fictional)',
      dateTimeFormatted: 'Friday, Nov 20, 2026 at 10:30 AM (45 mins)',
      durationMinutes: 45,
      status: 'confirmed',
      companionName: 'Meena Narayanan',
      companionRole: 'Daughter / Family Coordinator',
      transportStatus: 'Confirmed family ride',
      preparationNotice: 'Review verified instruction INS-006 prior to visit.',
    },
    careCircle: [
      {
        id: 'MEM-006',
        name: 'Meena Narayanan',
        relationship: 'Daughter',
        roleDescription: 'Primary Family Coordinator',
        permissionTier: 'Full Admin',
        phone: '+91-9000000005',
        email: 'meena.demo@example.test',
        emergencyPriority: 1,
        assignedResponsibility: 'Verify unconfirmed medication event EVT-005 & companion to Nov 20 review',
        acknowledgementStatus: 'acknowledged',
        lastActive: 'Active 30 mins ago',
      },
    ],
    alerts: [
      {
        id: 'GAP-003',
        severity: 'warning',
        title: 'Care Gap Radar: Medication event unconfirmed (EVT-005)',
        description: 'A fictional event has not been confirmed; this is not a clinical severity assessment.',
        actionRequired: 'Meena Narayanan (MEM-006) to confirm whether morning dose was taken or delayed.',
        timestamp: 'Detected Nov 15 at 09:15 AM',
        category: 'care_gap',
      },
    ],
    timelineEvents: [
      {
        id: 'evt-rn-01',
        title: 'Medication Event Flagged as Unconfirmed (EVT-005)',
        timestamp: 'Nov 15, 2026 • 09:15 AM',
        description: 'Dose for Example medicine F passed scheduled window without confirmation.',
        actorName: 'Care Gap Radar',
        actorRole: 'Safety Intelligence',
        category: 'care_gap',
        badgeLabel: 'Unconfirmed Event',
      },
    ],
  },
};

/**
 * Returns the complete dashboard bundle for a specific synthetic patient.
 * Defaults to Margaret Sullivan (DEMO-001) if not found or unspecified.
 */
export function getSyntheticDashboardData(patientId?: string): PatientDashboardBundle {
  if (patientId && SYNTHETIC_PATIENTS_DATASET[patientId]) {
    return SYNTHETIC_PATIENTS_DATASET[patientId];
  }
  return SYNTHETIC_PATIENTS_DATASET['DEMO-001'];
}

// Backward-compatible individual exports
export const SYNTHETIC_PATIENT = SYNTHETIC_PATIENTS_DATASET['DEMO-001'].patient;
export const SYNTHETIC_METRICS = SYNTHETIC_PATIENTS_DATASET['DEMO-001'].metrics;
export const SYNTHETIC_MEDICATION_SCHEDULE = SYNTHETIC_PATIENTS_DATASET['DEMO-001'].medicationSchedule;
export const SYNTHETIC_NEXT_APPOINTMENT = SYNTHETIC_PATIENTS_DATASET['DEMO-001'].nextAppointment;
export const SYNTHETIC_CARE_CIRCLE = SYNTHETIC_PATIENTS_DATASET['DEMO-001'].careCircle;
export const SYNTHETIC_ALERTS = SYNTHETIC_PATIENTS_DATASET['DEMO-001'].alerts;
export const SYNTHETIC_TIMELINE_EVENTS = SYNTHETIC_PATIENTS_DATASET['DEMO-001'].timelineEvents;
