/**
 * CARETRACE Instruction Vault Data Store & Services
 * PromptWars × Catalyst 2026
 *
 * Implements an immutable, versioned, source-aware repository for patient care instructions.
 * Supports source provenance, structured metadata, human review gates, and version comparison.
 */

import {
  CareInstruction,
  CareInstructionVersion,
  InstructionSource,
  InstructionReviewRecord,
  StructuredDiffItem,
} from "@/types/caretrace";

/* -------------------------------------------------------------------------- */
/* 1. Baseline Instruction Sources (Provenance)                              */
/* -------------------------------------------------------------------------- */
export const INITIAL_INSTRUCTION_SOURCES: InstructionSource[] = [
  {
    id: "src-001",
    patientId: "patient-profile-001",
    sourceType: "hospital_discharge",
    title: "St. Jude Hospital Post-Discharge Clinical Summary",
    facilityName: "St. Jude Medical Center",
    providerName: "Dr. Eleanor Vance, MD",
    providerRole: "Attending Cardiologist",
    documentReference: "DISCH-STJUDE-2026-8819",
    encounterDate: "2026-01-18",
    rawNotes: "Comprehensive discharge summary following observation for congestive balance and hypertensive titration.",
    enteredBy: "member-david",
    enteredByName: "David Sullivan",
    enteredByRole: "Family Care Coordinator",
    entryTimestamp: "2026-01-19T10:00:00Z",
    verificationDetails: "Hospital discharge seal on file; counter-verified during initial home nurse evaluation.",
    isMissingSourceDetails: false,
    attachments: [
      {
        id: "att-001",
        sourceId: "src-001",
        fileName: "st_jude_discharge_summary_sullivan.pdf",
        fileSize: 2450000,
        mimeType: "application/pdf",
        storagePath: "/storage/patient-001/sources/st_jude_discharge_summary_sullivan.pdf",
        uploadedBy: "member-david",
        uploadedByName: "David Sullivan",
        uploadedAt: "2026-01-19T10:05:00Z",
        description: "Official 4-page discharge packet with attending physician signature.",
      },
    ],
    createdAt: "2026-01-19T10:00:00Z",
  },
  {
    id: "src-002",
    patientId: "patient-profile-001",
    sourceType: "specialist_consult",
    title: "Dr. Robert Chen Geriatric Consultation Encounter",
    facilityName: "St. Jude Geriatric Clinic",
    providerName: "Dr. Robert Chen, MD",
    providerRole: "Geriatric Specialist",
    documentReference: "GER-CONS-2026-0210",
    encounterDate: "2026-02-10",
    rawNotes: "Comprehensive geriatric assessment focusing on mobility safety, cognitive wellness, and fall risk mitigation.",
    enteredBy: "member-david",
    enteredByName: "David Sullivan",
    enteredByRole: "Family Care Coordinator",
    entryTimestamp: "2026-02-10T16:30:00Z",
    verificationDetails: "Direct electronic health record encounter notes signed by Dr. Robert Chen.",
    isMissingSourceDetails: false,
    createdAt: "2026-02-10T16:30:00Z",
  },
  {
    id: "src-003",
    patientId: "patient-profile-001",
    sourceType: "lab_diagnostic_report",
    title: "Springfield Community Lab Requisition Protocol",
    facilityName: "Springfield Community Laboratory",
    providerName: "Clinical Laboratory Director",
    providerRole: "Clinical Pathologist",
    documentReference: "LAB-REQ-88912",
    encounterDate: "2026-02-12",
    rawNotes: "Renal profile (BUN, Serum Creatinine, eGFR) and electrolyte panel fasting instructions.",
    enteredBy: "member-sarah",
    enteredByName: "Sarah Jenkins, RN",
    enteredByRole: "Visiting Nurse",
    entryTimestamp: "2026-02-12T11:00:00Z",
    verificationDetails: "Laboratory requisition sheet attached with barcode order #88912.",
    isMissingSourceDetails: false,
    createdAt: "2026-02-12T11:00:00Z",
  },
  {
    id: "src-004",
    patientId: "patient-profile-001",
    sourceType: "caregiver_provided",
    title: "Visiting Nurse Home Environment & Vitals Assessment",
    facilityName: "St. Jude Home Care Services",
    providerName: "Sarah Jenkins, RN",
    providerRole: "Registered Visiting Nurse",
    documentReference: "VNH-ASSESS-2026-0214",
    encounterDate: "2026-02-14",
    rawNotes: "Environmental safety check and baseline radial pulse observation protocol.",
    enteredBy: "member-sarah",
    enteredByName: "Sarah Jenkins, RN",
    enteredByRole: "Visiting Nurse",
    entryTimestamp: "2026-02-14T09:15:00Z",
    verificationDetails: "Clinical nurse observation entered directly into CARETRACE.",
    isMissingSourceDetails: false,
    createdAt: "2026-02-14T09:15:00Z",
  },
  {
    id: "src-005",
    patientId: "patient-profile-001",
    sourceType: "patient_or_representative_entry",
    title: "Verbal Note from Neighbor Regarding Herbal Hawthorn Tea",
    facilityName: "Unverified Local Entry",
    rawNotes: "Neighbor suggested brewing hawthorn berry tea twice weekly for heart health.",
    enteredBy: "member-david",
    enteredByName: "David Sullivan",
    enteredByRole: "Family Care Coordinator",
    entryTimestamp: "2026-02-05T14:00:00Z",
    isMissingSourceDetails: true,
    notesAboutMissingSource: "No clinical document, prescriber order, or formal label provided. Transcribed from verbal conversation.",
    createdAt: "2026-02-05T14:00:00Z",
  },
];

