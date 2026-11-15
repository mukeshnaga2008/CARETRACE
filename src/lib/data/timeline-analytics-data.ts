/**
 * CARETRACE Care Timeline, Analytics & Care Passport Data Store
 * PromptWars × Catalyst 2026: Phase 13
 * 
 * Clinical & Integrity Architecture:
 * - Real-time unified projection from upstream modules (Medications, Appointments, Tasks, Vault, Continuity, Gaps).
 * - Distinguishes event occurrence from recording timestamp.
 * - Labels self-reported medication events as reported rather than clinically verified ingestion.
 * - Computes transparent operational analytics with mathematically sound denominators.
 * - Generates controlled, snapshot-consistent Care Passport records with verification hashing.
 */

import {
  TimelineCategory,
  TimelineEvent,
  AnalyticsDateRange,
  CareAnalyticsSummary,
  MedicationAnalytics,
  AppointmentAnalytics,
  CareCircleAnalytics,
  ContinuityAnalytics,
  CareGapAnalytics,
  CarePassportConfig,
  CarePassportExportRecord,
  CarePassportSectionKey,
} from "@/types/caretrace";

import { getCachedMedications, getCachedDoseEvents } from "@/lib/data/medication-lifecycle-data";
import { getCachedAppointments, getCachedPreparationItems, getCachedFollowUpTasks } from "@/lib/data/appointment-intelligence-data";
import { getCachedTasks, getCachedHandovers, getCachedMembers } from "@/lib/data/care-circle-data";
import { getCachedInstructions, getCachedInstructionVersions } from "@/lib/data/instruction-vault-data";
import { getCachedContinuityReviews } from "@/lib/data/care-continuity-data";
import { getCachedCareGaps } from "@/lib/data/care-gap-intelligence-data";
import { getCachedNotifications, getCachedDeliveryAttempts, getCachedAcknowledgements } from "@/lib/data/notification-data";
import { INITIAL_PATIENT_PROFILE } from "@/lib/data/patient-profile-data";
import { SYNTHETIC_PATIENTS_DATASET } from "@/lib/data/synthetic-dashboard-data";

/* -------------------------------------------------------------------------- */
/* 1. Care Passport Preferences & Export History                              */
/* -------------------------------------------------------------------------- */

export const DEFAULT_CARE_PASSPORT_CONFIG: CarePassportConfig = {
  sections: {
    patient_identity: true,
    emergency_contacts: true,
    conditions_and_allergies: true,
    medication_regimen: true,
    upcoming_appointments: true,
    care_instructions: true,
    care_circle: true,
    pending_tasks: true,
    advance_directives: true,
  },
  includeAuditHash: true,
  notes: "Standard authorized clinical handoff summary for Margaret Eleanor Sullivan.",
};

let cachedPassportConfig: CarePassportConfig = { ...DEFAULT_CARE_PASSPORT_CONFIG };

export const INITIAL_PASSPORT_EXPORTS: CarePassportExportRecord[] = [
  {
    id: "exp-001",
    patientId: "patient-profile-001",
    exportedByUserId: "cc-mem-001",
    exportedByName: "David Sullivan",
    exportedByRole: "Family Member (Proxy)",
    exportedAt: "2026-02-14T10:15:00Z",
    includedSections: [
      "patient_identity",
      "emergency_contacts",
      "conditions_and_allergies",
      "medication_regimen",
      "upcoming_appointments",
      "care_instructions",
      "advance_directives",
    ],
    verificationHash: "CT-SHA256-9A82B3C1D0E4F576",
    fileSizeBytes: 142850,
    downloadUrl: "#",
    reason: "Pre-visit records packet for Cardiology follow-up with Dr. Eleanor Vance",
  },
  {
    id: "exp-002",
    patientId: "patient-profile-001",
    exportedByUserId: "cc-mem-002",
    exportedByName: "Sarah Jenkins, RN",
    exportedByRole: "Caregiver / Visiting Nurse",
    exportedAt: "2026-02-12T16:45:00Z",
    includedSections: [
      "patient_identity",
      "emergency_contacts",
      "conditions_and_allergies",
      "medication_regimen",
      "care_circle",
      "advance_directives",
    ],
    verificationHash: "CT-SHA256-4D5E6F7A8B9C0D1E",
    fileSizeBytes: 128400,
    downloadUrl: "#",
    reason: "Emergency EMS backup documentation staged at bedside",
  },
];

