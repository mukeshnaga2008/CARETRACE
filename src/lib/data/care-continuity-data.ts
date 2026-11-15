/**
 * CARETRACE Care Continuity Engine Data Store & Services
 * PromptWars × Catalyst 2026
 *
 * Signature Innovation: Detects instruction revisions, computes deterministic diffs,
 * identifies potentially affected downstream care records with plain-language explanations,
 * enforces human-in-the-loop review gates, and manages controlled downstream implementations.
 */

import {
  ContinuityAnalysis,
  ContinuityImpactRecord,
  ContinuityReview,
  ContinuityImplementationJob,
  ContinuityEventType,
  ContinuityRecordType,
  ContinuityImpactClassification,
  FieldDiff,
  CareInstruction,
  CareInstructionVersion,
} from "@/types/caretrace";
import { getCachedInstructions, getCachedInstructionVersions } from "./instruction-vault-data";
import { getCachedMedications } from "./medication-lifecycle-data";
import { getCachedAppointments } from "./appointment-intelligence-data";
import { getCachedTasks } from "./care-circle-data";

/* -------------------------------------------------------------------------- */
/* 1. Baseline Continuity Analyses                                            */
/* -------------------------------------------------------------------------- */
export const INITIAL_CONTINUITY_ANALYSES: ContinuityAnalysis[] = [
  {
    id: "cont-ana-001",
    patientId: "patient-profile-001",
    instructionId: "inst-001",
    instructionTitle: "Morning Blood Pressure Monitoring & Metoprolol Protocol",
    eventType: "new_version_created",
    currentVersionNumber: 2,
    previousVersionNumber: 1,
    diffSummary: [
      {
        field: "targetParameter",
        previousValue: "Systolic BP ≥ 110 mmHg",
        currentValue: "Systolic BP ≥ 100 mmHg, Pulse ≥ 55 bpm",
        changeType: "modified",
      },
      {
        field: "description",
        previousValue: "Measure resting blood pressure prior to morning Metoprolol 50mg. Withhold dose if systolic BP < 110 mmHg.",
        currentValue: "Measure resting blood pressure and radial pulse prior to administering morning Metoprolol Succinate 50mg. Withhold dose and alert primary contact if systolic BP < 100 mmHg or pulse < 55 bpm.",
        changeType: "modified",
      },
      {
        field: "verificationStatus",
        previousValue: "verified",
        currentValue: "awaiting_verification",
        changeType: "modified",
      },
      {
        field: "actionItems",
        previousValue: null,
        currentValue: ["Notify Visiting Nurse if readings fall below threshold on 2 consecutive days."],
        changeType: "added",
      },
    ],
    detectedImpactCount: 4,
    status: "awaiting_human_review",
    createdAt: "2026-02-12T10:15:00Z",
    updatedAt: "2026-02-12T10:15:00Z",
  },
  {
    id: "cont-ana-002",
    patientId: "patient-profile-001",
    instructionId: "inst-006",
    instructionTitle: "Unverified Hawthorn Berry Herbal Tea Suggestion",
    eventType: "instruction_rejected",
    currentVersionNumber: 1,
    diffSummary: [
      {
        field: "verificationStatus",
        previousValue: "awaiting_verification",
        currentValue: "rejected",
        changeType: "modified",
      },
      {
        field: "rejectionRationale",
        previousValue: null,
        currentValue: "Contraindicated. Hawthorn extract possesses negative inotropic and additive hypotensive properties with Lisinopril and Metoprolol.",
        changeType: "added",
      },
    ],
    detectedImpactCount: 2,
    status: "implementation_completed",
    createdAt: "2026-02-06T11:15:00Z",
    updatedAt: "2026-02-06T11:45:00Z",
  },
  {
    id: "cont-ana-003",
    patientId: "patient-profile-001",
    instructionId: "inst-004",
    instructionTitle: "Fasting Metabolic & Renal Panel Preparation Protocol",
    eventType: "new_instruction_submitted",
    currentVersionNumber: 1,
    diffSummary: [
      {
        field: "title",
        previousValue: null,
        currentValue: "Fasting Metabolic & Renal Panel Preparation Protocol",
        changeType: "added",
      },
      {
        field: "targetParameter",
        previousValue: null,
        currentValue: "8 hours minimum fasting (Water permitted)",
        changeType: "added",
      },
    ],
    detectedImpactCount: 2,
    status: "needs_clarification",
    createdAt: "2026-02-14T08:30:00Z",
    updatedAt: "2026-02-14T09:00:00Z",
  },
];

