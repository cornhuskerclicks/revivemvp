-- Update Scale plan with Stripe price ID
UPDATE billing_plans
SET stripe_price_id = 'price_1SNJRjChzvrelJ8mmzIK9fN6'
WHERE name = 'Scale';

-- Verify all plans have price IDs
SELECT name, stripe_product_id, stripe_price_id, monthly_fee
FROM billing_plans
ORDER BY monthly_fee;
