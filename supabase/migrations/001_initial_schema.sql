-- LeadRakshak Supabase schema
-- Run once in Supabase Dashboard > SQL Editor. Never expose service_role keys in the browser.

create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Workspace',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id,user_id)
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  name text not null,
  phone text not null,
  service text not null default '',
  source text not null default 'WhatsApp',
  estimated_value numeric(14,2) not null default 0 check (estimated_value >= 0),
  status text not null default 'New' check (status in ('New','Contacted','Quote Sent','Negotiating','Won','Lost')),
  follow_up_at date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  lead_id uuid references public.leads(id) on delete set null,
  quote_number text not null,
  customer_name text not null,
  customer_phone text not null default '',
  valid_until date,
  line_items jsonb not null default '[]'::jsonb,
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  tax_percent numeric(5,2) not null default 0,
  total numeric(14,2) not null default 0,
  status text not null default 'Draft' check (status in ('Draft','Sent','Accepted','Rejected','Expired')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique(workspace_id,quote_number)
);

create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  activity_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists leads_workspace_follow_idx on public.leads(workspace_id,follow_up_at);
create index if not exists leads_workspace_status_idx on public.leads(workspace_id,status);
create index if not exists quotations_workspace_created_idx on public.quotations(workspace_id,created_at desc);
create index if not exists lead_activities_lead_idx on public.lead_activities(lead_id,created_at desc);

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.workspace_members wm where wm.workspace_id=target_workspace and wm.user_id=auth.uid()); $$;

create or replace function public.create_personal_workspace()
returns trigger language plpgsql security definer set search_path=public
as $$
declare new_workspace uuid;
begin
  insert into public.workspaces(name,created_by)
  values(case when nullif(new.raw_user_meta_data->>'full_name','') is null then 'My Workspace' else new.raw_user_meta_data->>'full_name' || '''s Workspace' end,new.id)
  returning id into new_workspace;
  insert into public.workspace_members(workspace_id,user_id,role)
  values(new_workspace,new.id,'owner');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_workspace on auth.users;
create trigger on_auth_user_created_workspace after insert on auth.users
for each row execute procedure public.create_personal_workspace();

-- Backfill users who registered before this migration was applied.
do $$
declare existing_user record; new_workspace uuid;
begin
  for existing_user in
    select u.id, u.raw_user_meta_data
    from auth.users u
    where not exists(select 1 from public.workspace_members wm where wm.user_id=u.id)
  loop
    insert into public.workspaces(name,created_by)
    values(case when nullif(existing_user.raw_user_meta_data->>'full_name','') is null then 'My Workspace' else existing_user.raw_user_meta_data->>'full_name' || '''s Workspace' end,existing_user.id)
    returning id into new_workspace;
    insert into public.workspace_members(workspace_id,user_id,role)
    values(new_workspace,existing_user.id,'owner');
  end loop;
end $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists leads_touch_updated_at on public.leads;
create trigger leads_touch_updated_at before update on public.leads
for each row execute procedure public.touch_updated_at();

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.leads enable row level security;
alter table public.quotations enable row level security;
alter table public.lead_activities enable row level security;

drop policy if exists "members can read workspaces" on public.workspaces;
create policy "members can read workspaces" on public.workspaces for select to authenticated using (public.is_workspace_member(id));
drop policy if exists "owners can update workspaces" on public.workspaces;
create policy "owners can update workspaces" on public.workspaces for update to authenticated using (exists(select 1 from public.workspace_members wm where wm.workspace_id=id and wm.user_id=auth.uid() and wm.role in ('owner','admin'))) with check (exists(select 1 from public.workspace_members wm where wm.workspace_id=id and wm.user_id=auth.uid() and wm.role in ('owner','admin')));

drop policy if exists "members can read membership" on public.workspace_members;
create policy "members can read membership" on public.workspace_members for select to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists "members manage own workspace leads" on public.leads;
drop policy if exists "workspace members read leads" on public.leads;
drop policy if exists "workspace members insert leads" on public.leads;
drop policy if exists "workspace members update leads" on public.leads;
drop policy if exists "workspace members delete leads" on public.leads;
create policy "workspace members read leads" on public.leads for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "workspace members insert leads" on public.leads for insert to authenticated with check (public.is_workspace_member(workspace_id) and created_by=auth.uid());
create policy "workspace members update leads" on public.leads for update to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "workspace members delete leads" on public.leads for delete to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists "members manage workspace quotations" on public.quotations;
drop policy if exists "workspace members read quotations" on public.quotations;
drop policy if exists "workspace members insert quotations" on public.quotations;
drop policy if exists "workspace members update quotations" on public.quotations;
drop policy if exists "workspace members delete quotations" on public.quotations;
create policy "workspace members read quotations" on public.quotations for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "workspace members insert quotations" on public.quotations for insert to authenticated with check (public.is_workspace_member(workspace_id) and created_by=auth.uid());
create policy "workspace members update quotations" on public.quotations for update to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "workspace members delete quotations" on public.quotations for delete to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists "members read workspace activities" on public.lead_activities;
create policy "members read workspace activities" on public.lead_activities for select to authenticated using (public.is_workspace_member(workspace_id));
drop policy if exists "members add workspace activities" on public.lead_activities;
create policy "members add workspace activities" on public.lead_activities for insert to authenticated with check (public.is_workspace_member(workspace_id) and actor_id=auth.uid());

grant usage on schema public to authenticated;
grant select,update on public.workspaces to authenticated;
grant select on public.workspace_members to authenticated;
grant select,insert,update,delete on public.leads to authenticated;
grant select,insert,update,delete on public.quotations to authenticated;
grant select,insert on public.lead_activities to authenticated;