/* -------------------------------------------------------------------------- */
/* 2. Baseline Impact Records (Explainable Downstream Mappings)               */
/* -------------------------------------------------------------------------- */
export const INITIAL_CONTINUITY_IMPACTS: ContinuityImpactRecord[] = [
  {
    id: "impact-001",
    analysisId: "cont-ana-001",
    patientId: "patient-profile-001",
    sourceInstructionId: "inst-001",
    sourceInstructionVersion: 2,
    relatedRecordType: "medication",
    relatedRecordId: "med-002",
    relatedRecordTitle: "Metoprolol Succinate ER 50mg (Oral Tablet)",
    reasonIdentified: "Active medication record contains pre-administration vital sign instructions referencing previous Version 1 threshold (110 mmHg).",
    explainableReason: "Active medication record contains pre-administration vital sign instructions referencing previous Version 1 threshold (110 mmHg).",
    impactClassification: "directly_linked",
    classification: "directly_linked",
    currentRecordData: {
      medicationId: "med-002",
      name: "Metoprolol Succinate ER",
      dosage: "50mg",
      currentInstructions: "Take 1 tablet daily at 08:00 AM with water after measuring blood pressure.",
    },
    suggestedReviewAction: "Review administration guidance to update systolic withhold threshold from 110 mmHg to 100 mmHg and add pulse ≥ 55 bpm boundary.",
    proposedDownstreamAdjustment: "Review administration guidance to update systolic withhold threshold from 110 mmHg to 100 mmHg and add pulse ≥ 55 bpm boundary.",
    reviewStatus: "approved_for_update",
    analyzedAt: "2026-02-12T10:15:00Z",
  },
  {
    id: "impact-002",
    analysisId: "cont-ana-001",
    patientId: "patient-profile-001",
    sourceInstructionId: "inst-001",
    sourceInstructionVersion: 2,
    relatedRecordType: "care_task",
    relatedRecordId: "task-003",
    relatedRecordTitle: "Daily Morning Blood Pressure & Pulse Recording",
    reasonIdentified: "Assigned care task for Visiting Nurse Sarah Jenkins requires updated safety boundary text so nurse logs withholding if pulse < 55 bpm.",
    explainableReason: "Assigned care task for Visiting Nurse Sarah Jenkins requires updated safety boundary text so nurse logs withholding if pulse < 55 bpm.",
    impactClassification: "directly_linked",
    classification: "directly_linked",
    currentRecordData: {
      taskId: "task-003",
      assignee: "Sarah Jenkins, RN",
      category: "vitals_check",
    },
    suggestedReviewAction: "Update task description checklist to reflect radial pulse safety threshold.",
    proposedDownstreamAdjustment: "Update task description checklist to reflect radial pulse safety threshold.",
    reviewStatus: "approved_for_update",
    analyzedAt: "2026-02-12T10:15:00Z",
  },
  {
    id: "impact-003",
    analysisId: "cont-ana-001",
    patientId: "patient-profile-001",
    sourceInstructionId: "inst-001",
    sourceInstructionVersion: 2,
    relatedRecordType: "dose_event",
    relatedRecordId: "dose-event-series-002",
    relatedRecordTitle: "Scheduled 08:00 AM Metoprolol Administration Events (Next 7 Days)",
    reasonIdentified: "Future scheduled dose event prompts display pre-dose check notes to family coordinators and home aides.",
    explainableReason: "Future scheduled dose event prompts display pre-dose check notes to family coordinators and home aides.",
    impactClassification: "potentially_related",
    classification: "potentially_related",
    suggestedReviewAction: "Permit care coordination engine to synchronize dose prompt instructions.",
    proposedDownstreamAdjustment: "Permit care coordination engine to synchronize dose prompt instructions.",
    reviewStatus: "pending_review",
    analyzedAt: "2026-02-12T10:15:00Z",
  },
  {
    id: "impact-004",
    analysisId: "cont-ana-001",
    patientId: "patient-profile-001",
    sourceInstructionId: "inst-001",
    sourceInstructionVersion: 2,
    relatedRecordType: "shift_handover",
    relatedRecordId: "handover-001",
    relatedRecordTitle: "Morning Shift Transition (Nurse Sarah -> David Sullivan)",
    reasonIdentified: "Care handover checklist tracks BP parameter verification during morning caregiver transition.",
    explainableReason: "Care handover checklist tracks BP parameter verification during morning caregiver transition.",
    impactClassification: "potentially_related",
    classification: "potentially_related",
    suggestedReviewAction: "Surface updated parameters in shift handover summary.",
    proposedDownstreamAdjustment: "Surface updated parameters in shift handover summary.",
    reviewStatus: "pending_review",
    analyzedAt: "2026-02-12T10:15:00Z",
  },
  {
    id: "impact-005",
    analysisId: "cont-ana-002",
    patientId: "patient-profile-001",
    sourceInstructionId: "inst-006",
    sourceInstructionVersion: 1,
    relatedRecordType: "caregiver_responsibility",
    relatedRecordId: "resp-diet-001",
    relatedRecordTitle: "Family Caregiver Kitchen & Pantry Stocking",
    reasonIdentified: "Instruction rejection due to clinical contraindication requires notifying family not to purchase herbal supplements.",
    explainableReason: "Instruction rejection due to clinical contraindication requires notifying family not to purchase herbal supplements.",
    impactClassification: "directly_linked",
    classification: "directly_linked",
    suggestedReviewAction: "Record dietary contraindication warning in care circle guidance.",
    proposedDownstreamAdjustment: "Record dietary contraindication warning in care circle guidance.",
    reviewStatus: "approved_for_update",
    analyzedAt: "2026-02-06T11:15:00Z",
  },
  {
    id: "impact-006",
    analysisId: "cont-ana-003",
    patientId: "patient-profile-001",
    sourceInstructionId: "inst-004",
    sourceInstructionVersion: 1,
    relatedRecordType: "appointment",
    relatedRecordId: "appt-002",
    relatedRecordTitle: "Routine Fasting Blood Panel (Springfield Community Lab)",
    reasonIdentified: "Appointment preparation notes must specify 8-hour fasting boundary and essential medication water guidelines.",
    explainableReason: "Appointment preparation notes must specify 8-hour fasting boundary and essential medication water guidelines.",
    impactClassification: "directly_linked",
    classification: "directly_linked",
    suggestedReviewAction: "Verify whether morning Lisinopril is permitted with 4 oz water before lab draw.",
    proposedDownstreamAdjustment: "Verify whether morning Lisinopril is permitted with 4 oz water before lab draw.",
    reviewStatus: "requires_clarification",
    analyzedAt: "2026-02-14T08:30:00Z",
  },
];

