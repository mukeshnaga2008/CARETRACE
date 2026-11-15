/**
 * Appointment Intelligence Data Store & Coordination Services
 * CARETRACE — Intelligent Healthcare Continuity Network
 * PromptWars × Catalyst 2026
 *
 * Implements structured appointment records, timezone-aware scheduling,
 * visit preparation checklists, post-visit outcome recording, and Care Circle follow-ups.
 */

import { 
  AppointmentRecord, 
  AppointmentPreparationItem, 
  AppointmentNote, 
  AppointmentFollowUpTask, 
  AppointmentHistoryEntry 
} from "@/types/caretrace";

// Baseline Appointments for Margaret Sullivan (78y)
export const INITIAL_APPOINTMENTS: AppointmentRecord[] = [
  {
    id: "appt-001",
    patientId: "patient-profile-001",
    title: "Cardiology Follow-up & Blood Pressure Review",
    appointmentType: "follow_up",
    providerName: "Dr. Eleanor Vance, MD",
    clinicName: "Metropolitan Heart Centre",
    departmentOrSpecialty: "Cardiology & Hypertension Clinic",
    locationText: "Suite 300, 450 Health Parkway, Springfield, IL 62704",
    appointmentDatetime: "2026-02-20T14:30:00",
    timezone: "America/Chicago",
    estimatedDurationMinutes: 45,
    appointmentStatus: "confirmed",
    bookingReference: "MHC-99214",
    contactInformation: "(555) 789-2345 (Clinic Desk)",
    preparationNotes: "Fasting required 2 hours prior for in-clinic basic metabolic panel. Bring home blood pressure log.",
    assignedAccompanyingName: "David Sullivan",
    assignedAccompanyingRole: "Son & Family Care Coordinator",
    transportationNeeded: true,
    createdBy: "Dr. Eleanor Vance, MD",
    updatedBy: "David Sullivan",
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-02-10T11:00:00Z",
    // Backwards-compatible aliases
    facility: "Metropolitan Heart Centre",
    specialty: "Cardiology",
    locationAddress: "Suite 300, 450 Health Parkway, Springfield, IL 62704",
    appointmentDate: "2026-02-20T14:30:00",
    durationMinutes: 45,
    transportNeeded: true,
    companionName: "David Sullivan",
    preparationInstructions: "Fasting required 2 hours prior for in-clinic basic metabolic panel.",
    agendaQuestions: [
      "Should Margaret continue taking CoQ10 100mg alongside Lisinopril?",
      "Blood pressure has averaged 132/82 in morning; does morning Lisinopril dose need adjustment?",
    ],
    status: "confirmed",
  },
  {
    id: "appt-002",
    patientId: "patient-profile-001",
    title: "Annual Geriatric Wellness & Cognitive Assessment",
    appointmentType: "doctor_consultation",
    providerName: "Dr. Robert Chen, MD",
    clinicName: "St. Jude Geriatric & Primary Care",
    departmentOrSpecialty: "Geriatric Medicine",
    locationText: "Building B, 1200 Mercy Drive, Springfield, IL 62702",
    appointmentDatetime: "2026-03-12T10:00:00",
    timezone: "America/Chicago",
    estimatedDurationMinutes: 60,
    appointmentStatus: "confirmed",
    bookingReference: "STJ-77148",
    contactInformation: "(555) 456-1122",
    preparationNotes: "Bring updated medication list including over-the-counter supplements and reading glasses.",
    assignedAccompanyingName: "Sarah Jenkins, RN",
    assignedAccompanyingRole: "Visiting Home Nurse",
    transportationNeeded: false,
    createdBy: "David Sullivan",
    updatedBy: "David Sullivan",
    createdAt: "2026-01-20T14:00:00Z",
    updatedAt: "2026-01-20T14:00:00Z",
    facility: "St. Jude Geriatric & Primary Care",
    specialty: "Geriatrics",
    locationAddress: "Building B, 1200 Mercy Drive, Springfield, IL 62702",
    appointmentDate: "2026-03-12T10:00:00",
    durationMinutes: 60,
    transportNeeded: false,
    companionName: "Sarah Jenkins, RN",
    status: "confirmed",
  },
  {
    id: "appt-003",
    patientId: "patient-profile-001",
    title: "Knee Osteoarthritis Physical Therapy Intake",
    appointmentType: "therapy_appointment",
    providerName: "Apex Rehabilitation Services",
    clinicName: "Apex Sports & Senior Mobility",
    departmentOrSpecialty: "Physical Therapy",
    locationText: "810 Lincoln Way, Springfield, IL 62703",
    appointmentDatetime: "2026-02-26T11:15:00",
    timezone: "America/Chicago",
    estimatedDurationMinutes: 60,
    appointmentStatus: "awaiting_confirmation",
    bookingReference: "APX-PENDING",
    contactInformation: "(555) 334-9988",
    preparationNotes: "Wear comfortable loose-fitting clothing and supportive walking sneakers.",
    assignedAccompanyingName: "David Sullivan",
    assignedAccompanyingRole: "Son & Family Care Coordinator",
    transportationNeeded: true,
    createdBy: "Sarah Jenkins, RN",
    updatedBy: "Sarah Jenkins, RN",
    createdAt: "2026-02-12T09:30:00Z",
    updatedAt: "2026-02-12T09:30:00Z",
    facility: "Apex Sports & Senior Mobility",
    specialty: "Physical Therapy",
    locationAddress: "810 Lincoln Way, Springfield, IL 62703",
    appointmentDate: "2026-02-26T11:15:00",
    durationMinutes: 60,
    transportNeeded: true,
    companionName: "David Sullivan",
    status: "scheduled",
  },
  {
    id: "appt-004",
    patientId: "patient-profile-001",
    title: "Post-Discharge Cardiac Rhythm Follow-up",
    appointmentType: "follow_up",
    providerName: "Dr. Eleanor Vance, MD",
    clinicName: "Metropolitan Heart Centre",
    departmentOrSpecialty: "Cardiology",
    locationText: "Suite 300, 450 Health Parkway, Springfield, IL 62704",
    appointmentDatetime: "2026-01-15T09:30:00",
    timezone: "America/Chicago",
    estimatedDurationMinutes: 45,
    appointmentStatus: "completed",
    bookingReference: "MHC-88102",
    contactInformation: "(555) 789-2345",
    assignedAccompanyingName: "David Sullivan",
    assignedAccompanyingRole: "Son & Family Care Coordinator",
    transportationNeeded: true,
    createdBy: "Dr. Eleanor Vance, MD",
    updatedBy: "Dr. Eleanor Vance, MD",
    createdAt: "2025-12-20T10:00:00Z",
    updatedAt: "2026-01-15T11:00:00Z",
    facility: "Metropolitan Heart Centre",
    specialty: "Cardiology",
    locationAddress: "Suite 300, 450 Health Parkway, Springfield, IL 62704",
    appointmentDate: "2026-01-15T09:30:00",
    durationMinutes: 45,
    transportNeeded: true,
    companionName: "David Sullivan",
    status: "completed",
  },
  {
    id: "appt-005",
    patientId: "patient-profile-001",
    title: "Routine Dental Cleaning & Checkup",
    appointmentType: "doctor_consultation",
    providerName: "Dr. Alan Miller, DDS",
    clinicName: "Springfield Family Dental Care",
    departmentOrSpecialty: "Dentistry",
    locationText: "220 South 6th St, Springfield, IL 62701",
    appointmentDatetime: "2026-01-08T15:00:00",
    timezone: "America/Chicago",
    estimatedDurationMinutes: 45,
    appointmentStatus: "cancelled",
    cancellationReason: "Rescheduled due to winter snow storm and low road visibility for patient transport.",
    cancelledAt: "2026-01-08T08:30:00Z",
    createdBy: "David Sullivan",
    updatedBy: "David Sullivan",
    createdAt: "2025-12-10T12:00:00Z",
    updatedAt: "2026-01-08T08:30:00Z",
    facility: "Springfield Family Dental Care",
    specialty: "Dentistry",
    locationAddress: "220 South 6th St, Springfield, IL 62701",
    appointmentDate: "2026-01-08T15:00:00",
    durationMinutes: 45,
    status: "cancelled",
  },
];

