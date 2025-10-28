-- Fix A2P tables to match the expected schema
-- This script updates the existing a2p_registrations table

-- Drop the old index if it exists
drop index if exists idx_a2p_registrations_status;

-- Rename registration_status to status if it exists
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_name = 'a2p_registrations' 
    and column_name = 'registration_status'
  ) then
    alter table a2p_registrations rename column registration_status to status;
  end if;
end $$;

-- Add missing columns if they don't exist
do $$
begin
  -- Add subaccount_sid if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'a2p_registrations' 
    and column_name = 'subaccount_sid'
  ) then
    alter table a2p_registrations add column subaccount_sid text;
  end if;

  -- Add brand_id if missing (rename from brand_name if exists)
  if exists (
    select 1 from information_schema.columns 
    where table_name = 'a2p_registrations' 
    and column_name = 'brand_name'
  ) then
    alter table a2p_registrations rename column brand_name to brand_id;
  elsif not exists (
    select 1 from information_schema.columns 
    where table_name = 'a2p_registrations' 
    and column_name = 'brand_id'
  ) then
    alter table a2p_registrations add column brand_id text;
  end if;

  -- Add messaging_service_sid if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'a2p_registrations' 
    and column_name = 'messaging_service_sid'
  ) then
    alter table a2p_registrations add column messaging_service_sid text;
  end if;

  -- Add phone_number if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'a2p_registrations' 
    and column_name = 'phone_number'
  ) then
    alter table a2p_registrations add column phone_number text;
  end if;

  -- Add company_name if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'a2p_registrations' 
    and column_name = 'company_name'
  ) then
    alter table a2p_registrations add column company_name text;
  end if;

  -- Add ein if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'a2p_registrations' 
    and column_name = 'ein'
  ) then
    alter table a2p_registrations add column ein text;
  end if;

  -- Add vertical if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'a2p_registrations' 
    and column_name = 'vertical'
  ) then
    alter table a2p_registrations add column vertical text;
  end if;

  -- Add contact_name if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'a2p_registrations' 
    and column_name = 'contact_name'
  ) then
    alter table a2p_registrations add column contact_name text;
  end if;

  -- Add contact_email if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'a2p_registrations' 
    and column_name = 'contact_email'
  ) then
    alter table a2p_registrations add column contact_email text;
  end if;

  -- Add campaign_name if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'a2p_registrations' 
    and column_name = 'campaign_name'
  ) then
    alter table a2p_registrations add column campaign_name text;
  end if;

  -- Add use_case if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'a2p_registrations' 
    and column_name = 'use_case'
  ) then
    alter table a2p_registrations add column use_case text;
  end if;

  -- Add error_message if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'a2p_registrations' 
    and column_name = 'error_message'
  ) then
    alter table a2p_registrations add column error_message text;
  end if;
end $$;

-- Update the status column constraint
alter table a2p_registrations drop constraint if exists a2p_registrations_status_check;
alter table a2p_registrations add constraint a2p_registrations_status_check 
  check (status in ('pending', 'brand_registered', 'campaign_registered', 'number_assigned', 'active', 'failed'));

-- Recreate the index
create index if not exists idx_a2p_registrations_status on a2p_registrations(status);

-- Fix twilio_accounts table - add missing columns
do $$
begin
  -- Add subaccount_sid if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'twilio_accounts' 
    and column_name = 'subaccount_sid'
  ) then
    alter table twilio_accounts add column subaccount_sid text;
  end if;

  -- Rename is_verified to is_active if needed
  if exists (
    select 1 from information_schema.columns 
    where table_name = 'twilio_accounts' 
    and column_name = 'is_verified'
  ) then
    alter table twilio_accounts rename column is_verified to is_active;
  elsif not exists (
    select 1 from information_schema.columns 
    where table_name = 'twilio_accounts' 
    and column_name = 'is_active'
  ) then
    alter table twilio_accounts add column is_active boolean default true;
  end if;
end $$;

-- Recreate index for twilio_accounts
create index if not exists idx_twilio_accounts_subaccount_sid on twilio_accounts(subaccount_sid);
