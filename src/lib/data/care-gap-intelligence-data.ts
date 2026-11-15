/**
 * CARETRACE Care Gap Intelligence & Safety Radar Data Store & Engine
 * PromptWars × Catalyst 2026
 *
 * Signature Module: Connects Medication Lifecycle, Care Circle, Instruction Vault,
 * Care Continuity Engine, Appointments, and Notifications to deterministically identify,
 * explain, prioritise, track, and resolve care coordination gaps.
 *
 * STRICT CLINICAL SAFETY GUARDRAILS:
 * - Care coordination and visibility system ONLY.
 * - NEVER provides medical diagnosis or treatment recommendations.
 * - NEVER assumes unconfirmed doses were missed.
 * - NEVER assumes user-reported taken status proves ingestion.
 * - NEVER calculates, recommends, or modifies medication dosages, frequencies, or treatment.
 * - NEVER recommends extra doses or schedule changes in response to missed or skipped events.
 */

import {
  CareGapRecord,
  CareGapCategory,
  CareGapType,
  CareGapPriority,
  CareGapStatus,
  CareGapAuditEntry,
  NotificationJob,
} from "@/types/caretrace";

import { getCachedMedications, getCachedDoseEvents } from "./medication-lifecycle-data";
import { getCachedTasks, getCachedHandovers, getCachedMembers } from "./care-circle-data";
import {
  getCachedAppointments,
  getCachedPreparationItems,
  getCachedFollowUpTasks,
} from "./appointment-intelligence-data";
import { getCachedInstructions, getCachedInstructionSources } from "./instruction-vault-data";
import {
  getCachedAnalyses,
  getCachedContinuityReviews,
  getCachedJobs,
} from "./care-continuity-data";

/* -------------------------------------------------------------------------- */
/* 1. Baseline Notification Jobs                                              */
/* -------------------------------------------------------------------------- */
export const INITIAL_NOTIFICATION_JOBS: NotificationJob[] = [
  {
    id: "notif-001",
    patientId: "patient-profile-001",
    recipientName: "David Sullivan",
    recipientContact: "+1 (555) 234-5678",
    channel: "sms",
    category: "medication_due",
    title: "Morning Dose Reminder",
    body: "Reminder: Eleanor's morning Metoprolol Succinate 50mg is scheduled for 08:00 AM.",
    scheduledFor: "2026-02-15T07:45:00Z",
    status: "delivered",
    idempotencyKey: "notif-idem-001",
    retryCount: 0,
    maxRetries: 3,
    sentAt: "2026-02-15T07:45:05Z",
    deliveredAt: "2026-02-15T07:45:12Z",
    createdAt: "2026-02-15T07:45:00Z",
  },
  {
    id: "notif-002",
    patientId: "patient-profile-001",
    recipientName: "Sarah Jenkins, RN",
    recipientContact: "sarah.jenkins@carecircle.org",
    channel: "email",
    category: "instruction_review",
    title: "Continuity Review Assigned",
    body: "New clinical instruction version diff (Metoprolol protocol) awaits review.",
    scheduledFor: "2026-02-12T10:20:00Z",
    status: "delivered",
    idempotencyKey: "notif-idem-002",
    retryCount: 0,
    maxRetries: 3,
    sentAt: "2026-02-12T10:20:02Z",
    deliveredAt: "2026-02-12T10:20:15Z",
    createdAt: "2026-02-12T10:20:00Z",
  },
  {
    id: "notif-003",
    patientId: "patient-profile-001",
    recipientName: "David Sullivan",
    recipientContact: "+1 (555) 234-5678",
    channel: "sms",
    category: "care_gap",
    title: "Fasting Lab Preparation Reminder",
    body: "Reminder: Eleanor's fasting metabolic lab is scheduled for tomorrow at 09:00 AM.",
    scheduledFor: "2026-02-14T18:00:00Z",
    status: "delivered",
    idempotencyKey: "notif-idem-003",
    retryCount: 0,
    maxRetries: 3,
    sentAt: "2026-02-14T18:00:05Z",
    deliveredAt: "2026-02-14T18:00:11Z",
    createdAt: "2026-02-14T18:00:00Z",
  },
  {
    id: "notif-004",
    patientId: "patient-profile-001",
    recipientName: "David Sullivan",
    recipientContact: "+1 (555) 234-5678",
    channel: "sms",
    category: "emergency",
    title: "Medication Withholding Threshold Notice",
    body: "Alert: Morning resting systolic blood pressure was below 100 mmHg.",
    scheduledFor: "2026-02-15T08:15:00Z",
    status: "failed",
    idempotencyKey: "notif-idem-004",
    retryCount: 3,
    maxRetries: 3,
    lastError: "SMS Gateway 504 Gateway Timeout: Carrier network unreachable.",
    sentAt: "2026-02-15T08:15:02Z",
    createdAt: "2026-02-15T08:15:00Z",
  },
];

