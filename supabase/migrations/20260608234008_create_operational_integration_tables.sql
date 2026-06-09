create schema if not exists private;

create or replace function private.current_company_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select company_id
  from public.app_user_profiles
  where auth_user_id = auth.uid()
    and active = true
  limit 1
$$;

revoke all on function private.current_company_id() from public;
grant usage on schema private to authenticated;
grant execute on function private.current_company_id() to authenticated;

create table if not exists public.company_integrations (
  company_id bigint primary key references public.clientes(id) on delete cascade,
  active boolean not null default true,
  chatwoot_base_url text,
  chatwoot_account_id text,
  chatwoot_inbox_id text,
  chatwoot_api_token text,
  evolution_base_url text,
  evolution_instance text,
  evolution_api_token text,
  n8n_webhook_url text,
  n8n_webhook_token text,
  webhook_secret text,
  updated_at timestamptz not null default now()
);

create table if not exists public.integration_logs (
  id uuid primary key default gen_random_uuid(),
  company_id bigint not null references public.clientes(id) on delete cascade,
  level text not null default 'info',
  event_type text not null,
  source text not null,
  message text not null,
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists public.automation_events (
  id uuid primary key default gen_random_uuid(),
  company_id bigint not null references public.clientes(id) on delete cascade,
  event_name text not null,
  source text not null default 'painelsupreme',
  status text not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  last_error text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.company_labels (
  id uuid primary key default gen_random_uuid(),
  company_id bigint not null references public.clientes(id) on delete cascade,
  name text not null,
  color text not null default '#64748b',
  type text not null default 'atendimento',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, name)
);

create table if not exists public.company_appointments (
  id uuid primary key default gen_random_uuid(),
  company_id bigint not null references public.clientes(id) on delete cascade,
  local_ref text not null,
  contact_id text,
  lead_id uuid,
  customer_name text not null,
  phone text,
  appointment_date date not null,
  appointment_time time not null,
  service text,
  assigned_to text,
  status text not null default 'pendente',
  notes text,
  source text not null default 'painelsupreme',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, local_ref)
);

create table if not exists public.company_leads (
  id uuid primary key default gen_random_uuid(),
  company_id bigint not null references public.clientes(id) on delete cascade,
  local_ref text not null,
  contact_id text,
  conversation_id text,
  name text not null,
  phone text,
  email text,
  source text not null default 'Chatwoot',
  stage text not null default 'Novo',
  status text not null default 'open',
  tags text[] not null default '{}',
  assigned_to text,
  last_message text,
  last_interaction_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, local_ref)
);

create table if not exists public.lead_interactions (
  id uuid primary key default gen_random_uuid(),
  company_id bigint not null references public.clientes(id) on delete cascade,
  lead_id uuid not null references public.company_leads(id) on delete cascade,
  type text not null,
  content text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists integration_logs_company_created_idx on public.integration_logs(company_id, created_at desc);
create index if not exists automation_events_company_status_idx on public.automation_events(company_id, status, created_at);
create index if not exists company_appointments_company_date_idx on public.company_appointments(company_id, appointment_date, appointment_time);
create index if not exists company_leads_company_conversation_idx on public.company_leads(company_id, conversation_id);
create index if not exists company_leads_company_phone_idx on public.company_leads(company_id, phone);
create index if not exists lead_interactions_lead_created_idx on public.lead_interactions(lead_id, created_at desc);

alter table public.integration_logs enable row level security;
alter table public.automation_events enable row level security;
alter table public.company_integrations enable row level security;
alter table public.company_labels enable row level security;
alter table public.company_appointments enable row level security;
alter table public.company_leads enable row level security;
alter table public.lead_interactions enable row level security;

create policy "integration_logs_select_company" on public.integration_logs
for select to authenticated using (company_id = private.current_company_id());

create policy "automation_events_select_company" on public.automation_events
for select to authenticated using (company_id = private.current_company_id());

create policy "company_labels_company_access" on public.company_labels
for all to authenticated
using (company_id = private.current_company_id())
with check (company_id = private.current_company_id());

create policy "company_appointments_company_access" on public.company_appointments
for all to authenticated
using (company_id = private.current_company_id())
with check (company_id = private.current_company_id());

create policy "company_leads_company_access" on public.company_leads
for all to authenticated
using (company_id = private.current_company_id())
with check (company_id = private.current_company_id());

create policy "lead_interactions_company_access" on public.lead_interactions
for all to authenticated
using (company_id = private.current_company_id())
with check (company_id = private.current_company_id());

grant select on public.integration_logs, public.automation_events to authenticated;
grant select, insert, update, delete on public.company_labels, public.company_appointments, public.company_leads, public.lead_interactions to authenticated;
