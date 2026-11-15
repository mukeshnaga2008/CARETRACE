/**
 * Care Circle Collaboration Data Store & Services
 * CARETRACE — Intelligent Healthcare Continuity Network
 * PromptWars × Catalyst 2026
 *
 * Implements member management, granular permissions, shared care tasks,
 * caregiver-to-family shift handovers, and collaboration audit logging.
 */

import { 
  CareCircleMember, 
  CareTask, 
  CareHandover, 
  Invitation, 
  CareCircleActivity 
} from "@/types/caretrace";

export const INITIAL_CARE_MEMBERS: CareCircleMember[] = [
  {
    id: "member-david",
    patientId: "patient-profile-001",
    name: "David Sullivan",
    email: "david.sullivan@caretrace.internal",
    phone: "(555) 019-2831",
    relationship: "Son & Healthcare Proxy",
    assignedRole: "family_coordinator",
    permissionTier: "full_admin",
    emergencyPriority: 1,
    isActive: true,
    membershipStatus: "active",
    joinedAt: "2024-01-10T09:00:00Z",
    permissions: [
      "view_profile",
      "edit_profile",
      "view_medications",
      "edit_medications",
      "log_adherence",
      "view_appointments",
      "manage_appointments",
      "manage_tasks",
      "manage_handovers",
      "manage_invitations",
      "manage_access_grants",
    ],
    currentResponsibilities: [
      "Vehicle escort & driving for clinical appointments",
      "Walgreens prescription refill management",
      "Primary emergency point of contact",
    ],
    lastActiveAt: "Active now",
  },
  {
    id: "member-sarah",
    patientId: "patient-profile-001",
    name: "Sarah Jenkins, RN",
    email: "s.jenkins@stjudehome.org",
    phone: "(555) 014-9921",
    relationship: "Visiting Home Nurse",
    assignedRole: "visiting_nurse",
    permissionTier: "caregiver_editor",
    emergencyPriority: 2,
    isActive: true,
    membershipStatus: "active",
    joinedAt: "2024-03-01T10:00:00Z",
    shiftTimes: "Mon / Wed / Fri Morning (08:00 – 12:00)",
    permissions: [
      "view_profile",
      "view_medications",
      "log_adherence",
      "view_appointments",
      "manage_tasks",
      "manage_handovers",
    ],
    currentResponsibilities: [
      "Tri-weekly blood pressure and resting vitals recording",
      "Morning medication administration confirmation",
      "Clinical shift handovers to family",
    ],
    lastActiveAt: "2 hours ago",
  },
  {
    id: "member-vance",
    patientId: "patient-profile-001",
    name: "Dr. Eleanor Vance, MD",
    email: "e.vance@metroheart.org",
    phone: "(555) 789-2345",
    relationship: "Attending Cardiologist",
    assignedRole: "specialist_physician",
    permissionTier: "caregiver_editor",
    emergencyPriority: 3,
    isActive: true,
    membershipStatus: "active",
    joinedAt: "2024-03-10T08:00:00Z",
    permissions: [
      "view_profile",
      "view_medications",
      "verify_medications",
      "view_appointments",
      "record_outcomes",
    ],
    currentResponsibilities: [
      "Cardiovascular therapy oversight",
      "Prescription instruction verification",
      "Outpatient consultations",
    ],
    lastActiveAt: "Yesterday",
  },
  {
    id: "member-chen",
    patientId: "patient-profile-001",
    name: "Dr. Robert Chen, MD",
    email: "r.chen@stjudemed.org",
    phone: "(555) 456-1122",
    relationship: "Primary Geriatrician",
    assignedRole: "specialist_physician",
    permissionTier: "caregiver_editor",
    emergencyPriority: 4,
    isActive: true,
    membershipStatus: "active",
    joinedAt: "2023-11-01T08:00:00Z",
    permissions: [
      "view_profile",
      "view_medications",
      "verify_medications",
      "view_appointments",
    ],
    currentResponsibilities: [
      "Annual wellness reviews and cognitive assessments",
      "Bone density & Vitamin D monitoring",
    ],
    lastActiveAt: "3 days ago",
  },
  {
    id: "member-mark",
    patientId: "patient-profile-001",
    name: "Mark Sullivan",
    email: "mark.sullivan@example.com",
    phone: "(555) 882-9901",
    relationship: "Son (Remote / Out of State)",
    assignedRole: "family_member",
    permissionTier: "family_viewer",
    emergencyPriority: 5,
    isActive: true,
    membershipStatus: "active",
    joinedAt: "2024-01-15T12:00:00Z",
    permissions: [
      "view_profile",
      "view_health_summary",
      "view_appointments",
    ],
    currentResponsibilities: [
      "Remote family observer",
      "Secondary weekend check-in",
    ],
    lastActiveAt: "5 days ago",
  },
  {
    id: "member-elena",
    patientId: "patient-profile-001",
    name: "Elena Rostova, DPT",
    email: "e.rostova@apexpt.org",
    phone: "(555) 334-9988",
    relationship: "Physical Therapist",
    assignedRole: "caregiver",
    permissionTier: "caregiver_editor",
    emergencyPriority: 6,
    isActive: false,
    membershipStatus: "invited",
    invitedAt: "2026-02-12T09:30:00Z",
    permissions: [
      "view_profile",
      "view_appointments",
      "manage_tasks",
    ],
    currentResponsibilities: [
      "Knee mobility and physical rehabilitation intake",
    ],
  },
];

