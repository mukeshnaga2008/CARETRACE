-- ==============================================================================
-- Migration: 20260215000011_security_hardening_rls.sql
-- Description: Security Hardening: Storage Buckets, Attachment Policies,
--              Audit Immutability, Privilege Escalation Defenses, and Anti-Tampering
-- PromptWars × Catalyst 2026: Phase 14 Hardening
-- ==============================================================================

-- 1. Ensure Private Storage Bucket for Clinical Documents & Care Passport PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'care_documents',
  'care_documents',
  false, -- STRICTLY PRIVATE
  10485760, -- 10MB file size limit
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

-- Storage Object RLS Policies
CREATE POLICY "Authorized Care Circle can read patient documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'care_documents' AND (
      -- Extract patient_id from path pattern: patients/{patient_id}/...
      (storage.foldername(name))[2] IN (
        SELECT patient_id::text FROM public.care_circle_members
        WHERE member_id = auth.uid()
          AND is_active = true
          AND membership_status = 'active'
      )
      OR (storage.foldername(name))[2] = auth.uid()::text
    )
  );

CREATE POLICY "Authorized editors can upload patient documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'care_documents' AND (
      (storage.foldername(name))[2] IN (
        SELECT patient_id::text FROM public.care_circle_members
        WHERE member_id = auth.uid()
          AND is_active = true
          AND membership_status = 'active'
          AND permission_tier IN ('full_admin', 'caregiver_editor', 'clinician_access')
      )
      OR (storage.foldername(name))[2] = auth.uid()::text
    )
  );

-- 2. Explicit Row Level Security for instruction_attachments
ALTER TABLE IF EXISTS public.instruction_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized members can read instruction attachments"
  ON public.instruction_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.care_instructions ci
      JOIN public.care_circle_members ccm ON ccm.patient_id = ci.patient_id
      WHERE ci.id = instruction_attachments.instruction_id
        AND ccm.member_id = auth.uid()
        AND ccm.is_active = true
        AND ccm.membership_status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.care_instructions ci
      WHERE ci.id = instruction_attachments.instruction_id
        AND ci.patient_id = auth.uid()
    )
  );

CREATE POLICY "Authorized editors can insert instruction attachments"
  ON public.instruction_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.care_instructions ci
      JOIN public.care_circle_members ccm ON ccm.patient_id = ci.patient_id
      WHERE ci.id = instruction_attachments.instruction_id
        AND ccm.member_id = auth.uid()
        AND ccm.is_active = true
        AND ccm.membership_status = 'active'
        AND ccm.permission_tier IN ('full_admin', 'caregiver_editor', 'clinician_access')
    )
  );

-- 3. Audit Log Immutability: Prevent UPDATE or DELETE on Audit Records
-- Care Passport exports cannot be modified or deleted by non-service-role
CREATE POLICY "Care Passport exports are immutable (no updates)"
  ON public.care_passport_exports FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Care Passport exports are immutable (no deletes)"
  ON public.care_passport_exports FOR DELETE
  TO authenticated
  USING (false);

-- Notification acknowledgements cannot be modified or deleted
CREATE POLICY "Notification acknowledgements are immutable (no updates)"
  ON public.notification_acknowledgements FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Notification acknowledgements are immutable (no deletes)"
  ON public.notification_acknowledgements FOR DELETE
  TO authenticated
  USING (false);

-- 4. Anti-Privilege Escalation on Care Circle Members
-- Regular members cannot elevate their own permission_tier or reactivate revoked status
CREATE OR REPLACE FUNCTION public.check_care_circle_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If user is attempting to change their own record
  IF NEW.member_id = auth.uid() THEN
    -- Block self-elevation of permission_tier
    IF NEW.permission_tier IS DISTINCT FROM OLD.permission_tier THEN
      RAISE EXCEPTION 'Privilege escalation violation: users cannot modify their own permission tier.';
    END IF;
    -- Block self-reactivation if suspended or revoked
    IF OLD.membership_status IN ('revoked', 'suspended') AND NEW.membership_status = 'active' THEN
      RAISE EXCEPTION 'Access violation: users cannot reactivate their own revoked or suspended membership.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_privilege_escalation ON public.care_circle_members;
CREATE TRIGGER trg_prevent_privilege_escalation
  BEFORE UPDATE ON public.care_circle_members
  FOR EACH ROW
  EXECUTE FUNCTION public.check_care_circle_privilege_escalation();
