-- Add billing tracking for phone numbers and A2P registration

-- Add cost tracking to a2p_registrations
ALTER TABLE a2p_registrations
ADD COLUMN IF NOT EXISTS brand_fee NUMERIC DEFAULT 4.00,
ADD COLUMN IF NOT EXISTS campaign_fee NUMERIC DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS total_paid NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Add billing to twilio_accounts (phone numbers)
ALTER TABLE twilio_accounts
ADD COLUMN IF NOT EXISTS monthly_cost NUMERIC DEFAULT 2.00,
ADD COLUMN IF NOT EXISTS setup_fee NUMERIC DEFAULT 1.00,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE;

-- Create phone number billing history table
CREATE TABLE IF NOT EXISTS phone_number_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  billing_type TEXT NOT NULL, -- 'setup' or 'monthly'
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending',
  billing_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_phone_billing_user_id ON phone_number_billing(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_billing_status ON phone_number_billing(status);
CREATE INDEX IF NOT EXISTS idx_a2p_payment_status ON a2p_registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_twilio_payment_status ON twilio_accounts(payment_status);

-- RLS Policies
ALTER TABLE phone_number_billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own phone billing"
  ON phone_number_billing FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage phone billing"
  ON phone_number_billing FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RPC function to check if A2P is paid
CREATE OR REPLACE FUNCTION is_a2p_paid(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_payment_status TEXT;
BEGIN
  SELECT payment_status INTO v_payment_status
  FROM a2p_registrations
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN v_payment_status = 'paid';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to check if phone number is paid
CREATE OR REPLACE FUNCTION is_phone_paid(p_phone_number TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_payment_status TEXT;
BEGIN
  SELECT payment_status INTO v_payment_status
  FROM twilio_accounts
  WHERE phone_number = p_phone_number;
  
  RETURN v_payment_status = 'paid';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