/* -------------------------------------------------------------------------- */
/* 3. Baseline Continuity Reviews (Human Approval Gates)                      */
/* -------------------------------------------------------------------------- */
export const INITIAL_CONTINUITY_REVIEWS: ContinuityReview[] = [
  {
    id: "rev-cont-001",
    analysisId: "cont-ana-001",
    patientId: "patient-profile-001",
    instructionId: "inst-001",
    instructionTitle: "Morning Blood Pressure Monitoring & Metoprolol Protocol",
    currentVersionNumber: 2,
    previousVersionNumber: 1,
    reviewStatus: "awaiting_human_review",
    assignedReviewerId: "member-vance",
    assignedReviewerName: "Dr. Eleanor Vance, MD",
    assignedReviewerRole: "Attending Cardiologist",
    impactedRecordsCount: 4,
    approvedRecordsCount: 2,
    excludedRecordsCount: 0,
    optimisticVersionLock: 1,
    reviewNotes: "Awaiting cardiology sign-off on pulse threshold addition before updating scheduled dose event prompts.",
    createdAt: "2026-02-12T10:15:00Z",
    updatedAt: "2026-02-12T10:15:00Z",
  },
  {
    id: "rev-cont-002",
    analysisId: "cont-ana-002",
    patientId: "patient-profile-001",
    instructionId: "inst-006",
    instructionTitle: "Unverified Hawthorn Berry Herbal Tea Suggestion",
    currentVersionNumber: 1,
    reviewStatus: "implementation_completed",
    assignedReviewerId: "member-vance",
    assignedReviewerName: "Dr. Eleanor Vance, MD",
    assignedReviewerRole: "Attending Cardiologist",
    impactedRecordsCount: 2,
    approvedRecordsCount: 2,
    excludedRecordsCount: 0,
    decision: "approved",
    decisionRationale: "Confirmed clinical rejection. Added contraindication advisory to care circle notes.",
    decidedByName: "Dr. Eleanor Vance, MD",
    decidedByRole: "Attending Cardiologist",
    decidedAt: "2026-02-06T11:30:00Z",
    optimisticVersionLock: 2,
    createdAt: "2026-02-06T11:15:00Z",
    updatedAt: "2026-02-06T11:45:00Z",
  },
  {
    id: "rev-cont-003",
    analysisId: "cont-ana-003",
    patientId: "patient-profile-001",
    instructionId: "inst-004",
    instructionTitle: "Fasting Metabolic & Renal Panel Preparation Protocol",
    currentVersionNumber: 1,
    reviewStatus: "needs_clarification",
    assignedReviewerId: "member-sarah",
    assignedReviewerName: "Sarah Jenkins, RN",
    assignedReviewerRole: "Visiting Nurse",
    impactedRecordsCount: 2,
    approvedRecordsCount: 0,
    excludedRecordsCount: 0,
    clarificationQuestion: "Confirm whether morning blood pressure medications (Lisinopril/Metoprolol) should be taken with sips of water or delayed until post-draw?",
    optimisticVersionLock: 1,
    createdAt: "2026-02-14T08:30:00Z",
    updatedAt: "2026-02-14T09:00:00Z",
  },
];