// Baseline Preparation Items
export const INITIAL_PREPARATION_ITEMS: AppointmentPreparationItem[] = [
  {
    id: "prep-001",
    appointmentId: "appt-001",
    patientId: "patient-profile-001",
    itemType: "question",
    title: "Should Margaret continue taking CoQ10 100mg alongside Lisinopril?",
    notes: "David Sullivan added over-the-counter CoQ10 on Feb 13. Awaiting cardiologist formal review.",
    isAddressed: false,
    createdByName: "David Sullivan",
    createdByRole: "Family Care Coordinator",
    createdAt: "2026-02-13T17:00:00Z",
  },
  {
    id: "prep-002",
    appointmentId: "appt-001",
    patientId: "patient-profile-001",
    itemType: "discussion_topic",
    title: "Blood pressure has averaged 132/82 in morning; evaluate Lisinopril 10mg efficacy.",
    notes: "Readings have been stable with no hypertensive episodes above 140/90.",
    isAddressed: false,
    createdByName: "Sarah Jenkins, RN",
    createdByRole: "Visiting Home Nurse",
    createdAt: "2026-02-14T09:15:00Z",
  },
  {
    id: "prep-003",
    appointmentId: "appt-001",
    patientId: "patient-profile-001",
    itemType: "document_to_bring",
    title: "Printout of past 14-day blood pressure and medication adherence log.",
    notes: "Export from CARETRACE Care Passport before departure.",
    isAddressed: false,
    createdByName: "David Sullivan",
    createdByRole: "Family Care Coordinator",
    createdAt: "2026-02-14T18:00:00Z",
  },
  {
    id: "prep-004",
    appointmentId: "appt-001",
    patientId: "patient-profile-001",
    itemType: "symptom_note",
    title: "Mild postural dizziness upon standing quickly noted twice this past week.",
    notes: "Nurse checked orthostatic BP on Feb 14: sitting 130/80, standing 122/76.",
    isAddressed: false,
    createdByName: "Sarah Jenkins, RN",
    createdByRole: "Visiting Home Nurse",
    createdAt: "2026-02-14T09:30:00Z",
  },
];