export const INITIAL_CARE_TASKS: CareTask[] = [
  {
    id: "task-001",
    patientId: "patient-profile-001",
    title: "Obtain Lisinopril prescription refill from Walgreens #4821",
    category: "medication_refill",
    description: "Refill remaining: 1. Pick up before Feb 18 to ensure continuous anti-hypertensive therapy.",
    priority: "high",
    dueDate: "2026-02-18",
    status: "in_progress",
    assignedMemberId: "member-david",
    assignedMemberName: "David Sullivan",
    assignedMemberRole: "Family Care Coordinator",
    acknowledgementRequired: true,
    relatedMedicationId: "med-001",
    createdAt: "2026-02-10T08:00:00Z",
    updatedAt: "2026-02-12T10:00:00Z",
  },
  {
    id: "task-002",
    patientId: "patient-profile-001",
    title: "Fasting basic metabolic panel lab draw 2h prior to Dr. Vance appointment",
    category: "appointment_preparation",
    description: "Metropolitan Heart Centre Lab (Suite 105). Escort Margaret and confirm fasting since 12:30 PM.",
    priority: "urgent",
    dueDate: "2026-02-20",
    status: "accepted",
    assignedMemberId: "member-david",
    assignedMemberName: "David Sullivan",
    assignedMemberRole: "Family Care Coordinator",
    acknowledgementRequired: true,
    relatedAppointmentId: "appt-001",
    createdAt: "2026-01-15T10:30:00Z",
    updatedAt: "2026-02-10T11:00:00Z",
  },
  {
    id: "task-003",
    patientId: "patient-profile-001",
    title: "Record resting morning blood pressure reading in portal",
    category: "vitals_check",
    description: "Measure resting BP at 08:00 AM prior to morning Lisinopril tablet.",
    priority: "medium",
    dueDate: "2026-02-19",
    status: "in_progress",
    assignedMemberId: "member-sarah",
    assignedMemberName: "Sarah Jenkins, RN",
    assignedMemberRole: "Visiting Home Nurse",
    acknowledgementRequired: false,
    createdAt: "2026-02-12T09:00:00Z",
    updatedAt: "2026-02-14T08:00:00Z",
  },
  {
    id: "task-004",
    patientId: "patient-profile-001",
    title: "Review cognitive exercise workbook prior to Dr. Chen geriatric wellness visit",
    category: "general_care_activity",
    description: "Complete mild orientation exercises with Margaret.",
    priority: "low",
    dueDate: "2026-03-10",
    status: "assigned",
    assignedMemberId: "member-sarah",
    assignedMemberName: "Sarah Jenkins, RN",
    assignedMemberRole: "Visiting Home Nurse",
    acknowledgementRequired: true,
    relatedAppointmentId: "appt-002",
    createdAt: "2026-01-20T14:30:00Z",
  },
  {
    id: "task-005",
    patientId: "patient-profile-001",
    title: "Check resting radial pulse rate prior to evening Metoprolol Tartrate dose",
    category: "medication_reminder",
    description: "Do not administer if resting heart rate is below 55 bpm per Dr. Vance cardiology guidelines.",
    priority: "medium",
    dueDate: "2026-02-15",
    status: "pending",
    assignedMemberId: "member-david",
    assignedMemberName: "David Sullivan",
    assignedMemberRole: "Family Care Coordinator",
    acknowledgementRequired: true,
    relatedMedicationId: "med-003",
    createdAt: "2026-02-14T18:00:00Z",
  },
  {
    id: "task-006",
    patientId: "patient-profile-001",
    title: "Confirm wheelchair transport ramp availability for St. Jude appointment",
    category: "companion_ride",
    description: "Ensure building entrance ramp has clear winter snow clearance.",
    priority: "medium",
    dueDate: "2026-03-11",
    status: "unassigned",
    acknowledgementRequired: false,
    createdAt: "2026-02-14T19:00:00Z",
  },
];

