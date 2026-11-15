-- CARETRACE: Complete Care Circle Collaboration & Responsibility Management
-- Migration: 20260215000005_care_circle_collaboration.sql
-- PromptWars × Catalyst 2026

BEGIN;

-- 1. Extend care_circle_members table with Phase 8 collaboration fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_circle_members' AND column_name = 'membership_status') THEN
    ALTER TABLE care_circle_members ADD COLUMN membership_status TEXT NOT NULL DEFAULT 'active'
      CHECK (membership_status IN ('invited', 'invitation_accepted', 'active', 'suspended', 'revoked', 'expired'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_circle_members' AND column_name = 'assigned_role') THEN
    ALTER TABLE care_circle_members ADD COLUMN assigned_role TEXT DEFAULT 'family_member';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_circle_members' AND column_name = 'permissions') THEN
    ALTER TABLE care_circle_members ADD COLUMN permissions TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_circle_members' AND column_name = 'joined_at') THEN
    ALTER TABLE care_circle_members ADD COLUMN joined_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_circle_members' AND column_name = 'invited_at') THEN
    ALTER TABLE care_circle_members ADD COLUMN invited_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_circle_members' AND column_name = 'suspended_at') THEN
    ALTER TABLE care_circle_members ADD COLUMN suspended_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_circle_members' AND column_name = 'revoked_at') THEN
    ALTER TABLE care_circle_members ADD COLUMN revoked_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_circle_members' AND column_name = 'revocation_reason') THEN
    ALTER TABLE care_circle_members ADD COLUMN revocation_reason TEXT;
  END IF;
END $$;

-- 2. Care Handovers Table (Caregiver and family shift handovers)
CREATE TABLE IF NOT EXISTS care_handovers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  outgoing_member_name TEXT NOT NULL,
  outgoing_member_role TEXT NOT NULL,
  incoming_member_name TEXT NOT NULL,
  incoming_member_role TEXT NOT NULL,
  handover_datetime TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'America/Chicago',
  relevant_responsibilities TEXT[] DEFAULT '{}',
  pending_task_ids TEXT[] DEFAULT '{}',
  non_clinical_notes TEXT NOT NULL,
  handover_status TEXT NOT NULL DEFAULT 'ready_for_handover'
    CHECK (handover_status IN ('draft', 'ready_for_handover', 'sent', 'acknowledged', 'needs_clarification', 'cancelled')),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by_name TEXT,
  clarification_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Care Circle Activity & Collaboration Audit Table
CREATE TABLE IF NOT EXISTS care_circle_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_care_circle_members_status ON care_circle_members(patient_id, membership_status);
CREATE INDEX IF NOT EXISTS idx_care_handovers_patient_time ON care_handovers(patient_id, handover_datetime);
CREATE INDEX IF NOT EXISTS idx_care_circle_activity_patient ON care_circle_activity(patient_id, created_at DESC);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE care_handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_circle_activity ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies: care_handovers
DROP POLICY IF EXISTS "Active members can view care handovers" ON care_handovers;
CREATE POLICY "Active members can view care handovers" ON care_handovers
  FOR SELECT USING (
    public.is_active_care_circle_member(patient_id)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Authorized members can manage care handovers" ON care_handovers;
CREATE POLICY "Authorized members can manage care handovers" ON care_handovers
  FOR ALL USING (
    public.is_active_care_circle_member(patient_id)
    OR auth.role() = 'service_role'
  );

-- 7. RLS Policies: care_circle_activity
DROP POLICY IF EXISTS "Active members can view circle activity logs" ON care_circle_activity;
CREATE POLICY "Active members can view circle activity logs" ON care_circle_activity
  FOR SELECT USING (
    public.is_active_care_circle_member(patient_id)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "System can append activity logs" ON care_circle_activity;
CREATE POLICY "System can append activity logs" ON care_circle_activity
  FOR INSERT WITH CHECK (
    public.is_active_care_circle_member(patient_id)
    OR auth.role() = 'service_role'
  );

COMMIT;