// Baseline Visit Outcomes
export const INITIAL_APPOINTMENT_NOTES: AppointmentNote[] = [
  {
    id: "note-001",
    appointmentId: "appt-004",
    patientId: "patient-profile-001",
    visitDate: "2026-01-15",
    providerName: "Dr. Eleanor Vance, MD",
    summaryText: "Patient evaluated 30 days post-discharge. Blood pressure well controlled on Lisinopril 10mg daily and Metoprolol Tartrate 25mg evening. Resting heart rate 68 bpm, sinus rhythm. No pedal edema noted. Reinforce consistent hydration and weekly blood pressure logs.",
    authorName: "Dr. Eleanor Vance, MD",
    authorRole: "Attending Cardiologist",
    sourceProvenance: "clinician_provided",
    verificationStatus: "verified",
    followUpInstructions: "Schedule routine outpatient follow-up in 5 weeks (Feb 2026). Fasting lab panel 2h prior.",
    documentsReference: "MHC Clinic Visit Note #CN-2026-0115",
    createdAt: "2026-01-15T11:00:00Z",
  },
];

// Baseline Follow-up Tasks
export const INITIAL_FOLLOW_UP_TASKS: AppointmentFollowUpTask[] = [
  {
    id: "task-001",
    patientId: "patient-profile-001",
    appointmentId: "appt-001",
    title: "Obtain Lisinopril prescription refill from Walgreens #4821",
    description: "Refill remaining: 1. Refill alert triggered to prevent disruption before Feb 18.",
    dueAt: "2026-02-18",
    assignedToName: "David Sullivan",
    assignedToRole: "Family Care Coordinator",
    taskStatus: "in_progress",
    sourceReference: "Refill Radar & Dr. Vance Visit Schedule",
    createdByName: "CARETRACE Continuity Engine",
    createdAt: "2026-02-10T08:00:00Z",
    updatedAt: "2026-02-12T10:00:00Z",
  },
  {
    id: "task-002",
    patientId: "patient-profile-001",
    appointmentId: "appt-001",
    title: "Fasting basic metabolic panel lab draw 2 hours prior to 2:30 PM appointment",
    description: "Metropolitan Heart Centre Lab (Suite 105). Margaret must not eat after 12:30 PM.",
    dueAt: "2026-02-20",
    assignedToName: "David Sullivan",
    assignedToRole: "Son & Escort Driver",
    taskStatus: "pending",
    sourceReference: "Dr. Eleanor Vance Appointment Pre-Order",
    createdByName: "Dr. Eleanor Vance, MD",
    createdAt: "2026-01-15T10:30:00Z",
    updatedAt: "2026-01-15T10:30:00Z",
  },
  {
    id: "task-003",
    patientId: "patient-profile-001",
    appointmentId: "appt-001",
    title: "Record daily morning blood pressure readings in CARETRACE portal",
    description: "Take resting BP at 08:00 AM before taking Lisinopril tablet.",
    dueAt: "2026-02-19",
    assignedToName: "Margaret Sullivan",
    assignedToRole: "Patient",
    taskStatus: "in_progress",
    sourceReference: "Hypertension Monitoring Plan",
    createdByName: "Sarah Jenkins, RN",
    createdAt: "2026-02-12T09:00:00Z",
    updatedAt: "2026-02-14T08:00:00Z",
  },
  {
    id: "task-004",
    patientId: "patient-profile-001",
    appointmentId: "appt-002",
    title: "Review cognitive exercise workbook prior to Dr. Chen geriatric review",
    description: "Complete mild memory and orientation exercises.",
    dueAt: "2026-03-10",
    assignedToName: "Sarah Jenkins, RN",
    assignedToRole: "Visiting Home Nurse",
    taskStatus: "pending",
    sourceReference: "St. Jude Geriatric Wellness Preparation",
    createdByName: "David Sullivan",
    createdAt: "2026-01-20T14:30:00Z",
    updatedAt: "2026-01-20T14:30:00Z",
  },
];

