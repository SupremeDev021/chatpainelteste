import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const chatwootUrl = env("CHATWOOT_BASE_URL");
const chatwootAccountId = env("CHATWOOT_ACCOUNT_ID");
const chatwootInboxId = env("CHATWOOT_INBOX_ID");
const chatwootToken = env("CHATWOOT_API_TOKEN");
const n8nUrl = env("N8N_BASE_URL");
const evolutionUrl = env("EVOLUTION_BASE_URL");
const evolutionInstance = env("EVOLUTION_INSTANCE");
const evolutionToken = env("EVOLUTION_API_TOKEN");

serve(async request => {
  if (request.method === "OPTIONS") return json({ ok: true });
  if (request.method !== "POST") return json({ error: "Metodo nao permitido" }, 405);

  try {
    const { action, payload = {} } = await request.json();
    if (action === "status") return json(await integrationStatus());
    if (action === "chatwoot.conversations") return json(await chatwootConversations(payload));
    if (action === "chatwoot.sendMessage") return json(await chatwootSendMessage(payload));
    return json({ error: "Acao nao suportada" }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: error.message || "Erro na integracao" }, 500);
  }
});

async function integrationStatus() {
  const [chatwoot, n8n, evolution] = await Promise.allSettled([
    chatwootFetch(`/api/v1/accounts/${chatwootAccountId}`),
    fetch(`${n8nUrl}/healthz`).then(async response => ({ ok: response.ok, status: response.status, body: await safeJson(response) })),
    fetch(`${evolutionUrl}/instance/connectionState/${encodeURIComponent(evolutionInstance)}`, {
      headers: { apikey: evolutionToken }
    }).then(async response => ({ ok: response.ok, status: response.status, body: await safeJson(response) }))
  ]);

  return {
    chatwoot: normalizeSettledStatus(chatwoot),
    n8n: normalizeSettledStatus(n8n),
    evolution: normalizeSettledStatus(evolution),
    checkedAt: new Date().toISOString()
  };
}

async function chatwootConversations(payload: Record<string, unknown>) {
  const status = typeof payload.status === "string" ? payload.status : "open";
  const page = Number(payload.page || 1);
  const path = `/api/v1/accounts/${chatwootAccountId}/conversations?inbox_id=${encodeURIComponent(chatwootInboxId)}&status=${encodeURIComponent(status)}&page=${page}`;
  const response = await chatwootFetch(path);
  const conversations = response?.data?.payload || response?.payload || [];
  return {
    conversations: conversations.map(normalizeChatwootConversation),
    meta: response?.data?.meta || response?.meta || {},
    syncedAt: new Date().toISOString()
  };
}

async function chatwootSendMessage(payload: Record<string, unknown>) {
  const conversationId = Number(payload.conversationId);
  const content = String(payload.content || "").trim();
  if (!conversationId || !content) throw new Error("Conversa e mensagem sao obrigatorias.");

  const response = await chatwootFetch(`/api/v1/accounts/${chatwootAccountId}/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, message_type: "outgoing" })
  });

  return {
    message: normalizeChatwootMessage(response),
    sentAt: new Date().toISOString()
  };
}

async function chatwootFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${chatwootUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "api-access-token": chatwootToken,
      ...(options.headers || {})
    }
  });
  const body = await safeJson(response);
  if (!response.ok) throw new Error(body?.errors?.join?.(", ") || body?.error || `Chatwoot ${response.status}`);
  return body;
}

function normalizeChatwootConversation(item: any) {
  const sender = item?.meta?.sender || {};
  const lastMessage = item?.last_non_activity_message || item?.messages?.at?.(-1) || {};
  return {
    id: `chatwoot_${item.id}`,
    externalId: String(item.id),
    provider: "chatwoot",
    contactName: sender.name || sender.phone_number || `Contato ${item.id}`,
    phone: sender.phone_number || "",
    email: sender.email || "",
    channel: "Chatwoot",
    status: normalizeConversationStatus(item.status),
    labels: item.labels || [],
    unreadCount: item.unread_count || 0,
    createdAt: dateFromChatwoot(item.created_at),
    updatedAt: dateFromChatwoot(item.updated_at || item.timestamp || item.last_activity_at),
    lastMessage: lastMessage.content || "",
    messages: (item.messages || []).filter((message: any) => !message.private).map(normalizeChatwootMessage)
  };
}

function normalizeChatwootMessage(message: any) {
  return {
    id: `chatwoot_msg_${message.id || crypto.randomUUID()}`,
    externalId: String(message.id || ""),
    from: message.message_type === 1 || message.sender_type === "User" ? "agent" : "contact",
    content: message.content || "",
    createdAt: dateFromChatwoot(message.created_at || message.updated_at)
  };
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

function normalizeSettledStatus(result: PromiseSettledResult<any>) {
  if (result.status === "rejected") {
    return { ok: false, status: "error", error: result.reason?.message || "Falha de conexao" };
  }
  const body = result.value?.body || result.value;
  return { ok: true, status: "connected", data: body };
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

function env(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Secret ausente: ${name}`);
  return value.replace(/\/$/, "");
}

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
