-- RE:VIVE MVP — Supabase Backend Setup
-- Message Logging & Campaign Tracking

-- 1️⃣ Core Message Logging Tables

-- Outbound + inbound SMS messages
CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES sms_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  direction TEXT CHECK (direction IN ('outbound','inbound')) NOT NULL,
  message_body TEXT NOT NULL,
  status TEXT DEFAULT 'queued',
  twilio_sid TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional audit log for high-level events
CREATE TABLE IF NOT EXISTS campaign_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES sms_campaigns(id) ON DELETE CASCADE,
  event_type TEXT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2️⃣ Twilio Webhook Logs

CREATE TABLE IF NOT EXISTS twilio_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payload JSONB NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3️⃣ Helper RPCs

-- Log an event in campaign_audit_logs
CREATE OR REPLACE FUNCTION public.log_campaign_event(
  p_campaign_id UUID,
  p_event_type TEXT,
  p_details TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO campaign_audit_logs (campaign_id, event_type, details)
  VALUES (p_campaign_id, p_event_type, p_details);
END;
$$;

-- Insert or update SMS message record
CREATE OR REPLACE FUNCTION public.log_sms_message(
  p_campaign_id UUID,
  p_contact_id UUID,
  p_direction TEXT,
  p_message_body TEXT,
  p_status TEXT,
  p_twilio_sid TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO sms_messages (campaign_id, contact_id, direction, message_body, status, twilio_sid)
  VALUES (p_campaign_id, p_contact_id, p_direction, p_message_body, p_status, p_twilio_sid);
END;
$$;

-- Handle inbound Twilio messages from webhook
CREATE OR REPLACE FUNCTION public.handle_inbound_message(payload JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_from TEXT := payload->>'From';
  v_body TEXT := payload->>'Body';
  v_sid TEXT := payload->>'MessageSid';
  v_contact_id UUID;
  v_campaign_id UUID;
BEGIN
  INSERT INTO twilio_webhook_logs (payload) VALUES (payload);

  SELECT id, campaign_id INTO v_contact_id, v_campaign_id
  FROM campaign_contacts
  WHERE phone_number = v_from
  LIMIT 1;

  IF v_contact_id IS NOT NULL THEN
    PERFORM log_sms_message(v_campaign_id, v_contact_id, 'inbound', v_body, 'received', v_sid);
    PERFORM log_campaign_event(v_campaign_id, 'Inbound Reply', 'Lead replied via SMS');
  END IF;
END;
$$;

-- 4️⃣ Automatic Campaign Status Update

CREATE OR REPLACE FUNCTION public.update_campaign_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (NEW.direction = 'outbound') THEN
    UPDATE sms_campaigns
    SET sent = sent + 1
    WHERE id = NEW.campaign_id;
  ELSIF (NEW.direction = 'inbound') THEN
    UPDATE sms_campaigns
    SET replies = replies + 1
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_campaign_stats ON sms_messages;
CREATE TRIGGER trg_update_campaign_stats
AFTER INSERT ON sms_messages
FOR EACH ROW EXECUTE PROCEDURE public.update_campaign_stats();

-- 5️⃣ Row-Level Security Policies

ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE twilio_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read own campaign data"
ON sms_messages FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM sms_campaigns c
  WHERE c.id = sms_messages.campaign_id
  AND c.user_id = auth.uid()
));

CREATE POLICY "Allow insert own messages"
ON sms_messages FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM sms_campaigns c
  WHERE c.id = sms_messages.campaign_id
  AND c.user_id = auth.uid()
));

CREATE POLICY "Allow read own audit logs"
ON campaign_audit_logs FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM sms_campaigns c
  WHERE c.id = campaign_audit_logs.campaign_id
  AND c.user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_messages_campaign_id ON sms_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_contact_id ON sms_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_twilio_sid ON sms_messages(twilio_sid);
CREATE INDEX IF NOT EXISTS idx_campaign_audit_logs_campaign_id ON campaign_audit_logs(campaign_id);