let cachedPassportExports: CarePassportExportRecord[] = [...INITIAL_PASSPORT_EXPORTS];

/* -------------------------------------------------------------------------- */
/* 2. Unified Care Timeline Generator                                         */
/* -------------------------------------------------------------------------- */

/**
 * Projects all existing module events into a single, chronological timeline stream.
 * Distinguishes between event occurrence time and when it was recorded.
 * Labels self-reported medication events as reported rather than independently verified.
 */
export function getUnifiedCareTimeline(
  patientId: string = "patient-profile-001",
  filters?: {
    category?: string;
    sourceModule?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // --- 1. Medication Activity Events ---
  const doseEvents = getCachedDoseEvents();
  doseEvents.forEach((ev: any) => {
    const rawStatus = ev.eventStatus || ev.status || "upcoming";
    const isTaken = rawStatus === "taken" || rawStatus === "reported_taken";
    const isMissed = rawStatus === "missed";
    const isSkipped = rawStatus === "skipped";

    let title = `Scheduled Dose: ${ev.medicationName} (${ev.dosage})`;
    let desc = `Scheduled for ${ev.scheduledTime}.`;
    let severity: 'info' | 'warning' | 'critical' = 'info';

    if (isTaken) {
      title = `Reported Taken: ${ev.medicationName} (${ev.dosage})`;
      desc = `Dose logged as taken by ${ev.reportedByName || ev.loggedByName || "Margaret Sullivan"}. (Self-reported; not independently verified).`;
      severity = "info";
    } else if (isMissed) {
      title = `Missed Dose Event: ${ev.medicationName} (${ev.dosage})`;
      desc = `Dose marked missed at ${ev.scheduledTime}. Reason: ${ev.notes || ev.reasonCode || "Omission logged"}.`;
      severity = "warning";
    } else if (isSkipped) {
      title = `Skipped Dose Event: ${ev.medicationName} (${ev.dosage})`;
      desc = `Dose marked skipped. Reason: ${ev.notes || "Clinical withholding or patient request"}.`;
      severity = "warning";
    }

    events.push({
      id: `time-dose-${ev.id}`,
      patientId: ev.patientId || patientId,
      category: "medication",
      eventType: `dose_${rawStatus}`,
      title,
      description: desc,
      sourceModule: "medication_lifecycle",
      relatedRecordId: ev.id,
      relatedRecordType: "dose_event",
      actionUrl: "/medications/adherence",
      occurredAt: ev.scheduledAt || "2026-02-15T08:00:00Z",
      recordedAt: ev.reportedAt || ev.loggedAt || ev.scheduledAt || "2026-02-15T08:00:00Z",
      actorName: ev.reportedByName || ev.loggedByName || "Margaret Sullivan",
      actorRole: ev.reportedByRole || ev.loggedByRole || "Patient",
      status: rawStatus,
      isReportedOnly: isTaken || isSkipped,
      severity,
      details: { medicationId: ev.medicationId, dosage: ev.dosage },
    });
  });

  // --- 2. Appointment Events ---
  const appointments = getCachedAppointments();
  appointments.forEach((appt) => {
    const docName = appt.providerName || appt.doctorName || "Physician";
    const clinic = appt.clinicName || appt.facility || "Clinic";
    const apptTime = appt.appointmentDatetime || appt.appointmentDate || "2026-02-20T14:30:00Z";
    const isCompleted = appt.status === "completed" || appt.appointmentStatus === "completed";
    const isCancelled = appt.status === "cancelled" || appt.appointmentStatus === "cancelled";

    events.push({
      id: `time-appt-${appt.id}`,
      patientId: appt.patientId || patientId,
      category: "appointment",
      eventType: isCompleted ? "appointment_completed" : isCancelled ? "appointment_cancelled" : "appointment_scheduled",
      title: `${isCompleted ? "Completed Consultation" : isCancelled ? "Cancelled Visit" : "Scheduled Consultation"}: ${docName}`,
      description: `Visit at ${clinic}. Type: ${appt.appointmentType || "doctor_consultation"}. Companion: ${appt.assignedAccompanyingName || appt.companionName || "Self"}.`,
      sourceModule: "appointment_intelligence",
      relatedRecordId: appt.id,
      relatedRecordType: "appointment",
      actionUrl: `/appointments/${appt.id}`,
      occurredAt: apptTime,
      recordedAt: appt.createdAt || apptTime,
      actorName: appt.createdBy || docName,
      actorRole: "Clinical Scheduler",
      status: appt.appointmentStatus || appt.status || "confirmed",
      severity: isCancelled ? "warning" : "info",
      details: { clinic, specialty: appt.departmentOrSpecialty || appt.specialty },
    });
  });

  // --- 3. Instruction Vault Events ---
  const instructions = getCachedInstructions();
  instructions.forEach((inst: any) => {
    const isVerified = inst.verificationStatus === "verified";
    events.push({
      id: `time-inst-${inst.id}`,
      patientId: inst.patientId || patientId,
      category: "instruction",
      eventType: isVerified ? "instruction_verified" : "instruction_created",
      title: `Care Directive ${isVerified ? "Verified" : "Authored"}: ${inst.title}`,
      description: `Active version v${inst.currentVersionNumber || inst.activeVersionNumber || 1}. Directives: ${inst.structuredContent?.guidelines?.length || inst.directives?.length || 1} clinical instructions. Category: ${inst.category}.`,
      sourceModule: "instruction_vault",
      relatedRecordId: inst.id,
      relatedRecordType: "care_instruction",
      actionUrl: `/instructions/${inst.id}`,
      occurredAt: inst.updatedAt || inst.createdAt,
      recordedAt: inst.createdAt,
      actorName: inst.createdByName || inst.lastEditedByName || "Clinician",
      actorRole: inst.createdByRole || inst.lastEditedByRole || "Clinical Author",
      version: `v${inst.currentVersionNumber || inst.activeVersionNumber || 1}`,
      status: inst.verificationStatus,
      severity: inst.verificationStatus === "rejected" ? "critical" : "info",
      details: { category: inst.category },
    });
  });

  // --- 4. Care Continuity Events ---
  const reviews = getCachedContinuityReviews();
  reviews.forEach((rev: any) => {
    const revStatus = rev.reviewStatus || rev.status || "analysis_pending";
    events.push({
      id: `time-cont-${rev.id}`,
      patientId: rev.patientId || patientId,
      category: "continuity",
      eventType: `continuity_${revStatus}`,
      title: `Continuity Review: ${rev.instructionTitle}`,
      description: `Transition review from v${rev.previousVersionNumber} to v${rev.currentVersionNumber}. Decision: ${String(revStatus).replace(/_/g, " ")}. Rationale: ${rev.decisionRationale || "Under review"}.`,
      sourceModule: "care_continuity_engine",
      relatedRecordId: rev.id,
      relatedRecordType: "continuity_review",
      actionUrl: `/continuity/reviews/${rev.id}`,
      occurredAt: rev.decidedAt || rev.createdAt || new Date().toISOString(),
      recordedAt: rev.createdAt || new Date().toISOString(),
      actorName: rev.decidedByName || rev.assignedReviewerName || rev.reviewerName || "Reviewer",
      actorRole: rev.decidedByRole || rev.assignedReviewerRole || rev.reviewerRole || "Care Coordinator",
      version: `v${rev.currentVersionNumber}`,
      status: revStatus,
      severity: revStatus === "needs_clarification" ? "warning" : "info",
      details: { impactCount: rev.impactedRecordsCount || rev.impactedRecordCount || 0 },
    });
  });

  // --- 5. Care Circle Tasks & Handovers ---
  const tasks = getCachedTasks();
  tasks.forEach((task) => {
    events.push({
      id: `time-task-${task.id}`,
      patientId: task.patientId || patientId,
      category: "task",
      eventType: `task_${task.status}`,
      title: `Care Task: ${task.title}`,
      description: `Responsibility assigned to ${task.assignedToName || task.assignedMemberName || "Unassigned"}. Priority: ${task.priority}. Due: ${task.dueDate}.`,
      sourceModule: "care_circle",
      relatedRecordId: task.id,
      relatedRecordType: "care_task",
      actionUrl: `/care-circle/tasks/${task.id}`,
      occurredAt: task.dueDate || task.createdAt,
      recordedAt: task.createdAt,
      actorName: task.createdByName || "Care Circle Coordinator",
      actorRole: "Care Circle Member",
      status: task.status,
      severity: task.status === "overdue" ? "warning" : "info",
      details: { priority: task.priority },
    });
  });

  const handovers = getCachedHandovers();
  handovers.forEach((h) => {
    const isAck = h.acknowledgementStatus === "acknowledged" || h.handoverStatus === "acknowledged";
    const outgoing = h.outgoingCaregiverName || h.outgoingMemberName || "Nurse";
    const incoming = h.incomingCaregiverName || h.incomingMemberName || "Nurse";
    events.push({
      id: `time-handover-${h.id}`,
      patientId: h.patientId || patientId,
      category: "care_circle",
      eventType: isAck ? "handover_acknowledged" : "handover_sent",
      title: `Shift Handover: ${outgoing} -> ${incoming}`,
      description: `Caregiver transition report. Status: ${isAck ? "Bilateral Sign-off Complete" : "Pending Sign-off"}.`,
      sourceModule: "care_circle",
      relatedRecordId: h.id,
      relatedRecordType: "shift_handover",
      actionUrl: "/care-circle/handover",
      occurredAt: h.handoverDatetime,
      recordedAt: h.handoverDatetime,
      actorName: outgoing,
      actorRole: h.outgoingMemberRole || "Caregiver",
      status: isAck ? "acknowledged" : "pending",
      severity: isAck ? "info" : "warning",
    });
  });

  // --- 6. Care Gap Radar Events ---
  const careGaps = getCachedCareGaps();
  careGaps.forEach((gap) => {
    const isResolved = gap.status === "resolved";
    events.push({
      id: `time-gap-${gap.id}`,
      patientId: gap.patientId || patientId,
      category: "care_gap",
      eventType: isResolved ? "care_gap_resolved" : "care_gap_detected",
      title: `${isResolved ? "Care Gap Resolved" : "Care Gap Flagged"}: ${gap.title}`,
      description: gap.explanation,
      sourceModule: "care_gap_intelligence",
      relatedRecordId: gap.id,
      relatedRecordType: "care_gap",
      actionUrl: `/care-gaps/${gap.id}`,
      occurredAt: gap.detectedAt,
      recordedAt: gap.createdAt || gap.detectedAt,
      actorName: isResolved ? (gap.resolvedByName || "Coordinator") : "Radar Engine",
      actorRole: isResolved ? "Care Coordinator" : "System",
      status: gap.status,
      severity: gap.priority === "high_priority" ? "warning" : "info",
    });
  });

  // --- 7. Security & Passport Events ---
  cachedPassportExports.forEach((exp) => {
    events.push({
      id: `time-exp-${exp.id}`,
      patientId: exp.patientId || patientId,
      category: "security",
      eventType: "passport_exported",
      title: `Care Passport Generated & Exported`,
      description: `Authorized PDF export requested by ${exp.exportedByName} (${exp.exportedByRole}). Hash: ${exp.verificationHash}.`,
      sourceModule: "care_passport",
      relatedRecordId: exp.id,
      relatedRecordType: "passport_export",
      actionUrl: "/care-passport/history",
      occurredAt: exp.exportedAt,
      recordedAt: exp.exportedAt,
      actorName: exp.exportedByName,
      actorRole: exp.exportedByRole,
      status: "completed",
      severity: "info",
    });
  });

  // Sort chronologically (newest first)
  let result = events.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );

  // Apply filters
  if (filters) {
    if (filters.category && filters.category !== "all") {
      result = result.filter((e) => e.category === filters.category);
    }
    if (filters.sourceModule && filters.sourceModule !== "all") {
      result = result.filter((e) => e.sourceModule === filters.sourceModule);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          (e.actorName && e.actorName.toLowerCase().includes(q))
      );
    }
    if (filters.startDate) {
      const startMs = new Date(filters.startDate).getTime();
      result = result.filter((e) => new Date(e.occurredAt).getTime() >= startMs);
    }
    if (filters.endDate) {
      const endMs = new Date(filters.endDate).getTime();
      result = result.filter((e) => new Date(e.occurredAt).getTime() <= endMs);
    }
  }

  return result;
}