let cachedNotificationJobs: NotificationJob[] = [...INITIAL_NOTIFICATION_JOBS];

export function getCachedNotificationJobs(): NotificationJob[] {
  return cachedNotificationJobs;
}

/* -------------------------------------------------------------------------- */
/* 2. Baseline Care Gap Records                                               */
/* -------------------------------------------------------------------------- */
export const INITIAL_CARE_GAPS: CareGapRecord[] = [
  {
    id: "gap-001",
    patientId: "patient-profile-001",
    category: "medication",
    gapType: "missed_medication_event",
    title: "Missed Scheduled Dose: Metoprolol Succinate 50mg",
    explanation:
      "A scheduled 08:00 AM Metoprolol 50mg dose event was recorded as 'missed' in the adherence log. Clinical safety rule: Do NOT recommend an extra dose or alter the schedule.",
    priority: "high_priority",
    priorityReason:
      "Metoprolol is a key rate-control medication. Coordination check is required to verify patient well-being without making dosage recommendations.",
    status: "open",
    relatedRecordType: "dose_event",
    relatedRecordId: "dose-event-003",
    relatedRecordTitle: "Metoprolol Succinate ER 50mg (08:00 AM)",
    sourceModule: "medication_lifecycle",
    detectedAt: "2026-02-15T09:30:00Z",
    actionRoute: "/medications/adherence",
    actionLabel: "Inspect Adherence Log",
    deduplicationKey: "patient-profile-001_missed_medication_event_dose_event_dose-event-003",
    auditHistory: [
      {
        id: "aud-gap-001",
        timestamp: "2026-02-15T09:30:00Z",
        actorName: "Care Gap Detection Engine",
        actorRole: "System Automator",
        action: "gap_detected",
        note: "Detected missed status recorded in medication adherence log.",
        newStatus: "open",
      },
    ],
    createdAt: "2026-02-15T09:30:00Z",
    updatedAt: "2026-02-15T09:30:00Z",
  },
  {
    id: "gap-002",
    patientId: "patient-profile-001",
    category: "medication",
    gapType: "overdue_unconfirmed_event",
    title: "Unconfirmed Evening Dose: Lisinopril 10mg",
    explanation:
      "Scheduled 08:00 PM Lisinopril 10mg dose has passed its scheduled window without confirmation. Note: CARETRACE does not assume an unconfirmed event was missed.",
    priority: "attention_required",
    priorityReason:
      "Unconfirmed status indicates a possible logging lapse. Caregiver coordination required to confirm whether the dose was taken or delayed.",
    status: "open",
    relatedRecordType: "dose_event",
    relatedRecordId: "dose-event-005",
    relatedRecordTitle: "Lisinopril 10mg (08:00 PM)",
    sourceModule: "medication_lifecycle",
    detectedAt: "2026-02-14T21:15:00Z",
    actionRoute: "/medications",
    actionLabel: "View Medication Events",
    deduplicationKey: "patient-profile-001_overdue_unconfirmed_event_dose_event_dose-event-005",
    auditHistory: [
      {
        id: "aud-gap-002",
        timestamp: "2026-02-14T21:15:00Z",
        actorName: "Care Gap Detection Engine",
        actorRole: "System Automator",
        action: "gap_detected",
        note: "Event passed scheduled window by >60 minutes without status update.",
        newStatus: "open",
      },
    ],
    createdAt: "2026-02-14T21:15:00Z",
    updatedAt: "2026-02-14T21:15:00Z",
  },
  {
    id: "gap-003",
    patientId: "patient-profile-001",
    category: "responsibility",
    gapType: "unassigned_care_task",
    title: "Unassigned Task: Prepare BP Tracking Sheet for Visiting Nurse",
    explanation:
      "A clinical vitals monitoring preparation task was created without an assigned Care Circle member.",
    priority: "attention_required",
    priorityReason:
      "Unassigned tasks risk delayed care coordination. An active caregiver must accept ownership.",
    status: "open",
    relatedRecordType: "care_task",
    relatedRecordId: "task-005",
    relatedRecordTitle: "Print Weekly BP Vitals Sheet",
    sourceModule: "care_circle",
    detectedAt: "2026-02-13T14:00:00Z",
    actionRoute: "/care-circle/tasks",
    actionLabel: "Assign Task",
    deduplicationKey: "patient-profile-001_unassigned_care_task_care_task_task-005",
    auditHistory: [
      {
        id: "aud-gap-003",
        timestamp: "2026-02-13T14:00:00Z",
        actorName: "Care Gap Detection Engine",
        actorRole: "System Automator",
        action: "gap_detected",
        note: "Task detected with assignee: null.",
        newStatus: "open",
      },
    ],
    createdAt: "2026-02-13T14:00:00Z",
    updatedAt: "2026-02-13T14:00:00Z",
  },
  {
    id: "gap-004",
    patientId: "patient-profile-001",
    category: "responsibility",
    gapType: "unacknowledged_shift_handover",
    title: "Unacknowledged Shift Handover: Nurse Sarah -> David Sullivan",
    explanation:
      "Caregiver shift handover report submitted 3 hours ago remains unacknowledged by the incoming caregiver.",
    priority: "routine",
    priorityReason:
      "Caregiver shift transitions require bilateral sign-off to ensure complete information continuity.",
    status: "assigned",
    assignedToId: "member-david",
    assignedToName: "David Sullivan",
    assignedToRole: "Family Care Coordinator",
    assignedAt: "2026-02-15T08:00:00Z",
    relatedRecordType: "shift_handover",
    relatedRecordId: "handover-001",
    relatedRecordTitle: "Morning Shift Transition (Nurse Sarah -> David)",
    sourceModule: "care_circle",
    detectedAt: "2026-02-15T11:00:00Z",
    actionRoute: "/care-circle/handover",
    actionLabel: "Acknowledge Handover",
    deduplicationKey: "patient-profile-001_unacknowledged_shift_handover_shift_handover_handover-001",
    auditHistory: [
      {
        id: "aud-gap-004",
        timestamp: "2026-02-15T11:00:00Z",
        actorName: "Care Gap Detection Engine",
        actorRole: "System Automator",
        action: "gap_detected",
        note: "Handover unacknowledged past standard 2-hour window.",
        newStatus: "assigned",
      },
    ],
    createdAt: "2026-02-15T11:00:00Z",
    updatedAt: "2026-02-15T11:00:00Z",
  },
  {
    id: "gap-005",
    patientId: "patient-profile-001",
    category: "appointment",
    gapType: "appointment_prep_overdue",
    title: "Appointment Prep Overdue: Fasting Blood Panel Preparation",
    explanation:
      "Appointment preparation checklist for the 8-hour fasting blood panel is pending confirmation with visit scheduled for tomorrow morning.",
    priority: "high_priority",
    priorityReason:
      "Incomplete fasting protocol will invalidate metabolic and lipid lab results, requiring rescheduling.",
    status: "open",
    relatedRecordType: "appointment",
    relatedRecordId: "appt-002",
    relatedRecordTitle: "Routine Fasting Blood Panel (Springfield Lab)",
    sourceModule: "appointment_intelligence",
    detectedAt: "2026-02-14T17:00:00Z",
    dueDate: "2026-02-16T08:00:00Z",
    actionRoute: "/appointments/preparation",
    actionLabel: "Complete Prep Checklist",
    deduplicationKey: "patient-profile-001_appointment_prep_overdue_appointment_appt-002",
    auditHistory: [
      {
        id: "aud-gap-005",
        timestamp: "2026-02-14T17:00:00Z",
        actorName: "Care Gap Detection Engine",
        actorRole: "System Automator",
        action: "gap_detected",
        note: "Preparation checklist pending completion with visit in <48 hours.",
        newStatus: "open",
      },
    ],
    createdAt: "2026-02-14T17:00:00Z",
    updatedAt: "2026-02-14T17:00:00Z",
  },
  {
    id: "gap-006",
    patientId: "patient-profile-001",
    category: "instruction_continuity",
    gapType: "continuity_review_needs_clarification",
    title: "Continuity Review Needs Clarification: Fasting Panel Med Water Protocol",
    explanation:
      "Continuity review is paused awaiting clinical response regarding pre-procedure antihypertensive administration with water.",
    priority: "attention_required",
    priorityReason:
      "Clinical clarification is needed before downstream dose prompt updates can be authorized.",
    status: "awaiting_clarification",
    clarificationRequest: "Is Eleanor permitted to take her 08:00 AM Lisinopril with a small sip of water before the 09:00 AM blood draw?",
    relatedRecordType: "continuity_review",
    relatedRecordId: "rev-cont-003",
    relatedRecordTitle: "Fasting Metabolic & Renal Panel Protocol Review",
    sourceModule: "continuity_engine",
    detectedAt: "2026-02-14T09:15:00Z",
    actionRoute: "/continuity/reviews",
    actionLabel: "View Continuity Review",
    deduplicationKey: "patient-profile-001_continuity_review_needs_clarification_continuity_review_rev-cont-003",
    auditHistory: [
      {
        id: "aud-gap-006",
        timestamp: "2026-02-14T09:15:00Z",
        actorName: "Sarah Jenkins, RN",
        actorRole: "Visiting Nurse",
        action: "clarification_requested",
        note: "Submitted clarification inquiry to attending clinic.",
        newStatus: "awaiting_clarification",
      },
    ],
    createdAt: "2026-02-14T09:15:00Z",
    updatedAt: "2026-02-14T09:15:00Z",
  },
  {
    id: "gap-007",
    patientId: "patient-profile-001",
    category: "notification",
    gapType: "notification_delivery_failed",
    title: "SMS Delivery Failed: Urgent Withholding Notification",
    explanation:
      "Provider delivery attempt failed for urgent medication withholding alert to primary emergency contact David Sullivan.",
    priority: "high_priority",
    priorityReason:
      "Critical care alerts must be acknowledged or rerouted to alternative verified channels (e.g. In-App or voice call).",
    status: "open",
    relatedRecordType: "notification",
    relatedRecordId: "notif-004",
    relatedRecordTitle: "SMS Gateway 504 Gateway Timeout (David Sullivan)",
    sourceModule: "notification_system",
    detectedAt: "2026-02-15T08:20:00Z",
    actionRoute: "/notifications",
    actionLabel: "Inspect Notification Delivery",
    deduplicationKey: "patient-profile-001_notification_delivery_failed_notification_notif-004",
    auditHistory: [
      {
        id: "aud-gap-007",
        timestamp: "2026-02-15T08:20:00Z",
        actorName: "Care Gap Detection Engine",
        actorRole: "System Automator",
        action: "gap_detected",
        note: "Notification job marked as failed after 3 retry attempts.",
        newStatus: "open",
      },
    ],
    createdAt: "2026-02-15T08:20:00Z",
    updatedAt: "2026-02-15T08:20:00Z",
  },
  {
    id: "gap-008",
    patientId: "patient-profile-001",
    category: "medication",
    gapType: "skipped_event_requiring_acknowledgement",
    title: "Resolved: Evening Atorvastatin Dose Time Discrepancy",
    explanation:
      "Caregiver verified patient took evening dose at 09:15 PM with dinner instead of 08:00 PM. Dose log synchronized.",
    priority: "routine",
    priorityReason:
      "Time shift verified; routine adherence tracking logged.",
    status: "resolved",
    relatedRecordType: "dose_event",
    relatedRecordId: "dose-event-001",
    relatedRecordTitle: "Atorvastatin Calcium 20mg (Evening)",
    sourceModule: "medication_lifecycle",
    detectedAt: "2026-02-11T20:30:00Z",
    resolvedByUserId: "member-sarah",
    resolvedByName: "Sarah Jenkins, RN",
    resolvedAt: "2026-02-11T21:45:00Z",
    resolutionDetails:
      "Spoke with Eleanor; confirmed dose taken with evening snack at 09:15 PM. Adherence recorded as delayed taken.",
    actionRoute: "/medications/adherence",
    actionLabel: "View Adherence History",
    deduplicationKey: "patient-profile-001_skipped_event_requiring_acknowledgement_dose_event_dose-event-001",
    auditHistory: [
      {
        id: "aud-gap-008-1",
        timestamp: "2026-02-11T20:30:00Z",
        actorName: "Care Gap Detection Engine",
        actorRole: "System Automator",
        action: "gap_detected",
        newStatus: "open",
      },
      {
        id: "aud-gap-008-2",
        timestamp: "2026-02-11T21:45:00Z",
        actorName: "Sarah Jenkins, RN",
        actorRole: "Visiting Nurse",
        action: "gap_resolved",
        note: "Verified dose ingestion at 09:15 PM. Non-prescribing administrative confirmation.",
        previousStatus: "open",
        newStatus: "resolved",
      },
    ],
    createdAt: "2026-02-11T20:30:00Z",
    updatedAt: "2026-02-11T21:45:00Z",
  },
];

