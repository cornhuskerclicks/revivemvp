-- Add pricing configuration for phone numbers and A2P fees with markup
CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL, -- 'phone_number_setup', 'phone_number_monthly', 'a2p_brand', 'a2p_campaign'
  base_cost DECIMAL(10,2) NOT NULL, -- Twilio's cost
  markup_percentage INTEGER NOT NULL DEFAULT 20, -- RE:VIVE's markup (20% = 1.2x)
  final_price DECIMAL(10,2) GENERATED ALWAYS AS (base_cost * (1 + markup_percentage / 100.0)) STORED,
  currency TEXT NOT NULL DEFAULT 'USD',
  country_code TEXT, -- NULL for A2P fees, specific for phone numbers
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pricing
INSERT INTO pricing_config (item_type, base_cost, markup_percentage, country_code) VALUES
  ('phone_number_setup', 1.00, 20, 'US'),
  ('phone_number_monthly', 1.50, 20, 'US'),
  ('phone_number_setup', 1.00, 20, 'GB'),
  ('phone_number_monthly', 1.00, 20, 'GB'),
  ('phone_number_setup', 1.00, 20, 'CA'),
  ('phone_number_monthly', 1.00, 20, 'CA'),
  ('a2p_brand', 4.00, 25, NULL), -- $4 Twilio + 25% = $5
  ('a2p_campaign', 10.00, 25, NULL); -- $10 Twilio + 25% = $12.50

-- Add payment tracking to a2p_registrations
ALTER TABLE a2p_registrations
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Enable RLS
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

-- Allow all users to read pricing
CREATE POLICY "Anyone can read pricing"
  ON pricing_config FOR SELECT
  TO authenticated
  USING (true);
