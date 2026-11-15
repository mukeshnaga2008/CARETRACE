-- ==============================================================================
-- Migration: 20260215000010_care_timeline_analytics_passport.sql
-- Description: Care Passport Exports, Verification Ledger, Passport Preferences,
--              and Unified Audit/Timeline Projections
-- PromptWars × Catalyst 2026: Phase 13
-- ==============================================================================

-- 1. Care Passport Exports Table
CREATE TABLE IF NOT EXISTS public.care_passport_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exported_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exported_by_name TEXT NOT NULL,
  exported_by_role TEXT NOT NULL,
  included_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  verification_hash TEXT NOT NULL,
  file_size_bytes INTEGER,
  download_url TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Care Passport Preferences Table
CREATE TABLE IF NOT EXISTS public.care_passport_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sections JSONB NOT NULL DEFAULT '{"patient_identity": true, "emergency_contacts": true, "conditions_and_allergies": true, "medication_regimen": true, "upcoming_appointments": true, "care_instructions": true, "care_circle": true, "pending_tasks": true, "advance_directives": true}'::jsonb,
  include_audit_hash BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for Audit Inquiries and Recipient Isolation
CREATE INDEX IF NOT EXISTS idx_passport_exports_patient ON public.care_passport_exports(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_passport_exports_user ON public.care_passport_exports(exported_by_user_id);
CREATE INDEX IF NOT EXISTS idx_passport_exports_hash ON public.care_passport_exports(verification_hash);
CREATE INDEX IF NOT EXISTS idx_passport_prefs_user ON public.care_passport_preferences(user_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.care_passport_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_passport_preferences ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Care Passport exports readable by patient or active Care Circle members
CREATE POLICY "Passport exports readable by authorized care circle"
  ON public.care_passport_exports FOR SELECT
  USING (
    auth.uid() = exported_by_user_id OR
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM public.care_circle_members ccm
      WHERE ccm.patient_id = care_passport_exports.patient_id
        AND ccm.user_id = auth.uid()
        AND ccm.status = 'active'
    )
  );

-- Passport exports insertable by patient or authorized Care Circle members
CREATE POLICY "Passport exports insertable by authorized care circle"
  ON public.care_passport_exports FOR INSERT
  WITH CHECK (
    auth.uid() = exported_by_user_id AND (
      auth.uid() = patient_id OR
      EXISTS (
        SELECT 1 FROM public.care_circle_members ccm
        WHERE ccm.patient_id = care_passport_exports.patient_id
          AND ccm.user_id = auth.uid()
          AND ccm.status = 'active'
      )
    )
  );

-- Passport preferences readable and updateable by owner
CREATE POLICY "Users can manage their passport preferences"
  ON public.care_passport_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
