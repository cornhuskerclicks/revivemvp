-- Update Growth plan with Stripe price ID
UPDATE billing_plans
SET stripe_price_id = 'price_1SNJREChzvrelJ8mf6bocsDx'
WHERE name = 'Growth';

-- Verify the update
SELECT name, stripe_product_id, stripe_price_id, monthly_fee
FROM billing_plans
WHERE name = 'Growth';
