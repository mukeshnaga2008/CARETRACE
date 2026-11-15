-- Migration: 20260215000006_instruction_vault.sql
-- Description: Instruction Vault - Secure, versioned, source-aware repository for care instructions
-- Author: CARETRACE Architecture Team
-- PromptWars × Catalyst 2026

-- 1. Create care_instructions table
CREATE TABLE IF NOT EXISTS care_instructions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'medication_related',
    'appointment_related',
    'general_care',
    'mobility_daily_routine',
    'dietary',
    'follow_up',
    'other'
  )),
  description TEXT NOT NULL,
  structured_content JSONB DEFAULT '{}'::jsonb,
  current_version_number INTEGER NOT NULL DEFAULT 1,
  verification_status TEXT NOT NULL DEFAULT 'awaiting_verification' CHECK (verification_status IN (
    'draft',
    'awaiting_verification',
    'verified',
    'rejected',
    'superseded',
    'archived'
  )),
  source_id UUID,
  effective_date DATE,
  expiration_date DATE,
  tags JSONB DEFAULT '[]'::jsonb,
  related_medication_id UUID REFERENCES medications(id) ON DELETE SET NULL,
  related_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by_name TEXT NOT NULL DEFAULT 'Care Coordinator',
  created_by_role TEXT NOT NULL DEFAULT 'family_coordinator',
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_by_name TEXT,
  verified_by_role TEXT,
  verified_at TIMESTAMPTZ,
  verification_rationale TEXT,
  rejected_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rejected_by_name TEXT,
  rejected_at TIMESTAMPTZ,
  rejection_rationale TEXT,
  superseded_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  archive_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enhance instruction_sources with provenance fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instruction_sources' AND column_name = 'title') THEN
    ALTER TABLE instruction_sources ADD COLUMN title TEXT DEFAULT 'Medical Source Document';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instruction_sources' AND column_name = 'entered_by') THEN
    ALTER TABLE instruction_sources ADD COLUMN entered_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instruction_sources' AND column_name = 'entered_by_name') THEN
    ALTER TABLE instruction_sources ADD COLUMN entered_by_name TEXT DEFAULT 'Care Coordinator';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instruction_sources' AND column_name = 'entered_by_role') THEN
    ALTER TABLE instruction_sources ADD COLUMN entered_by_role TEXT DEFAULT 'family_coordinator';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instruction_sources' AND column_name = 'is_missing_source_details') THEN
    ALTER TABLE instruction_sources ADD COLUMN is_missing_source_details BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instruction_sources' AND column_name = 'notes_about_missing_source') THEN
    ALTER TABLE instruction_sources ADD COLUMN notes_about_missing_source TEXT;
  END IF;
END $$;

-- 3. Create care_instruction_versions table (immutable version history)
CREATE TABLE IF NOT EXISTS care_instruction_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instruction_id UUID NOT NULL REFERENCES care_instructions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  structured_content JSONB DEFAULT '{}'::jsonb,
  verification_status TEXT NOT NULL,
  source_id UUID,
  effective_date DATE,
  expiration_date DATE,
  tags JSONB DEFAULT '[]'::jsonb,
  related_medication_id UUID REFERENCES medications(id) ON DELETE SET NULL,
  related_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  change_reason TEXT NOT NULL,
  changed_fields JSONB DEFAULT '[]'::jsonb,
  editor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  editor_name TEXT NOT NULL,
  editor_role TEXT NOT NULL,
  verified_by_name TEXT,
  verified_at TIMESTAMPTZ,
  verification_rationale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create instruction_reviews table (human review decision log)
CREATE TABLE IF NOT EXISTS instruction_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instruction_id UUID NOT NULL REFERENCES care_instructions(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewer_name TEXT NOT NULL,
  reviewer_role TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('verified', 'rejected')),
  rationale TEXT NOT NULL,
  checklist_notes TEXT,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create instruction_attachments table
CREATE TABLE IF NOT EXISTS instruction_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instruction_id UUID REFERENCES care_instructions(id) ON DELETE CASCADE,
  source_id UUID REFERENCES instruction_sources(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  uploaded_by_name TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT
);

-- 6. Indexes for performance and isolation
CREATE INDEX IF NOT EXISTS idx_instructions_patient_status ON care_instructions(patient_id, verification_status);
CREATE INDEX IF NOT EXISTS idx_instructions_category ON care_instructions(category);
CREATE INDEX IF NOT EXISTS idx_instruction_versions_inst_ver ON care_instruction_versions(instruction_id, version_number);
CREATE INDEX IF NOT EXISTS idx_instruction_reviews_patient ON instruction_reviews(patient_id);
CREATE INDEX IF NOT EXISTS idx_instruction_attachments_inst ON instruction_attachments(instruction_id);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE care_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_instruction_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruction_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruction_attachments ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies
CREATE POLICY "Users can read instructions for authorized patients"
  ON care_instructions FOR SELECT
  USING (
    patient_id IN (
      SELECT patient_id FROM care_circle_members 
      WHERE member_id = auth.uid() 
      AND is_active = true 
      AND membership_status = 'active'
    )
    OR patient_id = auth.uid()
  );

CREATE POLICY "Authorized editors can insert or update instructions"
  ON care_instructions FOR ALL
  USING (
    patient_id IN (
      SELECT patient_id FROM care_circle_members 
      WHERE member_id = auth.uid() 
      AND is_active = true 
      AND membership_status = 'active'
      AND permission_tier IN ('full_admin', 'caregiver_editor', 'clinician_access')
    )
  );

CREATE POLICY "Users can read instruction versions for authorized patients"
  ON care_instruction_versions FOR SELECT
  USING (
    patient_id IN (
      SELECT patient_id FROM care_circle_members 
      WHERE member_id = auth.uid() 
      AND is_active = true 
      AND membership_status = 'active'
    )
    OR patient_id = auth.uid()
  );

CREATE POLICY "Authorized editors can insert instruction versions"
  ON care_instruction_versions FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT patient_id FROM care_circle_members 
      WHERE member_id = auth.uid() 
      AND is_active = true 
      AND membership_status = 'active'
      AND permission_tier IN ('full_admin', 'caregiver_editor', 'clinician_access')
    )
  );

CREATE POLICY "Users can read reviews for authorized patients"
  ON instruction_reviews FOR SELECT
  USING (
    patient_id IN (
      SELECT patient_id FROM care_circle_members 
      WHERE member_id = auth.uid() 
      AND is_active = true 
      AND membership_status = 'active'
    )
  );

CREATE POLICY "Authorized reviewers can insert reviews"
  ON instruction_reviews FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT patient_id FROM care_circle_members 
      WHERE member_id = auth.uid() 
      AND is_active = true 
      AND membership_status = 'active'
      AND permission_tier IN ('full_admin', 'caregiver_editor', 'clinician_access')
    )
  );
