-- ==============================================================================
-- Migration: 20260215000009_notifications_and_reminders.sql
-- Description: Proactive Notification Centre, Reminder Engine, Delivery Tracking, 
--              Acknowledgement Records & Notification Preferences
-- PromptWars × Catalyst 2026: Phase 12
-- ==============================================================================

-- 1. Main Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  recipient_role TEXT,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'medication',
    'appointment',
    'care_circle',
    'instructions',
    'care_gap',
    'account_security'
  )),
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  preview_text TEXT NOT NULL,
  body TEXT NOT NULL,
  internal_event_ref TEXT,
  related_record_type TEXT,
  related_record_id TEXT,
  action_url TEXT,
  delivery_channel TEXT NOT NULL DEFAULT 'in_app' CHECK (delivery_channel IN ('in_app', 'email', 'sms', 'push')),
  delivery_status TEXT NOT NULL DEFAULT 'draft' CHECK (delivery_status IN (
    'draft',
    'scheduled',
    'queued',
    'processing',
    'sent_to_provider',
    'delivered',
    'failed',
    'cancelled',
    'expired',
    'suppressed'
  )),
  read_status TEXT NOT NULL DEFAULT 'unread' CHECK (read_status IN ('unread', 'read', 'archived')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  requires_acknowledgement BOOLEAN NOT NULL DEFAULT false,
  acknowledgement_status TEXT NOT NULL DEFAULT 'not_required' CHECK (acknowledgement_status IN ('not_required', 'pending', 'acknowledged')),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  acknowledged_by_name TEXT,
  acknowledgement_note TEXT,
  delivery_attempt_count INTEGER NOT NULL DEFAULT 0,
  last_delivery_attempt TIMESTAMPTZ,
  provider_reference TEXT,
  provider_response JSONB DEFAULT '{}'::jsonb,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  suppression_reason TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Delivery Attempts Table (Audit log of each external/internal transmission attempt)
CREATE TABLE IF NOT EXISTS public.notification_delivery_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'sms', 'push')),
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent_to_provider', 'confirmed_delivered', 'failed')),
  provider_name TEXT NOT NULL,
  provider_response_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Explicit Acknowledgements Table
CREATE TABLE IF NOT EXISTS public.notification_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_record_type TEXT,
  source_record_id TEXT,
  acknowledged_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  acknowledged_by_name TEXT NOT NULL,
  acknowledged_by_role TEXT NOT NULL,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  note TEXT,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Alter Notification Preferences if table already exists from migration 0
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification_preferences') THEN
    ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Chicago';
    ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS reminder_lead_minutes JSONB DEFAULT '{"medication": 15, "appointment": 120, "task": 60}'::jsonb;
    ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS daily_summary_enabled BOOLEAN DEFAULT false;
    ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS daily_summary_time TEXT DEFAULT '08:00';
    ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS non_sensitive_previews_only BOOLEAN DEFAULT true;
    ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS enabled_categories JSONB DEFAULT '{"medication": true, "appointment": true, "care_circle": true, "instructions": true, "care_gap": true, "account_security": true}'::jsonb;
  END IF;
END $$;

-- 5. Indexes for fast retrieval, queue processing, and recipient isolation
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, read_status);
CREATE INDEX IF NOT EXISTS idx_notifications_patient_cat ON public.notifications(patient_id, category);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON public.notifications(delivery_status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_ack ON public.notifications(recipient_id, acknowledgement_status);
CREATE INDEX IF NOT EXISTS idx_notifications_idempotency ON public.notifications(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_delivery_attempts_notif ON public.notification_delivery_attempts(notification_id);
CREATE INDEX IF NOT EXISTS idx_acknowledgements_notif ON public.notification_acknowledgements(notification_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_acknowledgements ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for Notifications
-- Users can read their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = recipient_id);

-- Users can update read_status and acknowledge their own notifications
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Authorized service role or coordinators can insert notifications
CREATE POLICY "Service and Care Circle coordinators can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    auth.uid() = recipient_id OR 
    EXISTS (
      SELECT 1 FROM public.care_circle_members ccm
      WHERE ccm.patient_id = notifications.patient_id 
        AND ccm.user_id = auth.uid() 
        AND ccm.status = 'active'
    )
  );

-- Delivery attempts readable by notification recipient or patient coordinators
CREATE POLICY "Delivery attempts viewable by recipient"
  ON public.notification_delivery_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.id = notification_delivery_attempts.notification_id
        AND n.recipient_id = auth.uid()
    )
  );

-- Acknowledgements viewable by Care Circle members for that patient
CREATE POLICY "Acknowledgements viewable by care circle"
  ON public.notification_acknowledgements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.care_circle_members ccm
      WHERE ccm.patient_id = notification_acknowledgements.patient_id
        AND ccm.user_id = auth.uid()
        AND ccm.status = 'active'
    ) OR auth.uid() = acknowledged_by_id
  );