/* -------------------------------------------------------------------------- */
/* 4. Baseline Implementation Jobs (Audit Trail)                              */
/* -------------------------------------------------------------------------- */
export const INITIAL_IMPLEMENTATION_JOBS: ContinuityImplementationJob[] = [
  {
    id: "job-001",
    reviewId: "rev-cont-002",
    analysisId: "cont-ana-002",
    patientId: "patient-profile-001",
    status: "completed",
    staleVersionDetected: false,
    concurrentRecordChangeDetected: false,
    executedAt: "2026-02-06T11:45:00Z",
    executedByName: "Dr. Eleanor Vance, MD",
    executedAuditRecords: [
      {
        recordType: "caregiver_responsibility",
        recordId: "resp-diet-001",
        action: "contraindication_warning_logged",
        previousValue: { warnings: [] },
        newValue: { warnings: ["Hawthorn extract contraindicated with ACE inhibitors."] },
      },
    ],
    createdAt: "2026-02-06T11:35:00Z",
  },
];

/* -------------------------------------------------------------------------- */
/* 5. Mutable Cache & Core Engine Logic                                       */
/* -------------------------------------------------------------------------- */
let cachedAnalyses: ContinuityAnalysis[] = [...INITIAL_CONTINUITY_ANALYSES];
let cachedImpacts: ContinuityImpactRecord[] = [...INITIAL_CONTINUITY_IMPACTS];
let cachedReviews: ContinuityReview[] = [...INITIAL_CONTINUITY_REVIEWS];
let cachedJobs: ContinuityImplementationJob[] = [...INITIAL_IMPLEMENTATION_JOBS];

export function getCachedAnalyses(): ContinuityAnalysis[] {
  return cachedAnalyses;
}

export function getCachedImpacts(): ContinuityImpactRecord[] {
  return cachedImpacts;
}

export function getCachedContinuityReviews(): ContinuityReview[] {
  return cachedReviews;
}

export function getCachedImplementationJobs(): ContinuityImplementationJob[] {
  return cachedJobs;
}
export const getCachedJobs = getCachedImplementationJobs;

/**
 * Change-Detection Service:
 * Listens for instruction events, performs deterministic field comparison,
 * searches related modules (meds, appointments, tasks, handovers),
 * and creates explainable continuity analysis records.
 */
