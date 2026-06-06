// ==========================================================================
// 0. CONEXÃO SUPABASE E CONFIGURAÇÕES GERAIS
// ==========================================================================
const SUPABASE_URL = 'https://hhyvtehbsfoeuagwhklm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_S9oWEYBafLstrVI2SJQ9uA_ijH5Ph9e';
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

let clienteLogado = null;

// Configuração central do "Painel Camaleão" - Define o que cada nicho vê
const CONFIG_POR_NICHO = {
    "clinica": [
        { id: "dashboard", icon: "fa-chart-pie", name: "Dashboard" },
        { id: "inbox", icon: "fa-comments", name: "Atendimentos" },
        { id: "agenda", icon: "fa-calendar-check", name: "Agenda de Consultas" },
        { id: "crm", icon: "fa-bullseye", name: "CRM" },
        { id: "automations", icon: "fa-robot", name: "Automações" },
        { id: "settings", icon: "fa-sliders", name: "Configurações" }
    ],
    "restaurante": [
        { id: "dashboard", icon: "fa-chart-pie", name: "Dashboard" },
        { id: "inbox", icon: "fa-comments", name: "Atendimentos" },
        { id: "pedidos", icon: "fa-motorcycle", name: "Gestão de Pedidos" },
        { id: "cardapio", icon: "fa-burger", name: "Cardápio" },
        { id: "automations", icon: "fa-robot", name: "Automações" },
        { id: "settings", icon: "fa-sliders", name: "Configurações" }
    ],
    "padrao": [ // Usado se o segmento não tiver configuração específica
        { id: "dashboard", icon: "fa-chart-pie", name: "Dashboard" },
        { id: "inbox", icon: "fa-comments", name: "Atendimentos" },
        { id: "crm", icon: "fa-bullseye", name: "CRM Visual" },
        { id: "automations", icon: "fa-robot", name: "Automações" },
        { id: "management", icon: "fa-building", name: "Gestão" },
        { id: "settings", icon: "fa-sliders", name: "Configurações" }
    ]
};

// ==========================================================================
// 1. CHAVES DE ARMAZENAMENTO (LOCAL STORAGE)
// ==========================================================================
const SUPREME_STORAGE_KEYS = {
  whiteLabel: "supreme_whitelabel_config",
  backend: "supreme_backend_config",
  ai: "supreme_ai_config",
  sessao: "sessao_supreme_cliente"
};

// ==========================================================================
// 2. SUPREME DESIGN SYSTEM - COMPONENT FACTORY (VANILLA JS)
// ==========================================================================
const SupremeUI = {
    chatItem: function({ id, name, initials, preview, time, channel, status, unread, isActive }) {
        const activeClass = isActive ? 'active' : '';
        const unreadBadge = unread > 0 ? `<span class="badge status-open">${unread}</span>` : '';
        
        return `
            <button class="chat-item ${activeClass}" type="button" data-conversation-id="${id}">
                <div class="avatar">${initials}</div>
                <div class="chat-preview">
                    <h4><span>${name}</span><span class="chat-time">${time}</span></h4>
                    <p>${preview}</p>
                    <div class="chat-meta-line">
                        ${getChannelBadge(channel)}
                        <span class="badge status-${status}">${getStatusLabel(status)}</span>
                        ${unreadBadge}
                    </div>
                </div>
            </button>
        `;
    },

    chatMessage: function({ type, text, time }) {
        const msgClass = type === 'in' ? 'msg-in' : type === 'note' ? 'msg-note' : 'msg-out';
        const notePrefix = type === 'note' ? '<strong>Nota interna:</strong> ' : '';
        
        return `
            <div class="message ${msgClass}">
                ${notePrefix}${escapeHTML(text)}
                <span class="msg-time">${escapeHTML(time)}</span>
            </div>
        `;
    },

    kanbanCard: function({ id, title, company, value, probability }) {
        return `
            <article class="k-card" draggable="true" data-opportunity-id="${id}">
                <h4>${escapeHTML(title)}</h4>
                <p>${escapeHTML(company)}</p>
                <div class="k-card-footer">
                    <span>${formatCurrency(value)}</span>
                    <span>${probability}%</span>
                </div>
            </article>
        `;
    },

    automationCard: function({ id, name, description, icon, active }) {
        const btnClass = active ? 'btn-secondary' : 'btn-ghost';
        const toggleIcon = active ? 'fa-toggle-on' : 'fa-toggle-off';
        const statusText = active ? 'Ativa' : 'Inativa';

        return `
            <article class="automation-card">
                <div class="automation-icon"><i class="${icon}"></i></div>
                <h3>${escapeHTML(name)}</h3>
                <p>${escapeHTML(description)}</p>
                <button class="btn ${btnClass} full" type="button" data-toggle-automation="${id}">
                    <i class="fa-solid ${toggleIcon}"></i> ${statusText}
                </button>
            </article>
        `;
    }
};

