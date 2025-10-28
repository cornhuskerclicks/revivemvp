-- Sleeping Beauty Automation Schema
-- Adds drip sequencing and timed message automation to campaigns

-- 1. Extend sms_campaigns table with drip parameters
ALTER TABLE sms_campaigns
ADD COLUMN IF NOT EXISTS drip_size INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS drip_interval_days INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS message_interval_days INTEGER[] DEFAULT ARRAY[2, 5, 30],
ADD COLUMN IF NOT EXISTS current_batch INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_drip_sent_at TIMESTAMP WITH TIME ZONE;

-- 2. Update campaign_contacts with automation fields
ALTER TABLE campaign_contacts
DROP COLUMN IF EXISTS status CASCADE;

ALTER TABLE campaign_contacts
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'uncontacted' 
  CHECK (status IN ('uncontacted', '1st_sent', '2nd_sent', '3rd_sent', 'responded', 'dnd', 'failed')),
ADD COLUMN IF NOT EXISTS last_message_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_message_due TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cycle_count INTEGER DEFAULT 0;

-- 3. Create automation queue table
CREATE TABLE IF NOT EXISTS automation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES sms_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  message_number INTEGER NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_automation_queue_scheduled ON automation_queue(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_automation_queue_campaign ON automation_queue(campaign_id);

-- 4. RPC function to queue next batch of contacts
CREATE OR REPLACE FUNCTION queue_campaign_batch(
  p_campaign_id UUID,
  p_batch_size INTEGER DEFAULT 100
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_queued_count INTEGER := 0;
  v_contact RECORD;
  v_message_intervals INTEGER[];
BEGIN
  -- Get campaign message intervals
  SELECT message_interval_days INTO v_message_intervals
  FROM sms_campaigns
  WHERE id = p_campaign_id;

  -- Queue uncontacted leads for first message
  FOR v_contact IN
    SELECT id FROM campaign_contacts
    WHERE campaign_id = p_campaign_id
    AND status = 'uncontacted'
    LIMIT p_batch_size
  LOOP
    INSERT INTO automation_queue (campaign_id, contact_id, message_number, scheduled_for)
    VALUES (p_campaign_id, v_contact.id, 1, NOW());
    
    v_queued_count := v_queued_count + 1;
  END LOOP;

  -- Update campaign batch counter
  UPDATE sms_campaigns
  SET current_batch = current_batch + 1,
      last_drip_sent_at = NOW()
  WHERE id = p_campaign_id;

  RETURN v_queued_count;
END;
$$;

-- 5. RPC function to process due messages
CREATE OR REPLACE FUNCTION process_due_messages()
RETURNS TABLE(
  campaign_id UUID,
  contact_id UUID,
  message_number INTEGER,
  phone_number TEXT,
  message_body TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aq.campaign_id,
    aq.contact_id,
    aq.message_number,
    cc.phone_number,
    sm.message_body
  FROM automation_queue aq
  JOIN campaign_contacts cc ON cc.id = aq.contact_id
  JOIN sms_campaigns sc ON sc.id = aq.campaign_id
  JOIN sms_messages sm ON sm.campaign_id = aq.campaign_id 
    AND sm.sequence_number = aq.message_number
    AND sm.message_type = 'sequence_' || aq.message_number
  WHERE aq.status = 'pending'
    AND aq.scheduled_for <= NOW()
    AND sc.status = 'active'
  LIMIT 100;
END;
$$;

-- 6. RPC function to schedule next message for a contact
CREATE OR REPLACE FUNCTION schedule_next_message(
  p_contact_id UUID,
  p_campaign_id UUID,
  p_current_message_number INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_intervals INTEGER[];
  v_next_interval INTEGER;
  v_next_message_number INTEGER;
BEGIN
  -- Get campaign intervals
  SELECT message_interval_days INTO v_message_intervals
  FROM sms_campaigns
  WHERE id = p_campaign_id;

  v_next_message_number := p_current_message_number + 1;

  -- If we have more messages to send (max 3)
  IF v_next_message_number <= 3 THEN
    v_next_interval := v_message_intervals[p_current_message_number];
    
    -- Queue next message
    INSERT INTO automation_queue (campaign_id, contact_id, message_number, scheduled_for)
    VALUES (
      p_campaign_id,
      p_contact_id,
      v_next_message_number,
      NOW() + (v_next_interval || ' days')::INTERVAL
    );

    -- Update contact
    UPDATE campaign_contacts
    SET next_message_due = NOW() + (v_next_interval || ' days')::INTERVAL
    WHERE id = p_contact_id;
  ELSE
    -- After 3rd message, schedule restart in 30 days if no response
    UPDATE campaign_contacts
    SET next_message_due = NOW() + INTERVAL '30 days'
    WHERE id = p_contact_id AND status != 'responded';
  END IF;
END;
$$;

-- 7. RPC function to restart cycle for non-responders
CREATE OR REPLACE FUNCTION restart_dormant_contacts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_restarted_count INTEGER := 0;
  v_contact RECORD;
BEGIN
  -- Find contacts that completed 3 messages 30+ days ago without responding
  FOR v_contact IN
    SELECT id, campaign_id
    FROM campaign_contacts
    WHERE status = '3rd_sent'
    AND next_message_due <= NOW()
    AND last_message_sent_at < NOW() - INTERVAL '30 days'
  LOOP
    -- Reset to uncontacted and increment cycle
    UPDATE campaign_contacts
    SET status = 'uncontacted',
        message_count = 0,
        cycle_count = cycle_count + 1,
        next_message_due = NULL
    WHERE id = v_contact.id;

    -- Queue first message again
    INSERT INTO automation_queue (campaign_id, contact_id, message_number, scheduled_for)
    VALUES (v_contact.campaign_id, v_contact.id, 1, NOW());

    v_restarted_count := v_restarted_count + 1;
  END LOOP;

  RETURN v_restarted_count;
END;
$$;

-- 8. RPC function to mark contact as responded
CREATE OR REPLACE FUNCTION mark_contact_responded(
  p_phone_number TEXT,
  p_campaign_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE campaign_contacts
  SET status = 'responded',
      next_message_due = NULL
  WHERE phone_number = p_phone_number
    AND campaign_id = p_campaign_id
    AND status NOT IN ('responded', 'dnd');

  -- Cancel any pending messages for this contact
  UPDATE automation_queue
  SET status = 'failed',
      error_message = 'Contact responded - cancelled remaining messages'
  WHERE contact_id IN (
    SELECT id FROM campaign_contacts
    WHERE phone_number = p_phone_number AND campaign_id = p_campaign_id
  )
  AND status = 'pending';
END;
$$;

-- 9. Enable RLS on automation_queue
ALTER TABLE automation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own automation queue"
  ON automation_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sms_campaigns
      WHERE sms_campaigns.id = automation_queue.campaign_id
      AND sms_campaigns.user_id = auth.uid()
    )
  );

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_status ON campaign_contacts(status);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_next_due ON campaign_contacts(next_message_due);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_status ON sms_campaigns(status);

COMMENT ON TABLE automation_queue IS 'Queue for scheduled SMS messages in drip campaigns';
COMMENT ON FUNCTION queue_campaign_batch IS 'Queues next batch of uncontacted leads for a campaign';
COMMENT ON FUNCTION process_due_messages IS 'Returns all messages that are due to be sent now';
COMMENT ON FUNCTION schedule_next_message IS 'Schedules the next message in sequence for a contact';
COMMENT ON FUNCTION restart_dormant_contacts IS 'Restarts the message cycle for contacts who completed 3 messages 30+ days ago';
COMMENT ON FUNCTION mark_contact_responded IS 'Marks a contact as responded and cancels pending messages';