// Baseline Appointment History Logs
export const INITIAL_APPOINTMENT_HISTORY: AppointmentHistoryEntry[] = [
  {
    id: "hist-001",
    appointmentId: "appt-001",
    versionNumber: 1,
    changeType: "created",
    changeReason: "Outpatient follow-up scheduled following Jan 15 clinical consultation",
    newDatetime: "2026-02-20T14:30:00",
    changedByName: "Dr. Eleanor Vance, MD",
    changedByRole: "Attending Cardiologist",
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "hist-002",
    appointmentId: "appt-001",
    versionNumber: 2,
    changeType: "updated",
    changeReason: "David Sullivan confirmed accompanying transport and driving role",
    changedByName: "David Sullivan",
    changedByRole: "Family Care Coordinator",
    createdAt: "2026-02-10T11:00:00Z",
  },
  {
    id: "hist-003",
    appointmentId: "appt-005",
    versionNumber: 1,
    changeType: "created",
    changeReason: "Routine 6-month dental cleaning appointment booked",
    newDatetime: "2026-01-08T15:00:00",
    changedByName: "David Sullivan",
    changedByRole: "Family Care Coordinator",
    createdAt: "2025-12-10T12:00:00Z",
  },
  {
    id: "hist-004",
    appointmentId: "appt-005",
    versionNumber: 2,
    changeType: "cancelled",
    changeReason: "Rescheduled due to winter snow storm and low road visibility for patient transport.",
    changedByName: "David Sullivan",
    changedByRole: "Family Care Coordinator",
    createdAt: "2026-01-08T08:30:00Z",
  },
];

