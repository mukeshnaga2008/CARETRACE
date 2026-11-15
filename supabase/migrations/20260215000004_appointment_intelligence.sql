-- CARETRACE: Complete Appointment Intelligence & Doctor Visit Management
-- Migration: 20260215000004_appointment_intelligence.sql
-- PromptWars × Catalyst 2026

BEGIN;

-- 1. Extend appointments table with Phase 7 intelligence fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'appointment_type') THEN
    ALTER TABLE appointments ADD COLUMN appointment_type TEXT DEFAULT 'doctor_consultation'
      CHECK (appointment_type IN ('doctor_consultation', 'follow_up', 'diagnostic_visit', 'therapy_appointment', 'hospital_visit', 'other'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'clinic_name') THEN
    ALTER TABLE appointments ADD COLUMN clinic_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'department_or_specialty') THEN
    ALTER TABLE appointments ADD COLUMN department_or_specialty TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'location_text') THEN
    ALTER TABLE appointments ADD COLUMN location_text TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'appointment_datetime') THEN
    ALTER TABLE appointments ADD COLUMN appointment_datetime TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'timezone') THEN
    ALTER TABLE appointments ADD COLUMN timezone TEXT DEFAULT 'America/Chicago';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'estimated_duration_minutes') THEN
    ALTER TABLE appointments ADD COLUMN estimated_duration_minutes INTEGER DEFAULT 45;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'appointment_status') THEN
    ALTER TABLE appointments ADD COLUMN appointment_status TEXT DEFAULT 'confirmed'
      CHECK (appointment_status IN ('planned', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'missed', 'awaiting_confirmation'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'booking_reference') THEN
    ALTER TABLE appointments ADD COLUMN booking_reference TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'contact_information') THEN
    ALTER TABLE appointments ADD COLUMN contact_information TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'preparation_notes') THEN
    ALTER TABLE appointments ADD COLUMN preparation_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'assigned_accompanying_name') THEN
    ALTER TABLE appointments ADD COLUMN assigned_accompanying_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'assigned_accompanying_role') THEN
    ALTER TABLE appointments ADD COLUMN assigned_accompanying_role TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'created_by') THEN
    ALTER TABLE appointments ADD COLUMN created_by TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'updated_by') THEN
    ALTER TABLE appointments ADD COLUMN updated_by TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'cancelled_at') THEN
    ALTER TABLE appointments ADD COLUMN cancelled_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'cancellation_reason') THEN
    ALTER TABLE appointments ADD COLUMN cancellation_reason TEXT;
  END IF;
END $$;

-- 2. Appointment Attendees Table (Care Circle Companion Tracking)
CREATE TABLE IF NOT EXISTS appointment_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attendee_name TEXT NOT NULL,
  attendee_role TEXT NOT NULL,
  relationship_to_patient TEXT NOT NULL,
  attendance_status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (attendance_status IN ('confirmed', 'tentative', 'declined', 'needs_transport')),
  is_driver BOOLEAN DEFAULT false,
  pickup_time TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Appointment Preparation Items Table (Agendas, Questions & Symptoms)
CREATE TABLE IF NOT EXISTS appointment_preparation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL
    CHECK (item_type IN ('question', 'discussion_topic', 'document_to_bring', 'symptom_note')),
  title TEXT NOT NULL,
  notes TEXT,
  is_addressed BOOLEAN NOT NULL DEFAULT false,
  addressed_notes TEXT,
  created_by_name TEXT NOT NULL,
  created_by_role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Appointment Notes & Outcomes Table
CREATE TABLE IF NOT EXISTS appointment_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  provider_name TEXT NOT NULL,
  summary_text TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  source_provenance TEXT NOT NULL
    CHECK (source_provenance IN ('patient_reported', 'family_entered', 'caregiver_entered', 'clinician_provided')),
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('verified', 'unverified', 'awaiting_review')),
  follow_up_instructions TEXT,
  documents_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Appointment Follow-up Tasks Table
CREATE TABLE IF NOT EXISTS appointment_follow_up_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_at DATE,
  assigned_to_name TEXT,
  assigned_to_role TEXT,
  task_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (task_status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'awaiting_clarification')),
  source_reference TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  completion_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Appointment History & Audit Trail Table
CREATE TABLE IF NOT EXISTS appointment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  change_type TEXT NOT NULL
    CHECK (change_type IN ('created', 'rescheduled', 'updated', 'cancelled', 'completed')),
  change_reason TEXT NOT NULL,
  previous_datetime TIMESTAMPTZ,
  new_datetime TIMESTAMPTZ,
  changed_by_name TEXT NOT NULL,
  changed_by_role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Indexes for Performance and Calendar Queries
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_datetime);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(appointment_status);
CREATE INDEX IF NOT EXISTS idx_preparation_items_appointment ON appointment_preparation_items(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_notes_appointment ON appointment_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_patient_due ON appointment_follow_up_tasks(patient_id, due_at);
CREATE INDEX IF NOT EXISTS idx_appointment_history_appointment ON appointment_history(appointment_id);

-- 8. Enable Row Level Security (RLS) on all appointment tables
ALTER TABLE appointment_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_preparation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_follow_up_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_history ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies: appointment_preparation_items
DROP POLICY IF EXISTS "Members can view appointment preparation items" ON appointment_preparation_items;
CREATE POLICY "Members can view appointment preparation items" ON appointment_preparation_items
  FOR SELECT USING (
    public.is_active_care_circle_member(patient_id)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Authorized members can manage preparation items" ON appointment_preparation_items;
CREATE POLICY "Authorized members can manage preparation items" ON appointment_preparation_items
  FOR ALL USING (
    public.is_care_circle_admin(patient_id)
    OR auth.role() = 'service_role'
  );

-- 10. RLS Policies: appointment_notes
DROP POLICY IF EXISTS "Members can view appointment notes" ON appointment_notes;
CREATE POLICY "Members can view appointment notes" ON appointment_notes
  FOR SELECT USING (
    public.is_active_care_circle_member(patient_id)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Authorized members can record appointment notes" ON appointment_notes;
CREATE POLICY "Authorized members can record appointment notes" ON appointment_notes
  FOR INSERT WITH CHECK (
    public.is_active_care_circle_member(patient_id)
    OR auth.role() = 'service_role'
  );

-- 11. RLS Policies: appointment_follow_up_tasks
DROP POLICY IF EXISTS "Members can view follow-up tasks" ON appointment_follow_up_tasks;
CREATE POLICY "Members can view follow-up tasks" ON appointment_follow_up_tasks
  FOR SELECT USING (
    public.is_active_care_circle_member(patient_id)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Authorized members can manage follow-up tasks" ON appointment_follow_up_tasks;
CREATE POLICY "Authorized members can manage follow-up tasks" ON appointment_follow_up_tasks
  FOR ALL USING (
    public.is_care_circle_admin(patient_id)
    OR auth.role() = 'service_role'
  );

-- 12. RLS Policies: appointment_history
DROP POLICY IF EXISTS "Members can view appointment history" ON appointment_history;
CREATE POLICY "Members can view appointment history" ON appointment_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_history.appointment_id
        AND public.is_active_care_circle_member(a.patient_id)
    )
    OR auth.role() = 'service_role'
  );

COMMIT;
