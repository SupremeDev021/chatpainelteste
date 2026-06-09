revoke all on public.company_integrations from anon, authenticated;
revoke all on public.integration_logs, public.automation_events, public.company_labels, public.company_appointments, public.company_leads, public.lead_interactions from anon;
revoke select on public.app_user_profiles from anon;

create index if not exists lead_interactions_company_created_idx
on public.lead_interactions(company_id, created_at desc);

alter function public.touch_app_user_profiles_updated_at()
set search_path = '';