// Mutable in-memory stores for demo session
let cachedAppointments: AppointmentRecord[] = [...INITIAL_APPOINTMENTS];
let cachedPreparationItems: AppointmentPreparationItem[] = [...INITIAL_PREPARATION_ITEMS];
let cachedAppointmentNotes: AppointmentNote[] = [...INITIAL_APPOINTMENT_NOTES];
let cachedFollowUpTasks: AppointmentFollowUpTask[] = [...INITIAL_FOLLOW_UP_TASKS];
let cachedAppointmentHistory: AppointmentHistoryEntry[] = [...INITIAL_APPOINTMENT_HISTORY];

export function getCachedAppointments(): AppointmentRecord[] {
  return cachedAppointments;
}

export function getCachedPreparationItems(appointmentId?: string): AppointmentPreparationItem[] {
  if (appointmentId) {
    return cachedPreparationItems.filter((i) => i.appointmentId === appointmentId);
  }
  return cachedPreparationItems;
}

export function getCachedAppointmentNotes(appointmentId?: string): AppointmentNote[] {
  if (appointmentId) {
    return cachedAppointmentNotes.filter((n) => n.appointmentId === appointmentId);
  }
  return cachedAppointmentNotes;
}

export function getCachedFollowUpTasks(appointmentId?: string): AppointmentFollowUpTask[] {
  if (appointmentId) {
    return cachedFollowUpTasks.filter((t) => t.appointmentId === appointmentId);
  }
  return cachedFollowUpTasks;
}

export function getCachedAppointmentHistory(appointmentId?: string): AppointmentHistoryEntry[] {
  if (appointmentId) {
    return cachedAppointmentHistory.filter((h) => h.appointmentId === appointmentId);
  }
  return cachedAppointmentHistory;
}

export function addAppointment(appointment: AppointmentRecord): void {
  cachedAppointments.push(appointment);
  cachedAppointmentHistory.push({
    id: `hist-${Date.now()}`,
    appointmentId: appointment.id,
    versionNumber: 1,
    changeType: "created",
    changeReason: "New clinical appointment registered in CARETRACE",
    newDatetime: appointment.appointmentDatetime,
    changedByName: appointment.createdBy || "Authorized User",
    changedByRole: "Care Circle Coordinator",
    createdAt: new Date().toISOString(),
  });
}

export function updateAppointment(
  id: string,
  updates: Partial<AppointmentRecord>,
  changeReason: string,
  editorName: string,
  editorRole: string
): AppointmentRecord | null {
  const index = cachedAppointments.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const prev = cachedAppointments[index];
  const updatedAppt: AppointmentRecord = {
    ...prev,
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: editorName,
  };

  cachedAppointments[index] = updatedAppt;

  cachedAppointmentHistory.push({
    id: `hist-${Date.now()}`,
    appointmentId: id,
    versionNumber: cachedAppointmentHistory.filter(h => h.appointmentId === id).length + 1,
    changeType: "updated",
    changeReason,
    previousDatetime: prev.appointmentDatetime,
    newDatetime: updates.appointmentDatetime || prev.appointmentDatetime,
    changedByName: editorName,
    changedByRole: editorRole,
    createdAt: new Date().toISOString(),
  });

  return updatedAppt;
}