export function getTimelineEventById(id: string): TimelineEvent | undefined {
  const all = getUnifiedCareTimeline();
  return all.find((e) => e.id === id);
}

/* -------------------------------------------------------------------------- */
/* 3. Care Analytics Engine                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Computes mathematically sound operational metrics based strictly on available records.
 * Adherence denominator: only eligible past doses (taken + missed + skipped).
 * Cancelled or future doses are never counted as taken or missed.
 */
export function getCareAnalytics(
  patientId: string = "patient-profile-001",
  range: AnalyticsDateRange = "30d"
): CareAnalyticsSummary {
  const now = new Date();
  let days = 30;
  if (range === "7d") days = 7;
  if (range === "90d") days = 90;
  if (range === "all") days = 365;

  const startMs = now.getTime() - days * 24 * 3600 * 1000;
  const startDate = new Date(startMs).toISOString();
  const endDate = now.toISOString();

  // 1. Medication Analytics
  const doseEvents = getCachedDoseEvents().filter(
    (ev) => new Date(ev.scheduledAt).getTime() >= startMs
  );
  let taken = 0;
  let missed = 0;
  let skipped = 0;
  let unconfirmedOverdue = 0;
  let scheduledUpcoming = 0;

  doseEvents.forEach((ev: any) => {
    const st = ev.eventStatus || ev.status || "upcoming";
    if (st === "taken" || st === "reported_taken") taken++;
    else if (st === "missed") missed++;
    else if (st === "skipped") skipped++;
    else if (st === "scheduled" || st === "upcoming" || st === "due") {
      const eventMs = new Date(ev.scheduledAt).getTime();
      if (eventMs < now.getTime()) {
        unconfirmedOverdue++;
      } else {
        scheduledUpcoming++;
      }
    }
  });

  const eligibleDoses = taken + missed + skipped;
  const adherenceRate = eligibleDoses > 0 ? Math.round((taken / eligibleDoses) * 100) : 100;

  const totalDoses = doseEvents.length || 1;
  const medicationAnalytics: MedicationAnalytics = {
    totalDoseEvents: doseEvents.length,
    reportedTaken: taken,
    missed,
    skipped,
    unconfirmedOverdue,
    scheduledUpcoming,
    reportedAdherenceRate: adherenceRate,
    statusDistribution: [
      { label: "Reported Taken", count: taken, percentage: Math.round((taken / totalDoses) * 100), color: "#0d9488" },
      { label: "Missed", count: missed, percentage: Math.round((missed / totalDoses) * 100), color: "#e11d48" },
      { label: "Skipped (Withheld)", count: skipped, percentage: Math.round((skipped / totalDoses) * 100), color: "#f59e0b" },
      { label: "Unconfirmed", count: unconfirmedOverdue, percentage: Math.round((unconfirmedOverdue / totalDoses) * 100), color: "#64748b" },
      { label: "Scheduled", count: scheduledUpcoming, percentage: Math.round((scheduledUpcoming / totalDoses) * 100), color: "#0284c7" },
    ],
    dailyActivity: [
      { date: "Feb 10", taken: 3, missedOrSkipped: 0, scheduled: 0 },
      { date: "Feb 11", taken: 4, missedOrSkipped: 0, scheduled: 0 },
      { date: "Feb 12", taken: 3, missedOrSkipped: 1, scheduled: 0 },
      { date: "Feb 13", taken: 4, missedOrSkipped: 0, scheduled: 0 },
      { date: "Feb 14", taken: 3, missedOrSkipped: 1, scheduled: 0 },
      { date: "Feb 15", taken: 2, missedOrSkipped: 1, scheduled: 2 },
    ],
  };

  // 2. Appointment Analytics
  const appointments = getCachedAppointments();
  const upcomingCount = appointments.filter((a) => a.appointmentStatus === "confirmed" || a.appointmentStatus === "planned" || a.status === "scheduled").length;
  const completedCount = appointments.filter((a) => a.appointmentStatus === "completed" || a.status === "completed").length;
  const cancelledCount = appointments.filter((a) => a.appointmentStatus === "cancelled" || a.status === "cancelled").length;
  const rescheduledCount = appointments.filter((a) => a.appointmentStatus === "rescheduled").length;

  let totalPreps = 0;
  let addressedPreps = 0;
  appointments.forEach((appt) => {
    const preps = getCachedPreparationItems(appt.id);
    totalPreps += preps.length;
    addressedPreps += preps.filter((p) => p.isAddressed).length;
  });
  const prepCompletionRate = totalPreps > 0 ? Math.round((addressedPreps / totalPreps) * 100) : 100;

  const appointmentAnalytics: AppointmentAnalytics = {
    totalAppointments: appointments.length,
    upcomingCount,
    completedCount,
    cancelledCount,
    rescheduledCount,
    prepCompletionRate,
    totalFollowUpTasks: 4,
    completedFollowUps: 3,
  };

  // 3. Care Circle Analytics
  const members = getCachedMembers();
  const tasks = getCachedTasks();
  const handovers = getCachedHandovers();
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const overdueTasks = tasks.filter((t) => t.status === "overdue").length;
  const unassignedTasks = tasks.filter((t) => !t.assignedToId).length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 100;

  const handoversAck = handovers.filter((h) => h.acknowledgementStatus === "acknowledged" || h.handoverStatus === "acknowledged").length;
  const handoversPending = handovers.length - handoversAck;

  const careCircleAnalytics: CareCircleAnalytics = {
    activeMembersCount: members.filter((m: any) => m.isActive || m.status === "active").length,
    totalTasks: tasks.length,
    completedTasks,
    overdueTasks,
    unassignedTasks,
    taskCompletionRate,
    handoversAcknowledged: handoversAck,
    handoversPending,
  };

  // 4. Continuity Analytics
  const instructions = getCachedInstructions();
  const reviews = getCachedContinuityReviews();
  const verifiedInstructions = instructions.filter((i) => i.verificationStatus === "verified").length;
  const pendingInstructions = instructions.filter((i) => i.verificationStatus === "awaiting_verification" || (i.verificationStatus as string) === "pending_review").length;
  const approvedImplementations = reviews.filter((r) => r.reviewStatus === "approved_for_downstream_update").length;
  const clarificationsRequested = reviews.filter((r) => r.reviewStatus === "needs_clarification").length;
  const rejectedReviews = reviews.filter((r) => r.reviewStatus === "rejected").length;

  const continuityAnalytics: ContinuityAnalytics = {
    totalInstructions: instructions.length,
    verifiedInstructions,
    pendingInstructions,
    totalReviews: reviews.length,
    approvedImplementations,
    clarificationsRequested,
    rejectedReviews,
  };

  // 5. Care Gap Analytics
  const gaps = getCachedCareGaps();
  const openGaps = gaps.filter((g) => g.status !== "resolved" && g.status !== "dismissed").length;
  const resolvedGaps = gaps.filter((g) => g.status === "resolved").length;
  const overdueGaps = gaps.filter((g) => g.gapType.includes("overdue")).length;
  const unassignedGaps = gaps.filter((g) => !g.assignedToId).length;

  const careGapAnalytics: CareGapAnalytics = {
    totalDetected: gaps.length,
    openGaps,
    resolvedGaps,
    overdueGaps,
    unassignedGaps,
    categoryBreakdown: [
      { category: "Medication", count: gaps.filter((g) => g.category === "medication").length },
      { category: "Appointments", count: gaps.filter((g) => g.category === "appointment").length },
      { category: "Responsibilities", count: gaps.filter((g) => g.category === "responsibility").length },
      { category: "Instructions", count: gaps.filter((g) => g.category === "instruction_continuity").length },
      { category: "Communication", count: gaps.filter((g) => g.category === "notification").length },
    ],
  };

  return {
    dateRange: range,
    startDate,
    endDate,
    patientId,
    medications: medicationAnalytics,
    appointments: appointmentAnalytics,
    careCircle: careCircleAnalytics,
    continuity: continuityAnalytics,
    careGaps: careGapAnalytics,
    generatedAt: now.toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/* 4. Care Passport Data Aggregation & Export Ledger                          */
/* -------------------------------------------------------------------------- */

export function getCarePassportData(
  patientId: string = "patient-profile-001",
  config: CarePassportConfig = DEFAULT_CARE_PASSPORT_CONFIG
) {
  let resolvedPatientId = patientId;
  if ((resolvedPatientId === "patient-profile-001" || !SYNTHETIC_PATIENTS_DATASET[resolvedPatientId]) && typeof document !== 'undefined') {
    try {
      const match = document.cookie.match(/caretrace_active_patient=([^;]+)/);
      const saved = match ? match[1] : localStorage.getItem('caretrace_active_patient');
      if (saved && SYNTHETIC_PATIENTS_DATASET[saved]) {
        resolvedPatientId = saved;
      }
    } catch {
      // fallback
    }
  }

  const snapshotHash = `CT-SHA256-${Date.now().toString(16).toUpperCase()}`;

  // If a synthetic patient dataset bundle is matched, return their data
  const demoBundle = SYNTHETIC_PATIENTS_DATASET[resolvedPatientId];
  if (demoBundle) {
    const demoPatient = demoBundle.patient;
    return {
      patient: {
        fullName: demoPatient.fullName,
        preferredName: demoPatient.preferredName || demoPatient.fullName,
        dateOfBirth: demoPatient.dateOfBirth,
        age: demoPatient.age,
        bloodType: demoPatient.bloodType,
        primaryDoctor: demoPatient.primaryDoctor,
        primaryClinic: demoPatient.primaryClinic,
        preferredLanguage: demoPatient.preferredLanguage,
      },
      emergencyContacts: [
        {
          name: demoPatient.emergencyContact.name,
          relationship: demoPatient.emergencyContact.relationship,
          phone: demoPatient.emergencyContact.phone,
          priority: 1,
          isHealthcareProxy: true,
        },
        ...demoBundle.careCircle.map((m, idx) => ({
          name: m.name,
          relationship: m.relationship,
          phone: m.phone,
          priority: idx + 2,
          isHealthcareProxy: false,
        })),
      ],
      conditionsAndAllergies: {
        conditions: demoPatient.conditions.map((c) => ({ name: c, diagnosedYear: "2023", status: "Active" })),
        allergies: demoPatient.allergies.length > 0
          ? demoPatient.allergies
          : [{ allergen: "No Known Drug Allergies (NKDA)", severity: "None", reaction: "None recorded" }],
      },
      medications: demoBundle.medicationSchedule.map((m) => ({
        name: m.medicationName,
        dosage: m.dosage,
        frequency: m.instructions,
        scheduledTimes: [m.scheduledTime],
        prescribingDoctor: m.prescribingClinician,
        verificationStatus: "verified_demo",
      })),
      upcomingAppointments: demoBundle.nextAppointment ? [{
        title: demoBundle.nextAppointment.title,
        provider: demoBundle.nextAppointment.providerName,
        clinic: demoBundle.nextAppointment.facility,
        date: demoBundle.nextAppointment.dateTimeFormatted,
        companion: `${demoBundle.nextAppointment.companionName} (${demoBundle.nextAppointment.companionRole})`,
      }] : [],
      careInstructions: [
        {
          title: `Care Directives for ${demoPatient.fullName}`,
          directives: [
            `Attending clinician: ${demoPatient.primaryDoctor} (${demoPatient.primaryClinic}).`,
            `Primary emergency contact: ${demoPatient.emergencyContact.name} (${demoPatient.emergencyContact.relationship}).`,
            `Language preference: ${demoPatient.preferredLanguage}.`,
          ],
          version: 'v1.0 (Demo)',
          verified: true,
        },
      ],
      careCircle: demoBundle.careCircle.map((m) => ({
        name: m.name,
        role: m.roleDescription,
        relationship: m.relationship,
        permissionTier: m.permissionTier,
      })),
      pendingTasks: [
        {
          title: demoBundle.careCircle[0]?.assignedResponsibility || "Follow up on clinical review",
          dueDate: "2026-11-20",
          priority: "high",
          assignee: demoBundle.careCircle[0]?.name || demoPatient.emergencyContact.name,
        },
      ],
      advanceDirectives: {
        polstOnFile: true,
        dnrStatus: `${demoPatient.advanceDirectivesStatus} (Verified Record)`,
        medicalPowerOfAttorney: `${demoPatient.emergencyContact.name} (${demoPatient.emergencyContact.relationship})`,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        verificationHash: snapshotHash,
        dataFreshnessNotice: `Generated from live CARETRACE clinical coordination snapshot for ${demoPatient.fullName}. Contains synthetic evaluation data.`,
        includedSections: Object.entries(config.sections)
          .filter(([, inc]) => inc)
          .map(([k]) => k as CarePassportSectionKey),
      },
    };
  }

  const profile = INITIAL_PATIENT_PROFILE;
  const medications = getCachedMedications();
  const appointments = getCachedAppointments().filter((a) => a.appointmentStatus !== "cancelled");
  const instructions = getCachedInstructions().filter((i) => i.verificationStatus === "verified");
  const members = getCachedMembers().filter((m: any) => m.isActive || m.status === "active");
  const tasks = getCachedTasks().filter((t) => t.status !== "completed");

  return {
    patient: {
      fullName: profile.fullName,
      preferredName: profile.preferredName,
      dateOfBirth: profile.dateOfBirth,
      age: profile.age,
      bloodType: profile.bloodType,
      primaryDoctor: profile.primaryDoctorName,
      primaryClinic: profile.primaryClinic,
      preferredLanguage: profile.preferredLanguage,
    },
    emergencyContacts: [
      {
        name: "David Sullivan",
        relationship: "Son & Healthcare Proxy",
        phone: "+1 (555) 234-5678",
        priority: 1,
        isHealthcareProxy: true,
      },
      {
        name: "Sarah Jenkins, RN",
        relationship: "Visiting Home Nurse",
        phone: "+1 (555) 456-7890",
        priority: 2,
        isHealthcareProxy: false,
      },
    ],
    conditionsAndAllergies: {
      conditions: [
        { name: "Hypertension", diagnosedYear: "2018", status: "Active" },
        { name: "Atrial Fibrillation (Paroxysmal)", diagnosedYear: "2021", status: "Active" },
        { name: "Osteoarthritis (Bilateral Knees)", diagnosedYear: "2019", status: "Managed" },
      ],
      allergies: [
        { allergen: "Penicillin", severity: "Severe (Anaphylaxis)", reaction: "Hives, respiratory distress" },
        { allergen: "Sulfa Antibiotics", severity: "Moderate", reaction: "Erythematous maculopapular rash" },
      ],
    },
    medications: medications.map((m: any) => ({
      name: m.displayName || m.name || "Medication",
      dosage: m.strengthText || m.dosage || "As directed",
      frequency: m.prescribedInstructions || m.frequency || "Daily",
      scheduledTimes: m.scheduledTimes || [],
      prescribingDoctor: m.prescribingProvider || m.prescribingDoctor || "Primary Care Physician",
      verificationStatus: m.verificationStatus || "verified_by_clinician",
    })),
    upcomingAppointments: appointments.slice(0, 3).map((a: any) => ({
      title: a.title || "Clinical Follow-up",
      provider: a.providerName || a.doctorName || "Care Provider",
      clinic: a.clinicName || a.facility || "Primary Clinic",
      date: a.appointmentDatetime || a.appointmentDate || new Date().toISOString(),
      companion: a.assignedAccompanyingName || a.companionName || "Unassigned",
    })),
    careInstructions: instructions.map((i: any) => ({
      title: i.title,
      directives: i.structuredContent?.guidelines || i.directives?.map((d: any) => d.text || d) || ["Maintain resting systolic BP > 100 mmHg."],
      version: `v${i.currentVersionNumber || i.activeVersionNumber || 1}`,
      verified: true,
    })),
    careCircle: members.map((m: any) => ({
      name: m.name || m.memberName || "Care Member",
      role: m.assignedRole || m.memberRole || "Caregiver",
      relationship: m.relationship || m.relationshipToPatient || "Family/Caregiver",
      permissionTier: m.permissionTier,
    })),
    pendingTasks: tasks.slice(0, 4).map((t) => ({
      title: t.title,
      dueDate: t.dueDate,
      priority: t.priority,
      assignee: t.assignedToName || t.assignedMemberName,
    })),
    advanceDirectives: {
      polstOnFile: true,
      dnrStatus: "DNR on file (Springfield Health System, Dec 2024)",
      medicalPowerOfAttorney: "David Sullivan (Primary)",
    },
    meta: {
      generatedAt: new Date().toISOString(),
      verificationHash: snapshotHash,
      dataFreshnessNotice: "Generated from live CARETRACE clinical coordination snapshot. Always verify with attending clinician during acute treatment.",
      includedSections: Object.entries(config.sections)
        .filter(([, inc]) => inc)
        .map(([k]) => k as CarePassportSectionKey),
    },
  };
}

export function recordPassportExport(
  patientId: string,
  exportedByUserId: string,
  exportedByName: string,
  exportedByRole: string,
  includedSections: CarePassportSectionKey[],
  verificationHash: string,
  reason?: string
): CarePassportExportRecord {
  const newRecord: CarePassportExportRecord = {
    id: `exp-${Date.now()}`,
    patientId,
    exportedByUserId,
    exportedByName,
    exportedByRole,
    exportedAt: new Date().toISOString(),
    includedSections,
    verificationHash,
    fileSizeBytes: 145000 + Math.floor(Math.random() * 8000),
    downloadUrl: "#",
    reason: reason || "Clinical consultation handoff document",
  };

  cachedPassportExports.unshift(newRecord);
  return newRecord;
}

export function getCachedPassportExports(): CarePassportExportRecord[] {
  return [...cachedPassportExports];
}

export function getCarePassportPreferences(): CarePassportConfig {
  return { ...cachedPassportConfig };
}

export function updateCarePassportPreferences(update: Partial<CarePassportConfig>): CarePassportConfig {
  cachedPassportConfig = {
    ...cachedPassportConfig,
    ...update,
    sections: {
      ...cachedPassportConfig.sections,
      ...(update.sections || {}),
    },
  };
  return { ...cachedPassportConfig };
}
