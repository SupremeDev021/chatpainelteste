import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const webhookSecret = Deno.env.get("INTEGRATION_WEBHOOK_SECRET") || "";

serve(async request => {
  if (request.method !== "POST") return response({ error: "Metodo nao permitido" }, 405);
  try {
    validateSecret(request);
    const payload = await request.json();
    const companyId = await resolveCompanyId(payload);
    if (!companyId) throw new Error("Empresa nao encontrada para este webhook.");

    const eventName = normalizeEventName(payload.event, payload);
    await registerEvent(companyId, eventName, payload);
    if (eventName === "nova_conversa" || eventName === "nova_mensagem_recebida") {
      await upsertLeadFromChatwoot(companyId, payload);
    }
    const n8n = await deliverToN8n(companyId, eventName, payload);
    await log(companyId, "info", eventName, "chatwoot", "Webhook processado", { event: payload.event }, { n8n });
    return response({ ok: true, companyId, event: eventName, n8n });
  } catch (error) {
    console.error(error);
    return response({ error: error.message || "Erro no webhook" }, 400);
  }
});

function validateSecret(request: Request) {
  if (!webhookSecret) throw new Error("Secret do webhook nao configurado.");
  const url = new URL(request.url);
  const received = request.headers.get("x-webhook-secret") || url.searchParams.get("secret") || "";
  if (received !== webhookSecret) throw new Error("Secret do webhook invalido.");
}

async function resolveCompanyId(payload: any) {
  const accountId = String(payload?.account?.id || payload?.conversation?.account_id || payload?.account_id || "");
  const inboxId = String(payload?.inbox?.id || payload?.conversation?.inbox_id || payload?.inbox_id || "");
  if (accountId && inboxId) {
    const rows = await rest(`/rest/v1/company_integrations?select=company_id&chatwoot_account_id=eq.${encodeURIComponent(accountId)}&chatwoot_inbox_id=eq.${encodeURIComponent(inboxId)}&active=eq.true&limit=1`);
    if (rows?.[0]?.company_id) return Number(rows[0].company_id);
  }
  const defaultCompanyId = Number(Deno.env.get("DEFAULT_COMPANY_ID") || 0);
  const defaultAccountId = String(Deno.env.get("CHATWOOT_ACCOUNT_ID") || "");
  const defaultInboxId = String(Deno.env.get("CHATWOOT_INBOX_ID") || "");
  return defaultCompanyId && accountId === defaultAccountId && inboxId === defaultInboxId ? defaultCompanyId : null;
}

async function upsertLeadFromChatwoot(companyId: number, payload: any) {
  const conversation = payload.conversation || payload;
  const contact = payload.contact || conversation?.meta?.sender || payload.sender || {};
  const message = payload.message || payload;
  const conversationId = String(conversation.id || message.conversation_id || "");
  if (!conversationId) return;

  const existing = await rest(`/rest/v1/company_leads?select=id&company_id=eq.${companyId}&conversation_id=eq.${encodeURIComponent(conversationId)}&limit=1`);
  const body: Record<string, unknown> = {
    company_id: companyId,
    local_ref: `chatwoot_${conversationId}`,
    contact_id: String(contact.id || ""),
    conversation_id: conversationId,
    name: contact.name || contact.phone_number || `Contato ${conversationId}`,
    phone: contact.phone_number || "",
    email: contact.email || "",
    source: "Chatwoot",
    stage: existing?.[0] ? undefined : "Novo",
    status: "open",
    tags: conversation.labels || [],
    last_message: message.content || conversation.last_non_activity_message?.content || "",
    last_interaction_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  if (existing?.[0]?.id) {
    delete body.stage;
    await rest(`/rest/v1/company_leads?id=eq.${existing[0].id}`, { method: "PATCH", body });
  } else {
    await rest("/rest/v1/company_leads", { method: "POST", body });
  }
}

async function registerEvent(companyId: number, eventName: string, payload: any) {
  return rest("/rest/v1/automation_events", {
    method: "POST",
    body: {
      company_id: companyId,
      event_name: eventName,
      source: "chatwoot",
      status: "queued",
      payload: standardEvent(companyId, eventName, payload)
    }
  });
}

async function deliverToN8n(companyId: number, eventName: string, data: any) {
  const configs = await rest(`/rest/v1/company_integrations?select=n8n_webhook_url,n8n_webhook_token&company_id=eq.${companyId}&active=eq.true&limit=1`).catch(() => []);
  const config = configs?.[0] || {};
  const defaultCompanyId = Number(Deno.env.get("DEFAULT_COMPANY_ID") || 0);
  const webhookUrl = config.n8n_webhook_url || (defaultCompanyId === companyId ? Deno.env.get("N8N_WEBHOOK_URL") : "");
  const token = config.n8n_webhook_token || (defaultCompanyId === companyId ? Deno.env.get("N8N_WEBHOOK_TOKEN") : "");
  if (!webhookUrl) return { delivered: false, reason: "Webhook n8n nao configurado" };

  const result = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { "x-webhook-token": token } : {}) },
    body: JSON.stringify(standardEvent(companyId, eventName, data))
  });
  const text = await result.text();
  return { delivered: result.ok, status: result.status, response: text.slice(0, 500) };
}

function standardEvent(companyId: number, eventName: string, data: any) {
  return {
    event: eventName,
    company_id: String(companyId),
    timestamp: new Date().toISOString(),
    source: "painelsupreme",
    data
  };
}

function normalizeEventName(event: unknown, payload: any) {
  const rawEvent = String(event || "");
  if (rawEvent === "message_created") {
    const messageType = payload?.message_type ?? payload?.message?.message_type;
    const isIncoming = Number(messageType) === 0 || String(messageType).toLowerCase() === "incoming";
    const isPrivate = Boolean(payload?.private ?? payload?.is_private ?? payload?.message?.private);
    return isIncoming && !isPrivate
      ? "nova_mensagem_recebida"
      : "mensagem_enviada";
  }
  return ({
    conversation_created: "nova_conversa",
    conversation_status_changed: "conversa_atualizada",
    conversation_updated: "conversa_atualizada",
    contact_updated: "contato_atualizado"
  } as Record<string, string>)[rawEvent] || rawEvent || "webhook_chatwoot";
}

async function log(companyId: number, level: string, eventType: string, source: string, message: string, requestPayload = {}, responsePayload = {}, error: string | null = null) {
  return rest("/rest/v1/integration_logs", {
    method: "POST",
    body: { company_id: companyId, level, event_type: eventType, source, message, request_payload: requestPayload, response_payload: responsePayload, error }
  });
}

async function rest(path: string, options: { method?: string; body?: unknown } = {}) {
  const result = await fetch(`${supabaseUrl}${path}`, {
    method: options.method || "GET",
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await result.text();
  const payload = text ? JSON.parse(text) : null;
  if (!result.ok) throw new Error(payload?.message || payload?.error || `Supabase ${result.status}`);
  return payload;
}

function response(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}