/* -------------------------------------------------------------------------- */
/* 2. Baseline Care Instructions                                              */
/* -------------------------------------------------------------------------- */
export const INITIAL_CARE_INSTRUCTIONS: CareInstruction[] = [
  {
    id: "inst-001",
    patientId: "patient-profile-001",
    title: "Morning Blood Pressure Monitoring & Metoprolol Protocol",
    category: "medication_related",
    description: "Measure resting blood pressure and radial pulse prior to administering morning Metoprolol Succinate 50mg. Withhold dose and alert primary contact if systolic BP < 100 mmHg or pulse < 55 bpm.",
    structuredContent: {
      frequency: "Daily at 08:00 AM",
      targetParameter: "Systolic BP ≥ 100 mmHg, Pulse ≥ 55 bpm",
      guidelines: [
        "Patient must sit quietly in a supportive armchair for 5 minutes prior to measurement.",
        "Use calibrated automatic upper arm cuff placed on the left arm at heart level.",
        "Record reading in CARETRACE Vitals log immediately.",
      ],
      precautions: [
        "Do NOT administer Metoprolol if heart rate is below 55 bpm.",
        "If systolic BP is below 100 mmHg, have patient rest recumbent and recheck in 20 minutes.",
      ],
      actionItems: [
        "Administer 50mg Metoprolol with 6-8 oz water if parameters are met.",
        "Notify Visiting Nurse Sarah Jenkins if readings fall below threshold on 2 consecutive days.",
      ],
    },
    currentVersionNumber: 2,
    verificationStatus: "verified",
    sourceId: "src-001",
    effectiveDate: "2026-01-20",
    expirationDate: "2026-07-20",
    tags: ["Cardiology", "Metoprolol", "Blood Pressure", "Vitals Safety"],
    relatedMedicationId: "med-002",
    relatedMedicationName: "Metoprolol Succinate ER 50mg",
    relatedTaskId: "task-003",
    relatedTaskTitle: "Daily Morning Blood Pressure & Pulse Recording",
    createdBy: "member-david",
    createdByName: "David Sullivan",
    createdByRole: "Family Care Coordinator",
    verifiedBy: "member-vance",
    verifiedByName: "Dr. Eleanor Vance, MD",
    verifiedByRole: "Attending Cardiologist",
    verifiedAt: "2026-01-21T14:30:00Z",
    verificationRationale: "Verified against hospital discharge instructions and cardiology titration protocol.",
    createdAt: "2026-01-20T09:00:00Z",
    updatedAt: "2026-02-12T11:30:00Z",
  },
  {
    id: "inst-002",
    patientId: "patient-profile-001",
    title: "Low-Sodium Dietary Guidance & Daily Fluid Balance",
    category: "dietary",
    description: "Maintain daily dietary sodium intake below 2,000 mg to prevent congestive fluid retention. Fluid target 1.5 to 2.0 litres per day unless acute lower extremity edema is observed.",
    structuredContent: {
      frequency: "Continuous Daily Routine",
      targetParameter: "Sodium < 2,000 mg/day; Fluid 1,500 - 2,000 mL/day",
      guidelines: [
        "Avoid canned soups, cured deli meats, and pre-packaged frozen meals.",
        "Flavour home-prepared meals with fresh herbs, garlic, and citrus rather than table salt.",
        "Drink small sips of water throughout the morning and afternoon; taper fluid intake after 7:00 PM.",
      ],
      precautions: [
        "Report weight gain of > 2 lbs in 24 hours or 4 lbs in one week immediately.",
      ],
    },
    currentVersionNumber: 1,
    verificationStatus: "verified",
    sourceId: "src-001",
    effectiveDate: "2026-01-20",
    tags: ["Dietary", "Congestive Heart Failure", "Fluid Balance"],
    createdBy: "member-david",
    createdByName: "David Sullivan",
    createdByRole: "Family Care Coordinator",
    verifiedBy: "member-vance",
    verifiedByName: "Dr. Eleanor Vance, MD",
    verifiedByRole: "Attending Cardiologist",
    verifiedAt: "2026-01-21T15:00:00Z",
    verificationRationale: "Standard AHA/ACC dietary guidelines for stage C heart failure management.",
    createdAt: "2026-01-20T09:30:00Z",
    updatedAt: "2026-01-21T15:00:00Z",
  },
  {
    id: "inst-003",
    patientId: "patient-profile-001",
    title: "Post-Stroke Cognitive Orientation & Seated Mobility Routine",
    category: "mobility_daily_routine",
    description: "Perform 15 minutes of guided seated lower extremity exercises (knee extensions, ankle pumps) and daily cognitive orientation workbook pages before lunch.",
    structuredContent: {
      frequency: "Mon / Wed / Fri at 11:00 AM",
      guidelines: [
        "Ensure patient is seated upright in a sturdy armchair with feet flat on the floor.",
        "Perform 10 seated leg extensions per side, resting 30 seconds between sets.",
        "Review daily calendar date, day of week, and upcoming family visits during exercise.",
      ],
      precautions: [
        "Halt exercise immediately if patient reports dizziness, lightheadedness, or shortness of breath.",
      ],
    },
    currentVersionNumber: 1,
    verificationStatus: "verified",
    sourceId: "src-002",
    effectiveDate: "2026-02-11",
    tags: ["Mobility", "Geriatrics", "Fall Prevention", "Cognitive Health"],
    relatedTaskId: "task-004",
    relatedTaskTitle: "Complete Cognitive Health Workbook Session",
    createdBy: "member-sarah",
    createdByName: "Sarah Jenkins, RN",
    createdByRole: "Visiting Nurse",
    verifiedBy: "member-chen",
    verifiedByName: "Dr. Robert Chen, MD",
    verifiedByRole: "Geriatric Specialist",
    verifiedAt: "2026-02-11T17:00:00Z",
    verificationRationale: "Geriatric mobility protocol approved during clinic assessment.",
    createdAt: "2026-02-11T10:00:00Z",
    updatedAt: "2026-02-11T17:00:00Z",
  },
  {
    id: "inst-004",
    patientId: "patient-profile-001",
    title: "Fasting Metabolic & Renal Panel Preparation Protocol",
    category: "follow_up",
    description: "Strict 8-hour fasting required prior to morning venous blood collection. Water and essential morning cardiovascular medications are permitted.",
    structuredContent: {
      frequency: "Specific to Upcoming Lab Draw (2026-03-02)",
      targetParameter: "8 hours minimum fasting (No food, juice, coffee, or milk)",
      guidelines: [
        "Patient may consume plain tap or bottled water freely throughout fasting period.",
        "Administer morning Lisinopril and Metoprolol with 4 oz of water at 07:00 AM as scheduled.",
      ],
      precautions: [
        "Do not withhold essential blood pressure medications unless specifically instructed by cardiologist.",
      ],
    },
    currentVersionNumber: 1,
    verificationStatus: "awaiting_verification",
    sourceId: "src-003",
    effectiveDate: "2026-03-02",
    tags: ["Laboratory", "Fasting", "Renal Function", "Blood Draw"],
    relatedAppointmentId: "appt-002",
    relatedAppointmentTitle: "Routine Fasting Blood Panel",
    relatedTaskId: "task-002",
    relatedTaskTitle: "Review Fasting Guidelines with Patient",
    createdBy: "member-david",
    createdByName: "David Sullivan",
    createdByRole: "Family Care Coordinator",
    createdAt: "2026-02-14T08:30:00Z",
    updatedAt: "2026-02-14T08:30:00Z",
  },
  {
    id: "inst-005",
    patientId: "patient-profile-001",
    title: "Night-time Ambient Lighting & Fall Prevention Walkway",
    category: "general_care",
    description: "Keep bedroom-to-bathroom hallway pathway illuminated with 5-watt amber nightlights to prevent nocturnal disorientation and fall risk.",
    structuredContent: {
      frequency: "Every Night (Dusk to Dawn)",
      guidelines: [
        "Ensure plug-in photocell amber nightlights are active in master bedroom, hallway, and master bath.",
        "Keep walking path completely clear of throw rugs, slippers, and electrical cables.",
      ],
    },
    currentVersionNumber: 1,
    verificationStatus: "verified",
    sourceId: "src-004",
    effectiveDate: "2026-02-14",
    tags: ["Fall Prevention", "Environmental Safety", "Home Nursing"],
    createdBy: "member-sarah",
    createdByName: "Sarah Jenkins, RN",
    createdByRole: "Visiting Nurse",
    verifiedBy: "member-david",
    verifiedByName: "David Sullivan",
    verifiedByRole: "Family Care Coordinator",
    verifiedAt: "2026-02-14T11:00:00Z",
    verificationRationale: "Implemented and inspected in residence during morning shift.",
    createdAt: "2026-02-14T09:30:00Z",
    updatedAt: "2026-02-14T11:00:00Z",
  },
  {
    id: "inst-006",
    patientId: "patient-profile-001",
    title: "Unverified Hawthorn Berry Herbal Tea Suggestion",
    category: "medication_related",
    description: "Neighbor suggested brewing hawthorn berry extract twice weekly for cardiovascular vitality.",
    currentVersionNumber: 1,
    verificationStatus: "rejected",
    sourceId: "src-005",
    tags: ["Herbal", "Unverified", "Contraindication Alert"],
    createdBy: "member-david",
    createdByName: "David Sullivan",
    createdByRole: "Family Care Coordinator",
    rejectedBy: "member-vance",
    rejectedByName: "Dr. Eleanor Vance, MD",
    rejectedAt: "2026-02-06T11:15:00Z",
    rejectionRationale: "Contraindicated. Hawthorn extract possesses significant vasodilatory and beta-blocking synergistic properties that can cause severe hypotension when co-administered with Lisinopril and Metoprolol.",
    createdAt: "2026-02-05T14:15:00Z",
    updatedAt: "2026-02-06T11:15:00Z",
  },
  {
    id: "inst-007",
    patientId: "patient-profile-001",
    title: "Spring 2025 Initial Blood Pressure Threshold (Systolic < 110 mmHg)",
    category: "medication_related",
    description: "Previous hospital guidance withholding Metoprolol if systolic blood pressure fell below 110 mmHg.",
    currentVersionNumber: 1,
    verificationStatus: "superseded",
    sourceId: "src-001",
    effectiveDate: "2025-05-10",
    tags: ["Archived", "Superseded", "Cardiology"],
    createdBy: "member-david",
    createdByName: "David Sullivan",
    createdByRole: "Family Care Coordinator",
    supersededAt: "2026-02-12T11:30:00Z",
    createdAt: "2025-05-10T08:00:00Z",
    updatedAt: "2026-02-12T11:30:00Z",
  },
];

