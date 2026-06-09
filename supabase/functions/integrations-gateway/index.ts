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
  if (request.method === "OPTIONS") return json({ ok: true });
  if (request.method !== "POST") return json({ error: "Metodo nao permitido" }, 405);

  let context: any = null;
  let action = "unknown";
  let payload: Record<string, any> = {};
  try {
    const body = await request.json();
    action = String(body.action || "");
    payload = body.payload || {};
    context = await integrationContext(request, payload);

    let result: unknown;
    if (action === "status") result = await integrationStatus(context);
    else if (action === "chatwoot.conversations") result = await chatwootConversations(context, payload);
    else if (action === "chatwoot.messages") result = await chatwootMessages(context, payload);
    else if (action === "chatwoot.sendMessage") result = await chatwootSendMessage(context, payload);
    else if (action === "chatwoot.setStatus") result = await chatwootSetStatus(context, payload);
    else if (action === "chatwoot.setLabels") result = await chatwootSetLabels(context, payload);
    else if (action === "evolution.sendText") result = await evolutionSendText(context, payload);
    else if (action === "automation.event") result = await emitAutomationEvent(context, payload.event, payload.data || {});
    else return json({ error: "Acao nao suportada" }, 400);

    await logIntegration(context.companyId, "info", action, "painelsupreme", "Operacao concluida", {}, compactResult(result));
    return json(result as Record<string, unknown>);
  } catch (error) {
    console.error(error);
    if (context?.companyId) {
      await logIntegration(context.companyId, "error", action, "painelsupreme", "Falha na integracao", safePayload(payload), {}, error.message).catch(console.error);
    }
    return json({ error: friendlyError(error.message), code: error.code || "INTEGRATION_ERROR" }, error.status || 500);
  }
});

async function integrationContext(request: Request, payload: Record<string, any>) {
  assertEnvironment();
  const authHeader = request.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) throw httpError(401, "Sessao ausente.", "AUTH_REQUIRED");

  const caller = await authUser(authHeader);
  const profiles = await rest(`/rest/v1/app_user_profiles?select=*&auth_user_id=eq.${caller.id}&active=eq.true&limit=1`);
  const profile = profiles?.[0];
  if (!profile?.company_id) throw httpError(403, "Usuario sem empresa ativa.", "COMPANY_NOT_FOUND");

  const companyId = Number(profile.company_id);
  if (payload.companyId && Number(payload.companyId) !== companyId) {
    throw httpError(403, "Acesso negado para esta empresa.", "TENANT_MISMATCH");
  }

  return {
    caller,
    profile,
    companyId,
    integration: await loadIntegration(companyId)
  };
}

async function loadIntegration(companyId: number) {
  const saved = await rest(`/rest/v1/company_integrations?select=*&company_id=eq.${companyId}&active=eq.true&limit=1`).catch(() => []);
  const panelRows = await rest(`/rest/v1/configuracoes_robo?select=dados_painel&cliente_id=eq.${companyId}&limit=1`);
  const panel = panelRows?.[0]?.dados_painel || {};
  const configured = saved?.[0] || {};
  const defaultCompanyId = Number(Deno.env.get("DEFAULT_COMPANY_ID") || 0);
  const allowEnvironmentFallback = !defaultCompanyId || defaultCompanyId === companyId;

  const integration = {
    chatwootBaseUrl: configured.chatwoot_base_url || (allowEnvironmentFallback ? Deno.env.get("CHATWOOT_BASE_URL") : ""),
    chatwootAccountId: configured.chatwoot_account_id || panel.integrations?.chatwoot?.accountId || (allowEnvironmentFallback ? Deno.env.get("CHATWOOT_ACCOUNT_ID") : ""),
    chatwootInboxId: configured.chatwoot_inbox_id || panel.integrations?.chatwoot?.inboxId || (allowEnvironmentFallback ? Deno.env.get("CHATWOOT_INBOX_ID") : ""),
    chatwootToken: configured.chatwoot_api_token || (allowEnvironmentFallback ? Deno.env.get("CHATWOOT_API_TOKEN") : ""),
    evolutionBaseUrl: configured.evolution_base_url || (allowEnvironmentFallback ? Deno.env.get("EVOLUTION_BASE_URL") : ""),
    evolutionInstance: configured.evolution_instance || panel.integrations?.evolution?.instanceName || (allowEnvironmentFallback ? Deno.env.get("EVOLUTION_INSTANCE") : ""),
    evolutionToken: configured.evolution_api_token || (allowEnvironmentFallback ? Deno.env.get("EVOLUTION_API_TOKEN") : ""),
    n8nBaseUrl: allowEnvironmentFallback ? Deno.env.get("N8N_BASE_URL") : "",
    n8nWebhookUrl: configured.n8n_webhook_url || safePublicUrl(panel.integrations?.n8n?.workflow) || (allowEnvironmentFallback ? Deno.env.get("N8N_WEBHOOK_URL") : ""),
    n8nWebhookToken: configured.n8n_webhook_token || (allowEnvironmentFallback ? Deno.env.get("N8N_WEBHOOK_TOKEN") : "")
  };
  return Object.fromEntries(Object.entries(integration).map(([key, value]) => [key, typeof value === "string" ? value.replace(/\/$/, "") : value]));
}

