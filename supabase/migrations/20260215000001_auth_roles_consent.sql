-- CARETRACE: Authentication, Roles, Care Circle Relationships, Consent & RLS Policies
-- Migration: 20260215000001_auth_roles_consent.sql
-- PromptWars × Catalyst 2026

BEGIN;

-- 1. Ensure Care Circles entity exists and is linked properly
CREATE TABLE IF NOT EXISTS care_circles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure index on care_circles
CREATE INDEX IF NOT EXISTS idx_care_circles_patient ON care_circles(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_circles_status ON care_circles(status);

-- 2. Enhanced care_invitations table (supporting secure token hashing, expiration, and lifecycle)
CREATE TABLE IF NOT EXISTS care_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID REFERENCES care_circles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invitee_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('family', 'caregiver', 'doctor')),
  permission_tier TEXT NOT NULL CHECK (permission_tier IN ('full_admin', 'caregiver_editor', 'family_viewer', 'emergency_only')),
  relationship TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_care_invitations_token_hash ON care_invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_care_invitations_email ON care_invitations(email);
CREATE INDEX IF NOT EXISTS idx_care_invitations_patient ON care_invitations(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_invitations_status ON care_invitations(status);

-- 3. Enhance care_circle_members with circle_id and status enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'care_circle_members' AND column_name = 'circle_id'
  ) THEN
    ALTER TABLE care_circle_members ADD COLUMN circle_id UUID REFERENCES care_circles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'care_circle_members' AND column_name = 'status'
  ) THEN
    ALTER TABLE care_circle_members ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'revoked', 'expired'));
  END IF;
END $$;

-- 4. Automatic Profile Creation on Supabase Auth Sign-up
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  extracted_full_name TEXT;
  extracted_role TEXT;
BEGIN
  extracted_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  extracted_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');

  INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    role,
    preferred_language,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    extracted_full_name,
    extracted_role,
    'en',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to hook Supabase auth.users to public.profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_auth_user();

-- 5. Helper Security Functions for Row Level Security (RLS)