/* -------------------------------------------------------------------------- */
/* 3. Baseline Instruction Versions (Immutable History)                       */
/* -------------------------------------------------------------------------- */
export const INITIAL_INSTRUCTION_VERSIONS: CareInstructionVersion[] = [
  {
    id: "ver-001-v1",
    instructionId: "inst-001",
    patientId: "patient-profile-001",
    versionNumber: 1,
    title: "Morning Blood Pressure Monitoring & Metoprolol Protocol",
    category: "medication_related",
    description: "Measure resting blood pressure prior to morning Metoprolol 50mg. Withhold dose if systolic BP < 110 mmHg.",
    structuredContent: {
      frequency: "Daily at 08:00 AM",
      targetParameter: "Systolic BP ≥ 110 mmHg",
      guidelines: ["Sit for 5 minutes before reading"],
      precautions: ["Do not give Metoprolol if systolic < 110 mmHg"],
    },
    verificationStatus: "verified",
    sourceId: "src-001",
    effectiveDate: "2026-01-20",
    tags: ["Cardiology", "Metoprolol"],
    relatedMedicationId: "med-002",
    changeReason: "Initial version created from hospital discharge instructions.",
    changedFields: ["title", "description", "structuredContent"],
    editorId: "member-david",
    editorName: "David Sullivan",
    editorRole: "Family Care Coordinator",
    verifiedBy: "member-vance",
    verifiedByName: "Dr. Eleanor Vance, MD",
    verifiedAt: "2026-01-21T14:30:00Z",
    verificationRationale: "Verified against discharge order sheet.",
    createdAt: "2026-01-20T09:00:00Z",
  },
  {
    id: "ver-001-v2",
    instructionId: "inst-001",
    patientId: "patient-profile-001",
    versionNumber: 2,
    title: "Morning Blood Pressure Monitoring & Metoprolol Protocol",
    category: "medication_related",
    description: "Measure resting blood pressure and radial pulse prior to administering morning Metoprolol Succinate 50mg. Withhold dose and alert primary contact if systolic BP < 100 mmHg or pulse < 55 bpm.",
    structuredContent: {
      frequency: "Daily at 08:00 AM",
      targetParameter: "Systolic BP ≥ 100 mmHg, Pulse ≥ 55 bpm",
      guidelines: [
        "Patient must sit quietly in a supportive armchair for 5 minutes prior to measurement.",
        "Use calibrated automatic upper arm cuff placed on the left arm at heart level.",
        "Record reading in CARETRACE Vitals log immediately.",
      ],
      precautions: [
        "Do NOT administer Metoprolol if heart rate is below 55 bpm.",
        "If systolic BP is below 100 mmHg, have patient rest recumbent and recheck in 20 minutes.",
      ],
      actionItems: [
        "Administer 50mg Metoprolol with 6-8 oz water if parameters are met.",
        "Notify Visiting Nurse Sarah Jenkins if readings fall below threshold on 2 consecutive days.",
      ],
    },
    verificationStatus: "verified",
    sourceId: "src-001",
    effectiveDate: "2026-02-12",
    tags: ["Cardiology", "Metoprolol", "Blood Pressure", "Vitals Safety"],
    relatedMedicationId: "med-002",
    changeReason: "Lowered systolic withholding threshold from 110 to 100 mmHg and added radial pulse ≥ 55 bpm safety boundary per Dr. Vance cardiology follow-up.",
    changedFields: ["description", "structuredContent", "effectiveDate"],
    editorId: "member-david",
    editorName: "David Sullivan",
    editorRole: "Family Care Coordinator",
    verifiedBy: "member-vance",
    verifiedByName: "Dr. Eleanor Vance, MD",
    verifiedAt: "2026-02-12T11:30:00Z",
    verificationRationale: "Cardiology follow-up consultation order verified. Patient remains asymptomatic at systolic 102-108 mmHg.",
    createdAt: "2026-02-12T10:15:00Z",
  },
];

