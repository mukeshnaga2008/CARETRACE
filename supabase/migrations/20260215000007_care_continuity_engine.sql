-- Migration: 20260215000007_care_continuity_engine.sql
-- Description: Care Continuity Engine (Signature Feature) - Change detection, explainable impact analysis, human review gates, and controlled implementation
-- Author: CARETRACE Architecture Team
-- PromptWars × Catalyst 2026

-- 1. Create continuity_analyses table
CREATE TABLE IF NOT EXISTS continuity_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instruction_id UUID NOT NULL REFERENCES care_instructions(id) ON DELETE CASCADE,
  instruction_title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'new_instruction_submitted',
    'new_version_created',
    'instruction_verified',
    'instruction_rejected',
    'instruction_superseded',
    'instruction_archived'
  )),
  current_version_number INTEGER NOT NULL,
  previous_version_number INTEGER,
  diff_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
  detected_impact_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'awaiting_human_review' CHECK (status IN (
    'analysis_pending',
    'analysis_completed',
    'awaiting_human_review',
    'needs_clarification',
    'approved_for_downstream_update',
    'rejected',
    'cancelled',
    'implementation_pending',
    'implementation_completed',
    'implementation_failed'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create continuity_impacts table
CREATE TABLE IF NOT EXISTS continuity_impacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES continuity_analyses(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_instruction_id UUID NOT NULL REFERENCES care_instructions(id) ON DELETE CASCADE,
  source_instruction_version INTEGER NOT NULL,
  related_record_type TEXT NOT NULL CHECK (related_record_type IN (
    'medication',
    'dose_event',
    'appointment',
    'followup_task',
    'care_task',
    'caregiver_responsibility',
    'shift_handover',
    'notification'
  )),
  related_record_id TEXT NOT NULL,
  related_record_title TEXT NOT NULL,
  reason_identified TEXT NOT NULL,
  impact_classification TEXT NOT NULL CHECK (impact_classification IN (
    'directly_linked',
    'potentially_related',
    'source_changed',
    'verification_changed',
    'requires_manual_assessment',
    'no_relationship_found'
  )),
  current_record_data JSONB DEFAULT '{}'::jsonb,
  suggested_review_action TEXT,
  review_status TEXT NOT NULL DEFAULT 'pending_review' CHECK (review_status IN (
    'pending_review',
    'approved_for_update',
    'excluded',
    'requires_clarification'
  )),
  exclusion_reason TEXT,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create continuity_reviews table (human approval gates)
CREATE TABLE IF NOT EXISTS continuity_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES continuity_analyses(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instruction_id UUID NOT NULL REFERENCES care_instructions(id) ON DELETE CASCADE,
  instruction_title TEXT NOT NULL,
  current_version_number INTEGER NOT NULL,
  previous_version_number INTEGER,
  review_status TEXT NOT NULL DEFAULT 'awaiting_human_review' CHECK (review_status IN (
    'analysis_pending',
    'analysis_completed',
    'awaiting_human_review',
    'needs_clarification',
    'approved_for_downstream_update',
    'rejected',
    'cancelled',
    'implementation_pending',
    'implementation_completed',
    'implementation_failed'
  )),
  assigned_reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_reviewer_name TEXT,
  assigned_reviewer_role TEXT,
  impacted_records_count INTEGER NOT NULL DEFAULT 0,
  approved_records_count INTEGER NOT NULL DEFAULT 0,
  excluded_records_count INTEGER NOT NULL DEFAULT 0,
  decision TEXT CHECK (decision IN ('approved', 'rejected', 'needs_clarification')),
  decision_rationale TEXT,
  decided_by_name TEXT,
  decided_by_role TEXT,
  decided_at TIMESTAMPTZ,
  clarification_question TEXT,
  escalated_to TEXT,
  review_notes TEXT,
  optimistic_version_lock INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create continuity_implementation_jobs table
CREATE TABLE IF NOT EXISTS continuity_implementation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES continuity_reviews(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL REFERENCES continuity_analyses(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'in_progress',
    'completed',
    'failed',
    'rolled_back'
  )),
  stale_version_detected BOOLEAN NOT NULL DEFAULT false,
  concurrent_record_change_detected BOOLEAN NOT NULL DEFAULT false,
  executed_at TIMESTAMPTZ,
  executed_by_name TEXT,
  executed_audit_records JSONB NOT NULL DEFAULT '[]'::jsonb,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Indexes for fast lookup & RLS filtering
CREATE INDEX IF NOT EXISTS idx_continuity_analyses_patient ON continuity_analyses(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_continuity_analyses_inst ON continuity_analyses(instruction_id);
CREATE INDEX IF NOT EXISTS idx_continuity_impacts_analysis ON continuity_impacts(analysis_id);
CREATE INDEX IF NOT EXISTS idx_continuity_impacts_patient ON continuity_impacts(patient_id);
CREATE INDEX IF NOT EXISTS idx_continuity_reviews_patient ON continuity_reviews(patient_id, review_status);
CREATE INDEX IF NOT EXISTS idx_continuity_jobs_review ON continuity_implementation_jobs(review_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE continuity_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE continuity_impacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE continuity_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE continuity_implementation_jobs ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
CREATE POLICY "Users can read continuity analyses for authorized patients"
  ON continuity_analyses FOR SELECT
  USING (
    patient_id IN (
      SELECT patient_id FROM care_circle_members 
      WHERE member_id = auth.uid() 
      AND is_active = true 
      AND membership_status = 'active'
    )
    OR patient_id = auth.uid()
  );

CREATE POLICY "Users can read continuity impacts for authorized patients"
  ON continuity_impacts FOR SELECT
  USING (
    patient_id IN (
      SELECT patient_id FROM care_circle_members 
      WHERE member_id = auth.uid() 
      AND is_active = true 
      AND membership_status = 'active'
    )
    OR patient_id = auth.uid()
  );

CREATE POLICY "Users can read continuity reviews for authorized patients"
  ON continuity_reviews FOR SELECT
  USING (
    patient_id IN (
      SELECT patient_id FROM care_circle_members 
      WHERE member_id = auth.uid() 
      AND is_active = true 
      AND membership_status = 'active'
    )
    OR patient_id = auth.uid()
  );

CREATE POLICY "Authorized reviewers can update continuity reviews"
  ON continuity_reviews FOR UPDATE
  USING (
    patient_id IN (
      SELECT patient_id FROM care_circle_members 
      WHERE member_id = auth.uid() 
      AND is_active = true 
      AND membership_status = 'active'
      AND permission_tier IN ('full_admin', 'caregiver_editor', 'clinician_access')
    )
  );
