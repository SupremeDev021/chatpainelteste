# Autenticacao Supabase Auth

Esta pasta prepara o Painel Supreme para usar Supabase Auth como fonte principal de login.

## Decisao tecnica

O login deve usar Supabase Auth. As permissoes e o vinculo multiempresa ficam em `public.app_user_profiles`.
Senhas nao devem ficar em `configuracoes_robo.dados_painel.users` para usuarios novos.

## Ordem de ativacao

1. Aplicar a migration `migrations/20260608000100_create_app_user_profiles.sql` no projeto Supabase.
2. Publicar a Edge Function `functions/provision-user`.
3. Configurar os secrets da function:

```bash
SUPABASE_URL=https://hhyvtehbsfoeuagwhklm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
```

4. Criar ou migrar o proprietario da empresa no Supabase Auth.
5. Criar o registro correspondente em `app_user_profiles` com `role = proprietario`.
6. Entrar no painel com esse proprietario e criar os demais usuarios pela tela de configuracoes.

## Comportamento durante a migracao

O `app.js` tenta login pelo Supabase Auth primeiro. Se o usuario ainda nao foi migrado, usa o fallback legado temporario em `dados_painel.users`.
Depois que um usuario for provisionado no Auth, o painel limpa a senha local desse usuario ao persistir os dados.

## Seguranca

A chave service role deve existir apenas nos secrets da Edge Function. Nunca coloque service role em `app.js`, HTML, N8N publico ou navegador.

## Integracoes operacionais

- `integrations-gateway`: proxy autenticado e isolado por empresa para Chatwoot, Evolution API e n8n.
- `chatwoot-webhook`: recebe eventos em tempo real do Chatwoot, registra logs e encaminha automacoes.
- `company_integrations`: configuracao tecnica por empresa; tokens ficam acessiveis apenas pelo backend.
- `integration_logs` e `automation_events`: diagnostico e fila de eventos.
- `company_leads`, `company_appointments` e `company_labels`: base operacional normalizada com RLS por empresa.

O gateway valida o `company_id` pelo perfil autenticado e rejeita qualquer identificador de outra empresa. O webhook publico usa segredo proprio e deve permanecer com `verify_jwt = false`; a validacao acontece dentro da funcao.