let cachedCareGaps: CareGapRecord[] = [...INITIAL_CARE_GAPS];

/* -------------------------------------------------------------------------- */
/* 3. Retrieval Services                                                      */
/* -------------------------------------------------------------------------- */
export function getCachedCareGaps(): CareGapRecord[] {
  return cachedCareGaps;
}

export function getCareGapById(id: string): CareGapRecord | null {
  return cachedCareGaps.find((g) => g.id === id) || null;
}

/* -------------------------------------------------------------------------- */
/* 4. Deterministic Gap Detection Engine                                      */
/* -------------------------------------------------------------------------- */
/**
 * Scans all existing modules (Medications, Dose Events, Tasks, Handovers,
 * Appointments, Instructions, Continuity Reviews, and Notifications)
 * and generates deterministic, explainable, deduplicated CareGapRecords.
 */
export function detectCareGaps(patientId: string = "patient-profile-001"): {
  allGaps: CareGapRecord[];
  newGapsCount: number;
  updatedGapsCount: number;
} {
  const now = new Date().toISOString();
  let newGapsCount = 0;
  let updatedGapsCount = 0;

  const candidateGaps: Array<Omit<CareGapRecord, "id" | "createdAt" | "updatedAt" | "auditHistory">> = [];

  // --- 1. Medication Gaps ---
  const doseEvents = getCachedDoseEvents();
  doseEvents.forEach((ev) => {
    if (ev.status === "missed") {
      candidateGaps.push({
        patientId,
        category: "medication",
        gapType: "missed_medication_event",
        title: `Missed Scheduled Dose: ${ev.medicationName}`,
        explanation: `Scheduled dose at ${ev.scheduledTime} on ${ev.scheduledAt ? new Date(ev.scheduledAt).toLocaleDateString() : 'scheduled date'} is marked 'missed'. Clinical safety rule: Do NOT recommend extra doses or schedule alterations.`,
        priority: "high_priority",
        priorityReason: "Medication omission requires coordination verification of patient well-being.",
        status: "open",
        relatedRecordType: "dose_event",
        relatedRecordId: ev.id,
        relatedRecordTitle: `${ev.medicationName} (${ev.scheduledTime})`,
        sourceModule: "medication_lifecycle",
        detectedAt: now,
        actionRoute: "/medications/adherence",
        actionLabel: "Inspect Adherence Log",
        deduplicationKey: `${patientId}_missed_medication_event_dose_event_${ev.id}`,
      });
    } else if (ev.status === "scheduled") {
      // Check if scheduled time is in the past
      const scheduledDateTime = ev.scheduledAt ? new Date(ev.scheduledAt).getTime() : 0;
      const currentDateTime = new Date().getTime();
      if (scheduledDateTime > 0 && currentDateTime > scheduledDateTime + 3600000) { // >1 hour overdue
        candidateGaps.push({
          patientId,
          category: "medication",
          gapType: "overdue_unconfirmed_event",
          title: `Overdue Unconfirmed Dose: ${ev.medicationName}`,
          explanation: `Scheduled dose at ${ev.scheduledTime} has passed its scheduled window without confirmation. Note: CARETRACE does not assume it was missed.`,
          priority: "attention_required",
          priorityReason: "Dose event remains unconfirmed after scheduled window; status verification needed.",
          status: "open",
          relatedRecordType: "dose_event",
          relatedRecordId: ev.id,
          relatedRecordTitle: `${ev.medicationName} (${ev.scheduledTime})`,
          sourceModule: "medication_lifecycle",
          detectedAt: now,
          actionRoute: "/medications",
          actionLabel: "Confirm Event Status",
          deduplicationKey: `${patientId}_overdue_unconfirmed_event_dose_event_${ev.id}`,
        });
      }
    }
  });

  // --- 2. Responsibility (Task & Handover) Gaps ---
  const tasks = getCachedTasks();
  tasks.forEach((t) => {
    if (!t.assignedToId && t.status !== "completed" && t.status !== "cancelled") {
      candidateGaps.push({
        patientId,
        category: "responsibility",
        gapType: "unassigned_care_task",
        title: `Unassigned Task: ${t.title}`,
        explanation: "Care responsibility task exists without an assigned Care Circle member.",
        priority: "attention_required",
        priorityReason: "Unassigned tasks risk delayed care coordination.",
        status: "open",
        relatedRecordType: "care_task",
        relatedRecordId: t.id,
        relatedRecordTitle: t.title,
        sourceModule: "care_circle",
        detectedAt: now,
        actionRoute: "/care-circle/tasks",
        actionLabel: "Assign Task",
        deduplicationKey: `${patientId}_unassigned_care_task_care_task_${t.id}`,
      });
    }

    if (t.status === "overdue") {
      candidateGaps.push({
        patientId,
        category: "responsibility",
        gapType: "overdue_task",
        title: `Overdue Care Task: ${t.title}`,
        explanation: `Task past due date (${t.dueDate || "scheduled time"}) remains incomplete.`,
        priority: "high_priority",
        priorityReason: "Overdue task requires immediate follow-up by assigned caregiver.",
        status: "open",
        assignedToId: t.assignedToId,
        assignedToName: t.assignedToName,
        assignedToRole: t.assignedToRole,
        relatedRecordType: "care_task",
        relatedRecordId: t.id,
        relatedRecordTitle: t.title,
        sourceModule: "care_circle",
        detectedAt: now,
        actionRoute: "/care-circle/tasks",
        actionLabel: "Complete Task",
        deduplicationKey: `${patientId}_overdue_task_care_task_${t.id}`,
      });
    }
  });

  const handovers = getCachedHandovers();
  handovers.forEach((h) => {
    const isPending = h.acknowledgementStatus === "pending" || h.handoverStatus === "ready_for_handover" || h.handoverStatus === "sent";
    if (isPending) {
      const outgoingName = h.outgoingCaregiverName || h.outgoingMemberName || "Outgoing Caregiver";
      const incomingName = h.incomingCaregiverName || h.incomingMemberName || "Incoming Caregiver";
      const incomingId = h.incomingCaregiverId || h.incomingMemberId;
      const shiftLabel = h.shiftDate || h.shiftPeriod || "Shift";
      candidateGaps.push({
        patientId,
        category: "responsibility",
        gapType: "unacknowledged_shift_handover",
        title: `Unacknowledged Shift Handover: ${outgoingName} -> ${incomingName}`,
        explanation: "Caregiver shift handover report remains unacknowledged by the incoming caregiver.",
        priority: "routine",
        priorityReason: "Caregiver transitions require bilateral sign-off to ensure care continuity.",
        status: "assigned",
        assignedToId: incomingId,
        assignedToName: incomingName,
        relatedRecordType: "shift_handover",
        relatedRecordId: h.id,
        relatedRecordTitle: `Handover (${shiftLabel})`,
        sourceModule: "care_circle",
        detectedAt: now,
        actionRoute: "/care-circle/handover",
        actionLabel: "Acknowledge Handover",
        deduplicationKey: `${patientId}_unacknowledged_shift_handover_shift_handover_${h.id}`,
      });
    }
  });

  // --- 3. Appointment Gaps ---
  const appointments = getCachedAppointments();
  appointments.forEach((appt) => {
    const preps = getCachedPreparationItems(appt.id);
    const unaddressedPreps = preps.filter((p) => !p.isAddressed);
    const isScheduled = appt.status === "scheduled" || appt.appointmentStatus === "scheduled" || appt.appointmentStatus === "planned" || appt.appointmentStatus === "confirmed";
    if (unaddressedPreps.length > 0 && isScheduled) {
      const docName = appt.providerName || appt.doctorName || "Physician";
      const specialty = appt.departmentOrSpecialty || appt.specialty || "Specialist";
      const schedDate = appt.appointmentDatetime ? new Date(appt.appointmentDatetime).toLocaleDateString() : (appt.scheduledDate || "Upcoming");
      const clinic = appt.clinicName || appt.facility || "Clinic";
      candidateGaps.push({
        patientId,
        category: "appointment",
        gapType: "appointment_prep_overdue",
        title: `Appointment Prep Incomplete: ${docName} (${specialty})`,
        explanation: `Pre-visit preparation (${unaddressedPreps.length} unaddressed items) is pending completion for visit on ${schedDate}.`,
        priority: "high_priority",
        priorityReason: "Incomplete preparation can invalidate diagnostic tests or cause visit delays.",
        status: "open",
        dueDate: appt.appointmentDatetime || `${appt.scheduledDate || "2026-02-20"}T${appt.scheduledTime || "09:00"}:00Z`,
        relatedRecordType: "appointment",
        relatedRecordId: appt.id,
        relatedRecordTitle: `${docName} - ${clinic}`,
        sourceModule: "appointment_intelligence",
        detectedAt: now,
        actionRoute: "/appointments/preparation",
        actionLabel: "Complete Prep Checklist",
        deduplicationKey: `${patientId}_appointment_prep_overdue_appointment_${appt.id}`,
      });
    }
  });

  // --- 4. Instruction & Continuity Gaps ---
  const instructions = getCachedInstructions();
  instructions.forEach((inst) => {
    if (inst.verificationStatus === "awaiting_verification") {
      candidateGaps.push({
        patientId,
        category: "instruction_continuity",
        gapType: "instruction_awaiting_verification",
        title: `Instruction Awaiting Verification: ${inst.title}`,
        explanation: "Newly submitted clinical care instruction is in unverified quarantine awaiting clinical verification.",
        priority: "attention_required",
        priorityReason: "Unverified instructions cannot be synchronized downstream until verified by a physician or nurse.",
        status: "open",
        relatedRecordType: "instruction",
        relatedRecordId: inst.id,
        relatedRecordTitle: inst.title,
        sourceModule: "instruction_vault",
        detectedAt: now,
        actionRoute: "/instructions/review",
        actionLabel: "Review Instruction",
        deduplicationKey: `${patientId}_instruction_awaiting_verification_instruction_${inst.id}`,
      });
    }
  });

  const continuityReviews = getCachedContinuityReviews();
  continuityReviews.forEach((rev) => {
    if (rev.reviewStatus === "needs_clarification") {
      candidateGaps.push({
        patientId,
        category: "instruction_continuity",
        gapType: "continuity_review_needs_clarification",
        title: `Continuity Review Awaiting Clarification: ${rev.instructionTitle}`,
        explanation: "Downstream continuity synchronization is paused awaiting author clarification.",
        priority: "attention_required",
        priorityReason: "Clarification response required to resume review and downstream synchronization.",
        status: "awaiting_clarification",
        clarificationRequest: rev.clarificationQuestion,
        relatedRecordType: "continuity_review",
        relatedRecordId: rev.id,
        relatedRecordTitle: rev.instructionTitle,
        sourceModule: "continuity_engine",
        detectedAt: now,
        actionRoute: `/continuity/reviews/${rev.id}`,
        actionLabel: "Respond to Clarification",
        deduplicationKey: `${patientId}_continuity_review_needs_clarification_continuity_review_${rev.id}`,
      });
    }
  });

  // --- 5. Notification Gaps ---
  cachedNotificationJobs.forEach((notif) => {
    if (notif.status === "failed") {
      candidateGaps.push({
        patientId,
        category: "notification",
        gapType: "notification_delivery_failed",
        title: `Notification Delivery Failed: ${notif.title}`,
        explanation: `Delivery attempt via ${notif.channel.toUpperCase()} to ${notif.recipientName} failed: ${notif.lastError || "Carrier error"}.`,
        priority: "high_priority",
        priorityReason: "Failed notification delivery risks coordinator unawareness of critical events.",
        status: "open",
        relatedRecordType: "notification",
        relatedRecordId: notif.id,
        relatedRecordTitle: `${notif.channel.toUpperCase()} to ${notif.recipientName}`,
        sourceModule: "notification_system",
        detectedAt: now,
        actionRoute: "/notifications",
        actionLabel: "Inspect Delivery Attempt",
        deduplicationKey: `${patientId}_notification_delivery_failed_notification_${notif.id}`,
      });
    }
  });

  // --- Deduplication & Update Processing ---
  candidateGaps.forEach((cand) => {
    const existing = cachedCareGaps.find(
      (g) => g.deduplicationKey === cand.deduplicationKey
    );

    if (!existing) {
      // Create new gap record
      const newGap: CareGapRecord = {
        ...cand,
        id: `gap-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        createdAt: now,
        updatedAt: now,
        auditHistory: [
          {
            id: `aud-${Date.now()}`,
            timestamp: now,
            actorName: "Care Gap Detection Engine",
            actorRole: "System Automator",
            action: "gap_detected",
            note: "Automatically identified during deterministic multi-module scan.",
            newStatus: cand.status,
          },
        ],
      };
      cachedCareGaps.unshift(newGap);
      newGapsCount++;
    } else {
      // Only update if existing gap is still active
      if (existing.status !== "resolved" && existing.status !== "dismissed") {
        existing.detectedAt = now;
        existing.updatedAt = now;
        updatedGapsCount++;
      }
    }
  });

  return {
    allGaps: cachedCareGaps,
    newGapsCount,
    updatedGapsCount,
  };
}

/* -------------------------------------------------------------------------- */
/* 5. Care Gap Lifecycle & Assignment Operations                             */
/* -------------------------------------------------------------------------- */

/**
 * Assign or reassign care gap to an eligible Care Circle member.
 */
export function assignCareGap(
  gapId: string,
  assignedToId: string,
  assignedToName: string,
  assignedToRole: string,
  actorName: string,
  actorRole: string,
  note?: string
): CareGapRecord | null {
  const gap = cachedCareGaps.find((g) => g.id === gapId);
  if (!gap) return null;

  const now = new Date().toISOString();
  const prevStatus = gap.status;

  gap.assignedToId = assignedToId;
  gap.assignedToName = assignedToName;
  gap.assignedToRole = assignedToRole;
  gap.assignedAt = now;
  gap.status = "assigned";
  gap.updatedAt = now;

  gap.auditHistory.unshift({
    id: `aud-${Date.now()}`,
    timestamp: now,
    actorName,
    actorRole,
    action: "gap_assigned",
    note: note || `Assigned to ${assignedToName} (${assignedToRole}).`,
    previousStatus: prevStatus,
    newStatus: "assigned",
  });

  return gap;
}

/**
 * Respond to an assignment (accept or decline).
 */
export function respondToAssignment(
  gapId: string,
  action: "accept" | "decline",
  actorName: string,
  actorRole: string,
  reason?: string
): CareGapRecord | null {
  const gap = cachedCareGaps.find((g) => g.id === gapId);
  if (!gap) return null;

  const now = new Date().toISOString();
  const prevStatus = gap.status;

  if (action === "accept") {
    gap.status = "acknowledged";
    gap.auditHistory.unshift({
      id: `aud-${Date.now()}`,
      timestamp: now,
      actorName,
      actorRole,
      action: "assignment_accepted",
      note: reason || "Responsibility accepted by assigned member.",
      previousStatus: prevStatus,
      newStatus: "acknowledged",
    });
  } else {
    // Declined: return to unassigned open state
    gap.status = "open";
    gap.assignedToId = undefined;
    gap.assignedToName = undefined;
    gap.assignedToRole = undefined;
    gap.assignedAt = undefined;
    gap.auditHistory.unshift({
      id: `aud-${Date.now()}`,
      timestamp: now,
      actorName,
      actorRole,
      action: "assignment_declined",
      note: reason ? `Declined: ${reason}` : "Assignment declined; returned to unassigned queue.",
      previousStatus: prevStatus,
      newStatus: "open",
    });
  }

  gap.updatedAt = now;
  return gap;
}

/**
 * Resolve a care gap with mandatory documented resolution action and details.
 */
export function resolveCareGap(
  gapId: string,
  resolutionAction: string,
  resolutionDetails: string,
  actorName: string,
  actorRole: string
): CareGapRecord | null {
  const gap = cachedCareGaps.find((g) => g.id === gapId);
  if (!gap) return null;

  const now = new Date().toISOString();
  const prevStatus = gap.status;

  gap.status = "resolved";
  gap.resolvedByName = actorName;
  gap.resolvedAt = now;
  gap.resolutionDetails = `${resolutionAction}: ${resolutionDetails}`;
  gap.updatedAt = now;

  gap.auditHistory.unshift({
    id: `aud-${Date.now()}`,
    timestamp: now,
    actorName,
    actorRole,
    action: "gap_resolved",
    note: `${resolutionAction}: ${resolutionDetails}`,
    previousStatus: prevStatus,
    newStatus: "resolved",
  });

  return gap;
}

/**
 * Dismiss a care gap with mandatory documented justification.
 */
export function dismissCareGap(
  gapId: string,
  dismissedReason: string,
  actorName: string,
  actorRole: string
): CareGapRecord | null {
  const gap = cachedCareGaps.find((g) => g.id === gapId);
  if (!gap) return null;

  const now = new Date().toISOString();
  const prevStatus = gap.status;

  gap.status = "dismissed";
  gap.dismissedByName = actorName;
  gap.dismissedAt = now;
  gap.dismissedReason = dismissedReason;
  gap.updatedAt = now;

  gap.auditHistory.unshift({
    id: `aud-${Date.now()}`,
    timestamp: now,
    actorName,
    actorRole,
    action: "gap_dismissed",
    note: `Dismissed: ${dismissedReason}`,
    previousStatus: prevStatus,
    newStatus: "dismissed",
  });

  return gap;
}

/**
 * Update gap status (e.g. mark in progress, request clarification, or reopen).
 */
export function updateCareGapStatus(
  gapId: string,
  status: CareGapStatus,
  actorName: string,
  actorRole: string,
  note?: string,
  clarificationRequest?: string
): CareGapRecord | null {
  const gap = cachedCareGaps.find((g) => g.id === gapId);
  if (!gap) return null;

  const now = new Date().toISOString();
  const prevStatus = gap.status;

  gap.status = status;
  if (clarificationRequest) {
    gap.clarificationRequest = clarificationRequest;
  }
  gap.updatedAt = now;

  gap.auditHistory.unshift({
    id: `aud-${Date.now()}`,
    timestamp: now,
    actorName,
    actorRole,
    action: `status_changed_to_${status}`,
    note: note || (clarificationRequest ? `Clarification inquiry: ${clarificationRequest}` : `Status updated to ${status}`),
    previousStatus: prevStatus,
    newStatus: status,
  });

  return gap;
}