/* -------------------------------------------------------------------------- */
/* 4. Baseline Human Review Decisions (Audit Trail)                           */
/* -------------------------------------------------------------------------- */
export const INITIAL_INSTRUCTION_REVIEWS: InstructionReviewRecord[] = [
  {
    id: "rev-001",
    instructionId: "inst-001",
    versionNumber: 1,
    patientId: "patient-profile-001",
    reviewerId: "member-vance",
    reviewerName: "Dr. Eleanor Vance, MD",
    reviewerRole: "Attending Cardiologist",
    decision: "verified",
    rationale: "Discharge instructions match hospital inpatient summary DISCH-STJUDE-2026-8819.",
    checklistNotes: "Verified medication name, dosage form, and withholding bounds.",
    decidedAt: "2026-01-21T14:30:00Z",
  },
  {
    id: "rev-002",
    instructionId: "inst-001",
    versionNumber: 2,
    patientId: "patient-profile-001",
    reviewerId: "member-vance",
    reviewerName: "Dr. Eleanor Vance, MD",
    reviewerRole: "Attending Cardiologist",
    decision: "verified",
    rationale: "Approved threshold reduction to 100 mmHg and addition of 55 bpm pulse check. Prevents inappropriate dose omission.",
    checklistNotes: "Checked against resting ECG and home vitals trends.",
    decidedAt: "2026-02-12T11:30:00Z",
  },
  {
    id: "rev-003",
    instructionId: "inst-006",
    versionNumber: 1,
    patientId: "patient-profile-001",
    reviewerId: "member-vance",
    reviewerName: "Dr. Eleanor Vance, MD",
    reviewerRole: "Attending Cardiologist",
    decision: "rejected",
    rationale: "Herbal hawthorn extract has documented negative inotropic and additive hypotensive interactions with ACE inhibitors and beta-blockers.",
    checklistNotes: "Drug interaction database cross-reference completed.",
    decidedAt: "2026-02-06T11:15:00Z",
  },
];

