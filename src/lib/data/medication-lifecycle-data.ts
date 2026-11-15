/**
 * Medication Lifecycle Data Store & Idempotent Dose Engine
 * CARETRACE — Intelligent Healthcare Continuity Network
 * PromptWars × Catalyst 2026
 *
 * Implements auditable medication management, versioning, idempotent dose generation,
 * and adherence recording without autonomous clinical decision-making.
 */

import { 
  MedicationRecord, 
  MedicationVersion, 
  DoseEvent, 
  AdherenceSummary,
  DoseEventStatus,
  CaregiverMedicationAssignment
} from "@/types/caretrace";

// Baseline Medications for Margaret Sullivan (78y)
export const INITIAL_MEDICATIONS: MedicationRecord[] = [
  {
    id: "med-001",
    patientId: "patient-profile-001",
    displayName: "Lisinopril",
    genericName: "Lisinopril USP",
    strengthText: "10mg",
    form: "Tablet",
    routeText: "Oral",
    prescribedInstructions: "Take 1 tablet (10mg) by mouth once daily in the morning with a full glass of water. Monitor blood pressure weekly.",
    prescribingProvider: "Dr. Eleanor Vance, MD (Cardiology)",
    pharmacy: "Walgreens Pharmacy #4821",
    rxNumber: "RX-994101",
    refillsRemaining: 1,
    refillDueDate: "2026-02-18",
    effectiveStartDate: "2024-03-10",
    sourceType: "physician_prescribed",
    sourceReference: "St. Jude Hospital Discharge Summary #DS-2024-118",
    verificationStatus: "verified",
    verifiedAt: "2026-01-15T10:00:00Z",
    verifiedByName: "Dr. Eleanor Vance, MD",
    status: "active",
    scheduledTimes: ["08:00"],
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    notes: "Primary anti-hypertensive therapy. Refill alert triggered (3 days remaining).",
    sideEffects: ["Mild dry cough", "Dizziness upon standing"],
    foodInstructions: "May be taken with or without food. Maintain consistent hydration.",
    assignedMemberName: "David Sullivan",
    assignedMemberRole: "Primary Family Coordinator",
    versionNumber: 1,
    createdAt: "2024-03-10T08:00:00Z",
    updatedAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "med-002",
    patientId: "patient-profile-001",
    displayName: "Vitamin D3",
    genericName: "Cholecalciferol",
    strengthText: "2000 IU",
    form: "Capsule",
    routeText: "Oral",
    prescribedInstructions: "Take 1 softgel capsule (2000 IU) by mouth once daily with breakfast.",
    prescribingProvider: "Dr. Robert Chen, MD (Geriatrics)",
    pharmacy: "CVS Caremark Mail Order",
    rxNumber: "RX-442109",
    refillsRemaining: 3,
    refillDueDate: "2026-04-30",
    effectiveStartDate: "2023-11-01",
    sourceType: "physician_prescribed",
    sourceReference: "Annual Geriatric Wellness Review",
    verificationStatus: "verified",
    verifiedAt: "2026-01-10T14:30:00Z",
    verifiedByName: "Dr. Robert Chen, MD",
    status: "active",
    scheduledTimes: ["08:00"],
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    notes: "Bone density support for knee osteoarthritis.",
    foodInstructions: "Take with food containing healthy fats for optimal absorption.",
    assignedMemberName: "David Sullivan",
    assignedMemberRole: "Primary Family Coordinator",
    versionNumber: 1,
    createdAt: "2023-11-01T08:00:00Z",
    updatedAt: "2026-01-10T14:30:00Z",
  },
  {
    id: "med-003",
    patientId: "patient-profile-001",
    displayName: "Metoprolol Tartrate",
    genericName: "Metoprolol Tartrate",
    strengthText: "25mg",
    form: "Tablet",
    routeText: "Oral",
    prescribedInstructions: "Take 1 tablet (25mg) by mouth in the evening with food. Do not skip evening dose.",
    prescribingProvider: "Dr. Eleanor Vance, MD (Cardiology)",
    pharmacy: "Walgreens Pharmacy #4821",
    rxNumber: "RX-883204",
    refillsRemaining: 2,
    refillDueDate: "2026-03-25",
    effectiveStartDate: "2024-08-20",
    sourceType: "physician_prescribed",
    sourceReference: "Cardiology Outpatient Follow-up",
    verificationStatus: "verified",
    verifiedAt: "2026-01-15T10:00:00Z",
    verifiedByName: "Dr. Eleanor Vance, MD",
    status: "active",
    scheduledTimes: ["20:00"],
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    notes: "Rate control. Take pulse prior to evening dose; report if < 55 bpm.",
    sideEffects: ["Fatigue", "Cold extremities"],
    foodInstructions: "Take with or immediately after evening meal.",
    assignedMemberName: "Sarah Jenkins, RN",
    assignedMemberRole: "Visiting Home Nurse",
    versionNumber: 1,
    createdAt: "2024-08-20T20:00:00Z",
    updatedAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "med-004",
    patientId: "patient-profile-001",
    displayName: "Coenzyme Q10 (CoQ10)",
    genericName: "Ubiquinone",
    strengthText: "100mg",
    form: "Capsule",
    routeText: "Oral",
    prescribedInstructions: "Take 1 softgel (100mg) by mouth with morning meal.",
    pharmacy: "Over-the-counter retail",
    refillsRemaining: 0,
    effectiveStartDate: "2026-02-13",
    sourceType: "family_entered",
    sourceReference: "Family coordinator log (David Sullivan)",
    verificationStatus: "awaiting_review",
    status: "awaiting_verification",
    scheduledTimes: ["08:00"],
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    notes: "Over-the-counter supplement added by David Sullivan. Awaiting Dr. Vance cardiologist review at upcoming Feb 20 visit.",
    assignedMemberName: "David Sullivan",
    assignedMemberRole: "Family Care Coordinator",
    versionNumber: 1,
    createdAt: "2026-02-13T16:45:00Z",
    updatedAt: "2026-02-13T16:45:00Z",
  },
];

