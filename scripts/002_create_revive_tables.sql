-- RE:VIVE SaaS Tables for Twilio Integration and Campaign Management

-- Twilio Accounts (stores user's Twilio credentials)
create table if not exists public.twilio_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_sid text not null,
  auth_token text not null,
  phone_number text,
  is_verified boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.twilio_accounts enable row level security;

create policy "twilio_accounts_select_own"
  on public.twilio_accounts for select
  using (auth.uid() = user_id);

create policy "twilio_accounts_insert_own"
  on public.twilio_accounts for insert
  with check (auth.uid() = user_id);

create policy "twilio_accounts_update_own"
  on public.twilio_accounts for update
  using (auth.uid() = user_id);

create policy "twilio_accounts_delete_own"
  on public.twilio_accounts for delete
  using (auth.uid() = user_id);

-- SMS Campaigns
create table if not exists public.sms_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text default 'draft', -- draft, active, paused, completed
  twilio_phone_number text,
  batch_size int default 50,
  total_leads int default 0,
  sent int default 0,
  delivered int default 0,
  replies int default 0,
  failed int default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.sms_campaigns enable row level security;

create policy "sms_campaigns_select_own"
  on public.sms_campaigns for select
  using (auth.uid() = user_id);

create policy "sms_campaigns_insert_own"
  on public.sms_campaigns for insert
  with check (auth.uid() = user_id);

create policy "sms_campaigns_update_own"
  on public.sms_campaigns for update
  using (auth.uid() = user_id);

create policy "sms_campaigns_delete_own"
  on public.sms_campaigns for delete
  using (auth.uid() = user_id);

-- Campaign Contacts (leads uploaded to campaigns)
create table if not exists public.campaign_contacts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.sms_campaigns(id) on delete cascade,
  lead_name text not null,
  phone_number text not null,
  tags text[],
  status text default 'pending', -- pending, sent, delivered, replied, failed
  last_message_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table public.campaign_contacts enable row level security;

create policy "campaign_contacts_select_own"
  on public.campaign_contacts for select
  using (
    exists (
      select 1 from public.sms_campaigns
      where sms_campaigns.id = campaign_contacts.campaign_id
      and sms_campaigns.user_id = auth.uid()
    )
  );

create policy "campaign_contacts_insert_own"
  on public.campaign_contacts for insert
  with check (
    exists (
      select 1 from public.sms_campaigns
      where sms_campaigns.id = campaign_contacts.campaign_id
      and sms_campaigns.user_id = auth.uid()
    )
  );

create policy "campaign_contacts_update_own"
  on public.campaign_contacts for update
  using (
    exists (
      select 1 from public.sms_campaigns
      where sms_campaigns.id = campaign_contacts.campaign_id
      and sms_campaigns.user_id = auth.uid()
    )
  );

-- SMS Messages (3-part sequences and replies)
create table if not exists public.sms_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.sms_campaigns(id) on delete cascade,
  contact_id uuid references public.campaign_contacts(id) on delete cascade,
  message_body text not null,
  message_type text not null, -- sequence_1, sequence_2, sequence_3, reply, outbound
  sequence_number int,
  direction text not null, -- inbound, outbound
  status text default 'pending', -- pending, sent, delivered, failed
  twilio_sid text,
  error_message text,
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table public.sms_messages enable row level security;

create policy "sms_messages_select_own"
  on public.sms_messages for select
  using (
    exists (
      select 1 from public.sms_campaigns
      where sms_campaigns.id = sms_messages.campaign_id
      and sms_campaigns.user_id = auth.uid()
    )
  );

create policy "sms_messages_insert_own"
  on public.sms_messages for insert
  with check (
    exists (
      select 1 from public.sms_campaigns
      where sms_campaigns.id = sms_messages.campaign_id
      and sms_campaigns.user_id = auth.uid()
    )
  );

create policy "sms_messages_update_own"
  on public.sms_messages for update
  using (
    exists (
      select 1 from public.sms_campaigns
      where sms_campaigns.id = sms_messages.campaign_id
      and sms_campaigns.user_id = auth.uid()
    )
  );

-- Campaign Audit Logs
create table if not exists public.campaign_audit_logs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.sms_campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  details jsonb,
  created_at timestamp with time zone default now()
);

alter table public.campaign_audit_logs enable row level security;

create policy "campaign_audit_logs_select_own"
  on public.campaign_audit_logs for select
  using (auth.uid() = user_id);

create policy "campaign_audit_logs_insert_own"
  on public.campaign_audit_logs for insert
  with check (auth.uid() = user_id);

-- Create indexes for performance
create index if not exists idx_sms_campaigns_user_id on public.sms_campaigns(user_id);
create index if not exists idx_sms_campaigns_status on public.sms_campaigns(status);
create index if not exists idx_campaign_contacts_campaign_id on public.campaign_contacts(campaign_id);
create index if not exists idx_campaign_contacts_status on public.campaign_contacts(status);
create index if not exists idx_sms_messages_campaign_id on public.sms_messages(campaign_id);
create index if not exists idx_sms_messages_contact_id on public.sms_messages(contact_id);
create index if not exists idx_sms_messages_direction on public.sms_messages(direction);