/* -------------------------------------------------------------------------- */
/* 5. Mutable Cache & Engine Services                                         */
/* -------------------------------------------------------------------------- */
let cachedInstructions: CareInstruction[] = [...INITIAL_CARE_INSTRUCTIONS];
let cachedSources: InstructionSource[] = [...INITIAL_INSTRUCTION_SOURCES];
let cachedVersions: CareInstructionVersion[] = [...INITIAL_INSTRUCTION_VERSIONS];
let cachedReviews: InstructionReviewRecord[] = [...INITIAL_INSTRUCTION_REVIEWS];

export function getCachedInstructions(): CareInstruction[] {
  return cachedInstructions;
}

export function getCachedInstructionSources(): InstructionSource[] {
  return cachedSources;
}

export function getCachedInstructionVersions(): CareInstructionVersion[] {
  return cachedVersions;
}

export function getCachedInstructionReviews(): InstructionReviewRecord[] {
  return cachedReviews;
}

export function addInstructionSource(source: InstructionSource): void {
  cachedSources.unshift(source);
}

export function addCareInstruction(instruction: CareInstruction): void {
  // Populate source if present
  if (instruction.sourceId && !instruction.source) {
    instruction.source = cachedSources.find((s) => s.id === instruction.sourceId);
  }

  cachedInstructions.unshift(instruction);

  // Initialize Version 1 record in immutable history
  const v1: CareInstructionVersion = {
    id: `ver-${instruction.id}-v1`,
    instructionId: instruction.id,
    patientId: instruction.patientId,
    versionNumber: 1,
    title: instruction.title,
    category: instruction.category,
    description: instruction.description,
    structuredContent: instruction.structuredContent,
    verificationStatus: instruction.verificationStatus,
    sourceId: instruction.sourceId,
    source: instruction.source,
    effectiveDate: instruction.effectiveDate,
    expirationDate: instruction.expirationDate,
    tags: instruction.tags,
    relatedMedicationId: instruction.relatedMedicationId,
    relatedAppointmentId: instruction.relatedAppointmentId,
    relatedTaskId: instruction.relatedTaskId,
    changeReason: "Initial instruction creation in CARETRACE vault.",
    changedFields: ["title", "description", "category", "sourceId"],
    editorId: instruction.createdBy,
    editorName: instruction.createdByName,
    editorRole: instruction.createdByRole,
    createdAt: instruction.createdAt,
  };

  cachedVersions.unshift(v1);
}