export const INITIAL_HANDOVERS: CareHandover[] = [
  {
    id: "handover-001",
    patientId: "patient-profile-001",
    outgoingMemberId: "member-sarah",
    outgoingMemberName: "Sarah Jenkins, RN",
    outgoingMemberRole: "Visiting Home Nurse (Day Shift)",
    incomingMemberId: "member-david",
    incomingMemberName: "David Sullivan",
    incomingMemberRole: "Family Care Coordinator (Evening Shift)",
    handoverDatetime: "2026-02-15T12:30:00",
    timezone: "America/Chicago",
    relevantResponsibilities: [
      "Morning resting blood pressure recorded at 130/80 mmHg (normal range)",
      "Lisinopril 10mg and Vitamin D3 2000 IU confirmed taken with breakfast at 08:14",
      "Evening Metoprolol Tartrate 25mg scheduled for 20:00 with food",
    ],
    pendingTaskIds: ["task-001", "task-005"],
    nonClinicalNotes: "Margaret had great spirits today and walked 15 minutes in the backyard sun. Right knee was slightly tender upon climbing stairs, but she tolerated gentle seated stretches well. Her evening meal is prepared in the refrigerator; please remind her to take evening Metoprolol with dinner.",
    handoverStatus: "ready_for_handover",
    createdAt: "2026-02-15T12:00:00Z",
    updatedAt: "2026-02-15T12:00:00Z",
  },
];

export const INITIAL_INVITATIONS: Invitation[] = [
  {
    id: "inv-001",
    patientId: "patient-profile-001",
    invitedBy: "member-david",
    email: "e.rostova@apexpt.org",
    inviteeName: "Elena Rostova, DPT",
    relationship: "Physical Therapist",
    permissionTier: "caregiver_editor",
    token: "inv_tok_998124_secure_hash",
    status: "pending",
    expiresAt: "2026-02-22T09:30:00Z",
    createdAt: "2026-02-12T09:30:00Z",
  },
];

export const INITIAL_ACTIVITIES: CareCircleActivity[] = [
  {
    id: "act-001",
    patientId: "patient-profile-001",
    eventType: "handover_sent",
    title: "Nurse-to-Family Shift Handover Prepared",
    description: "Sarah Jenkins, RN prepared evening care handover for David Sullivan.",
    actorName: "Sarah Jenkins, RN",
    actorRole: "Visiting Home Nurse",
    timestamp: "2026-02-15T12:00:00Z",
  },
  {
    id: "act-002",
    patientId: "patient-profile-001",
    eventType: "task_completed",
    title: "Morning Medication Adherence Confirmed",
    description: "Lisinopril 10mg and Vitamin D3 reported taken with morning meal.",
    actorName: "Margaret Sullivan",
    actorRole: "Patient",
    timestamp: "2026-02-15T08:14:00Z",
  },
  {
    id: "act-003",
    patientId: "patient-profile-001",
    eventType: "task_assigned",
    title: "Cardiology Lab Escort Assigned",
    description: "Task 'Fasting metabolic panel draw' assigned to David Sullivan.",
    actorName: "Dr. Eleanor Vance, MD",
    actorRole: "Attending Cardiologist",
    timestamp: "2026-02-14T11:00:00Z",
  },
  {
    id: "act-004",
    patientId: "patient-profile-001",
    eventType: "member_invited",
    title: "Physical Therapist Invited to Circle",
    description: "Invitation dispatched to Elena Rostova, DPT (Apex Rehabilitation).",
    actorName: "David Sullivan",
    actorRole: "Family Care Coordinator",
    timestamp: "2026-02-12T09:30:00Z",
  },
];

