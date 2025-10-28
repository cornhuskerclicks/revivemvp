-- A2P 10DLC Registration Tables for Multi-Tenant Compliance
-- Each user/client gets their own Twilio subaccount, brand, campaign, and phone number

-- Table: a2p_registrations
-- Tracks the A2P registration process for each user
create table if not exists a2p_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  subaccount_sid text,
  brand_id text,
  campaign_id text,
  messaging_service_sid text,
  phone_number text,
  status text default 'pending' check (status in ('pending', 'brand_registered', 'campaign_registered', 'number_assigned', 'active', 'failed')),
  
  -- Brand information
  company_name text,
  ein text,
  vertical text,
  contact_name text,
  contact_email text,
  
  -- Campaign information
  campaign_name text,
  use_case text,
  
  -- Error tracking
  error_message text,
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Table: twilio_accounts
-- Stores Twilio subaccount credentials for each user
create table if not exists twilio_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  account_sid text not null,
  auth_token text not null,
  subaccount_sid text,
  phone_number text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes for performance
create index if not exists idx_a2p_registrations_user_id on a2p_registrations(user_id);
create index if not exists idx_a2p_registrations_status on a2p_registrations(status);
create index if not exists idx_twilio_accounts_user_id on twilio_accounts(user_id);
create index if not exists idx_twilio_accounts_subaccount_sid on twilio_accounts(subaccount_sid);

-- Row Level Security (RLS)
alter table a2p_registrations enable row level security;
alter table twilio_accounts enable row level security;

-- RLS Policies: Users can only see their own records
create policy "Users can view their own A2P registrations"
  on a2p_registrations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own A2P registrations"
  on a2p_registrations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own A2P registrations"
  on a2p_registrations for update
  using (auth.uid() = user_id);

create policy "Users can view their own Twilio accounts"
  on twilio_accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own Twilio accounts"
  on twilio_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own Twilio accounts"
  on twilio_accounts for update
  using (auth.uid() = user_id);

-- Function: Update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_a2p_registrations_updated_at
  before update on a2p_registrations
  for each row
  execute function update_updated_at_column();

create trigger update_twilio_accounts_updated_at
  before update on twilio_accounts
  for each row
  execute function update_updated_at_column();
