-- Database functions for incrementing campaign stats

-- Increment sent count
create or replace function increment_campaign_sent(campaign_id uuid)
returns void as $$
begin
  update sms_campaigns
  set sent = sent + 1,
      updated_at = now()
  where id = campaign_id;
end;
$$ language plpgsql security definer;

-- Increment delivered count
create or replace function increment_campaign_delivered(campaign_id uuid)
returns void as $$
begin
  update sms_campaigns
  set delivered = delivered + 1,
      updated_at = now()
  where id = campaign_id;
end;
$$ language plpgsql security definer;

-- Increment replies count
create or replace function increment_campaign_replies(campaign_id uuid)
returns void as $$
begin
  update sms_campaigns
  set replies = replies + 1,
      updated_at = now()
  where id = campaign_id;
end;
$$ language plpgsql security definer;

-- Increment failed count
create or replace function increment_campaign_failed(campaign_id uuid)
returns void as $$
begin
  update sms_campaigns
  set failed = failed + 1,
      updated_at = now()
  where id = campaign_id;
end;
$$ language plpgsql security definer;
