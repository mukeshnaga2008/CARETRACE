-- Migration: 20260215000008_care_gap_intelligence.sql
-- Description: Care Gap Radar & Safety Intelligence Schema (Phase 11)
-- PromptWars × Catalyst 2026

-- 1. Create care_gaps table
CREATE TABLE IF NOT EXISTS care_gaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'medication',
    'responsibility',
    'appointment',
    'instruction_continuity',
    'notification'
  )),
  gap_type TEXT NOT NULL,
  title TEXT NOT NULL,
  explanation TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN (
    'informational',
    'routine',
    'attention_required',
    'high_priority'
  )),
  priority_reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open',
    'assigned',
    'acknowledged',
    'in_progress',
    'awaiting_clarification',
    'resolved',
    'dismissed',
    'reopened'
  )),
  related_record_type TEXT NOT NULL,
  related_record_id TEXT NOT NULL,
  related_record_title TEXT NOT NULL,
  source_module TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_to_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_to_name TEXT,
  assigned_to_role TEXT,
  assigned_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  resolution_details TEXT,
  resolved_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_by_name TEXT,
  resolved_at TIMESTAMPTZ,
  dismissed_reason TEXT,
  dismissed_at TIMESTAMPTZ,
  dismissed_by_name TEXT,
  clarification_request TEXT,
  action_route TEXT NOT NULL,
  action_label TEXT NOT NULL,
  deduplication_key TEXT NOT NULL,
  audit_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for fast query performance & deduplication
CREATE INDEX IF NOT EXISTS idx_care_gaps_patient ON care_gaps(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_care_gaps_category ON care_gaps(patient_id, category);
CREATE INDEX IF NOT EXISTS idx_care_gaps_priority ON care_gaps(patient_id, priority);
CREATE INDEX IF NOT EXISTS idx_care_gaps_dedup ON care_gaps(deduplication_key);
CREATE INDEX IF NOT EXISTS idx_care_gaps_assigned ON care_gaps(assigned_to_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE care_gaps ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can read care gaps for authorized patients"
  ON care_gaps FOR SELECT
  USING (
    patient_id IN (
      SELECT patient_id FROM care_circle_members 
      WHERE member_id = auth.uid() 
      AND is_active = true 
      AND membership_status = 'active'
    )
    OR patient_id = auth.uid()
  );

CREATE POLICY "Authorized Care Circle members can update care gaps"
  ON care_gaps FOR UPDATE
  USING (
    patient_id IN (
      SELECT patient_id FROM care_circle_members 
      WHERE member_id = auth.uid() 
      AND is_active = true 
      AND membership_status = 'active'
      AND permission_tier IN ('full_admin', 'caregiver_editor', 'clinician_access')
    )
  );

CREATE POLICY "Authorized Care Circle members can insert care gaps"
  ON care_gaps FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT patient_id FROM care_circle_members 
      WHERE member_id = auth.uid() 
      AND is_active = true 
      AND membership_status = 'active'
      AND permission_tier IN ('full_admin', 'caregiver_editor', 'clinician_access')
    )
  );
