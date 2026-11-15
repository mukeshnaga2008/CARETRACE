// CARETRACE Core TypeScript Type Definitions
// PromptWars × Catalyst 2026

export type UserRole = 'patient' | 'family' | 'caregiver' | 'doctor' | 'admin';

export type PermissionTier = 'full_admin' | 'caregiver_editor' | 'family_viewer' | 'emergency_only' | 'clinician_access';

export type ConsentScope = 'full_medical' | 'medication_only' | 'emergency_summary' | 'care_circle_coordination';

export interface PatientProfile {
  id: string;
  userId?: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  dateOfBirth: string; // YYYY-MM-DD
  bloodType: string;
  emergencyPinHash?: string;
  allergies: Array<{ allergen: string; severity: 'Mild' | 'Moderate' | 'Severe'; reaction: string }>;
  chronicConditions: Array<{ condition: string; diagnosedYear: number; status: 'Active' | 'Managed' | 'Resolved' }>;
  advanceDirectives: {
    status: string;
    dnr: boolean;
    polstOnFile: boolean;
    proxyContactName: string;
    proxyPhone: string;
    notes?: string;
  };
  primaryDoctorName: string;
  primaryClinic: string;
  preferredLanguage: string;
  createdAt: string;
  updatedAt: string;
}

export type VerificationStatus = 'verified' | 'patient_reported' | 'pending_review';

export type InformationProvenance = 
  | 'patient_provided' 
  | 'family_entered' 
  | 'caregiver_entered' 
  | 'clinical_summary' 
  | 'pending_verification';