export function rescheduleAppointment(
  id: string,
  newDate: string,
  newTime: string,
  rescheduleReason: string,
  editorName: string,
  editorRole: string
): AppointmentRecord | null {
  const index = cachedAppointments.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const prev = cachedAppointments[index];
  const newDatetime = `${newDate}T${newTime}:00`;

  const updatedAppt: AppointmentRecord = {
    ...prev,
    appointmentDatetime: newDatetime,
    appointmentDate: newDatetime,
    appointmentStatus: "rescheduled",
    status: "rescheduled",
    updatedAt: new Date().toISOString(),
    updatedBy: editorName,
  };

  cachedAppointments[index] = updatedAppt;

  cachedAppointmentHistory.push({
    id: `hist-${Date.now()}`,
    appointmentId: id,
    versionNumber: cachedAppointmentHistory.filter(h => h.appointmentId === id).length + 1,
    changeType: "rescheduled",
    changeReason: rescheduleReason,
    previousDatetime: prev.appointmentDatetime,
    newDatetime,
    changedByName: editorName,
    changedByRole: editorRole,
    createdAt: new Date().toISOString(),
  });

  return updatedAppt;
}

export function cancelAppointment(
  id: string,
  cancellationReason: string,
  editorName: string,
  editorRole: string
): AppointmentRecord | null {
  const index = cachedAppointments.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const prev = cachedAppointments[index];
  const updatedAppt: AppointmentRecord = {
    ...prev,
    appointmentStatus: "cancelled",
    status: "cancelled",
    cancelledAt: new Date().toISOString(),
    cancellationReason,
    updatedAt: new Date().toISOString(),
    updatedBy: editorName,
  };

  cachedAppointments[index] = updatedAppt;

  cachedAppointmentHistory.push({
    id: `hist-${Date.now()}`,
    appointmentId: id,
    versionNumber: cachedAppointmentHistory.filter(h => h.appointmentId === id).length + 1,
    changeType: "cancelled",
    changeReason: cancellationReason,
    previousDatetime: prev.appointmentDatetime,
    changedByName: editorName,
    changedByRole: editorRole,
    createdAt: new Date().toISOString(),
  });

  return updatedAppt;
}

export function addPreparationItem(item: AppointmentPreparationItem): void {
  cachedPreparationItems.push(item);
}

export function togglePreparationItem(id: string, addressedNotes?: string): AppointmentPreparationItem | null {
  const item = cachedPreparationItems.find((i) => i.id === id);
  if (!item) return null;

  item.isAddressed = !item.isAddressed;
  if (addressedNotes) {
    item.addressedNotes = addressedNotes;
  }
  return item;
}

export function deletePreparationItem(id: string): boolean {
  const initialLength = cachedPreparationItems.length;
  cachedPreparationItems = cachedPreparationItems.filter((i) => i.id !== id);
  return cachedPreparationItems.length < initialLength;
}

export function recordVisitOutcome(note: AppointmentNote): AppointmentRecord | null {
  cachedAppointmentNotes.push(note);
  
  // Mark the appointment as completed
  const appt = cachedAppointments.find((a) => a.id === note.appointmentId);
  if (appt) {
    appt.appointmentStatus = "completed";
    appt.status = "completed";
    appt.updatedAt = new Date().toISOString();

    cachedAppointmentHistory.push({
      id: `hist-${Date.now()}`,
      appointmentId: appt.id,
      versionNumber: cachedAppointmentHistory.filter(h => h.appointmentId === appt.id).length + 1,
      changeType: "completed",
      changeReason: "Clinical visit outcome recorded by authorized attendee",
      changedByName: note.authorName,
      changedByRole: note.authorRole,
      createdAt: new Date().toISOString(),
    });
  }

  return appt || null;
}

export function addFollowUpTask(task: AppointmentFollowUpTask): void {
  cachedFollowUpTasks.push(task);
}

export function updateFollowUpTaskStatus(
  taskId: string,
  newStatus: AppointmentFollowUpTask["taskStatus"],
  completionNotes?: string
): AppointmentFollowUpTask | null {
  const task = cachedFollowUpTasks.find((t) => t.id === taskId);
  if (!task) return null;

  task.taskStatus = newStatus;
  task.updatedAt = new Date().toISOString();
  if (completionNotes) {
    task.completionNotes = completionNotes;
  }
  if (newStatus === "completed") {
    task.completedAt = new Date().toISOString();
  }

  return task;
}
