-- Add country code support for international phone numbers
-- A2P registration is only required for US numbers

-- Add country_code to campaign_contacts
alter table campaign_contacts 
add column if not exists country_code varchar(2) default 'US';

-- Add country_code to a2p_registrations
alter table a2p_registrations 
add column if not exists country_code varchar(2) default 'US';

-- Add country_code to twilio_accounts
alter table twilio_accounts 
add column if not exists country_code varchar(2) default 'US';

-- Create index for country code filtering
create index if not exists idx_campaign_contacts_country_code on campaign_contacts(country_code);
create index if not exists idx_a2p_registrations_country_code on a2p_registrations(country_code);

-- Add comment explaining A2P requirement
comment on column a2p_registrations.country_code is 'Country code for phone number. A2P registration only required for US (US) numbers.';