async function integrationStatus(context: any) {
  const cfg = context.integration;
  const [chatwoot, n8n, evolution] = await Promise.allSettled([
    chatwootFetch(cfg, `/api/v1/accounts/${cfg.chatwootAccountId}`),
    externalFetch(`${cfg.n8nBaseUrl}/healthz`),
    externalFetch(`${cfg.evolutionBaseUrl}/instance/connectionState/${encodeURIComponent(cfg.evolutionInstance)}`, {
      headers: { apikey: cfg.evolutionToken }
    })
  ]);
  return {
    chatwoot: settledStatus(chatwoot),
    n8n: settledStatus(n8n),
    evolution: settledStatus(evolution),
    checkedAt: new Date().toISOString()
  };
}

async function chatwootConversations(context: any, payload: Record<string, any>) {
  requireChatwoot(context.integration);
  const status = String(payload.status || "all");
  const maxPages = Math.min(Math.max(Number(payload.maxPages || 20), 1), 50);
  const requestedPage = payload.page ? Number(payload.page) : null;
  const pages = requestedPage ? [requestedPage] : Array.from({ length: maxPages }, (_, index) => index + 1);
  const conversations: any[] = [];
  let meta: Record<string, unknown> = {};

  for (const page of pages) {
    const path = `/api/v1/accounts/${context.integration.chatwootAccountId}/conversations?inbox_id=${encodeURIComponent(context.integration.chatwootInboxId)}&assignee_type=all&status=${encodeURIComponent(status)}&page=${page}`;
    const response = await chatwootFetch(context.integration, path);
    const current = response?.data?.payload || response?.payload || [];
    meta = response?.data?.meta || response?.meta || meta;
    conversations.push(...current.filter((item: any) => String(item.inbox_id) === String(context.integration.chatwootInboxId)));
    const hasMore = response?.data?.meta?.has_more ?? response?.meta?.has_more;
    if (!current.length || hasMore === false || (hasMore === undefined && current.length < 25)) break;
  }

  const unique = [...new Map(conversations.map(item => [String(item.id), item])).values()];
  return {
    conversations: unique.map(normalizeChatwootConversation),
    meta: { ...meta, returned_count: unique.length },
    syncedAt: new Date().toISOString()
  };
}

async function chatwootMessages(context: any, payload: Record<string, any>) {
  const conversationId = requiredNumber(payload.conversationId, "Conversa obrigatoria.");
  const response = await chatwootFetch(context.integration, `/api/v1/accounts/${context.integration.chatwootAccountId}/conversations/${conversationId}/messages`);
  const messages = response?.payload || response?.data?.payload || response?.messages || (Array.isArray(response) ? response : []);
  return {
    conversationId: String(conversationId),
    messages: messages.filter((message: any) => !isActivityMessage(message)).map(normalizeChatwootMessage),
    labels: response?.meta?.labels || [],
    contact: response?.meta?.contact || null,
    syncedAt: new Date().toISOString()
  };
}