// Baseline Version History Records
export const INITIAL_MEDICATION_VERSIONS: MedicationVersion[] = [
  {
    id: "ver-001",
    medicationId: "med-001",
    versionNumber: 1,
    displayName: "Lisinopril",
    strengthText: "10mg",
    prescribedInstructions: "Take 1 tablet (10mg) by mouth once daily in the morning with water.",
    status: "active",
    verificationStatus: "verified",
    changeReason: "Initial baseline prescription imported from St. Jude Discharge Summary",
    changedByName: "Dr. Eleanor Vance, MD",
    changedByRole: "Attending Cardiologist",
    createdAt: "2024-03-10T08:00:00Z",
  },
  {
    id: "ver-002",
    medicationId: "med-003",
    versionNumber: 1,
    displayName: "Metoprolol Tartrate",
    strengthText: "25mg",
    prescribedInstructions: "Take 1 tablet (25mg) by mouth in the evening with food.",
    status: "active",
    verificationStatus: "verified",
    changeReason: "Prescription initiated during cardiology consult",
    changedByName: "Dr. Eleanor Vance, MD",
    changedByRole: "Attending Cardiologist",
    createdAt: "2024-08-20T20:00:00Z",
  },
  {
    id: "ver-003",
    medicationId: "med-004",
    versionNumber: 1,
    displayName: "Coenzyme Q10 (CoQ10)",
    strengthText: "100mg",
    prescribedInstructions: "Take 1 softgel (100mg) by mouth with morning meal.",
    status: "awaiting_verification",
    verificationStatus: "awaiting_review",
    changeReason: "Family coordinator recorded over-the-counter dietary supplement",
    changedByName: "David Sullivan",
    changedByRole: "Family Care Coordinator",
    createdAt: "2026-02-13T16:45:00Z",
  },
];

// In-Memory mutable collections for demo session
let cachedMedications: MedicationRecord[] = [...INITIAL_MEDICATIONS];
let cachedVersions: MedicationVersion[] = [...INITIAL_MEDICATION_VERSIONS];
let cachedDoseEvents: DoseEvent[] = [];

/**
 * Idempotent Dose Event Generator
 * Generates scheduled occurrences for a given date string (YYYY-MM-DD) based strictly on active schedules.
 * Guarantees that running multiple times never creates duplicate doses (OWASP & Clinical Safety).
 */