/**
 * Creates a new version of an instruction when edited.
 * CRITICAL SAFETY RULE: Editing resets verificationStatus to 'awaiting_verification'
 * so that edits never silently inherit previous verified status.
 */
export function createNewInstructionVersion(
  instructionId: string,
  data: {
    title: string;
    category: CareInstruction["category"];
    description: string;
    sourceId: string;
    changeReason: string;
    effectiveDate?: string;
    expirationDate?: string;
    tags?: string[];
    structuredContent?: CareInstruction["structuredContent"];
    relatedMedicationId?: string;
    relatedAppointmentId?: string;
    relatedTaskId?: string;
  },
  editor: {
    id: string;
    name: string;
    role: string;
  }
): CareInstruction | null {
  const instruction = cachedInstructions.find((i) => i.id === instructionId);
  if (!instruction) return null;

  const nextVersionNumber = instruction.currentVersionNumber + 1;
  const source = cachedSources.find((s) => s.id === data.sourceId);

  // Identify changed fields
  const changedFields: string[] = [];
  if (data.title !== instruction.title) changedFields.push("title");
  if (data.category !== instruction.category) changedFields.push("category");
  if (data.description !== instruction.description) changedFields.push("description");
  if (data.sourceId !== instruction.sourceId) changedFields.push("sourceId");
  if (data.effectiveDate !== instruction.effectiveDate) changedFields.push("effectiveDate");

  // Reset verification status: a modified version MUST NOT inherit verified status!
  instruction.currentVersionNumber = nextVersionNumber;
  instruction.title = data.title;
  instruction.category = data.category;
  instruction.description = data.description;
  instruction.sourceId = data.sourceId;
  instruction.source = source;
  instruction.verificationStatus = "awaiting_verification";
  instruction.verifiedBy = undefined;
  instruction.verifiedByName = undefined;
  instruction.verifiedAt = undefined;
  instruction.verificationRationale = undefined;
  instruction.effectiveDate = data.effectiveDate;
  instruction.expirationDate = data.expirationDate;
  if (data.tags) instruction.tags = data.tags;
  if (data.structuredContent) instruction.structuredContent = data.structuredContent;
  if (data.relatedMedicationId !== undefined) instruction.relatedMedicationId = data.relatedMedicationId;
  if (data.relatedAppointmentId !== undefined) instruction.relatedAppointmentId = data.relatedAppointmentId;
  if (data.relatedTaskId !== undefined) instruction.relatedTaskId = data.relatedTaskId;
  instruction.updatedAt = new Date().toISOString();

  // Create immutable version record
  const newVersionRecord: CareInstructionVersion = {
    id: `ver-${instruction.id}-v${nextVersionNumber}`,
    instructionId: instruction.id,
    patientId: instruction.patientId,
    versionNumber: nextVersionNumber,
    title: instruction.title,
    category: instruction.category,
    description: instruction.description,
    structuredContent: instruction.structuredContent,
    verificationStatus: "awaiting_verification",
    sourceId: instruction.sourceId,
    source: instruction.source,
    effectiveDate: instruction.effectiveDate,
    expirationDate: instruction.expirationDate,
    tags: instruction.tags,
    relatedMedicationId: instruction.relatedMedicationId,
    relatedAppointmentId: instruction.relatedAppointmentId,
    relatedTaskId: instruction.relatedTaskId,
    changeReason: data.changeReason,
    changedFields,
    editorId: editor.id,
    editorName: editor.name,
    editorRole: editor.role,
    createdAt: new Date().toISOString(),
  };

  cachedVersions.unshift(newVersionRecord);
  return instruction;
}

