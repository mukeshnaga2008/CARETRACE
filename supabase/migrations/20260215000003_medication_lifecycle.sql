-- CARETRACE: Complete Medication Lifecycle Manager Schema & RLS
-- Migration: 20260215000003_medication_lifecycle.sql
-- PromptWars × Catalyst 2026

BEGIN;

-- 1. Extend medications table with provenance, verification and versioning
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medications' AND column_name = 'display_name') THEN
    ALTER TABLE medications ADD COLUMN display_name TEXT;
    UPDATE medications SET display_name = name WHERE display_name IS NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medications' AND column_name = 'strength_text') THEN
    ALTER TABLE medications ADD COLUMN strength_text TEXT;
    UPDATE medications SET strength_text = dosage WHERE strength_text IS NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medications' AND column_name = 'prescribed_instructions') THEN
    ALTER TABLE medications ADD COLUMN prescribed_instructions TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medications' AND column_name = 'route_text') THEN
    ALTER TABLE medications ADD COLUMN route_text TEXT DEFAULT 'Oral';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medications' AND column_name = 'source_type') THEN
    ALTER TABLE medications ADD COLUMN source_type TEXT NOT NULL DEFAULT 'physician_prescribed'
      CHECK (source_type IN ('patient_provided', 'family_entered', 'caregiver_entered', 'physician_prescribed', 'imported_external'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medications' AND column_name = 'verification_status') THEN
    ALTER TABLE medications ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'verified'
      CHECK (verification_status IN ('unverified', 'awaiting_review', 'verified', 'needs_clarification'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medications' AND column_name = 'version_number') THEN
    ALTER TABLE medications ADD COLUMN version_number INTEGER NOT NULL DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medications' AND column_name = 'archived_at') THEN
    ALTER TABLE medications ADD COLUMN archived_at TIMESTAMPTZ;
  END IF;
END $$;

-- 2. Medication Version History (Preserving auditable clinical change history)
CREATE TABLE IF NOT EXISTS medication_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  display_name TEXT NOT NULL,
  strength_text TEXT NOT NULL,
  prescribed_instructions TEXT NOT NULL,
  status TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  change_reason TEXT NOT NULL,
  changed_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  changed_by_name TEXT NOT NULL,
  changed_by_role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medication_versions_med_id ON medication_versions(medication_id, version_number DESC);

-- 3. Medication Schedules (Structured pattern with timezone awareness)
CREATE TABLE IF NOT EXISTS medication_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL DEFAULT 'daily' CHECK (schedule_type IN ('daily', 'specific_days', 'as_needed')),
  times_of_day JSONB NOT NULL DEFAULT '["08:00"]'::jsonb,
  days_of_week JSONB NOT NULL DEFAULT '[0,1,2,3,4,5,6]'::jsonb,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  human_schedule_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medication_schedules_med_patient ON medication_schedules(medication_id, patient_id);

-- 4. Caregiver Medication Assignments
CREATE TABLE IF NOT EXISTS medication_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_member_id UUID NOT NULL REFERENCES care_circle_members(id) ON DELETE CASCADE,
  assignment_role TEXT NOT NULL DEFAULT 'primary_reminder' CHECK (assignment_role IN ('primary_reminder', 'administrator', 'observer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_med_assignments_member ON medication_assignments(assigned_member_id, status);

-- 5. Extend dose_events with idempotency_key and adherence reporting fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dose_events' AND column_name = 'idempotency_key') THEN
    ALTER TABLE dose_events ADD COLUMN idempotency_key TEXT UNIQUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dose_events' AND column_name = 'event_status') THEN
    ALTER TABLE dose_events ADD COLUMN event_status TEXT NOT NULL DEFAULT 'upcoming'
      CHECK (event_status IN ('upcoming', 'due', 'reported_taken', 'skipped', 'missed', 'awaiting_confirmation', 'cancelled'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dose_events' AND column_name = 'reported_at') THEN
    ALTER TABLE dose_events ADD COLUMN reported_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dose_events' AND column_name = 'reported_by_name') THEN
    ALTER TABLE dose_events ADD COLUMN reported_by_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dose_events' AND column_name = 'reported_by_role') THEN
    ALTER TABLE dose_events ADD COLUMN reported_by_role TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dose_events' AND column_name = 'adherence_notes') THEN
    ALTER TABLE dose_events ADD COLUMN adherence_notes TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dose_events_idempotency ON dose_events(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_dose_events_status_time ON dose_events(event_status, scheduled_for);

-- 6. Enable Row Level Security (RLS) on new tables
ALTER TABLE medication_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_assignments ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies: medication_versions
DROP POLICY IF EXISTS "Members can view medication version history" ON medication_versions;
CREATE POLICY "Members can view medication version history" ON medication_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM medications m
      WHERE m.id = medication_versions.medication_id
        AND public.is_active_care_circle_member(m.patient_id)
    )
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Authorized members can append medication version" ON medication_versions;
CREATE POLICY "Authorized members can append medication version" ON medication_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM medications m
      WHERE m.id = medication_versions.medication_id
        AND public.is_care_circle_admin(m.patient_id)
    )
    OR auth.role() = 'service_role'
  );

-- 8. RLS Policies: medication_schedules
DROP POLICY IF EXISTS "Members can view medication schedules" ON medication_schedules;
CREATE POLICY "Members can view medication schedules" ON medication_schedules
  FOR SELECT USING (
    public.is_active_care_circle_member(patient_id)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Only patient or full admin can manage schedules" ON medication_schedules;
CREATE POLICY "Only patient or full admin can manage schedules" ON medication_schedules
  FOR ALL USING (
    public.is_care_circle_admin(patient_id)
    OR auth.role() = 'service_role'
  );

-- 9. RLS Policies: medication_assignments
DROP POLICY IF EXISTS "Members can view caregiver medication assignments" ON medication_assignments;
CREATE POLICY "Members can view caregiver medication assignments" ON medication_assignments
  FOR SELECT USING (
    public.is_active_care_circle_member(patient_id)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Only patient or full admin can modify assignments" ON medication_assignments;
CREATE POLICY "Only patient or full admin can modify assignments" ON medication_assignments
  FOR ALL USING (
    public.is_care_circle_admin(patient_id)
    OR auth.role() = 'service_role'
  );

COMMIT;