export function generateDoseEventsForDate(patientId: string, dateStr: string): DoseEvent[] {
  const dateObj = new Date(dateStr + "T00:00:00");
  const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat

  // Only approved/active medications generate scheduled dose events
  const eligibleMedications = cachedMedications.filter(
    (m) => (m.status === "active" || m.status === "awaiting_verification") && m.daysOfWeek.includes(dayOfWeek)
  );

  eligibleMedications.forEach((med) => {
    med.scheduledTimes.forEach((time) => {
      const scheduledAt = `${dateStr}T${time}:00`;
      const idempotencyKey = `med_${med.id}_${dateStr}_${time}`;

      // Check if event already exists
      const existing = cachedDoseEvents.find((e) => e.idempotencyKey === idempotencyKey);
      if (!existing) {
        // Determine initial event status based on current time
        const now = new Date();
        const eventDate = new Date(scheduledAt);
        let initialStatus: DoseEventStatus = "upcoming";

        if (now > eventDate) {
          // If in the past today, mark as due
          initialStatus = "due";
        }

        const newEvent: DoseEvent = {
          id: `dose-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          patientId,
          medicationId: med.id,
          medicationName: med.displayName,
          dosage: med.strengthText,
          scheduleId: `sched-${med.id}`,
          scheduledAt,
          scheduledTime: time,
          timezone: "America/Chicago",
          eventStatus: initialStatus,
          idempotencyKey,
        };

        cachedDoseEvents.push(newEvent);
      }
    });
  });

  return cachedDoseEvents
    .filter((e) => e.scheduledAt.startsWith(dateStr))
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}

// Pre-populate today's dose events with realistic baseline states
const todayStr = new Date().toISOString().split("T")[0];
generateDoseEventsForDate("patient-profile-001", todayStr);

// Set realistic initial states for Margaret's today schedule
const morningLisinopril = cachedDoseEvents.find(
  (e) => e.medicationName === "Lisinopril" && e.scheduledAt.startsWith(todayStr)
);
if (morningLisinopril) {
  morningLisinopril.eventStatus = "reported_taken";
  morningLisinopril.reportedAt = `${todayStr}T08:14:00Z`;
  morningLisinopril.reportedByName = "Margaret Sullivan";
  morningLisinopril.reportedByRole = "Patient";
  morningLisinopril.adherenceNotes = "Taken with breakfast and full glass of water.";
}

const morningVitD = cachedDoseEvents.find(
  (e) => e.medicationName === "Vitamin D3" && e.scheduledAt.startsWith(todayStr)
);
if (morningVitD) {
  morningVitD.eventStatus = "reported_taken";
  morningVitD.reportedAt = `${todayStr}T08:14:00Z`;
  morningVitD.reportedByName = "Margaret Sullivan";
  morningVitD.reportedByRole = "Patient";
}

const eveningMetoprolol = cachedDoseEvents.find(
  (e) => e.medicationName === "Metoprolol Tartrate" && e.scheduledAt.startsWith(todayStr)
);
if (eveningMetoprolol) {
  eveningMetoprolol.eventStatus = "upcoming";
}

const morningCoQ10 = cachedDoseEvents.find(
  (e) => e.medicationName.includes("CoQ10") && e.scheduledAt.startsWith(todayStr)
);
if (morningCoQ10) {
  morningCoQ10.eventStatus = "awaiting_confirmation";
  morningCoQ10.adherenceNotes = "Awaiting evening check-in by David Sullivan.";
}

/**
 * Record an adherence event action
 */
export function recordDoseAdherence(
  doseEventId: string,
  action: "report_taken" | "report_skipped" | "record_missed" | "mark_awaiting_confirmation",
  reporterName: string,
  reporterRole: string,
  notes?: string,
  reasonCode?: string
): { success: boolean; event?: DoseEvent; error?: string } {
  const event = cachedDoseEvents.find((e) => e.id === doseEventId);
  if (!event) {
    return { success: false, error: "Dose event not found" };
  }

  const statusMap: Record<string, DoseEventStatus> = {
    report_taken: "reported_taken",
    report_skipped: "skipped",
    record_missed: "missed",
    mark_awaiting_confirmation: "awaiting_confirmation",
  };

  event.eventStatus = statusMap[action];
  event.reportedAt = new Date().toISOString();
  event.reportedByName = reporterName;
  event.reportedByRole = reporterRole;
  if (notes) event.adherenceNotes = notes;

  return { success: true, event };
}

/**
 * Calculates adherence statistics with transparent formula explanation
 */
export function calculateAdherenceMetrics(events: DoseEvent[]): AdherenceSummary {
  const nonCancelled = events.filter((e) => e.eventStatus !== "cancelled");
  const totalScheduled = nonCancelled.length;
  const reportedTaken = nonCancelled.filter((e) => e.eventStatus === "reported_taken").length;
  const skipped = nonCancelled.filter((e) => e.eventStatus === "skipped").length;
  const missed = nonCancelled.filter((e) => e.eventStatus === "missed").length;
  const awaitingConfirmation = nonCancelled.filter((e) => e.eventStatus === "awaiting_confirmation").length;

  const rate = totalScheduled > 0 ? Math.round((reportedTaken / totalScheduled) * 100) : 100;

  return {
    totalScheduled,
    reportedTaken,
    skipped,
    missed,
    awaitingConfirmation,
    adherenceRatePercentage: rate,
    explanation: "Adherence rate is calculated as (Reported Taken Doses ÷ Total Scheduled Non-Cancelled Doses) × 100. Reported taken indicates an authorized user logged consumption; it does not replace clinical verification.",
  };
}

export function getCachedMedications(): MedicationRecord[] {
  return cachedMedications;
}

export function getCachedDoseEvents(): DoseEvent[] {
  return cachedDoseEvents;
}

export function getCachedVersions(): MedicationVersion[] {
  return cachedVersions;
}

export function addMedication(med: MedicationRecord): void {
  cachedMedications.push(med);
  cachedVersions.push({
    id: `ver-${Date.now()}`,
    medicationId: med.id,
    versionNumber: 1,
    displayName: med.displayName,
    strengthText: med.strengthText,
    prescribedInstructions: med.prescribedInstructions,
    status: med.status,
    verificationStatus: med.verificationStatus,
    changeReason: "Initial creation of prescription record",
    changedByName: med.assignedMemberName || "Authorized User",
    changedByRole: "Care Coordinator",
    createdAt: new Date().toISOString(),
  });
}

export function updateMedication(
  id: string,
  updates: Partial<MedicationRecord>,
  changeReason: string,
  editorName: string,
  editorRole: string
): MedicationRecord | null {
  const index = cachedMedications.findIndex((m) => m.id === id);
  if (index === -1) return null;

  const prev = cachedMedications[index];
  const nextVersion = prev.versionNumber + 1;

  cachedMedications[index] = {
    ...prev,
    ...updates,
    versionNumber: nextVersion,
    updatedAt: new Date().toISOString(),
  };

  // Archive previous version in auditable version history
  cachedVersions.push({
    id: `ver-${Date.now()}`,
    medicationId: id,
    versionNumber: nextVersion,
    displayName: updates.displayName || prev.displayName,
    strengthText: updates.strengthText || prev.strengthText,
    prescribedInstructions: updates.prescribedInstructions || prev.prescribedInstructions,
    status: updates.status || prev.status,
    verificationStatus: updates.verificationStatus || prev.verificationStatus,
    changeReason,
    changedByName: editorName,
    changedByRole: editorRole,
    createdAt: new Date().toISOString(),
  });

  return cachedMedications[index];
}

export function verifyMedicationRecord(
  medId: string,
  decision: "verified" | "needs_clarification",
  verifierName: string,
  verifierRole: string,
  clarificationNotes?: string
): MedicationRecord | null {
  const index = cachedMedications.findIndex((m) => m.id === medId);
  if (index === -1) return null;

  const med = cachedMedications[index];
  med.verificationStatus = decision;
  if (decision === "verified") {
    med.status = "active";
    med.verifiedAt = new Date().toISOString();
    med.verifiedByName = `${verifierName} (${verifierRole})`;
  } else {
    med.status = "awaiting_verification";
    if (clarificationNotes) {
      med.notes = `[CLARIFICATION REQUIRED] ${clarificationNotes}. Previous note: ${med.notes || ''}`;
    }
  }
  med.updatedAt = new Date().toISOString();

  cachedVersions.push({
    id: `ver-${Date.now()}`,
    medicationId: medId,
    versionNumber: med.versionNumber + 1,
    displayName: med.displayName,
    strengthText: med.strengthText,
    prescribedInstructions: med.prescribedInstructions,
    status: med.status,
    verificationStatus: decision,
    changeReason: decision === "verified" ? "Clinician verified prescription instruction" : `Clarification requested: ${clarificationNotes || 'Clinical review needed'}`,
    changedByName: verifierName,
    changedByRole: verifierRole,
    createdAt: new Date().toISOString(),
  });

  return med;
}