-- Check if current authenticated user is an active member of patient's care circle with active status
CREATE OR REPLACE FUNCTION public.is_active_care_circle_member(check_patient_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_profile_id UUID;
BEGIN
  -- Get the profile id for the authenticated user
  SELECT id INTO current_user_profile_id FROM public.profiles WHERE user_id = auth.uid();
  IF current_user_profile_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- The patient themselves is always an active member of their own circle
  IF current_user_profile_id = check_patient_id THEN
    RETURN TRUE;
  END IF;

  -- Check if there is an active membership record
  RETURN EXISTS (
    SELECT 1 FROM public.care_circle_members
    WHERE patient_id = check_patient_id
      AND (member_id = current_user_profile_id OR user_id = auth.uid())
      AND status = 'active'
      AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if current authenticated user has full_admin permissions for a given patient
CREATE OR REPLACE FUNCTION public.is_care_circle_admin(check_patient_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_profile_id UUID;
BEGIN
  SELECT id INTO current_user_profile_id FROM public.profiles WHERE user_id = auth.uid();
  IF current_user_profile_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF current_user_profile_id = check_patient_id THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.care_circle_members
    WHERE patient_id = check_patient_id
      AND (member_id = current_user_profile_id OR user_id = auth.uid())
      AND permission_tier = 'full_admin'
      AND status = 'active'
      AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 6. Enable RLS on newly created tables
ALTER TABLE care_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_grants ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies: Profiles
DROP POLICY IF EXISTS "Users can view own profile or care circle peers" ON profiles;
CREATE POLICY "Users can view own profile or care circle peers" ON profiles
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_active_care_circle_member(profiles.id)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (
    auth.uid() = user_id
  ) WITH CHECK (
    auth.uid() = user_id
  );

-- 8. RLS Policies: Care Circles
DROP POLICY IF EXISTS "Members can view their care circles" ON care_circles;
CREATE POLICY "Members can view their care circles" ON care_circles
  FOR SELECT USING (
    public.is_active_care_circle_member(patient_id)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Only patient or full admin can create/manage care circles" ON care_circles;
CREATE POLICY "Only patient or full admin can create/manage care circles" ON care_circles
  FOR ALL USING (
    public.is_care_circle_admin(patient_id)
    OR auth.role() = 'service_role'
  );

-- 9. RLS Policies: Care Circle Members
DROP POLICY IF EXISTS "Members can view care circle membership" ON care_circle_members;
CREATE POLICY "Members can view care circle membership" ON care_circle_members
  FOR SELECT USING (
    public.is_active_care_circle_member(patient_id)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Only patient or full admin can modify care circle members" ON care_circle_members;
CREATE POLICY "Only patient or full admin can modify care circle members" ON care_circle_members
  FOR ALL USING (
    public.is_care_circle_admin(patient_id)
    OR auth.role() = 'service_role'
  );

-- 10. RLS Policies: Care Invitations
DROP POLICY IF EXISTS "Invitations visible to circle admin or verified invitee email" ON care_invitations;
CREATE POLICY "Invitations visible to circle admin or verified invitee email" ON care_invitations
  FOR SELECT USING (
    public.is_care_circle_admin(patient_id)
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Only circle admin can issue or revoke invitations" ON care_invitations;
CREATE POLICY "Only circle admin can issue or revoke invitations" ON care_invitations
  FOR INSERT WITH CHECK (
    public.is_care_circle_admin(patient_id)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Circle admin or matching invitee can update invitation status" ON care_invitations;
CREATE POLICY "Circle admin or matching invitee can update invitation status" ON care_invitations
  FOR UPDATE USING (
    public.is_care_circle_admin(patient_id)
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR auth.role() = 'service_role'
  );

-- 11. RLS Policies: Consent Records
DROP POLICY IF EXISTS "Consent records visible to patient, grantor, recipient, or admin" ON consent_records;
CREATE POLICY "Consent records visible to patient, grantor, recipient, or admin" ON consent_records
  FOR SELECT USING (
    public.is_care_circle_admin(patient_id)
    OR granted_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR granted_to_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Only patient or legal grantor can create consent" ON consent_records;
CREATE POLICY "Only patient or legal grantor can create consent" ON consent_records
  FOR INSERT WITH CHECK (
    public.is_care_circle_admin(patient_id)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Only patient or legal grantor can revoke consent" ON consent_records;
CREATE POLICY "Only patient or legal grantor can revoke consent" ON consent_records
  FOR UPDATE USING (
    public.is_care_circle_admin(patient_id)
    OR auth.role() = 'service_role'
  );

-- 12. RLS Policies: Access Grants (Break-glass and EMS)
DROP POLICY IF EXISTS "Access grants visible to circle admin and active emergency grantees" ON access_grants;
CREATE POLICY "Access grants visible to circle admin and active emergency grantees" ON access_grants
  FOR SELECT USING (
    public.is_care_circle_admin(patient_id)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Only circle admin can create or revoke access grants" ON access_grants;
CREATE POLICY "Only circle admin can create or revoke access grants" ON access_grants
  FOR ALL USING (
    public.is_care_circle_admin(patient_id)
    OR auth.role() = 'service_role'
  );

-- 13. RLS Policies: Audit Events (Strictly Append-Only)
DROP POLICY IF EXISTS "Audit events visible to patient and active care circle members" ON audit_events;
CREATE POLICY "Audit events visible to patient and active care circle members" ON audit_events
  FOR SELECT USING (
    public.is_active_care_circle_member(patient_id)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Authorized users can append audit events" ON audit_events;
CREATE POLICY "Authorized users can append audit events" ON audit_events
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    OR auth.role() = 'service_role'
  );

-- Prevent any UPDATE or DELETE on audit_events to maintain immutable clinical audit trail
CREATE OR REPLACE FUNCTION public.prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit events are immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_audit_events ON audit_events;
CREATE TRIGGER trg_immutable_audit_events
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_audit_modification();

COMMIT;