export interface EmergencyContact {
  id: string;
  patientId: string;
  contactName: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  priorityOrder: number;
  isAuthorizedCaregiver: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientPreferences {
  id: string;
  patientId: string;
  preferredName: string;
  preferredLanguage: string;
  preferredCommunicationMethod: 'phone' | 'sms' | 'email' | 'in_person';
  timeFormat: '12h' | '24h';
  largerText: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  voiceReadoutEnabled: boolean;
  timezone: string;
  accessibilityNotes?: string;
  notificationPreferences: {
    medicationReminders: boolean;
    appointmentReminders: boolean;
    careGapAlerts: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HealthInformationSource {
  id: string;
  patientId: string;
  category: 'allergies' | 'chronic_conditions' | 'advance_directives' | 'emergency_contacts' | 'care_preferences' | 'medications';
  sourceType: InformationProvenance;
  enteredByName: string;
  enteredByRole: string;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  verifiedByName?: string;
  details?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type MembershipStatus = 
  | 'invited' 
  | 'invitation_accepted' 
  | 'active' 
  | 'suspended' 
  | 'revoked' 
  | 'expired';

export type CareCircleAssignedRole = 
  | 'patient' 
  | 'family_coordinator' 
  | 'visiting_nurse' 
  | 'caregiver' 
  | 'specialist_physician' 
  | 'family_member';

export interface CareCircleMember {
  id: string;
  patientId: string;
  memberId?: string;
  name: string;
  email: string;
  phone: string;
  relationship: string; // 'Daughter', 'Son', 'Visiting RN', 'Primary Physician', etc.
  permissionTier: PermissionTier;
  emergencyPriority?: number; // 1 = First call
  isActive: boolean;
  avatarUrl?: string;
  lastActiveAt?: string;
  shiftTimes?: string;

  // Phase 8 Care Circle Collaboration Extensions
  membershipStatus?: MembershipStatus;
  assignedRole?: CareCircleAssignedRole;
  permissions?: string[];
  joinedAt?: string;
  invitedAt?: string;
  suspendedAt?: string;
  revokedAt?: string;
  revocationReason?: string;
  currentResponsibilities?: string[];
}

export interface Invitation {
  id: string;
  patientId: string;
  invitedBy: string;
  invitedByName?: string;
  email: string;
  inviteeName: string;
  relationship: string;
  permissionTier: PermissionTier;
  role?: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
  createdAt: string;
  personalNote?: string;
}

export interface ConsentRecord {
  id: string;
  patientId: string;
  grantedToId?: string;
  grantedToName?: string;
  scope: ConsentScope;
  isActive: boolean;
  grantedBy: string;
  grantedAt: string;
  revokedAt?: string;
  revocationReason?: string;
}

export interface AccessGrant {
  id: string;
  patientId: string;
  granteeIdentifier: string;
  grantType: 'standard' | 'break_glass_emergency' | 'temporary_clinician';
  accessPassToken: string;
  expiresAt: string;
  accessedCount: number;
  lastAccessedAt?: string;
  reason?: string;
  createdAt: string;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  genericName?: string;
  dosage: string;
  form: string; // 'Tablet', 'Capsule', 'Liquid', 'Injection', 'Patch'
  route: string; // 'Oral', 'Sublingual', 'Topical', etc.
  frequency: string; // 'Once daily in morning', 'Twice daily with meals', etc.
  scheduledTimes: string[]; // e.g. ['08:00', '20:00']
  prescribingDoctor: string;
  pharmacy: string;
  rxNumber: string;
  refillsRemaining: number;
  refillDueDate?: string;
  startDate: string;
  endDate?: string;
  storageInstructions?: string;
  foodInstructions?: string; // 'Take with food', 'Take on empty stomach'
  sideEffectWarnings: string[];
  isActive: boolean;
  sourceInstructionId?: string;
  createdAt: string;
  updatedAt: string;
}

export type MedicationStatus = 'active' | 'paused' | 'completed' | 'discontinued' | 'awaiting_verification';
export type MedicationSourceType = 'patient_provided' | 'family_entered' | 'caregiver_entered' | 'physician_prescribed' | 'imported_external';
export type MedicationVerificationStatus = 'unverified' | 'awaiting_review' | 'verified' | 'needs_clarification';
export type DoseEventStatus = 'upcoming' | 'due' | 'reported_taken' | 'skipped' | 'missed' | 'awaiting_confirmation' | 'cancelled';

export interface MedicationRecord {
  id: string;
  patientId: string;
  displayName: string;
  genericName?: string;
  strengthText: string;
  form: string;
  routeText: string;
  prescribedInstructions: string;
  prescribingProvider?: string;
  pharmacy?: string;
  rxNumber?: string;
  refillsRemaining: number;
  refillDueDate?: string;
  effectiveStartDate: string;
  effectiveEndDate?: string;
  sourceType: MedicationSourceType;
  sourceReference?: string;
  verificationStatus: MedicationVerificationStatus;
  verifiedAt?: string;
  verifiedByName?: string;
  status: MedicationStatus;
  scheduledTimes: string[];
  daysOfWeek: number[]; // 0 = Sun, 1 = Mon ... 6 = Sat
  notes?: string;
  sideEffects?: string[];
  foodInstructions?: string;
  assignedMemberName?: string;
  assignedMemberRole?: string;
  versionNumber: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface MedicationVersion {
  id: string;
  medicationId: string;
  versionNumber: number;
  displayName: string;
  strengthText: string;
  prescribedInstructions: string;
  status: MedicationStatus;
  verificationStatus: MedicationVerificationStatus;
  changeReason: string;
  changedByName: string;
  changedByRole: string;
  createdAt: string;
}

export interface MedicationSchedule {
  id: string;
  medicationId: string;
  patientId: string;
  scheduleType: 'daily' | 'specific_days' | 'as_needed';
  timesOfDay: string[];
  daysOfWeek: number[];
  timezone: string;
  startDate: string;
  endDate?: string;
  humanScheduleNotes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CaregiverMedicationAssignment {
  id: string;
  medicationId: string;
  patientId: string;
  assignedMemberId: string;
  assignedMemberName: string;
  assignedMemberRole: string;
  assignmentRole: 'primary_reminder' | 'administrator' | 'observer';
  status: 'active' | 'acknowledged' | 'inactive';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdherenceSummary {
  totalScheduled: number;
  reportedTaken: number;
  skipped: number;
  missed: number;
  awaitingConfirmation: number;
  adherenceRatePercentage: number;
  explanation: string;
}

export type DoseStatus = 'scheduled' | 'taken' | 'missed' | 'skipped' | 'delayed';

export interface DoseEvent {
  id: string;
  patientId: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledFor?: string; // ISO string
  doseLabel?: string; // 'Morning Dose (10mg)'
  status?: DoseStatus;
  loggedAt?: string;
  loggedByRole?: string;
  loggedByName?: string;
  reasonCode?: string;
  notes?: string;

  // Phase 6 Medication Lifecycle & Idempotency Extensions
  scheduleId?: string;
  scheduledAt: string;
  scheduledTime: string;
  timezone?: string;
  eventStatus: DoseEventStatus;
  idempotencyKey?: string;
  reportedAt?: string;
  reportedByName?: string;
  reportedByRole?: string;
  adherenceNotes?: string;
}

export interface AdherenceRecord {
  id: string;
  doseEventId: string;
  patientId: string;
  medicationId: string;
  status: DoseStatus;
  loggedAt: string;
  loggedById?: string;
  loggedByName: string;
  loggedByRole: string;
  reasonCode?: string;
  notes?: string;
}

export type AppointmentType = 
  | 'doctor_consultation' 
  | 'follow_up' 
  | 'diagnostic_visit' 
  | 'therapy_appointment' 
  | 'hospital_visit' 
  | 'other';

export type AppointmentStatus = 
  | 'planned' 
  | 'confirmed' 
  | 'rescheduled' 
  | 'completed' 
  | 'cancelled' 
  | 'missed' 
  | 'awaiting_confirmation'
  | 'scheduled';

export interface Appointment {
  id: string;
  patientId: string;
  title: string;
  appointmentType?: AppointmentType;
  providerName: string;
  clinicName?: string;
  departmentOrSpecialty?: string;
  locationText?: string;
  appointmentDatetime?: string; // ISO 8601 string (e.g. 2026-02-20T14:30:00)
  timezone?: string; // "America/Chicago"
  estimatedDurationMinutes?: number;
  appointmentStatus?: AppointmentStatus;
  bookingReference?: string;
  contactInformation?: string;
  preparationNotes?: string;
  assignedAccompanyingName?: string;
  assignedAccompanyingRole?: string;
  transportationNeeded?: boolean;
  createdBy?: string;
  updatedBy?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt?: string;

  // Backwards compatibility aliases with earlier mock models
  specialty?: string;
  doctorName?: string;
  facility?: string;
  locationAddress?: string;
  appointmentDate?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  status?: AppointmentStatus;
  durationMinutes?: number;
  transportNeeded?: boolean;
  companionMemberId?: string;
  companionName?: string;
  preparationInstructions?: string;
  agendaQuestions?: string[];
  postVisitNotes?: string;
}

export type AppointmentRecord = Appointment;

export interface AppointmentPreparationItem {
  id: string;
  appointmentId: string;
  patientId: string;
  itemType: 'question' | 'discussion_topic' | 'document_to_bring' | 'symptom_note';
  title: string;
  notes?: string;
  isAddressed: boolean;
  addressedNotes?: string;
  createdByName: string;
  createdByRole: string;
  createdAt: string;
}

export interface AppointmentNote {
  id: string;
  appointmentId: string;
  patientId: string;
  visitDate: string;
  providerName: string;
  summaryText: string;
  authorName: string;
  authorRole: string;
  sourceProvenance: 'patient_reported' | 'family_entered' | 'caregiver_entered' | 'clinician_provided';
  verificationStatus: 'verified' | 'unverified' | 'awaiting_review';
  followUpInstructions?: string;
  documentsReference?: string;
  createdAt: string;
}

export interface AppointmentFollowUpTask {
  id: string;
  patientId: string;
  appointmentId: string;
  title: string;
  description: string;
  dueAt?: string;
  assignedToName?: string;
  assignedToRole?: string;
  taskStatus: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'awaiting_clarification';
  sourceReference: string;
  createdByName: string;
  completionNotes?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentHistoryEntry {
  id: string;
  appointmentId: string;
  versionNumber: number;
  changeType: 'created' | 'rescheduled' | 'updated' | 'cancelled' | 'completed';
  changeReason: string;
  previousDatetime?: string;
  newDatetime?: string;
  changedByName: string;
  changedByRole: string;
  createdAt: string;
}

export type TaskCategory = 
  | 'medication_refill'
  | 'medication_reminder'
  | 'appointment_preparation'
  | 'appointment_followup'
  | 'appointment_escort'
  | 'vitals_check'
  | 'exercise_pt'
  | 'exercise_routine'
  | 'dietary'
  | 'dietary_prep'
  | 'supplies'
  | 'doctor_followup'
  | 'companion_ride'
  | 'general_care_activity'
  | 'general_observation'
  | 'lab_draw'
  | 'documentation_review'
  | 'care_handover'
  | 'other';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 
  | 'unassigned'
  | 'assigned'
  | 'accepted'
  | 'pending' 
  | 'in_progress' 
  | 'completed' 
  | 'overdue' 
  | 'cancelled';

export interface CareTask {
  id: string;
  patientId: string;
  title: string;
  category: TaskCategory;
  description: string;
  priority: TaskPriority;
  dueDate: string; // ISO string
  isRecurring?: boolean;
  recurrenceRule?: string;
  status: TaskStatus;
  assignedMemberId?: string;
  assignedMemberName?: string;
  assignedMemberRole?: string;
  assignedToId?: string;
  assignedToName?: string;
  assignedToRole?: string;
  completedAt?: string;
  completedByName?: string;
  acknowledgementRequired?: boolean;
  acknowledgedAt?: string;
  acknowledgedByName?: string;
  sourceInstructionId?: string;
  timezone?: string;
  completionNotes?: string;
  relatedMedicationId?: string;
  relatedAppointmentId?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
}

export type HandoverStatus = 
  | 'draft'
  | 'ready_for_handover'
  | 'sent'
  | 'acknowledged'
  | 'needs_clarification'
  | 'cancelled';

export interface CareHandover {
  id: string;
  patientId: string;
  outgoingMemberId?: string;
  outgoingMemberName: string;
  outgoingMemberRole: string;
  incomingMemberId?: string;
  incomingMemberName: string;
  incomingMemberRole: string;
  shiftPeriod?: string;
  handoverDatetime: string;
  timezone?: string;
  relevantResponsibilities: string[];
  pendingTaskIds?: string[];
  nonClinicalNotes: string;
  handoverStatus: HandoverStatus;
  outgoingCaregiverName?: string;
  incomingCaregiverName?: string;
  incomingCaregiverId?: string;
  shiftDate?: string;
  acknowledgementStatus?: string;
  acknowledgedAt?: string;
  acknowledgedByName?: string;
  clarificationNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CareCircleActivityEventType =
  | 'member_joined'
  | 'member_invited'
  | 'member_suspended'
  | 'member_revoked'
  | 'role_changed'
  | 'task_assigned'
  | 'task_accepted'
  | 'task_completed'
  | 'handover_sent'
  | 'handover_acknowledged'
  | 'handover_clarification';

export interface CareCircleActivity {
  id: string;
  patientId: string;
  eventType: CareCircleActivityEventType;
  title: string;
  description: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// CARE CONTINUITY ENGINE & INSTRUCTION VAULT
export type InstructionCategory = 
  | 'medication_related'
  | 'appointment_related'
  | 'general_care'
  | 'mobility_daily_routine'
  | 'dietary'
  | 'follow_up'
  | 'other';

export type InstructionVerificationStatus = 
  | 'draft'
  | 'awaiting_verification'
  | 'verified'
  | 'rejected'
  | 'superseded'
  | 'archived';

export type InstructionSourceType = 
  | 'healthcare_professional_document'
  | 'patient_or_representative_entry'
  | 'caregiver_provided'
  | 'appointment_follow_up'
  | 'hospital_discharge'
  | 'lab_diagnostic_report'
  | 'specialist_consult'
  | 'primary_care_visit'
  | 'lab_result'
  | 'patient_self_report'
  | 'other_documented_source';

export interface InstructionAttachment {
  id: string;
  instructionId?: string;
  sourceId?: string;
  fileName: string;
  fileSize: number; // in bytes
  mimeType: string;
  storagePath: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  description?: string;
}

export interface InstructionSource {
  id: string;
  patientId: string;
  sourceType: InstructionSourceType;
  title: string;
  facilityName?: string;
  providerName?: string;
  providerRole?: string;
  documentReference?: string;
  encounterDate?: string;
  rawNotes?: string;
  enteredBy: string;
  enteredByName: string;
  enteredByRole: string;
  entryTimestamp: string;
  verificationDetails?: string;
  isMissingSourceDetails?: boolean;
  notesAboutMissingSource?: string;
  attachments?: InstructionAttachment[];
  createdAt: string;
  updatedAt?: string;
}

export interface CareInstruction {
  id: string;
  patientId: string;
  title: string;
  category: InstructionCategory;
  description: string;
  structuredContent?: {
    frequency?: string;
    targetParameter?: string;
    guidelines?: string[];
    precautions?: string[];
    actionItems?: string[];
  };
  currentVersionNumber: number;
  verificationStatus: InstructionVerificationStatus;
  sourceId: string;
  source?: InstructionSource;
  effectiveDate?: string;
  expirationDate?: string;
  tags?: string[];
  
  // Connected Caretrace Entities
  relatedMedicationId?: string;
  relatedMedicationName?: string;
  relatedAppointmentId?: string;
  relatedAppointmentTitle?: string;
  relatedTaskId?: string;
  relatedTaskTitle?: string;

  // Provenance & Audit
  createdBy: string;
  createdByName: string;
  createdByRole: string;
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedByRole?: string;
  verifiedAt?: string;
  verificationRationale?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  rejectionRationale?: string;

  supersededAt?: string;
  archivedAt?: string;
  archiveReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CareInstructionVersion {
  id: string;
  instructionId: string;
  patientId: string;
  versionNumber: number;
  title: string;
  category: InstructionCategory;
  description: string;
  structuredContent?: {
    frequency?: string;
    targetParameter?: string;
    guidelines?: string[];
    precautions?: string[];
    actionItems?: string[];
  };
  verificationStatus: InstructionVerificationStatus;
  sourceId: string;
  source?: InstructionSource;
  effectiveDate?: string;
  expirationDate?: string;
  tags?: string[];
  relatedMedicationId?: string;
  relatedAppointmentId?: string;
  relatedTaskId?: string;
  
  changeReason: string;
  changedFields?: string[];
  editorId: string;
  editorName: string;
  editorRole: string;
  
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  verificationRationale?: string;
  
  createdAt: string;
}

export interface InstructionReviewRecord {
  id: string;
  instructionId: string;
  versionNumber: number;
  patientId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string;
  decision: 'verified' | 'rejected';
  rationale: string;
  checklistNotes?: string;
  decidedAt: string;
}

export interface StructuredDiffItem {
  type: 'medication_added' | 'medication_modified' | 'medication_discontinued' | 'task_added' | 'appointment_scheduled' | 'clinical_warning';
  title: string;
  previousValue?: string;
  newValue?: string;
  clinicalRationale: string;
  affectedFutureEventsCount: number;
  dependentEntities: string[];
}

export interface InstructionVersion {
  id: string;
  patientId: string;
  sourceId: string;
  source: InstructionSource;
  versionNumber: number;
  title: string;
  summary: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'superseded';
  changes: StructuredDiffItem[];
  clinicalWarnings: string[];
  affectedEventCount: number;
  createdBy: string;
  createdByName: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeReview {
  id: string;
  instructionVersionId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string;
  decision: 'approved' | 'rejected';
  rationale: string;
  checklistVerification: Array<{ item: string; verified: boolean }>;
  decidedAt: string;
}

// CARE CONTINUITY ENGINE (Signature Feature Types)
export type ContinuityEventType =
  | 'new_instruction_submitted'
  | 'new_version_created'
  | 'instruction_verified'
  | 'instruction_rejected'
  | 'instruction_superseded'
  | 'instruction_archived';

export type ContinuityImpactClassification =
  | 'directly_linked'
  | 'potentially_related'
  | 'source_changed'
  | 'verification_changed'
  | 'requires_manual_assessment'
  | 'no_relationship_found';

export type ContinuityRecordType =
  | 'medication'
  | 'dose_event'
  | 'appointment'
  | 'followup_task'
  | 'care_task'
  | 'caregiver_responsibility'
  | 'shift_handover'
  | 'notification';

export type ContinuityReviewStatus =
  | 'analysis_pending'
  | 'analysis_completed'
  | 'awaiting_human_review'
  | 'needs_clarification'
  | 'approved_for_downstream_update'
  | 'rejected'
  | 'cancelled'
  | 'implementation_pending'
  | 'implementation_completed'
  | 'implementation_failed';

export interface FieldDiff {
  field: string;
  previousValue: any;
  currentValue: any;
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
}

export interface ContinuityAnalysis {
  id: string;
  patientId: string;
  instructionId: string;
  instructionTitle: string;
  eventType: ContinuityEventType;
  currentVersionNumber: number;
  previousVersionNumber?: number;
  diffSummary: FieldDiff[];
  detectedImpactCount: number;
  status: ContinuityReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ContinuityImpactRecord {
  id: string;
  analysisId: string;
  patientId: string;
  sourceInstructionId: string;
  sourceInstructionVersion: number;
  relatedRecordType: ContinuityRecordType;
  relatedRecordId: string;
  relatedRecordTitle: string;
  reasonIdentified: string;
  explainableReason?: string;
  impactClassification: ContinuityImpactClassification;
  classification?: ContinuityImpactClassification;
  currentRecordData?: Record<string, any>;
  suggestedReviewAction?: string;
  proposedDownstreamAdjustment?: string;
  reviewStatus: 'pending_review' | 'approved_for_update' | 'excluded' | 'requires_clarification';
  exclusionReason?: string;
  analyzedAt: string;
}

export interface ContinuityReview {
  id: string;
  analysisId: string;
  patientId: string;
  instructionId: string;
  instructionTitle: string;
  currentVersionNumber: number;
  previousVersionNumber?: number;
  reviewStatus: ContinuityReviewStatus;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  assignedReviewerRole?: string;
  impactedRecordsCount: number;
  approvedRecordsCount: number;
  excludedRecordsCount: number;
  decision?: 'approved' | 'rejected' | 'needs_clarification';
  decisionRationale?: string;
  decidedByName?: string;
  decisionSubmittedByName?: string;
  decidedByRole?: string;
  decidedAt?: string;
  clarificationQuestion?: string;
  escalatedTo?: string;
  reviewNotes?: string;
  optimisticVersionLock: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContinuityImplementationJob {
  id: string;
  reviewId: string;
  analysisId: string;
  patientId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  staleVersionDetected: boolean;
  concurrentRecordChangeDetected: boolean;
  executedAt?: string;
  executedByName?: string;
  executedAuditRecords: Array<{
    recordType: string;
    recordId: string;
    action: string;
    previousValue: any;
    newValue: any;
  }>;
  failureReason?: string;
  createdAt: string;
}

export type CareGapCategory =
  | 'medication'
  | 'responsibility'
  | 'appointment'
  | 'instruction_continuity'
  | 'notification';

export type CareGapType =
  // Medication gaps
  | 'missed_medication_event'
  | 'overdue_unconfirmed_event'
  | 'skipped_event_requiring_acknowledgement'
  | 'medication_awaiting_verification'
  | 'medication_continuity_review_pending'
  // Responsibility gaps
  | 'unassigned_care_task'
  | 'assignment_awaiting_acceptance'
  | 'overdue_task'
  | 'task_without_appropriate_owner'
  | 'unacknowledged_shift_handover'
  // Appointment gaps
  | 'appointment_prep_overdue'
  | 'followup_task_incomplete'
  | 'appointment_awaiting_confirmation'
  | 'appointment_instruction_awaiting_verification'
  // Instruction & Continuity gaps
  | 'instruction_awaiting_verification'
  | 'instruction_missing_source'
  | 'continuity_review_awaiting_reviewer'
  | 'continuity_review_needs_clarification'
  | 'approved_continuity_update_pending_implementation'
  | 'failed_continuity_implementation'
  // Notification gaps
  | 'notification_delivery_failed'
  | 'notification_stale_processing'
  | 'notification_suppressed_by_preferences'
  | 'critical_event_no_delivery_attempt';

export type CareGapPriority = 'informational' | 'routine' | 'attention_required' | 'high_priority';

export type CareGapStatus =
  | 'open'
  | 'assigned'
  | 'acknowledged'
  | 'in_progress'
  | 'awaiting_clarification'
  | 'resolved'
  | 'dismissed'
  | 'reopened';

export interface CareGapAuditEntry {
  id: string;
  timestamp: string;
  actorId?: string;
  actorName: string;
  actorRole: string;
  action: string;
  note?: string;
  previousStatus?: CareGapStatus;
  newStatus?: CareGapStatus;
}

export interface CareGapRecord {
  id: string;
  patientId: string;
  category: CareGapCategory;
  gapType: CareGapType;
  title: string;
  explanation: string;
  priority: CareGapPriority;
  priorityReason: string;
  status: CareGapStatus;
  relatedRecordType: string;
  relatedRecordId: string;
  relatedRecordTitle: string;
  sourceModule: string;
  detectedAt: string;
  assignedToId?: string;
  assignedToName?: string;
  assignedToRole?: string;
  assignedAt?: string;
  dueDate?: string;
  resolutionDetails?: string;
  resolvedByUserId?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  dismissedReason?: string;
  dismissedAt?: string;
  dismissedByName?: string;
  clarificationRequest?: string;
  actionRoute: string;
  actionLabel: string;
  deduplicationKey: string;
  auditHistory: CareGapAuditEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CareGapAlert {
  id: string;
  patientId: string;
  category: 'missed_meds' | 'overdue_task' | 'refill_due' | 'missing_followup' | 'lapsed_vitals' | 'circle_inactivity';
  severity: 'critical' | 'warning' | 'advisory';
  title: string;
  description: string;
  detectedAt: string;
  recommendedAction: string;
  actionRoute: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedByName?: string;
}

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';
export type NotificationStatus = 'queued' | 'processing' | 'sent' | 'delivered' | 'failed' | 'cancelled';

export type NotificationCategory = 
  | 'medication'
  | 'appointment'
  | 'care_circle'
  | 'instructions'
  | 'care_gap'
  | 'account_security';

export type NotificationEventType =
  // Medication
  | 'upcoming_scheduled_dose'
  | 'dose_awaiting_confirmation'
  | 'dose_missed_or_skipped'
  | 'medication_responsibility_assigned'
  // Appointment
  | 'upcoming_appointment_reminder'
  | 'appointment_prep_reminder'
  | 'appointment_followup_reminder'
  | 'appointment_changed'
  // Care Circle
  | 'invitation_received'
  | 'invitation_response'
  | 'task_assigned'
  | 'task_assignment_response'
  | 'handover_sent'
  | 'handover_ack_requested'
  | 'handover_acknowledged'
  // Instructions and continuity
  | 'instruction_awaiting_verification'
  | 'instruction_review_assigned'
  | 'instruction_version_changed'
  | 'continuity_review_created'
  | 'continuity_clarification_requested'
  | 'continuity_implementation_status'
  // Care gaps
  | 'care_gap_detected'
  | 'care_gap_assigned'
  | 'care_gap_responsibility_awaiting'
  | 'care_gap_approaching_due'
  | 'care_gap_overdue'
  | 'care_gap_resolved_reopened'
  // Account and security
  | 'access_permission_changed'
  | 'security_event'
  | 'invitation_revoked';

export type NotificationDeliveryStatus = 
  | 'draft'
  | 'scheduled'
  | 'queued'
  | 'processing'
  | 'sent_to_provider'
  | 'delivered'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'suppressed';

export type NotificationReadStatus = 'unread' | 'read' | 'archived';

export type NotificationAcknowledgementStatus = 'not_required' | 'pending' | 'acknowledged';

export interface CareTraceNotification {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientRole?: string;
  patientId: string;
  category: NotificationCategory;
  eventType: NotificationEventType;
  title: string;
  previewText: string;
  body: string;
  internalEventRef?: string;
  relatedRecordType?: string;
  relatedRecordId?: string;
  actionUrl?: string;
  deliveryChannel: NotificationChannel;
  deliveryStatus: NotificationDeliveryStatus;
  readStatus: NotificationReadStatus;
  isRead: boolean;
  requiresAcknowledgement: boolean;
  acknowledgementStatus: NotificationAcknowledgementStatus;
  acknowledgedAt?: string;
  acknowledgedById?: string;
  acknowledgedByName?: string;
  acknowledgementNote?: string;
  deliveryAttemptCount: number;
  lastDeliveryAttempt?: string;
  providerReference?: string;
  providerResponse?: {
    statusCode?: number;
    statusText?: string;
    message?: string;
    rawId?: string;
  };
  scheduledFor?: string;
  sentAt?: string;
  deliveredAt?: string;
  expiresAt?: string;
  suppressionReason?: string;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreference {
  id?: string;
  userId: string;
  userRole?: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean; // unconfigured
  smsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // e.g. "21:30"
  quietHoursEnd: string; // e.g. "07:30"
  timezone: string; // e.g. "America/Chicago"
  enabledCategories: {
    medication?: boolean;
    appointment?: boolean;
    care_circle?: boolean;
    instructions?: boolean;
    care_gap?: boolean;
    account_security?: boolean;
  };
  reminderLeadMinutes: {
    medication?: number;
    appointment?: number;
    task?: number;
  };
  dailySummaryEnabled: boolean;
  dailySummaryTime: string; // "08:00"
  nonSensitivePreviewsOnly: boolean;
  updatedAt: string;
}

export interface NotificationDeliveryAttempt {
  id: string;
  notificationId: string;
  channel: NotificationChannel;
  attemptNumber: number;
  status: 'pending' | 'sent_to_provider' | 'confirmed_delivered' | 'failed';
  providerName: string;
  providerResponseCode?: string;
  errorMessage?: string;
  timestamp: string;
}

export interface NotificationAcknowledgement {
  id: string;
  notificationId: string;
  patientId: string;
  sourceRecordType?: string;
  sourceRecordId?: string;
  acknowledgedById: string;
  acknowledgedByName: string;
  acknowledgedByRole: string;
  previousStatus: string;
  newStatus: string;
  note?: string;
  acknowledgedAt: string;
}

export interface NotificationJob {
  id: string;
  patientId: string;
  recipientId?: string;
  recipientName: string;
  recipientContact: string;
  channel: NotificationChannel;
  category: 'emergency' | 'medication_due' | 'missed_dose' | 'care_gap' | 'task_assigned' | 'instruction_review' | 'appointment_reminder';
  title: string;
  body: string;
  scheduledFor: string;
  status: NotificationStatus;
  idempotencyKey: string;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  patientId: string;
  actorId?: string;
  actorName: string;
  actorRole: string;
  eventCategory: 'auth' | 'consent' | 'medication' | 'continuity_review' | 'task' | 'appointment' | 'care_gap' | 'passport_export' | 'emergency_access';
  eventAction: string;
  recordIdentifier?: string;
  severity: 'info' | 'warning' | 'critical';
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface UserAccessibilityPreferences {
  fontSize: 'standard' | 'large' | 'extra_large';
  highContrast: boolean;
  reducedMotion: boolean;
  voiceReadoutEnabled: boolean;
  simplifiedNavigation: boolean;
  hapticFeedback: boolean;
}

/* -------------------------------------------------------------------------- */
/* Phase 13: Care Timeline, Analytics & Care Passport Types                   */
/* -------------------------------------------------------------------------- */

export type TimelineCategory = 
  | 'medication'
  | 'appointment'
  | 'instruction'
  | 'continuity'
  | 'care_circle'
  | 'task'
  | 'care_gap'
  | 'notification'
  | 'security';

export interface TimelineEvent {
  id: string;
  patientId: string;
  category: TimelineCategory;
  eventType: string;
  title: string;
  description: string;
  sourceModule: string;
  relatedRecordId: string;
  relatedRecordType: string;
  actionUrl: string;
  occurredAt: string;
  recordedAt: string;
  actorName?: string;
  actorRole?: string;
  version?: string;
  status?: string;
  isReportedOnly?: boolean;
  severity: 'info' | 'warning' | 'critical';
  details?: Record<string, any>;
}

export type AnalyticsDateRange = '7d' | '30d' | '90d' | 'all';

export interface MedicationAnalytics {
  totalDoseEvents: number;
  reportedTaken: number;
  missed: number;
  skipped: number;
  unconfirmedOverdue: number;
  scheduledUpcoming: number;
  reportedAdherenceRate: number; // percentage based on eligible past doses
  statusDistribution: Array<{ label: string; count: number; percentage: number; color: string }>;
  dailyActivity: Array<{ date: string; taken: number; missedOrSkipped: number; scheduled: number }>;
}

export interface AppointmentAnalytics {
  totalAppointments: number;
  upcomingCount: number;
  completedCount: number;
  cancelledCount: number;
  rescheduledCount: number;
  prepCompletionRate: number;
  totalFollowUpTasks: number;
  completedFollowUps: number;
}

export interface CareCircleAnalytics {
  activeMembersCount: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  unassignedTasks: number;
  taskCompletionRate: number;
  handoversAcknowledged: number;
  handoversPending: number;
}

export interface ContinuityAnalytics {
  totalInstructions: number;
  verifiedInstructions: number;
  pendingInstructions: number;
  totalReviews: number;
  approvedImplementations: number;
  clarificationsRequested: number;
  rejectedReviews: number;
}

export interface CareGapAnalytics {
  totalDetected: number;
  openGaps: number;
  resolvedGaps: number;
  overdueGaps: number;
  unassignedGaps: number;
  categoryBreakdown: Array<{ category: string; count: number }>;
}

export interface CareAnalyticsSummary {
  dateRange: AnalyticsDateRange;
  startDate: string;
  endDate: string;
  patientId: string;
  medications: MedicationAnalytics;
  appointments: AppointmentAnalytics;
  careCircle: CareCircleAnalytics;
  continuity: ContinuityAnalytics;
  careGaps: CareGapAnalytics;
  generatedAt: string;
}

export type CarePassportSectionKey =
  | 'patient_identity'
  | 'emergency_contacts'
  | 'conditions_and_allergies'
  | 'medication_regimen'
  | 'upcoming_appointments'
  | 'care_instructions'
  | 'care_circle'
  | 'pending_tasks'
  | 'advance_directives';

export interface CarePassportConfig {
  sections: Record<CarePassportSectionKey, boolean>;
  includeAuditHash: boolean;
  includeVerificationHash?: boolean;
  notes?: string;
  customNotes?: string;
}

export interface CarePassportExportRecord {
  id: string;
  patientId: string;
  exportedByUserId: string;
  exportedByName: string;
  exportedByRole: string;
  exportedAt: string;
  includedSections: CarePassportSectionKey[];
  verificationHash: string;
  fileSizeBytes?: number;
  downloadUrl?: string;
  reason?: string;
}