/**
 * Human Verification or Rejection of an instruction.
 * Must require an explicit authorized human action.
 */
export function reviewInstruction(
  instructionId: string,
  decision: "verified" | "rejected",
  rationale: string,
  reviewer: {
    id: string;
    name: string;
    role: string;
  },
  checklistNotes?: string
): CareInstruction | null {
  const instruction = cachedInstructions.find((i) => i.id === instructionId);
  if (!instruction) return null;

  instruction.verificationStatus = decision;
  const now = new Date().toISOString();

  if (decision === "verified") {
    instruction.verifiedBy = reviewer.id;
    instruction.verifiedByName = reviewer.name;
    instruction.verifiedByRole = reviewer.role;
    instruction.verifiedAt = now;
    instruction.verificationRationale = rationale;
    instruction.rejectedBy = undefined;
    instruction.rejectedByName = undefined;
    instruction.rejectedAt = undefined;
    instruction.rejectionRationale = undefined;
  } else {
    instruction.rejectedBy = reviewer.id;
    instruction.rejectedByName = reviewer.name;
    instruction.rejectedAt = now;
    instruction.rejectionRationale = rationale;
  }
  instruction.updatedAt = now;

  // Update current version in version history
  const currentVer = cachedVersions.find(
    (v) => v.instructionId === instructionId && v.versionNumber === instruction.currentVersionNumber
  );
  if (currentVer) {
    currentVer.verificationStatus = decision;
    if (decision === "verified") {
      currentVer.verifiedBy = reviewer.id;
      currentVer.verifiedByName = reviewer.name;
      currentVer.verifiedAt = now;
      currentVer.verificationRationale = rationale;
    }
  }

  // Record review decision in immutable log
  cachedReviews.unshift({
    id: `rev-${Date.now()}`,
    instructionId: instruction.id,
    versionNumber: instruction.currentVersionNumber,
    patientId: instruction.patientId,
    reviewerId: reviewer.id,
    reviewerName: reviewer.name,
    reviewerRole: reviewer.role,
    decision,
    rationale,
    checklistNotes,
    decidedAt: now,
  });

  return instruction;
}