// ==========================================================================
// 3. ESTADO GLOBAL DA APLICAÇÃO (STATE)
// ==========================================================================
const state = {
  activeModule: "dashboard",
  activeFilter: "all",
  activeConversationId: "conv-001",
  isInternalNote: false,
  uploadedLogoDataUrl: "",
  draggedOpportunityId: null,

  conversations: [
    {
      id: "conv-001", status: "open", assignedTo: "Ana Sales", lastAt: "09:42", unread: 2,
      contact: { name: "Mariana Costa", initials: "MC", company: "Costa Beauty Clinic", channel: "whatsapp", phone: "+55 11 98888-1200", tags: ["Lead quente", "Automação", "WhatsApp"], sentiment: "Positivo", value: 6800 },
      messages: [
        { type: "in", text: "Olá, vi a Supreme Tech no Instagram. Quero automatizar o atendimento da minha clínica pelo WhatsApp.", time: "09:31" },
        { type: "out", text: "Olá, Mariana! Perfeito. Conseguimos integrar WhatsApp, IA, CRM e automações para sua clínica. Hoje vocês recebem muitos leads por dia?", time: "09:34" },
        { type: "in", text: "Sim, recebemos em média 40 mensagens por dia e perdemos muitas por demora no retorno.", time: "09:42" }
      ]
    },
    {
      id: "conv-002", status: "pending", assignedTo: "Bruno CX", lastAt: "10:08", unread: 0,
      contact: { name: "Rafael Mendes", initials: "RM", company: "Mendes Imóveis", channel: "instagram", phone: "+55 21 97777-4400", tags: ["CRM", "Pipeline"], sentiment: "Neutro", value: 9200 },
      messages: [
        { type: "in", text: "Preciso organizar meus corretores em um funil de vendas. Vocês têm CRM visual?", time: "09:58" },
        { type: "note", text: "Cliente pediu demonstração ainda esta semana. Priorizar follow-up.", time: "10:08" }
      ]
    }
  ],

  opportunities: [
    { id: "opp-001", title: "Automação WhatsApp + IA", company: "Costa Beauty Clinic", value: 6800, stage: "Novo Lead", probability: 35, owner: "Ana Sales" },
    { id: "opp-002", title: "CRM para corretores", company: "Mendes Imóveis", value: 9200, stage: "Qualificação", probability: 55, owner: "Bruno CX" },
    { id: "opp-003", title: "IA para suporte educacional", company: "JR Educação", value: 3900, stage: "Proposta", probability: 70, owner: "Carla Suporte" },
    { id: "opp-004", title: "Integração ERP Enterprise", company: "Lima Distribuidora", value: 14700, stage: "Fechado", probability: 100, owner: "Ana Sales" }
  ],

  automations: [
    { id: "auto-001", name: "Novo lead WhatsApp", description: "Cria contato, aplica tag, envia saudação e abre oportunidade no CRM.", icon: "fa-brands fa-whatsapp", active: true },
    { id: "auto-002", name: "Follow-up inteligente", description: "Detecta conversas sem resposta e agenda follow-up automático.", icon: "fa-solid fa-clock-rotate-left", active: true },
    { id: "auto-003", name: "Resumo pós-atendimento", description: "Gera resumo, classifica sentimento e atualiza histórico do cliente.", icon: "fa-solid fa-brain", active: false }
  ],

  contracts: [
    { client: "Costa Beauty Clinic", plan: "Automation Pro", status: "Em negociação", mrr: 1890, due: "15/07/2026" },
    { client: "Mendes Imóveis", plan: "CRM Enterprise", status: "Proposta enviada", mrr: 2490, due: "22/07/2026" }
  ]
};

// ==========================================================================
// 4. INICIALIZAÇÃO, LOGIN E EVENTOS
// ==========================================================================
document.addEventListener("DOMContentLoaded", initApp);

function initApp() {
  const sessaoSalva = localStorage.getItem(SUPREME_STORAGE_KEYS.sessao);
  
  if (sessaoSalva) {
      // Já está logado
      iniciarSessao(JSON.parse(sessaoSalva));
  } else {
      // Não está logado, mostra tela de login e esconde o painel
      document.getElementById('login-screen').style.display = 'flex';
      document.querySelector('.app-shell').style.display = 'none';
  }

  // Prepara formulário de login (se existir na tela)
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
      loginForm.addEventListener('submit', realizarLogin);
  }
}

// LÓGICA DE LOGIN UNIFICADA
async function realizarLogin(e) {
    e.preventDefault();
    if (!supabaseClient) return showTechToast("Supabase não configurado.", "error");

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const btn = e.target.querySelector('button');
    const textoOriginal = btn.innerText;
    
    btn.innerText = "Autenticando...";

    // Simulação ou chamada real ao Supabase (Adaptado da sua estrutura Admin)
    const { data: cliente, error } = await supabaseClient
        .from('clientes')
        .select('*')
        .eq('email', email)
        .eq('senha', senha)
        .single(); 

    btn.innerText = textoOriginal;

    if (cliente) {
        if (cliente.status === 'suspenso') {
            showTechToast("⛔ Acesso Suspenso. Contate a Supreme-Tech.", "error");
            return;
        }
        iniciarSessao(cliente);
    } else {
        showTechToast("Acesso Negado. Credenciais inválidas.", "error");
    }
}

