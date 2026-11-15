-- CARETRACE: Complete Database Migration Schema
-- PromptWars × Catalyst 2026
-- Supports: Profiles, Care Circle, Medications, Adherence, Continuity Engine,
-- Care Gap Radar, Notifications, Audit Events, Consent, and Access Grants.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (Elder Patient, Family Member, Caregiver, Clinician)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE, -- Nullable for managed synthetic / offline elder profiles
  email TEXT,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('patient', 'family', 'caregiver', 'doctor', 'admin')),
  avatar_url TEXT,
  date_of_birth DATE,
  emergency_pin_hash TEXT,
  blood_type TEXT,
  allergies JSONB DEFAULT '[]'::jsonb,
  chronic_conditions JSONB DEFAULT '[]'::jsonb,
  advance_directives JSONB DEFAULT '{"status": "Documented", "dnr": false, "polst_on_file": true}'::jsonb,
  primary_doctor_name TEXT,
  primary_clinic TEXT,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Care Circle Members
CREATE TABLE IF NOT EXISTS care_circle_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  relationship TEXT NOT NULL, -- e.g., 'Son', 'Daughter', 'Visiting Nurse', 'Primary Doctor'
  permission_tier TEXT NOT NULL CHECK (permission_tier IN ('full_admin', 'caregiver_editor', 'family_viewer', 'emergency_only')),
  emergency_priority INTEGER DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Invitations
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invitee_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  permission_tier TEXT NOT NULL CHECK (permission_tier IN ('full_admin', 'caregiver_editor', 'family_viewer', 'emergency_only')),
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Consent Records
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  granted_to_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  scope TEXT NOT NULL CHECK (scope IN ('full_medical', 'medication_only', 'emergency_summary', 'care_circle_coordination')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  granted_by UUID NOT NULL REFERENCES profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Access Grants
CREATE TABLE IF NOT EXISTS access_grants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  grantee_identifier TEXT NOT NULL, -- email or name of EMS / provider
  grant_type TEXT NOT NULL CHECK (grant_type IN ('standard', 'break_glass_emergency', 'temporary_clinician')),
  access_pass_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accessed_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Medications
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  generic_name TEXT,
  dosage TEXT NOT NULL, -- e.g. "10mg"
  form TEXT NOT NULL, -- e.g. "Tablet", "Capsule", "Drops"
  route TEXT DEFAULT 'Oral',
  frequency TEXT NOT NULL, -- e.g. "Once daily", "Twice daily with meals"
  scheduled_times JSONB NOT NULL DEFAULT '["08:00"]'::jsonb, -- e.g. ["08:00", "20:00"]
  prescribing_doctor TEXT,
  pharmacy TEXT,
  rx_number TEXT,
  refills_remaining INTEGER DEFAULT 0,
  refill_due_date DATE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  storage_instructions TEXT,
  food_instructions TEXT,
  side_effect_warnings JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source_instruction_id UUID, -- Links to Care Continuity Engine instruction version
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Instruction Sources (Provenance for Care Continuity Engine)
CREATE TABLE IF NOT EXISTS instruction_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('hospital_discharge', 'specialist_consult', 'primary_care_visit', 'lab_result', 'patient_self_report')),
  facility_name TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  provider_role TEXT,
  document_reference TEXT,
  encounter_date DATE NOT NULL,
  raw_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Instruction Versions (Care Continuity Engine core versioning)
CREATE TABLE IF NOT EXISTS instruction_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES instruction_sources(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'superseded')),
  changes_payload JSONB NOT NULL DEFAULT '{}'::jsonb, -- Structured diff payload
  clinical_warnings JSONB DEFAULT '[]'::jsonb,
  affected_event_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Dose Events
