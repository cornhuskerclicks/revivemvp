-- Update Starter plan with Stripe price ID
UPDATE billing_plans
SET stripe_price_id = 'price_1SNJQSChzvrelJ8miOIVhzVl'
WHERE name = 'Starter';

-- Verify the update
SELECT name, stripe_product_id, stripe_price_id, monthly_fee, sms_credits
FROM billing_plans
WHERE name = 'Starter';