// PREPARA O PAINEL DE ACORDO COM A EMPRESA
function iniciarSessao(dadosCliente) {
    clienteLogado = dadosCliente;
    localStorage.setItem(SUPREME_STORAGE_KEYS.sessao, JSON.stringify(dadosCliente));

    // Ocultar login, exibir App
    const loginScreen = document.getElementById('login-screen');
    const appShell = document.querySelector('.app-shell');
    if (loginScreen) loginScreen.style.display = 'none';
    if (appShell) appShell.style.display = 'flex';

    showTechToast(`Bem-vindo, ${clienteLogado.nome_empresa}!`, "success");

    // 1. CARREGAR WHITE-LABEL DINÂMICO
    loadSavedWhiteLabel(); // Tenta carregar local, mas numa versão avançada puxaria do 'dadosCliente'

    // 2. CONSTRUIR O MENU CAMALEÃO (Dicionário de Nichos)
    renderSidebar(clienteLogado.segmento);

    // 3. INJETAR CHATWOOT (Exemplo de como ficaria a integração invisível)
    // initChatwootWidget(clienteLogado.nome_instancia);

    // 4. RENDERIZAR O MÓDULO INICIAL
    bindEvents();
    setActiveModule("dashboard");
}

function fazerLogout() {
    clienteLogado = null;
    localStorage.removeItem(SUPREME_STORAGE_KEYS.sessao);
    document.querySelector('.app-shell').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
}

function renderSidebar(segmento) {
    const sidebarMenu = document.querySelector('.saas-menu');
    if (!sidebarMenu) return;

    sidebarMenu.innerHTML = ''; // Limpa menu atual
    
    // Pega a lista de módulos baseada no nicho da empresa, ou 'padrao' se não achar
    const modulos = CONFIG_POR_NICHO[segmento] || CONFIG_POR_NICHO["padrao"];

    modulos.forEach(mod => {
        sidebarMenu.innerHTML += `
            <button class="saas-btn" data-module="${mod.id}" title="${mod.name}" type="button">
                <i class="fa-solid ${mod.icon}"></i>
            </button>
        `;
    });

    // Re-bind click events for the newly created buttons
    sidebarMenu.querySelectorAll('.saas-btn').forEach(btn => {
        btn.addEventListener('click', () => setActiveModule(btn.dataset.module));
    });
}

function bindEvents() {
  // Os eventos do Sidebar agora são criados no renderSidebar(), mas mantemos para navegação interna
  document.querySelectorAll("[data-module-open]").forEach((button) => {
    button.addEventListener("click", () => setActiveModule(button.dataset.moduleOpen));
  });

  const btnRefresh = document.getElementById("btn-refresh-dashboard");
  if(btnRefresh) btnRefresh.addEventListener("click", () => { renderDashboard(); showTechToast("Atualizado.", "info"); });

  const searchInput = document.getElementById("conversation-search");
  if(searchInput) searchInput.addEventListener("input", () => renderConversations());

  document.querySelectorAll(".filter-btn[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeFilter = button.dataset.filter;
      document.querySelectorAll(".filter-btn").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderConversations();
    });
  });

  const convList = document.getElementById("conversations-list");
  if(convList) {
      convList.addEventListener("click", (event) => {
        const chatItem = event.target.closest(".chat-item");
        if (!chatItem) return;
        state.activeConversationId = chatItem.dataset.conversationId;
        const conversation = getActiveConversation();
        if (conversation) conversation.unread = 0;
        renderConversations();
        renderActiveConversation();
      });
  }

  document.querySelectorAll(".macro-tag[data-macro]").forEach((button) => {
    button.addEventListener("click", () => insertMacro(button.dataset.macro));
  });

  const toggleNote = document.getElementById("toggle-note");
  if(toggleNote) toggleNote.addEventListener("change", toggleInternalNote);

  const btnSend = document.getElementById("btn-send");
  if(btnSend) btnSend.addEventListener("click", sendMessage);

  const msgInput = document.getElementById("msg-input");
  if(msgInput) {
      msgInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          sendMessage();
        }
      });
  }

  // Bind dinâmico verificando se os botões existem
  const bindIfExists = (id, event, func) => { const el = document.getElementById(id); if(el) el.addEventListener(event, func); };
  
  bindIfExists("btn-ai-suggestion", "click", applyAISuggestion);
  bindIfExists("btn-ai-summary", "click", generateAISummary);
  bindIfExists("btn-analyze-sentiment", "click", analyzeSentiment);
  bindIfExists("btn-resolve-conversation", "click", resolveConversation);
  bindIfExists("btn-new-conversation", "click", createMockConversation);
  bindIfExists("btn-add-opportunity", "click", createOpportunity);

  const kanbanBoard = document.getElementById("kanban-board");
  if (kanbanBoard) {
      kanbanBoard.addEventListener("dragstart", handleKanbanDragStart);
      kanbanBoard.addEventListener("dragover", handleKanbanDragOver);
      kanbanBoard.addEventListener("drop", handleKanbanDrop);
  }

  bindIfExists("btn-create-automation", "click", createAutomation);
  
  const autoGrid = document.getElementById("automation-grid");
  if(autoGrid) {
      autoGrid.addEventListener("click", (event) => {
        const button = event.target.closest("[data-toggle-automation]");
        if (!button) return;
        toggleAutomation(button.dataset.toggleAutomation);
      });
  }

  bindIfExists("btn-export-report", "click", () => showTechToast("Relatório empresarial exportado com sucesso.", "success"));
  bindIfExists("wl-logo-file", "change", handleLogoUpload);
  bindIfExists("btn-apply-whitelabel", "click", applyWhiteLabel);
  bindIfExists("btn-save-backend", "click", saveBackendConfig);
  bindIfExists("btn-save-ai", "click", saveAIConfig);
  bindIfExists("btn-logout", "click", fazerLogout);
}