async function chatwootSendMessage(context: any, payload: Record<string, any>) {
  const conversationId = requiredNumber(payload.conversationId, "Conversa obrigatoria.");
  const content = String(payload.content || "").trim();
  if (!content) throw httpError(400, "Mensagem obrigatoria.", "MESSAGE_REQUIRED");

  const response = await chatwootFetch(context.integration, `/api/v1/accounts/${context.integration.chatwootAccountId}/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      content,
      message_type: "outgoing",
      private: Boolean(payload.private),
      content_type: "text",
      content_attributes: {}
    })
  });

  await emitAutomationEvent(context, "mensagem_enviada", { conversation_id: conversationId, content, message: response });
  return { message: normalizeChatwootMessage(response), sentAt: new Date().toISOString() };
}

async function chatwootSetStatus(context: any, payload: Record<string, any>) {
  const conversationId = requiredNumber(payload.conversationId, "Conversa obrigatoria.");
  const status = String(payload.status || "resolved");
  const response = await chatwootFetch(context.integration, `/api/v1/accounts/${context.integration.chatwootAccountId}/conversations/${conversationId}/toggle_status`, {
    method: "POST",
    body: JSON.stringify({ status })
  });
  return { conversationId: String(conversationId), status, response };
}

async function chatwootSetLabels(context: any, payload: Record<string, any>) {
  const conversationId = requiredNumber(payload.conversationId, "Conversa obrigatoria.");
  const labels = Array.isArray(payload.labels) ? payload.labels.map(String) : [];
  const response = await chatwootFetch(context.integration, `/api/v1/accounts/${context.integration.chatwootAccountId}/conversations/${conversationId}/labels`, {
    method: "POST",
    body: JSON.stringify({ labels })
  });
  await emitAutomationEvent(context, "etiqueta_aplicada", { conversation_id: conversationId, labels });
  return { conversationId: String(conversationId), labels: response?.payload || labels };
}

async function evolutionSendText(context: any, payload: Record<string, any>) {
  const cfg = context.integration;
  if (!cfg.evolutionBaseUrl || !cfg.evolutionInstance || !cfg.evolutionToken) throw httpError(422, "Evolution API nao configurada.", "EVOLUTION_NOT_CONFIGURED");
  const number = String(payload.number || "").replace(/\D/g, "");
  const text = String(payload.text || "").trim();
  if (!number || !text) throw httpError(400, "Numero e mensagem sao obrigatorios.", "INVALID_MESSAGE");
  const result = await externalFetch(`${cfg.evolutionBaseUrl}/message/sendText/${encodeURIComponent(cfg.evolutionInstance)}`, {
    method: "POST",
    headers: { apikey: cfg.evolutionToken, "Content-Type": "application/json" },
    body: JSON.stringify({ number, text })
  });
  await emitAutomationEvent(context, "mensagem_enviada", { number, text, provider: "evolution" });
  return result;
}

async function emitAutomationEvent(context: any, eventName: string, data: Record<string, unknown>) {
  const event = {
    event: String(eventName || "evento"),
    company_id: String(context.companyId),
    timestamp: new Date().toISOString(),
    source: "painelsupreme",
    data
  };
  const inserted = await rest("/rest/v1/automation_events", {
    method: "POST",
    prefer: "return=representation",
    body: { company_id: context.companyId, event_name: event.event, payload: event, status: "queued" }
  });
  const eventId = inserted?.[0]?.id;
  const webhookUrl = context.integration.n8nWebhookUrl;
  if (!webhookUrl) return { queued: true, delivered: false, reason: "Webhook n8n nao configurado", eventId };

  try {
    const response = await externalFetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(context.integration.n8nWebhookToken ? { "x-webhook-token": context.integration.n8nWebhookToken } : {})
      },
      body: JSON.stringify(event)
    });
    await rest(`/rest/v1/automation_events?id=eq.${eventId}`, {
      method: "PATCH",
      body: { status: "sent", attempts: 1, processed_at: new Date().toISOString(), last_error: null }
    });
    return { queued: true, delivered: true, response, eventId };
  } catch (error) {
    await rest(`/rest/v1/automation_events?id=eq.${eventId}`, {
      method: "PATCH",
      body: { status: "failed", attempts: 1, last_error: error.message }
    });
    return { queued: true, delivered: false, error: error.message, eventId };
  }
}

async function chatwootFetch(cfg: any, path: string, options: RequestInit = {}) {
  requireChatwoot(cfg);
  return externalFetch(`${cfg.chatwootBaseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", "api-access-token": cfg.chatwootToken, ...(options.headers || {}) }
  });
}

async function externalFetch(url: string, options: RequestInit = {}) {
  if (!url) throw new Error("URL da integracao ausente.");
  const response = await fetch(url, options);
  const body = await safeJson(response);
  if (!response.ok) throw new Error(body?.errors?.join?.(", ") || body?.error || body?.message || `HTTP ${response.status}`);
  return body;
}

async function authUser(authHeader: string) {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: authHeader } });
  const user = await response.json();
  if (!response.ok || !user?.id) throw httpError(401, "Sessao invalida.", "AUTH_INVALID");
  return user;
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
  if (!response.ok) throw new Error(payload?.message || payload?.error || `Supabase ${response.status}`);
  return payload;
}

