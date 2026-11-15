-- CARETRACE: Elderly Patient Profile, Health Identity, Emergency Contacts & Preferences
-- Migration: 20260215000002_patient_profile_identity.sql
-- PromptWars × Catalyst 2026

BEGIN;

-- 1. Patient Health Profile Table (Differentiating clinical identity from auth credentials)
CREATE TABLE IF NOT EXISTS patient_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  preferred_name TEXT NOT NULL,
  date_of_birth DATE,
  blood_type TEXT DEFAULT 'Unknown',
  profile_photo_url TEXT,
  phone_number TEXT,
  email TEXT,
  address_line1 TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  preferred_language TEXT DEFAULT 'en',
  profile_completion_percentage INTEGER NOT NULL DEFAULT 85 CHECK (profile_completion_percentage BETWEEN 0 AND 100),
  verification_status TEXT NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('verified', 'patient_reported', 'pending_review')),
  last_reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_profiles_patient_id ON patient_profiles(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_verification ON patient_profiles(verification_status);

-- 2. Emergency Contacts Table (Priority ordered, non-caregiver assumption)
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  priority_order INTEGER NOT NULL DEFAULT 1 CHECK (priority_order >= 1 AND priority_order <= 10),
  is_authorized_caregiver BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_patient_priority UNIQUE (patient_id, priority_order) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_patient_priority ON emergency_contacts(patient_id, priority_order ASC);

-- 3. Patient Preferences Table
CREATE TABLE IF NOT EXISTS patient_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID UNIQUE NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  preferred_name TEXT NOT NULL,
  preferred_language TEXT DEFAULT 'en',
  preferred_communication_method TEXT DEFAULT 'phone' CHECK (preferred_communication_method IN ('phone', 'sms', 'email', 'in_person')),
  time_format TEXT DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
  larger_text BOOLEAN DEFAULT TRUE,
  high_contrast BOOLEAN DEFAULT FALSE,
  reduced_motion BOOLEAN DEFAULT FALSE,
  voice_readout_enabled BOOLEAN DEFAULT TRUE,
  timezone TEXT DEFAULT 'America/New_York',
  accessibility_notes TEXT,
  notification_preferences JSONB DEFAULT '{"medication_reminders": true, "appointment_reminders": true, "care_gap_alerts": true, "quiet_hours_enabled": true, "quiet_hours_start": "21:30", "quiet_hours_end": "07:30"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Health Information Sources (Provenance and Verification Tracking)
CREATE TABLE IF NOT EXISTS health_information_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('allergies', 'chronic_conditions', 'advance_directives', 'emergency_contacts', 'care_preferences', 'medications')),
  source_type TEXT NOT NULL CHECK (source_type IN ('patient_provided', 'family_entered', 'caregiver_entered', 'clinical_summary', 'pending_verification')),
  entered_by_name TEXT NOT NULL,
  entered_by_role TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('verified', 'patient_reported', 'pending_review')),
  verified_at TIMESTAMPTZ,
  verified_by_name TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_sources_patient_category ON health_information_sources(patient_id, category);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_information_sources ENABLE ROW LEVEL SECURITY;

-- 6. Helper function to check if caller has permission to view full private patient identity
CREATE OR REPLACE FUNCTION public.can_view_sensitive_patient_data(check_profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_profile_id UUID;
BEGIN
  SELECT id INTO current_user_profile_id FROM public.profiles WHERE user_id = auth.uid();
  IF current_user_profile_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- The patient themselves can always view their own sensitive data
  IF current_user_profile_id = check_profile_id THEN
    RETURN TRUE;
  END IF;

  -- Only full_admin tier or doctors can view unmasked sensitive details (DOB, street address)
  RETURN EXISTS (
    SELECT 1 FROM public.care_circle_members
    WHERE patient_id = check_profile_id
      AND (member_id = current_user_profile_id OR user_id = auth.uid())
      AND permission_tier IN ('full_admin')
      AND status = 'active'
      AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 7. RLS Policies: patient_profiles
DROP POLICY IF EXISTS "Members can view patient profile" ON patient_profiles;
CREATE POLICY "Members can view patient profile" ON patient_profiles
  FOR SELECT USING (
    public.is_active_care_circle_member(patient_id)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Only patient or full admin can update patient profile" ON patient_profiles;
CREATE POLICY "Only patient or full admin can update patient profile" ON patient_profiles
  FOR UPDATE USING (
    public.is_care_circle_admin(patient_id)
    OR auth.role() = 'service_role'
  );

-- 8. RLS Policies: emergency_contacts
DROP POLICY IF EXISTS "Members can view emergency contacts" ON emergency_contacts;
CREATE POLICY "Members can view emergency contacts" ON emergency_contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patient_profiles p
      WHERE p.id = emergency_contacts.patient_id
        AND public.is_active_care_circle_member(p.patient_id)
    )
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Only patient or full admin can manage emergency contacts" ON emergency_contacts;
CREATE POLICY "Only patient or full admin can manage emergency contacts" ON emergency_contacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM patient_profiles p
      WHERE p.id = emergency_contacts.patient_id
        AND public.is_care_circle_admin(p.patient_id)
    )
    OR auth.role() = 'service_role'
  );

-- 9. RLS Policies: patient_preferences
DROP POLICY IF EXISTS "Members can view patient preferences" ON patient_preferences;
CREATE POLICY "Members can view patient preferences" ON patient_preferences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patient_profiles p
      WHERE p.id = patient_preferences.patient_id
        AND public.is_active_care_circle_member(p.patient_id)
    )
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Only patient or full admin can modify preferences" ON patient_preferences;
CREATE POLICY "Only patient or full admin can modify preferences" ON patient_preferences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM patient_profiles p
      WHERE p.id = patient_preferences.patient_id
        AND public.is_care_circle_admin(p.patient_id)
    )
    OR auth.role() = 'service_role'
  );

-- 10. RLS Policies: health_information_sources
DROP POLICY IF EXISTS "Members can view health information sources" ON health_information_sources;
CREATE POLICY "Members can view health information sources" ON health_information_sources
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patient_profiles p
      WHERE p.id = health_information_sources.patient_id
        AND public.is_active_care_circle_member(p.patient_id)
    )
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Active circle members can append health provenance" ON health_information_sources;
CREATE POLICY "Active circle members can append health provenance" ON health_information_sources
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM patient_profiles p
      WHERE p.id = health_information_sources.patient_id
        AND public.is_active_care_circle_member(p.patient_id)
    )
    OR auth.role() = 'service_role'
  );

COMMIT;