// ==========================================================================
// 5. FUNÇÕES DE RENDERIZAÇÃO E NEGÓCIO
// ==========================================================================

function setActiveModule(moduleName) {
  state.activeModule = moduleName;

  document.querySelectorAll(".saas-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.module === moduleName);
  });

  document.querySelectorAll(".app-module").forEach((section) => {
    section.classList.remove("active");
  });

  const activeSection = document.getElementById(`module-${moduleName}`);
  if (activeSection) {
    activeSection.classList.add("active");
  }

  if (moduleName === "dashboard") renderDashboard();
  if (moduleName === "crm") renderKanban();
  if (moduleName === "automations") renderAutomations();
  if (moduleName === "inbox") {
      renderConversations();
      renderActiveConversation();
  }
}

function renderDashboard() {
  const kpiLeads = document.getElementById("kpi-leads");
  if(!kpiLeads) return; // Se a tela não foi injetada, aborta.

  const leads = state.conversations.length + 12;
  const conversions = state.opportunities.filter((opportunity) => opportunity.stage === "Fechado").length;
  const active = state.conversations.filter((conversation) => conversation.status === "open").length;
  const revenue = state.opportunities
    .filter((opportunity) => opportunity.stage === "Fechado")
    .reduce((total, opportunity) => total + opportunity.value, 0);

  const efficiency = Math.min(98, 86 + active + conversions);
  const averageResponse = "3m 24s";

  setText("kpi-leads", String(leads));
  setText("kpi-conversions", String(conversions));
  setText("kpi-active", String(active));
  setText("kpi-response", averageResponse);
  setText("kpi-efficiency", `${efficiency}%`);
  setText("kpi-revenue", formatCurrency(revenue));
  setText("hero-score", `${efficiency}%`);
  setText("hero-ai", String(37 + active));

  const insights = [
    "Leads com intenção comercial alta aumentaram 18% nas últimas 24h.",
    "Tempo médio de primeira resposta está dentro da meta premium.",
    "IA recomenda priorizar oportunidades acima de R$ 8.000 no pipeline."
  ];

  const insightsContainer = document.getElementById("dashboard-insights");
  if(insightsContainer) insightsContainer.innerHTML = insights.map((item) => `<li>${escapeHTML(item)}</li>`).join("");
}

