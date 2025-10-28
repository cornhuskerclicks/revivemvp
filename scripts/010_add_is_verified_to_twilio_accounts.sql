-- Add is_verified column to twilio_accounts table
-- This tracks whether the Twilio subaccount has been verified and is ready to use

alter table twilio_accounts 
add column if not exists is_verified boolean default false;

-- Add index for performance when querying verified accounts
create index if not exists idx_twilio_accounts_is_verified 
on twilio_accounts(is_verified);

-- Update existing records to be verified (assuming they were manually set up)
update twilio_accounts 
set is_verified = true 
where is_active = true;
