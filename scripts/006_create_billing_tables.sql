-- RE:VIVE Billing & Credit System
-- Creates tables for subscription plans and user billing tracking

-- Billing Plans Table
CREATE TABLE IF NOT EXISTS billing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  max_contacts INT NOT NULL,
  monthly_fee NUMERIC NOT NULL,
  monthly_credits INT NOT NULL,
  stripe_price_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Billing Table
CREATE TABLE IF NOT EXISTS user_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES billing_plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  credits_remaining INT DEFAULT 0,
  renew_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_billing_user_id ON user_billing(user_id);
CREATE INDEX IF NOT EXISTS idx_user_billing_stripe_customer ON user_billing(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_billing_status ON user_billing(status);

-- RLS Policies
ALTER TABLE billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_billing ENABLE ROW LEVEL SECURITY;

-- Anyone can view billing plans
CREATE POLICY "Anyone can view billing plans"
  ON billing_plans FOR SELECT
  USING (true);

-- Users can only view their own billing info
CREATE POLICY "Users can view own billing"
  ON user_billing FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all billing records
CREATE POLICY "Service role can manage billing"
  ON user_billing FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_user_billing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_billing_updated
  BEFORE UPDATE ON user_billing
  FOR EACH ROW
  EXECUTE FUNCTION update_user_billing_timestamp();

-- RPC function to deduct SMS credits
CREATE OR REPLACE FUNCTION deduct_sms_credit(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_billing
  SET credits_remaining = GREATEST(credits_remaining - 1, 0)
  WHERE user_id = p_user_id AND credits_remaining > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to check if user has credits
CREATE OR REPLACE FUNCTION has_sms_credits(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_credits INT;
BEGIN
  SELECT credits_remaining INTO v_credits
  FROM user_billing
  WHERE user_id = p_user_id AND status = 'active';
  
  RETURN COALESCE(v_credits, 0) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed default billing plans
INSERT INTO billing_plans (name, max_contacts, monthly_fee, monthly_credits)
VALUES
  ('Starter', 2500, 497, 5000),
  ('Growth', 10000, 997, 15000),
  ('Scale', 50000, 1997, 50000),
  ('Enterprise', 100000, 0, 100000)
ON CONFLICT DO NOTHING;