function renderConversations() {
  const list = document.getElementById("conversations-list");
  if (!list) return;

  const searchInput = document.getElementById("conversation-search");
  const search = searchInput ? searchInput.value.trim().toLowerCase() : "";

  const filtered = state.conversations.filter((conversation) => {
    const matchesFilter = state.activeFilter === "all" || conversation.status === state.activeFilter;
    const searchable = [
      conversation.contact.name,
      conversation.contact.company,
      conversation.contact.phone,
      getLastMessage(conversation).text
    ].join(" ").toLowerCase();

    return matchesFilter && searchable.includes(search);
  });

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><p>Nenhuma conversa encontrada.</p></div>`;
    return;
  }

  list.innerHTML = filtered.map((conversation) => {
    return SupremeUI.chatItem({
      id: conversation.id,
      name: conversation.contact.name,
      initials: conversation.contact.initials,
      preview: getLastMessage(conversation).text,
      time: conversation.lastAt,
      channel: conversation.contact.channel,
      status: conversation.status,
      unread: conversation.unread,
      isActive: conversation.id === state.activeConversationId
    });
  }).join("");
}

function renderActiveConversation() {
  const conversation = getActiveConversation();
  if (!conversation) return;

  setText("active-contact-name", conversation.contact.name);
  setText("active-contact-meta", `${conversation.contact.company} • ${capitalize(conversation.contact.channel)} • ${conversation.assignedTo}`);

  const assignSelect = document.getElementById("assign-select");
  if (assignSelect) assignSelect.value = conversation.assignedTo;

  const history = document.getElementById("chat-history");
  if (history) {
      history.innerHTML = conversation.messages.map((message) => {
        return SupremeUI.chatMessage({
          type: message.type,
          text: message.text,
          time: message.time
        });
      }).join("");
      history.scrollTop = history.scrollHeight;
  }

  renderContactDetails(conversation);
}

function renderContactDetails(conversation) {
  setText("details-avatar", conversation.contact.initials);
  setText("details-name", conversation.contact.name);
  setText("details-company", conversation.contact.company);
  setText("details-channel", capitalize(conversation.contact.channel));
  setText("details-phone", conversation.contact.phone);
  setText("details-value", formatCurrency(conversation.contact.value));
  setText("details-sentiment", conversation.contact.sentiment);

  const tagsContainer = document.getElementById("details-tags");
  if (tagsContainer) {
      tagsContainer.innerHTML = conversation.contact.tags
        .map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join("");
  }

  const summaryOutput = document.getElementById("ai-summary-output");
  if (summaryOutput && !summaryOutput.dataset.generated) {
    summaryOutput.textContent = "Gere um resumo automático para visualizar o contexto da conversa.";
  }
}

function sendMessage() {
  const input = document.getElementById("msg-input");
  if(!input) return;
  const text = input.value.trim();
  const conversation = getActiveConversation();

  if (!conversation) return showTechToast("Selecione uma conversa antes de enviar.", "error");
  if (!text) return showTechToast("Digite uma mensagem antes de enviar.", "error");

  const messageType = state.isInternalNote ? "note" : "out";

  conversation.messages.push({
    type: messageType,
    text,
    time: getCurrentTime()
  });
  conversation.lastAt = getCurrentTime();

  if (!state.isInternalNote && conversation.status === "pending") {
    conversation.status = "open";
  }

  input.value = "";
  renderConversations();
  renderActiveConversation();
  showTechToast(state.isInternalNote ? "Nota interna adicionada." : "Mensagem enviada com sucesso.", "success");
}

function insertMacro(text) {
  const input = document.getElementById("msg-input");
  if(!input) return;
  const separator = input.value.trim().length > 0 ? " " : "";
  input.value = `${input.value}${separator}${text}`;
  input.focus();
}

function toggleInternalNote() {
  const toggle = document.getElementById("toggle-note");
  if(!toggle) return;
  state.isInternalNote = toggle.checked;

  const inputArea = document.getElementById("input-area");
  const inputField = document.getElementById("msg-input");
  const sendIcon = document.querySelector("#btn-send i");

  if(inputArea) inputArea.classList.toggle("internal-note-mode", state.isInternalNote);
  if(inputField) inputField.placeholder = state.isInternalNote ? "Escreva uma nota interna para sua equipe..." : "Digite sua mensagem ao cliente...";
  if(sendIcon) sendIcon.className = state.isInternalNote ? "fa-solid fa-lock" : "fa-solid fa-paper-plane";
}

function applyAISuggestion() {
  const conversation = getActiveConversation();
  if (!conversation) return showTechToast("Selecione uma conversa para usar a IA.", "error");

  const suggestion = createAISuggestion(conversation);
  const input = document.getElementById("msg-input");
  if(input) {
      input.value = suggestion;
      input.focus();
  }
  showTechToast("Sugestão de IA aplicada no campo de mensagem.", "info");
}

function createAISuggestion(conversation) {
  const value = conversation.contact.value;
  if (conversation.contact.sentiment === "Preocupado") {
    return "Entendo sua preocupação. Para garantir segurança e qualidade, podemos configurar limites de resposta, base de conhecimento aprovada e transferência para humano quando a IA identificar baixa confiança.";
  }
  if (value >= 8000) {
    return "Pelo volume e potencial da sua operação, recomendo uma implantação com CRM visual, automações de follow-up e IA para qualificação dos leads. Posso montar uma proposta premium personalizada para você.";
  }
  return "Perfeito. Podemos estruturar uma solução com atendimento integrado, histórico inteligente e automações para reduzir tempo de resposta e aumentar conversões.";
}

function generateAISummary() {
  const conversation = getActiveConversation();
  if (!conversation) return showTechToast("Selecione uma conversa para resumir.", "error");

  const lastInbound = [...conversation.messages].reverse().find((message) => message.type === "in");
  const summary = `Resumo IA: ${conversation.contact.name} da empresa ${conversation.contact.company} demonstrou interesse em ${conversation.contact.tags.join(", ")}. Valor estimado: ${formatCurrency(conversation.contact.value)}. Último ponto relevante: "${lastInbound ? lastInbound.text : "sem mensagem recente"}".`;

  const output = document.getElementById("ai-summary-output");
  if(output) {
      output.textContent = summary;
      output.dataset.generated = "true";
  }
  showTechToast("Resumo automático gerado pela IA.", "success");
}

function analyzeSentiment() {
  const conversation = getActiveConversation();
  if (!conversation) return showTechToast("Selecione uma conversa para analisar.", "error");

  const joinedMessages = conversation.messages.map((message) => message.text.toLowerCase()).join(" ");

  if (joinedMessages.includes("preocup") || joinedMessages.includes("demora") || joinedMessages.includes("perdemos")) {
    conversation.contact.sentiment = "Preocupado";
  } else if (joinedMessages.includes("ótimo") || joinedMessages.includes("excelente") || joinedMessages.includes("perfeito")) {
    conversation.contact.sentiment = "Positivo";
  } else {
    conversation.contact.sentiment = "Neutro";
  }

  renderActiveConversation();
  showTechToast(`Sentimento classificado como: ${conversation.contact.sentiment}.`, "info");
}

function resolveConversation() {
  const conversation = getActiveConversation();
  if (!conversation) return showTechToast("Selecione uma conversa para resolver.", "error");

  conversation.status = "resolved";
  conversation.unread = 0;

  renderConversations();
  renderActiveConversation();
  renderDashboard();
  showTechToast("Atendimento marcado como resolvido.", "success");
}

function createMockConversation() {
  const id = `conv-${String(state.conversations.length + 1).padStart(3, "0")}`;
  const conversation = {
    id, status: "open", assignedTo: "IA Copilot", lastAt: getCurrentTime(), unread: 1,
    contact: { name: "Novo Lead Premium", initials: "NL", company: "Empresa em Qualificação", channel: "whatsapp", phone: "+55 11 90000-0000", email: "lead@empresa.com", tags: ["Novo", "IA", "Qualificação"], sentiment: "Neutro", value: 5200 },
    messages: [{ type: "in", text: "Olá, quero conhecer as soluções da Supreme Tech.", time: getCurrentTime() }]
  };

  state.conversations.unshift(conversation);
  state.activeConversationId = id;

  renderConversations();
  renderActiveConversation();
  renderDashboard();
  showTechToast("Nova conversa criada para demonstração.", "success");
}

function renderKanban() {
    const board = document.getElementById("kanban-board");
    if (!board) return;
    const stages = ["Novo Lead", "Qualificação", "Proposta", "Fechado"];

    board.innerHTML = stages.map(stage => {
        const stageOpps = state.opportunities.filter(opp => opp.stage === stage);
        const stageTotal = stageOpps.reduce((sum, opp) => sum + opp.value, 0);

        const cardsHTML = stageOpps.map(opp => 
            SupremeUI.kanbanCard({
                id: opp.id, title: opp.title, company: opp.company, value: opp.value, probability: opp.probability
            })
        ).join("");

        return `
            <section class="kanban-column" data-stage="${escapeHTML(stage)}">
                <header class="kanban-header">
                    <h3>${escapeHTML(stage)}</h3>
                    <span>${stageOpps.length} oportunidades • ${formatCurrency(stageTotal)}</span>
                </header>
                <div class="kanban-cards">
                    ${cardsHTML}
                </div>
            </section>
        `;
    }).join("");
}

function handleKanbanDragStart(event) {
  const card = event.target.closest(".k-card");
  if (!card) return;
  state.draggedOpportunityId = card.dataset.opportunityId;
  event.dataTransfer.effectAllowed = "move";
}

function handleKanbanDragOver(event) {
  const column = event.target.closest(".kanban-column");
  if (!column) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function handleKanbanDrop(event) {
  const column = event.target.closest(".kanban-column");
  if (!column || !state.draggedOpportunityId) return;

  const opportunity = state.opportunities.find((item) => item.id === state.draggedOpportunityId);
  if (!opportunity) return;

  opportunity.stage = column.dataset.stage;
  if (opportunity.stage === "Fechado") {
    opportunity.probability = 100;
  }

  state.draggedOpportunityId = null;
  renderKanban();
  renderDashboard();
  showTechToast(`Oportunidade movida para ${opportunity.stage}.`, "success");
}

function createOpportunity() {
  const id = `opp-${String(state.opportunities.length + 1).padStart(3, "0")}`;
  state.opportunities.unshift({
    id, title: "Nova solução SaaS personalizada", company: "Lead Enterprise", value: 7500, stage: "Novo Lead", probability: 25, owner: "Ana Sales"
  });

  renderKanban();
  renderDashboard();
  showTechToast("Nova oportunidade criada no CRM.", "success");
}

function renderAutomations() {
  const grid = document.getElementById("automation-grid");
  if(!grid) return;
  
  grid.innerHTML = state.automations.map((automation) => {
    return SupremeUI.automationCard({
        id: automation.id, name: automation.name, description: automation.description, icon: automation.icon, active: automation.active
    });
  }).join("");
}

function toggleAutomation(id) {
  const automation = state.automations.find((item) => item.id === id);
  if (!automation) return;

  automation.active = !automation.active;
  renderAutomations();
  showTechToast(`Automação ${automation.active ? "ativada" : "desativada"}.`, "info");
}

function createAutomation() {
  const id = `auto-${String(state.automations.length + 1).padStart(3, "0")}`;
  state.automations.push({
    id, name: "Webhook para CRM externo", description: "Envia eventos de conversa e oportunidade para sistemas externos via webhook.", icon: "fa-solid fa-plug-circle-bolt", active: false
  });

  renderAutomations();
  showTechToast("Nova automação criada.", "success");
}

function renderContracts() {
  const table = document.getElementById("contracts-table");
  if(!table) return;
  table.innerHTML = state.contracts
    .map((contract) => {
      const statusClass = contract.status === "Ativo" ? "status-open" : contract.status === "Proposta enviada" ? "status-pending" : "status-resolved";
      return `
        <tr>
          <td>${escapeHTML(contract.client)}</td>
          <td>${escapeHTML(contract.plan)}</td>
          <td><span class="badge ${statusClass}">${escapeHTML(contract.status)}</span></td>
          <td>${formatCurrency(contract.mrr)}</td>
          <td>${escapeHTML(contract.due)}</td>
        </tr>
      `;
    }).join("");
}

// ==========================================================================
// 6. FUNÇÕES DE CONFIGURAÇÃO (WHITE-LABEL, BACKEND, IA)
// ==========================================================================

function handleLogoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) {
    showTechToast("Formato inválido. Use PNG, JPG, WEBP ou SVG.", "error");
    event.target.value = "";
    return;
  }

  if (file.size > 1024 * 1024) {
    showTechToast("A imagem deve ter no máximo 1MB.", "error");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    state.uploadedLogoDataUrl = String(reader.result);
    const fileNameDisplay = document.getElementById("file-name-display");
    if(fileNameDisplay) fileNameDisplay.textContent = file.name;
    const clientLogo = document.getElementById("client-logo-sidebar");
    if(clientLogo) clientLogo.src = state.uploadedLogoDataUrl;
    showTechToast("Logomarca carregada. Clique em aplicar para salvar.", "info");
  };
  reader.onerror = () => showTechToast("Não foi possível carregar a imagem.", "error");
  reader.readAsDataURL(file);
}

function applyWhiteLabel() {
  const bgInput = document.getElementById("wl-bg");
  const primaryInput = document.getElementById("wl-primary");
  const accentInput = document.getElementById("wl-accent");
  const logoInput = document.getElementById("wl-logo-url");

  if (!bgInput || !primaryInput || !accentInput) return;

  const bgColor = bgInput.value;
  const primaryColor = primaryInput.value;
  const accentColor = accentInput.value;
  const logoUrl = logoInput ? logoInput.value.trim() : '';

  const clientLogo = document.getElementById("client-logo-sidebar");
  let finalLogo = state.uploadedLogoDataUrl || (clientLogo ? clientLogo.src : '');

  if (logoUrl) {
    if (!isValidURL(logoUrl)) return showTechToast("URL da logomarca inválida.", "error");
    finalLogo = logoUrl;
  }

  document.documentElement.style.setProperty("--bg-dark", bgColor);
  document.documentElement.style.setProperty("--primary", primaryColor);
  document.documentElement.style.setProperty("--primary-strong", lightenHex(primaryColor, 22));
  document.documentElement.style.setProperty("--accent", accentColor);
  if(clientLogo) clientLogo.src = finalLogo;

  const config = { bgColor, primaryColor, accentColor, logoUrl: finalLogo };
  localStorage.setItem(SUPREME_STORAGE_KEYS.whiteLabel, JSON.stringify(config));
  showTechToast("Identidade visual aplicada com sucesso.", "success");
}

function loadSavedWhiteLabel() {
  const rawConfig = localStorage.getItem(SUPREME_STORAGE_KEYS.whiteLabel);
  if (!rawConfig) return;

  try {
    const config = JSON.parse(rawConfig);
    if (config.bgColor) { 
        document.documentElement.style.setProperty("--bg-dark", config.bgColor); 
        const bgInput = document.getElementById("wl-bg");
        if(bgInput) bgInput.value = config.bgColor; 
    }
    if (config.primaryColor) {
      document.documentElement.style.setProperty("--primary", config.primaryColor);
      document.documentElement.style.setProperty("--primary-strong", lightenHex(config.primaryColor, 22));
      const primInput = document.getElementById("wl-primary");
      if(primInput) primInput.value = config.primaryColor;
    }
    if (config.accentColor) { 
        document.documentElement.style.setProperty("--accent", config.accentColor); 
        const accInput = document.getElementById("wl-accent");
        if(accInput) accInput.value = config.accentColor; 
    }
    if (config.logoUrl) { 
        const clientLogo = document.getElementById("client-logo-sidebar");
        if(clientLogo) clientLogo.src = config.logoUrl; 
    }
  } catch {
    localStorage.removeItem(SUPREME_STORAGE_KEYS.whiteLabel);
  }
}

function saveBackendConfig() {
  const backendURL = document.getElementById("backend-url")?.value.trim() || '';
  const accountId = document.getElementById("chatwoot-account")?.value.trim() || '';

  if (backendURL && !isValidURL(backendURL)) return showTechToast("URL do backend inválida.", "error");

  const config = { backendURL, accountId };
  localStorage.setItem(SUPREME_STORAGE_KEYS.backend, JSON.stringify(config));
  showTechToast("Conexão segura salva. Token deve permanecer no backend.", "success");
}

function loadSavedBackendConfig() {
  const rawConfig = localStorage.getItem(SUPREME_STORAGE_KEYS.backend);
  if (!rawConfig) return;

  try {
    const config = JSON.parse(rawConfig);
    const backendInput = document.getElementById("backend-url");
    const accountInput = document.getElementById("chatwoot-account");
    if(backendInput) backendInput.value = config.backendURL || "";
    if(accountInput) accountInput.value = config.accountId || "";
  } catch {
    localStorage.removeItem(SUPREME_STORAGE_KEYS.backend);
  }
}

function saveAIConfig() {
  const toneInput = document.getElementById("ai-tone");
  const autoSummaryInput = document.getElementById("ai-autosummary");
  if(!toneInput || !autoSummaryInput) return;

  const tone = toneInput.value;
  const autosummary = autoSummaryInput.value;

  localStorage.setItem(SUPREME_STORAGE_KEYS.ai, JSON.stringify({ tone, autosummary }));
  showTechToast("Configurações de IA salvas.", "success");
}

function loadSavedAIConfig() {
  const rawConfig = localStorage.getItem(SUPREME_STORAGE_KEYS.ai);
  if (!rawConfig) return;

  try {
    const config = JSON.parse(rawConfig);
    const toneInput = document.getElementById("ai-tone");
    const autoSummaryInput = document.getElementById("ai-autosummary");
    if (config.tone && toneInput) toneInput.value = config.tone;
    if (config.autosummary && autoSummaryInput) autoSummaryInput.value = config.autosummary;
  } catch {
    localStorage.removeItem(SUPREME_STORAGE_KEYS.ai);
  }
}

// ==========================================================================
// 7. FUNÇÕES UTILITÁRIAS E FORMATADORES
// ==========================================================================

function getActiveConversation() {
  return state.conversations.find((conversation) => conversation.id === state.activeConversationId);
}

function getLastMessage(conversation) {
  return conversation.messages[conversation.messages.length - 1] || { text: "", time: "" };
}

function getChannelBadge(channel) {
  const normalized = channel.toLowerCase();
  if (normalized === "whatsapp") return '<span class="badge whatsapp"><i class="fa-brands fa-whatsapp"></i> WhatsApp</span>';
  if (normalized === "instagram") return '<span class="badge instagram"><i class="fa-brands fa-instagram"></i> Instagram</span>';
  return '<span class="badge email"><i class="fa-solid fa-envelope"></i> E-mail</span>';
}

function getStatusLabel(status) {
  const labels = { open: "Aberto", pending: "Pendente", resolved: "Resolvido" };
  return labels[status] || status;
}

function showTechToast(message, type = "info") {
  let container = document.getElementById("tech-toast-container");
  if(!container) {
      container = document.createElement("div");
      container.id = "tech-toast-container";
      document.body.appendChild(container);
  }
  const toast = document.createElement("div");

  const normalizedType = ["success", "error", "info"].includes(type) ? type : "info";
  const iconClass = normalizedType === "success" ? "fa-circle-check" : normalizedType === "error" ? "fa-circle-xmark" : "fa-circle-info";

  toast.className = `tech-toast toast-${normalizedType}`;

  const icon = document.createElement("div");
  icon.className = "toast-icon";
  const iconElement = document.createElement("i");
  iconElement.className = `fa-solid ${iconClass}`;
  icon.appendChild(iconElement);

  const body = document.createElement("div");
  body.className = "toast-body";
  const title = document.createElement("h4");
  title.textContent = normalizedType === "success" ? "Sucesso" : normalizedType === "error" ? "Atenção" : "Informação";
  const text = document.createElement("p");
  text.textContent = message;

  const progress = document.createElement("div");
  progress.className = "toast-progress";

  body.appendChild(title);
  body.appendChild(text);

  toast.appendChild(icon);
  toast.appendChild(body);
  toast.appendChild(progress);

  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("show"));

  window.setTimeout(() => {
    toast.classList.remove("show");
    window.setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function setText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function getCurrentTime() {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

function capitalize(value) {
  const stringValue = String(value || "");
  if (!stringValue) return "";
  return stringValue.charAt(0).toUpperCase() + stringValue.slice(1);
}

function isValidURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function lightenHex(hex, percentage) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const number = parseInt(normalized, 16);
  const red = Math.min(255, (number >> 16) + Math.round(255 * (percentage / 100)));
  const green = Math.min(255, ((number >> 8) & 255) + Math.round(255 * (percentage / 100)));
  const blue = Math.min(255, (number & 255) + Math.round(255 * (percentage / 100)));
  return `#${((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1)}`;
}
