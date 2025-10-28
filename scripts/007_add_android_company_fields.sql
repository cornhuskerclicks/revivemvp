-- Add company_name and niche fields to androids table
ALTER TABLE androids
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS niche TEXT;

-- Update existing androids with default values if needed
UPDATE androids
SET company_name = 'My Business'
WHERE company_name IS NULL;
