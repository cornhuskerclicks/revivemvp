-- Add billing tracking per subaccount for ISV model
-- This allows us to track usage per user's Twilio subaccount

-- Add subaccount_sid to credit_transactions for tracking
ALTER TABLE credit_transactions 
ADD COLUMN IF NOT EXISTS subaccount_sid TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_credit_transactions_subaccount 
ON credit_transactions(subaccount_sid);

-- Add webhook audit log table for Stripe events
CREATE TABLE IF NOT EXISTS stripe_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_event_type 
ON stripe_webhook_logs(event_type);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_processed 
ON stripe_webhook_logs(processed);

-- RLS for webhook logs (service role only)
ALTER TABLE stripe_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage webhook logs"
  ON stripe_webhook_logs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Function to log Twilio usage per subaccount
CREATE OR REPLACE FUNCTION log_subaccount_usage(
  p_user_id UUID,
  p_subaccount_sid TEXT,
  p_campaign_id UUID,
  p_credits_used INT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO credit_transactions (
    user_id,
    campaign_id,
    transaction_type,
    change_amount,
    subaccount_sid
  ) VALUES (
    p_user_id,
    p_campaign_id,
    'sms_sent',
    -p_credits_used,
    p_subaccount_sid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