CREATE TABLE IF NOT EXISTS dose_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  dose_label TEXT NOT NULL, -- e.g. "Morning Dose (10mg)"
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'taken', 'missed', 'skipped', 'delayed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Adherence Records (Detailed user logs)
CREATE TABLE IF NOT EXISTS adherence_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dose_event_id UUID NOT NULL REFERENCES dose_events(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('taken', 'missed', 'skipped', 'delayed')),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logged_by_id UUID REFERENCES profiles(id),
  logged_by_role TEXT NOT NULL,
  reason_code TEXT, -- e.g. 'nausea', 'fasting', 'refill_needed', 'forgot'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  specialty TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  facility TEXT NOT NULL,
  location_address TEXT,
  appointment_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 45,
  transport_needed BOOLEAN DEFAULT false,
  companion_member_id UUID REFERENCES care_circle_members(id) ON DELETE SET NULL,
  preparation_instructions TEXT,
  agenda_questions JSONB DEFAULT '[]'::jsonb,
  post_visit_notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Care Tasks
CREATE TABLE IF NOT EXISTS care_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('medication_refill', 'vitals_check', 'exercise_pt', 'dietary', 'supplies', 'doctor_followup', 'companion_ride')),
  description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')),
  completed_at TIMESTAMPTZ,
  completed_by_id UUID REFERENCES profiles(id),
  acknowledgement_required BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by_id UUID REFERENCES profiles(id),
  source_instruction_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Care Assignments
CREATE TABLE IF NOT EXISTS care_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES care_tasks(id) ON DELETE CASCADE,
  assigned_member_id UUID NOT NULL REFERENCES care_circle_members(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  role_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Care Dependencies (Inter-record links impacted by instruction changes)
CREATE TABLE IF NOT EXISTS care_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instruction_version_id UUID NOT NULL REFERENCES instruction_versions(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL CHECK (dependency_type IN ('medication_override', 'dose_event_cancel', 'dose_event_create', 'care_task_create', 'appointment_requirement')),
  target_table TEXT NOT NULL,
  target_record_id UUID,
  impact_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'staged' CHECK (status IN ('staged', 'applied', 'reverted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Change Reviews (Human-in-the-loop clinical approval gate)
CREATE TABLE IF NOT EXISTS change_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instruction_version_id UUID NOT NULL REFERENCES instruction_versions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewer_role TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
  rationale TEXT NOT NULL,
  checklist_verification JSONB NOT NULL DEFAULT '[]'::jsonb,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Notification Jobs (Honest lifecycle engine)
CREATE TABLE IF NOT EXISTS notification_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'sms', 'push')),
  category TEXT NOT NULL CHECK (category IN ('emergency', 'medication_due', 'missed_dose', 'care_gap', 'task_assigned', 'instruction_review', 'appointment_reminder')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'delivered', 'failed', 'cancelled')),
  idempotency_key TEXT UNIQUE,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Notification Logs
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES notification_jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quiet_hours_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME DEFAULT '21:30',
  quiet_hours_end TIME DEFAULT '07:30',
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  medication_reminders BOOLEAN DEFAULT true,
  gap_alerts BOOLEAN DEFAULT true,
  task_updates BOOLEAN DEFAULT true,
  emergency_always_bypass_quiet BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Audit Events (Unified tamper-evident trail)
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  event_category TEXT NOT NULL CHECK (event_category IN ('auth', 'consent', 'medication', 'continuity_review', 'task', 'appointment', 'care_gap', 'passport_export', 'emergency_access')),
  event_action TEXT NOT NULL,
  record_identifier TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. User Preferences & Elder Accessibility
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  font_size TEXT NOT NULL DEFAULT 'large' CHECK (font_size IN ('standard', 'large', 'extra_large')),
  high_contrast BOOLEAN DEFAULT false,
  reduced_motion BOOLEAN DEFAULT false,
  voice_readout_enabled BOOLEAN DEFAULT true,
  simplified_navigation BOOLEAN DEFAULT true,
  haptic_feedback BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high-performance patient-level query isolation
CREATE INDEX IF NOT EXISTS idx_medications_patient ON medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_dose_events_patient_date ON dose_events(patient_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_care_tasks_patient_due ON care_tasks(patient_id, due_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON appointments(patient_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_audit_events_patient_time ON audit_events(patient_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notification_jobs(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_continuity_patient_status ON instruction_versions(patient_id, status);

-- Row Level Security (RLS) Enablement
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dose_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE adherence_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruction_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Base RLS Policy: Authenticated users can view their patient data or assigned circle data
CREATE POLICY "Patient isolation policy for profiles" ON profiles
  FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');