async function logIntegration(companyId: number, level: string, eventType: string, source: string, message: string, requestPayload = {}, responsePayload = {}, error: string | null = null) {
  return rest("/rest/v1/integration_logs", {
    method: "POST",
    body: {
      company_id: companyId,
      level,
      event_type: eventType,
      source,
      message,
      request_payload: requestPayload,
      response_payload: responsePayload,
      error
    }
  });
}

function normalizeChatwootConversation(item: any) {
  const sender = item?.meta?.sender || {};
  const lastMessage = item?.last_non_activity_message || item?.messages?.at?.(-1) || {};
  return {
    id: `chatwoot_${item.id}`,
    externalId: String(item.id),
    contactId: String(sender.id || ""),
    provider: "chatwoot",
    contactName: sender.name || sender.phone_number || `Contato ${item.id}`,
    phone: sender.phone_number || "",
    email: sender.email || "",
    avatarUrl: sender.thumbnail || "",
    channel: item?.meta?.channel || "Chatwoot",
    status: normalizeConversationStatus(item.status),
    labels: item.labels || [],
    unreadCount: item.unread_count || 0,
    createdAt: dateFromChatwoot(item.created_at),
    updatedAt: dateFromChatwoot(item.updated_at || item.timestamp || item.last_activity_at),
    lastMessage: lastMessage.content || "",
    messages: (item.messages || []).filter((message: any) => !isActivityMessage(message)).map(normalizeChatwootMessage)
  };
}

function normalizeChatwootMessage(message: any) {
  const attachments = (message.attachments || (message.attachment ? [message.attachment] : [])).filter(Boolean).map((attachment: any) => ({
    id: String(attachment.id || ""),
    type: attachment.file_type || attachment.extension || "file",
    url: attachment.data_url || attachment.file_url || attachment.thumb_url || "",
    thumbUrl: attachment.thumb_url || "",
    name: attachment.file_name || attachment.name || ""
  }));
  return {
    id: `chatwoot_msg_${message.id || crypto.randomUUID()}`,
    externalId: String(message.id || ""),
    from: message.private ? "note" : Number(message.message_type) === 0 || message.sender_type === "Contact" ? "contact" : "agent",
    content: message.content || message.processed_message_content || "",
    contentType: message.content_type || "text",
    status: message.status || null,
    attachments,
    createdAt: dateFromChatwoot(message.created_at || message.updated_at)
  };
}

function isActivityMessage(message: any) {
  return Number(message.message_type) === 2 && !message.private;
}

function normalizeConversationStatus(status: string) {
  if (status === "resolved") return "resolved";
  if (status === "pending" || status === "snoozed") return "pending";
  return "open";
}

function dateFromChatwoot(value: unknown) {
  if (!value) return new Date().toISOString();
  if (typeof value === "number") return new Date(value * 1000).toISOString();
  return new Date(String(value)).toISOString();
}

function settledStatus(result: PromiseSettledResult<any>) {
  if (result.status === "rejected") return { ok: false, status: "error", error: result.reason?.message || "Falha de conexao" };
  return { ok: true, status: "connected", data: result.value };
}

async function safeJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function requireChatwoot(cfg: any) {
  if (!cfg.chatwootBaseUrl || !cfg.chatwootAccountId || !cfg.chatwootInboxId || !cfg.chatwootToken) {
    throw httpError(422, "Chatwoot nao configurado para esta empresa.", "CHATWOOT_NOT_CONFIGURED");
  }
}

function assertEnvironment() {
  if (!supabaseUrl || !serviceRoleKey || !anonKey) throw new Error("Ambiente Supabase incompleto.");
}

function requiredNumber(value: unknown, message: string) {
  const number = Number(value);
  if (!number) throw httpError(400, message, "INVALID_ID");
  return number;
}

function safePublicUrl(value: unknown) {
  const url = String(value || "");
  return url.startsWith("https://") ? url : "";
}

function safePayload(payload: Record<string, unknown>) {
  const safe = { ...payload };
  delete safe.password;
  delete safe.token;
  delete safe.apiKey;
  delete safe.api_key;
  return safe;
}

function compactResult(result: any) {
  if (!result) return {};
  if (Array.isArray(result.conversations)) return { conversations: result.conversations.length, syncedAt: result.syncedAt };
  if (Array.isArray(result.messages)) return { messages: result.messages.length, syncedAt: result.syncedAt };
  return { ok: true };
}

function friendlyError(message: string) {
  if (/401|sign in|token|Sessao/i.test(message)) return "Token invalido ou expirado.";
  if (/fetch|connect|URL/i.test(message)) return "Integracao desconectada.";
  return message || "Erro na integracao.";
}

function httpError(status: number, message: string, code: string) {
  const error: any = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