// Mutable state for demo session
let cachedMembers: CareCircleMember[] = [...INITIAL_CARE_MEMBERS];
let cachedTasks: CareTask[] = [...INITIAL_CARE_TASKS];
let cachedHandovers: CareHandover[] = [...INITIAL_HANDOVERS];
let cachedInvitations: Invitation[] = [...INITIAL_INVITATIONS];
let cachedActivities: CareCircleActivity[] = [...INITIAL_ACTIVITIES];

export function getCachedMembers(): CareCircleMember[] {
  return cachedMembers;
}

export function getCachedTasks(): CareTask[] {
  return cachedTasks;
}

export function getCachedHandovers(): CareHandover[] {
  return cachedHandovers;
}

export function getCachedInvitations(): Invitation[] {
  return cachedInvitations;
}

export function getCachedActivities(): CareCircleActivity[] {
  return cachedActivities;
}

export function addMember(member: CareCircleMember): void {
  cachedMembers.push(member);
  cachedActivities.unshift({
    id: `act-${Date.now()}`,
    patientId: member.patientId,
    eventType: "member_joined",
    title: `${member.name} Joined Care Circle`,
    description: `${member.name} joined as ${member.relationship} with ${member.permissionTier} permissions.`,
    actorName: member.name,
    actorRole: member.relationship,
    timestamp: new Date().toISOString(),
  });
}

export function updateMemberRole(
  memberId: string,
  newRole: CareCircleMember["assignedRole"],
  newTier: CareCircleMember["permissionTier"],
  changeReason: string,
  editorName: string,
  editorRole: string
): CareCircleMember | null {
  const member = cachedMembers.find((m) => m.id === memberId);
  if (!member) return null;

  member.assignedRole = newRole;
  member.permissionTier = newTier;

  cachedActivities.unshift({
    id: `act-${Date.now()}`,
    patientId: member.patientId,
    eventType: "role_changed",
    title: `Permissions Updated for ${member.name}`,
    description: `Role changed to ${newRole} (${newTier}). Reason: ${changeReason}`,
    actorName: editorName,
    actorRole: editorRole,
    timestamp: new Date().toISOString(),
  });

  return member;
}

export function suspendMember(
  memberId: string,
  suspensionReason: string,
  editorName: string,
  editorRole: string
): CareCircleMember | null {
  const member = cachedMembers.find((m) => m.id === memberId);
  if (!member) return null;

  member.isActive = false;
  member.membershipStatus = "suspended";
  member.suspendedAt = new Date().toISOString();

  cachedActivities.unshift({
    id: `act-${Date.now()}`,
    patientId: member.patientId,
    eventType: "member_suspended",
    title: `Access Suspended for ${member.name}`,
    description: `Suspended by ${editorName}. Reason: ${suspensionReason}`,
    actorName: editorName,
    actorRole: editorRole,
    timestamp: new Date().toISOString(),
  });

  return member;
}

export function revokeMember(
  memberId: string,
  revocationReason: string,
  editorName: string,
  editorRole: string
): CareCircleMember | null {
  const member = cachedMembers.find((m) => m.id === memberId);
  if (!member) return null;

  member.isActive = false;
  member.membershipStatus = "revoked";
  member.revokedAt = new Date().toISOString();
  member.revocationReason = revocationReason;

  cachedActivities.unshift({
    id: `act-${Date.now()}`,
    patientId: member.patientId,
    eventType: "member_revoked",
    title: `Care Circle Access Revoked for ${member.name}`,
    description: `Revocation executed by ${editorName}. Reason: ${revocationReason}`,
    actorName: editorName,
    actorRole: editorRole,
    timestamp: new Date().toISOString(),
  });

  return member;
}

export function addInvitation(invitation: Invitation): void {
  cachedInvitations.push(invitation);
  cachedActivities.unshift({
    id: `act-${Date.now()}`,
    patientId: invitation.patientId,
    eventType: "member_invited",
    title: `Invitation Sent to ${invitation.inviteeName}`,
    description: `Secure invitation dispatched to ${invitation.email} for role ${invitation.relationship}.`,
    actorName: "David Sullivan",
    actorRole: "Family Care Coordinator",
    timestamp: new Date().toISOString(),
  });
}

export function cancelInvitation(invitationId: string): boolean {
  const inv = cachedInvitations.find((i) => i.id === invitationId);
  if (!inv) return false;
  inv.status = "declined";
  return true;
}

