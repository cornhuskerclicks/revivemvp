-- RE:VIVE Billing RPC Functions
-- Secure functions to manage billing without exposing service role key

-- Create billing audit logs table
CREATE TABLE IF NOT EXISTS billing_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_billing_audit_user_id ON billing_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_audit_event_type ON billing_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_billing_audit_created_at ON billing_audit_logs(created_at);

-- RLS for audit logs
ALTER TABLE billing_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON billing_audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- RPC function to upsert user billing (replaces service role direct access)
CREATE OR REPLACE FUNCTION upsert_user_billing(
  p_user_id UUID,
  p_plan_id UUID,
  p_stripe_customer_id TEXT,
  p_stripe_subscription_id TEXT,
  p_credits_remaining INT,
  p_renew_date TIMESTAMP WITH TIME ZONE,
  p_status TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_billing (
    user_id,
    plan_id,
    stripe_customer_id,
    stripe_subscription_id,
    credits_remaining,
    renew_date,
    status
  )
  VALUES (
    p_user_id,
    p_plan_id,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_credits_remaining,
    p_renew_date,
    p_status
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    stripe_subscription_id = EXCLUDED.stripe_subscription_id,
    credits_remaining = EXCLUDED.credits_remaining,
    renew_date = EXCLUDED.renew_date,
    status = EXCLUDED.status,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to renew user credits
CREATE OR REPLACE FUNCTION renew_user_credits(
  p_stripe_customer_id TEXT,
  p_credits INT
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_billing
  SET
    credits_remaining = p_credits,
    renew_date = NOW() + INTERVAL '30 days',
    status = 'active',
    updated_at = NOW()
  WHERE stripe_customer_id = p_stripe_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to update subscription status
CREATE OR REPLACE FUNCTION update_subscription_status(
  p_stripe_customer_id TEXT,
  p_status TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_billing
  SET
    status = p_status,
    updated_at = NOW()
  WHERE stripe_customer_id = p_stripe_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to log billing audit events
CREATE OR REPLACE FUNCTION log_billing_audit(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_data JSONB
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO billing_audit_logs (user_id, event_type, event_data)
  VALUES (p_user_id, p_event_type, p_event_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION upsert_user_billing TO authenticated;
GRANT EXECUTE ON FUNCTION renew_user_credits TO authenticated;
GRANT EXECUTE ON FUNCTION update_subscription_status TO authenticated;
GRANT EXECUTE ON FUNCTION log_billing_audit TO authenticated;

-- Grant execute permissions to anon for webhook processing
GRANT EXECUTE ON FUNCTION upsert_user_billing TO anon;
GRANT EXECUTE ON FUNCTION renew_user_credits TO anon;
GRANT EXECUTE ON FUNCTION update_subscription_status TO anon;
GRANT EXECUTE ON FUNCTION log_billing_audit TO anon;
