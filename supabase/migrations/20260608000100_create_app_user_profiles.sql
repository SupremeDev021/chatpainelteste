create extension if not exists pgcrypto with schema extensions;

create table if not exists public.app_user_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  company_id bigint not null references public.clientes(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null default 'atendente',
  permissions jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_user_profiles_company_id_idx on public.app_user_profiles(company_id);
create index if not exists app_user_profiles_email_idx on public.app_user_profiles(lower(email));

alter table public.app_user_profiles enable row level security;

create or replace function public.touch_app_user_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_app_user_profiles_updated_at on public.app_user_profiles;
create trigger touch_app_user_profiles_updated_at
before update on public.app_user_profiles
for each row execute function public.touch_app_user_profiles_updated_at();

drop policy if exists "app_user_profiles_select_own_company" on public.app_user_profiles;
create policy "app_user_profiles_select_own_company"
on public.app_user_profiles
for select
to authenticated
using (auth_user_id = auth.uid())
;