export function addCareTask(task: CareTask): void {
  cachedTasks.push(task);
  cachedActivities.unshift({
    id: `act-${Date.now()}`,
    patientId: task.patientId,
    eventType: "task_assigned",
    title: `New Care Task Created: ${task.title}`,
    description: `Assigned to ${task.assignedMemberName || "Care Circle Pool"} (Due: ${task.dueDate}).`,
    actorName: "David Sullivan",
    actorRole: "Family Care Coordinator",
    timestamp: new Date().toISOString(),
  });
}

export function updateCareTaskStatus(
  taskId: string,
  status: CareTask["status"],
  completionNotes?: string,
  actorName = "Authorized Member"
): CareTask | null {
  const task = cachedTasks.find((t) => t.id === taskId);
  if (!task) return null;

  task.status = status;
  task.updatedAt = new Date().toISOString();
  if (completionNotes) task.completionNotes = completionNotes;
  if (status === "completed") {
    task.completedAt = new Date().toISOString();
    task.completedByName = actorName;

    cachedActivities.unshift({
      id: `act-${Date.now()}`,
      patientId: task.patientId,
      eventType: "task_completed",
      title: `Task Completed: ${task.title}`,
      description: completionNotes ? `Completed: "${completionNotes}"` : `Completed by ${actorName}.`,
      actorName,
      actorRole: "Care Circle",
      timestamp: new Date().toISOString(),
    });
  }

  return task;
}

export function reassignCareTask(
  taskId: string,
  assignedMemberId: string,
  assignedMemberName: string,
  assignedMemberRole: string,
  reassignReason: string,
  editorName: string
): CareTask | null {
  const task = cachedTasks.find((t) => t.id === taskId);
  if (!task) return null;

  const prevAssignee = task.assignedMemberName;
  task.assignedMemberId = assignedMemberId;
  task.assignedMemberName = assignedMemberName;
  task.assignedMemberRole = assignedMemberRole;
  task.status = "assigned";
  task.updatedAt = new Date().toISOString();

  cachedActivities.unshift({
    id: `act-${Date.now()}`,
    patientId: task.patientId,
    eventType: "task_assigned",
    title: `Task Reassigned: ${task.title}`,
    description: `Reassigned from ${prevAssignee || "Pool"} to ${assignedMemberName}. Reason: ${reassignReason}`,
    actorName: editorName,
    actorRole: "Care Circle",
    timestamp: new Date().toISOString(),
  });

  return task;
}

export function addHandover(handover: CareHandover): void {
  cachedHandovers.push(handover);
  cachedActivities.unshift({
    id: `act-${Date.now()}`,
    patientId: handover.patientId,
    eventType: "handover_sent",
    title: `Care Shift Handover Submitted`,
    description: `Handover from ${handover.outgoingMemberName} to ${handover.incomingMemberName}.`,
    actorName: handover.outgoingMemberName,
    actorRole: handover.outgoingMemberRole,
    timestamp: new Date().toISOString(),
  });
}

export function acknowledgeHandover(
  handoverId: string,
  acknowledgerName: string,
  notes?: string
): CareHandover | null {
  const handover = cachedHandovers.find((h) => h.id === handoverId);
  if (!handover) return null;

  handover.handoverStatus = "acknowledged";
  handover.acknowledgedAt = new Date().toISOString();
  handover.acknowledgedByName = acknowledgerName;
  handover.updatedAt = new Date().toISOString();

  cachedActivities.unshift({
    id: `act-${Date.now()}`,
    patientId: handover.patientId,
    eventType: "handover_acknowledged",
    title: `Care Shift Handover Acknowledged`,
    description: `${acknowledgerName} reviewed and accepted active care responsibilities.`,
    actorName: acknowledgerName,
    actorRole: "Incoming Care Coordinator",
    timestamp: new Date().toISOString(),
  });

  return handover;
}

export function requestHandoverClarification(
  handoverId: string,
  question: string,
  requesterName: string
): CareHandover | null {
  const handover = cachedHandovers.find((h) => h.id === handoverId);
  if (!handover) return null;

  handover.handoverStatus = "needs_clarification";
  handover.clarificationNotes = question;
  handover.updatedAt = new Date().toISOString();

  cachedActivities.unshift({
    id: `act-${Date.now()}`,
    patientId: handover.patientId,
    eventType: "handover_clarification",
    title: `Handover Clarification Requested`,
    description: `${requesterName} asked: "${question}"`,
    actorName: requesterName,
    actorRole: "Care Circle",
    timestamp: new Date().toISOString(),
  });

  return handover;
}
