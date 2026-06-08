import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Metodo nao permitido" }, 405);

  try {
    assertEnv();
    const payload = await request.json();
    if (payload.mode === "bootstrap_owner") {
      return json(await bootstrapOwner(payload));
    }

    const authHeader = request.headers.get("Authorization") || "";
    const caller = await getCaller(authHeader);
    const companyId = Number(payload.companyId);
    if (!companyId || !payload.email || !payload.name || !payload.role) {
      return json({ error: "Campos obrigatorios ausentes" }, 400);
    }

    const allowed = await canManageCompanyUsers(caller, companyId);
    if (!allowed) return json({ error: "Permissao insuficiente" }, 403);

    const authUser = await upsertAuthUser(payload);
    const profile = await upsertProfile({
      auth_user_id: authUser.id,
      company_id: companyId,
      full_name: payload.name,
      email: String(payload.email).trim().toLowerCase(),
      role: payload.role,
      permissions: payload.permissions || {},
      active: payload.active !== false
    });

    return json({
      authUserId: authUser.id,
      profileId: profile.id,
      email: profile.email,
      role: profile.role
    });
  } catch (error) {
    console.error(error);
    return json({ error: error.message || "Erro ao provisionar usuario" }, 500);
  }
});

async function bootstrapOwner(payload: any) {
  const companyId = Number(payload.companyId);
  const email = String(payload.email || "").trim().toLowerCase();
  const password = String(payload.password || "");
  const name = String(payload.name || "Proprietario");
  if (!companyId || !email || !password) throw new Error("Campos obrigatorios ausentes para bootstrap.");

  const companies = await rest(`/rest/v1/clientes?select=id,email,senha,nome_empresa&id=eq.${companyId}&email=eq.${encodeURIComponent(email)}&senha=eq.${encodeURIComponent(password)}&limit=1`);
  const company = companies?.[0];
  if (!company) throw new Error("Credenciais da empresa invalidas para bootstrap.");

  const existingProfile = await rest(`/rest/v1/app_user_profiles?select=*&company_id=eq.${companyId}&email=eq.${encodeURIComponent(email)}&limit=1`);
  if (existingProfile?.[0]?.auth_user_id) {
    return {
      authUserId: existingProfile[0].auth_user_id,
      profileId: existingProfile[0].id,
      email: existingProfile[0].email,
      role: existingProfile[0].role
    };
  }

  const authUser = await upsertAuthUser({
    email,
    password,
    name,
    role: "proprietario"
  });
  const profile = await upsertProfile({
    auth_user_id: authUser.id,
    company_id: companyId,
    full_name: name,
    email,
    role: "proprietario",
    permissions: allPermissions(),
    active: true
  });

  return {
    authUserId: authUser.id,
    profileId: profile.id,
    email: profile.email,
    role: profile.role
  };
}

function assertEnv() {
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    throw new Error("Configure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e SUPABASE_ANON_KEY na Edge Function.");
  }
}

async function getCaller(authHeader: string) {
  if (!authHeader.startsWith("Bearer ")) throw new Error("Sessao ausente.");
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: authHeader
    }
  });
  const user = await response.json();
  if (!response.ok || !user?.id) throw new Error("Sessao invalida.");
  return user;
}

async function canManageCompanyUsers(caller: any, companyId: number) {
  const profile = await rest(`/rest/v1/app_user_profiles?select=*&auth_user_id=eq.${caller.id}&limit=1`);
  const current = profile?.[0];
  if (current?.company_id === companyId && current.active) {
    const canManage = current.permissions?.settings?.includes("manage_users");
    if (["proprietario", "administrador"].includes(current.role) || canManage) return true;
  }

  const owner = await rest(`/rest/v1/clientes?select=id,email&id=eq.${companyId}&email=eq.${encodeURIComponent(String(caller.email || "").toLowerCase())}&limit=1`);
  return Boolean(owner?.[0]);
}

async function upsertAuthUser(payload: any) {
  const body: Record<string, unknown> = {
    email: String(payload.email).trim().toLowerCase(),
    email_confirm: true,
    user_metadata: { name: payload.name }
  };
  if (payload.password) body.password = payload.password;

  if (payload.authUserId) {
    return rest(`/auth/v1/admin/users/${payload.authUserId}`, { method: "PUT", body });
  }

  return rest("/auth/v1/admin/users", { method: "POST", body });
}

async function upsertProfile(profile: Record<string, unknown>) {
  const rows = await rest("/rest/v1/app_user_profiles?on_conflict=auth_user_id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    body: profile
  });
  return rows?.[0];
}

function allPermissions() {
  return {
    dashboard: ["view", "create", "edit", "delete", "export", "manage_users", "configure_integrations"],
    inbox: ["view", "create", "edit", "delete", "export", "manage_users", "configure_integrations"],
    crm: ["view", "create", "edit", "delete", "export", "manage_users", "configure_integrations"],
    agenda: ["view", "create", "edit", "delete", "export", "manage_users", "configure_integrations"],
    management: ["view", "create", "edit", "delete", "export", "manage_users", "configure_integrations"],
    automations: ["view", "create", "edit", "delete", "export", "manage_users", "configure_integrations"],
    marketplace: ["view", "create", "edit", "delete", "export", "manage_users", "configure_integrations"],
    settings: ["view", "create", "edit", "delete", "export", "manage_users", "configure_integrations"]
  };
}

async function rest(path: string, options: { method?: string; body?: unknown; prefer?: string } = {}) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(payload?.msg || payload?.message || payload?.error || `Erro Supabase ${response.status}`);
  return payload;
}

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
