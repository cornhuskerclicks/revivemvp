-- Update billing plans with actual Stripe product IDs
-- Note: You'll need to get the price IDs from Stripe dashboard for each product

-- Update Starter plan
UPDATE billing_plans
SET stripe_price_id = 'price_STARTER_MONTHLY_ID_HERE'
WHERE name = 'Starter';

-- Update Growth plan  
UPDATE billing_plans
SET stripe_price_id = 'price_GROWTH_MONTHLY_ID_HERE'
WHERE name = 'Growth';

-- Update Scale plan
UPDATE billing_plans
SET stripe_price_id = 'price_SCALE_MONTHLY_ID_HERE'
WHERE name = 'Scale';

-- Add stripe_product_id column to track product IDs separately
ALTER TABLE billing_plans
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

-- Update with product IDs
UPDATE billing_plans
SET stripe_product_id = 'prod_TJxLvshK9imY7B'
WHERE name = 'Starter';

UPDATE billing_plans
SET stripe_product_id = 'prod_TJxLTaezmytDtg'
WHERE name = 'Growth';

UPDATE billing_plans
SET stripe_product_id = 'prod_TJxMKLlTYZhrwp'
WHERE name = 'Scale';

-- Add index for stripe_product_id
CREATE INDEX IF NOT EXISTS idx_billing_plans_stripe_product 
ON billing_plans(stripe_product_id);