/**
 * Archives or supersedes an instruction.
 * Historical versions are never deleted.
 */
export function archiveInstruction(
  instructionId: string,
  archiveReason: string
): CareInstruction | null {
  const instruction = cachedInstructions.find((i) => i.id === instructionId);
  if (!instruction) return null;

  instruction.verificationStatus = "archived";
  instruction.archivedAt = new Date().toISOString();
  instruction.archiveReason = archiveReason;
  instruction.updatedAt = new Date().toISOString();

  return instruction;
}

/**
 * Deterministic version comparison helper.
 * Compares two versions of an instruction without inferring clinical conclusions.
 */
export function compareInstructionVersions(
  instructionId: string,
  vA: number,
  vB: number
): {
  versionA: CareInstructionVersion | null;
  versionB: CareInstructionVersion | null;
  differences: Array<{ field: string; prev: any; next: any; changed: boolean }>;
} {
  const versionA = cachedVersions.find(
    (v) => v.instructionId === instructionId && v.versionNumber === vA
  ) || null;
  const versionB = cachedVersions.find(
    (v) => v.instructionId === instructionId && v.versionNumber === vB
  ) || null;

  if (!versionA || !versionB) {
    return { versionA, versionB, differences: [] };
  }

  const fieldsToCheck = [
    "title",
    "category",
    "description",
    "sourceId",
    "verificationStatus",
    "effectiveDate",
    "expirationDate",
  ];

  const differences = fieldsToCheck.map((f) => {
    const valA = (versionA as any)[f];
    const valB = (versionB as any)[f];
    return {
      field: f,
      prev: valA,
      next: valB,
      changed: JSON.stringify(valA) !== JSON.stringify(valB),
    };
  });

  return { versionA, versionB, differences };
}