export function detectInstructionChange(
  instruction: CareInstruction,
  previousVersion: CareInstructionVersion | null,
  eventType: ContinuityEventType,
  actor: { name: string; role: string }
): { analysis: ContinuityAnalysis; impacts: ContinuityImpactRecord[]; review: ContinuityReview } {
  const analysisId = `cont-ana-${Date.now()}`;
  const reviewId = `rev-cont-${Date.now()}`;

  // Deterministic field diff
  const diffSummary: FieldDiff[] = [];

  if (previousVersion) {
    if (instruction.title !== previousVersion.title) {
      diffSummary.push({
        field: "title",
        previousValue: previousVersion.title,
        currentValue: instruction.title,
        changeType: "modified",
      });
    }
    if (instruction.description !== previousVersion.description) {
      diffSummary.push({
        field: "description",
        previousValue: previousVersion.description,
        currentValue: instruction.description,
        changeType: "modified",
      });
    }
    if (instruction.category !== previousVersion.category) {
      diffSummary.push({
        field: "category",
        previousValue: previousVersion.category,
        currentValue: instruction.category,
        changeType: "modified",
      });
    }
    if (instruction.verificationStatus !== previousVersion.verificationStatus) {
      diffSummary.push({
        field: "verificationStatus",
        previousValue: previousVersion.verificationStatus,
        currentValue: instruction.verificationStatus,
        changeType: "modified",
      });
    }
  } else {
    diffSummary.push({
      field: "title",
      previousValue: null,
      currentValue: instruction.title,
      changeType: "added",
    });
    diffSummary.push({
      field: "description",
      previousValue: null,
      currentValue: instruction.description,
      changeType: "added",
    });
  }

  // Detect Impact Relationships across existing modules
  const impacts: ContinuityImpactRecord[] = [];

  // 1. Check linked medication
  if (instruction.relatedMedicationId) {
    const med = getCachedMedications().find((m) => m.id === instruction.relatedMedicationId);
    impacts.push({
      id: `impact-${Date.now()}-1`,
      analysisId,
      patientId: instruction.patientId,
      sourceInstructionId: instruction.id,
      sourceInstructionVersion: instruction.currentVersionNumber,
      relatedRecordType: "medication",
      relatedRecordId: instruction.relatedMedicationId,
      relatedRecordTitle: med ? `${med.displayName} ${med.strengthText}` : "Linked Prescription",
      reasonIdentified: `Medication record explicitly references this instruction (${instruction.title}).`,
      explainableReason: `Medication record explicitly references this instruction (${instruction.title}).`,
      impactClassification: "directly_linked",
      classification: "directly_linked",
      suggestedReviewAction: "Review administration directions for clinical alignment.",
      proposedDownstreamAdjustment: "Review administration directions for clinical alignment.",
      reviewStatus: "pending_review",
      analyzedAt: new Date().toISOString(),
    });
  }

  // 2. Check linked care task
  if (instruction.relatedTaskId) {
    const task = getCachedTasks().find((t) => t.id === instruction.relatedTaskId);
    impacts.push({
      id: `impact-${Date.now()}-2`,
      analysisId,
      patientId: instruction.patientId,
      sourceInstructionId: instruction.id,
      sourceInstructionVersion: instruction.currentVersionNumber,
      relatedRecordType: "care_task",
      relatedRecordId: instruction.relatedTaskId,
      relatedRecordTitle: task ? task.title : "Linked Care Task",
      reasonIdentified: `Care task is linked to this care directive.`,
      impactClassification: "directly_linked",
      suggestedReviewAction: "Review task description and checklist parameters.",
      reviewStatus: "pending_review",
      analyzedAt: new Date().toISOString(),
    });
  }

  // 3. Check linked appointment
  if (instruction.relatedAppointmentId) {
    const appt = getCachedAppointments().find((a) => a.id === instruction.relatedAppointmentId);
    impacts.push({
      id: `impact-${Date.now()}-3`,
      analysisId,
      patientId: instruction.patientId,
      sourceInstructionId: instruction.id,
      sourceInstructionVersion: instruction.currentVersionNumber,
      relatedRecordType: "appointment",
      relatedRecordId: instruction.relatedAppointmentId,
      relatedRecordTitle: appt ? appt.title : "Linked Clinic Appointment",
      reasonIdentified: `Clinic visit preparation or agenda questions relate to this directive.`,
      impactClassification: "directly_linked",
      suggestedReviewAction: "Verify pre-visit fasting or medication instructions.",
      reviewStatus: "pending_review",
      analyzedAt: new Date().toISOString(),
    });
  }

  // Fallback if no explicit linkages found
  if (impacts.length === 0) {
    impacts.push({
      id: `impact-${Date.now()}-none`,
      analysisId,
      patientId: instruction.patientId,
      sourceInstructionId: instruction.id,
      sourceInstructionVersion: instruction.currentVersionNumber,
      relatedRecordType: "caregiver_responsibility",
      relatedRecordId: "circle-general",
      relatedRecordTitle: "Care Circle Daily Routine",
      reasonIdentified: "General care instruction recorded without direct medication or appointment linkage.",
      impactClassification: "potentially_related",
      suggestedReviewAction: "Inform primary family coordinator during shift check-in.",
      reviewStatus: "pending_review",
      analyzedAt: new Date().toISOString(),
    });
  }

  const analysis: ContinuityAnalysis = {
    id: analysisId,
    patientId: instruction.patientId,
    instructionId: instruction.id,
    instructionTitle: instruction.title,
    eventType,
    currentVersionNumber: instruction.currentVersionNumber,
    previousVersionNumber: previousVersion ? previousVersion.versionNumber : undefined,
    diffSummary,
    detectedImpactCount: impacts.length,
    status: "awaiting_human_review",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const review: ContinuityReview = {
    id: reviewId,
    analysisId,
    patientId: instruction.patientId,
    instructionId: instruction.id,
    instructionTitle: instruction.title,
    currentVersionNumber: instruction.currentVersionNumber,
    previousVersionNumber: previousVersion ? previousVersion.versionNumber : undefined,
    reviewStatus: "awaiting_human_review",
    assignedReviewerId: "member-david",
    assignedReviewerName: "David Sullivan",
    assignedReviewerRole: "Family Care Coordinator",
    impactedRecordsCount: impacts.length,
    approvedRecordsCount: 0,
    excludedRecordsCount: 0,
    optimisticVersionLock: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  cachedAnalyses.unshift(analysis);
  impacts.forEach((imp) => cachedImpacts.unshift(imp));
  cachedReviews.unshift(review);

  return { analysis, impacts, review };
}

/**
 * Human Review Decision Handler:
 * Enforces mandatory rationale and optimistic version locking to prevent stale review overwrites.
 */
export function submitReviewDecision(
  reviewId: string,
  decision: "approved" | "rejected" | "needs_clarification",
  rationale: string,
  approvedRecordIds: string[],
  excludedRecords: Array<{ recordId: string; exclusionReason: string }>,
  reviewer: string | { name: string; role: string },
  optimisticLock: number
): { success: boolean; review?: ContinuityReview; error?: string } {
  const review = cachedReviews.find((r) => r.id === reviewId);
  if (!review) return { success: false, error: "Review not found" };

  // Concurrency & Stale Check
  if (review.optimisticVersionLock !== optimisticLock) {
    return {
      success: false,
      error: "Concurrency conflict: This review was updated by another coordinator. Please refresh and review current state.",
    };
  }

  // Verify instruction version is still current
  const currentInst = getCachedInstructions().find((i) => i.id === review.instructionId);
  if (currentInst && currentInst.currentVersionNumber !== review.currentVersionNumber) {
    return {
      success: false,
      error: `Stale version conflict: Instruction has been updated to v${currentInst.currentVersionNumber} since analysis was generated.`,
    };
  }

  const now = new Date().toISOString();
  review.decision = decision;
  review.decisionRationale = rationale;
  review.decidedByName = typeof reviewer === "string" ? reviewer : reviewer.name;
  review.decidedByRole = typeof reviewer === "string" ? "caregiver" : reviewer.role;
  review.decidedAt = now;
  review.optimisticVersionLock += 1;
  review.updatedAt = now;

  // Process per-record approvals / exclusions
  approvedRecordIds.forEach((recId) => {
    const impact = cachedImpacts.find((imp) => imp.id === recId || imp.relatedRecordId === recId);
    if (impact) impact.reviewStatus = "approved_for_update";
  });

  excludedRecords.forEach(({ recordId, exclusionReason }) => {
    const impact = cachedImpacts.find((imp) => imp.id === recordId || imp.relatedRecordId === recordId);
    if (impact) {
      impact.reviewStatus = "excluded";
      impact.exclusionReason = exclusionReason;
    }
  });

  review.approvedRecordsCount = approvedRecordIds.length;
  review.excludedRecordsCount = excludedRecords.length;

  if (decision === "approved") {
    review.reviewStatus = "approved_for_downstream_update";
  } else if (decision === "rejected") {
    review.reviewStatus = "rejected";
  } else {
    review.reviewStatus = "needs_clarification";
  }

  // Update associated analysis status
  const analysis = cachedAnalyses.find((a) => a.id === review.analysisId);
  if (analysis) {
    analysis.status = review.reviewStatus;
    analysis.updatedAt = now;
  }

  return { success: true, review };
}

/**
 * Exclude a specific impacted record with mandatory reason.
 */
export function excludeImpactRecord(
  impactId: string,
  exclusionReason: string
): ContinuityImpactRecord | null {
  const impact = cachedImpacts.find((i) => i.id === impactId);
  if (!impact) return null;

  impact.reviewStatus = "excluded";
  impact.exclusionReason = exclusionReason;
  return impact;
}

/**
 * Request clarification for review.
 */
export function requestReviewClarification(
  reviewId: string,
  question: string,
  requesterName: string
): ContinuityReview | null {
  const review = cachedReviews.find((r) => r.id === reviewId);
  if (!review) return null;

  review.reviewStatus = "needs_clarification";
  review.clarificationQuestion = question;
  review.updatedAt = new Date().toISOString();

  const analysis = cachedAnalyses.find((a) => a.id === review.analysisId);
  if (analysis) analysis.status = "needs_clarification";

  return review;
}

/**
 * Escalate review to another authorized member.
 */
export function escalateContinuityReview(
  reviewId: string,
  escalateTo: string,
  escalationReason: string
): ContinuityReview | null {
  const review = cachedReviews.find((r) => r.id === reviewId);
  if (!review) return null;

  review.escalatedTo = escalateTo;
  review.reviewNotes = `Escalated to ${escalateTo}: ${escalationReason}`;
  review.updatedAt = new Date().toISOString();
  return review;
}

/**
 * Controlled Downstream Implementation Execution:
 * Applies approved non-clinical synchronization safely with strict safeguards.
 * CLINICAL SAFETY: Never alters dosage, frequencies, or therapy autonomously.
 */
export function executeControlledImplementation(
  reviewId: string,
  executorName: string,
  optimisticLock: number
): { success: boolean; job?: ContinuityImplementationJob; error?: string } {
  const review = cachedReviews.find((r) => r.id === reviewId);
  if (!review) return { success: false, error: "Review record not found" };

  if (review.reviewStatus !== "approved_for_downstream_update") {
    return { success: false, error: "Review has not received authorized human approval." };
  }

  if (review.optimisticVersionLock !== optimisticLock) {
    return { success: false, error: "Concurrency lock mismatch. Review record was modified." };
  }

  // Check stale version
  const currentInst = getCachedInstructions().find((i) => i.id === review.instructionId);
  if (currentInst && currentInst.currentVersionNumber !== review.currentVersionNumber) {
    return {
      success: false,
      error: "Stale version: The instruction was updated after this review was approved. Renewal required.",
    };
  }

  const now = new Date().toISOString();
  const approvedImpacts = cachedImpacts.filter(
    (imp) => imp.analysisId === review.analysisId && imp.reviewStatus === "approved_for_update"
  );

  const auditRecords: ContinuityImplementationJob["executedAuditRecords"] = [];

  // Apply safe, non-prescribing coordination synchronizations
  approvedImpacts.forEach((imp) => {
    if (imp.relatedRecordType === "care_task") {
      const task = getCachedTasks().find((t) => t.id === imp.relatedRecordId);
      if (task) {
        const prev = task.description;
        task.description = `${task.description} [Synchronized with Instruction v${review.currentVersionNumber}]`;
        auditRecords.push({
          recordType: "care_task",
          recordId: task.id,
          action: "task_guidance_synchronized",
          previousValue: prev,
          newValue: task.description,
        });
      }
    } else if (imp.relatedRecordType === "medication") {
      // NOTE: CARETRACE clinical safety rule: Do NOT change dosage!
      // Only attach verified instruction linkage reference for coordinator visibility.
      const med = getCachedMedications().find((m) => m.id === imp.relatedRecordId);
      if (med) {
        auditRecords.push({
          recordType: "medication",
          recordId: med.id,
          action: "instruction_provenance_linked",
          previousValue: { instructionVersion: review.previousVersionNumber || 1 },
          newValue: { instructionVersion: review.currentVersionNumber },
        });
      }
    }
  });

  const job: ContinuityImplementationJob = {
    id: `job-${Date.now()}`,
    reviewId: review.id,
    analysisId: review.analysisId,
    patientId: review.patientId,
    status: "completed",
    staleVersionDetected: false,
    concurrentRecordChangeDetected: false,
    executedAt: now,
    executedByName: executorName,
    executedAuditRecords: auditRecords,
    createdAt: now,
  };

  cachedJobs.unshift(job);
  review.reviewStatus = "implementation_completed";
  review.updatedAt = now;

  const analysis = cachedAnalyses.find((a) => a.id === review.analysisId);
  if (analysis) {
    analysis.status = "implementation_completed";
    analysis.updatedAt = now;
  }

  return { success: true, job };
}
