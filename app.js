const STORAGE_KEY = "supreme_platform_state_v2";
const SESSION_KEY = "supreme_client_session_v2";
const SESSION_TIMEOUT_MS = 1000 * 60 * 60 * 4;
const SUPABASE_URL = "https://hhyvtehbsfoeuagwhklm.supabase.co";
const SUPABASE_KEY = "sb_publishable_S9oWEYBafLstrVI2SJQ9uA_ijH5Ph9e";

const MODULES = {
  dashboard: { label: "Dashboard", icon: "layout-dashboard" },
  inbox: { label: "Atendimentos", icon: "messages-square" },
  crm: { label: "CRM visual", icon: "git-branch" },
  agenda: { label: "Agenda", icon: "calendar-days" },
  management: { label: "Gestao empresarial", icon: "building-2" },
  automations: { label: "Automacoes", icon: "workflow" },
  marketplace: { label: "Marketplace", icon: "shopping-bag" },
  settings: { label: "Configuracoes", icon: "settings" }
};

const PERMISSION_ACTIONS = ["view", "create", "edit", "delete", "export", "manage_users", "configure_integrations"];
const ROLE_PRESETS = {
  proprietario: allPermissions(),
  administrador: allPermissions(),
  gerente: permissions(["view", "create", "edit", "export"]),
  supervisor: permissions(["view", "edit", "export"]),
  atendente: modulePermissions(["dashboard", "inbox", "agenda", "crm"], ["view", "create", "edit"]),
  financeiro: modulePermissions(["dashboard", "management"], ["view", "create", "edit", "export"]),
  comercial: modulePermissions(["dashboard", "crm", "inbox"], ["view", "create", "edit", "export"]),
  suporte: modulePermissions(["dashboard", "inbox", "agenda"], ["view", "create", "edit"])
};

const ICONS = {
  activity: "<path d='M22 12h-4l-3 8L9 4l-3 8H2'/>",
  bell: "<path d='M10.27 21a2 2 0 0 0 3.46 0'/><path d='M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9'/>",
  "building-2": "<path d='M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18'/><path d='M6 12H4a2 2 0 0 0-2 2v8h20v-8a2 2 0 0 0-2-2h-2'/><path d='M10 6h4M10 10h4M10 14h4M10 18h4'/>",
  "calendar-days": "<path d='M8 2v4M16 2v4M3 10h18'/><rect x='3' y='4' width='18' height='18' rx='2'/><path d='M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01'/>",
  "calendar-plus": "<path d='M8 2v4M16 2v4M3 10h18'/><rect x='3' y='4' width='18' height='18' rx='2'/><path d='M12 14v6M9 17h6'/>",
  "check-circle": "<path d='m9 12 2 2 4-4'/><circle cx='12' cy='12' r='10'/>",
  "chevron-left": "<path d='m15 18-6-6 6-6'/>",
  "chevron-right": "<path d='m9 18 6-6-6-6'/>",
  "columns-3": "<rect width='18' height='18' x='3' y='3' rx='2'/><path d='M9 3v18M15 3v18'/>",
  "folder-plus": "<path d='M12 10v6M9 13h6'/><path d='M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'/>",
  "git-branch": "<line x1='6' x2='6' y1='3' y2='15'/><circle cx='18' cy='6' r='3'/><circle cx='6' cy='18' r='3'/><path d='M18 9a9 9 0 0 1-9 9'/>",
  "git-pull-request-arrow": "<circle cx='18' cy='18' r='3'/><circle cx='6' cy='6' r='3'/><path d='M6 9v6a3 3 0 0 0 3 3h6'/><path d='m15 9 3-3 3 3'/>",
  grip: "<circle cx='9' cy='5' r='1'/><circle cx='9' cy='12' r='1'/><circle cx='9' cy='19' r='1'/><circle cx='15' cy='5' r='1'/><circle cx='15' cy='12' r='1'/><circle cx='15' cy='19' r='1'/>",
  "layout-dashboard": "<rect width='7' height='9' x='3' y='3' rx='1'/><rect width='7' height='5' x='14' y='3' rx='1'/><rect width='7' height='9' x='14' y='12' rx='1'/><rect width='7' height='5' x='3' y='16' rx='1'/>",
  "log-in": "<path d='M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4'/><path d='m10 17 5-5-5-5'/><path d='M15 12H3'/>",
  "log-out": "<path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'/><path d='m16 17 5-5-5-5'/><path d='M21 12H9'/>",
  "message-square-plus": "<path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h8'/><path d='M19 3v6M16 6h6'/>",
  "messages-square": "<path d='M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z'/><path d='M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1'/>",
  "panel-top": "<rect width='18' height='18' x='3' y='3' rx='2'/><path d='M3 9h18'/>",
  plus: "<path d='M5 12h14M12 5v14'/>",
  "refresh-cw": "<path d='M3 12a9 9 0 0 1 15-6.7L21 8'/><path d='M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16'/><path d='M3 21v-5h5'/>",
  save: "<path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z'/><path d='M17 21v-8H7v8M7 3v5h8'/>",
  send: "<path d='m22 2-7 20-4-9-9-4Z'/><path d='M22 2 11 13'/>",
  settings: "<path d='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z'/><circle cx='12' cy='12' r='3'/>",
  "shopping-bag": "<path d='M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z'/><path d='M3 6h18M16 10a4 4 0 0 1-8 0'/>",
  sparkles: "<path d='m12 3-1.9 4.7L5.5 9.5l4.6 1.8L12 16l1.9-4.7 4.6-1.8-4.6-1.8Z'/><path d='M5 3v4M3 5h4M19 15v6M16 18h6'/>",
  target: "<circle cx='12' cy='12' r='10'/><circle cx='12' cy='12' r='6'/><circle cx='12' cy='12' r='2'/>",
  "user-round-plus": "<circle cx='8' cy='8' r='4'/><path d='M2 20a6 6 0 0 1 12 0'/><path d='M18 10v8M14 14h8'/>",
  "user-plus": "<path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M19 8v6M22 11h-6'/>",
  wand: "<path d='M15 4V2M15 16v-2M8 9H6M20 9h-2M17.8 6.2 19 5M11 13l-7 7M4 20l10.6-10.6a2 2 0 0 0-2.8-2.8L1.2 17.2a2 2 0 0 0 2.8 2.8Z'/>",
  workflow: "<rect width='8' height='8' x='3' y='3' rx='2'/><rect width='8' height='8' x='13' y='13' rx='2'/><path d='M11 7h4a2 2 0 0 1 2 2v4'/>"
};

let platform = loadPlatform();
let session = loadSession();
let tenant = null;
let activeModule = "dashboard";
let activeConversationId = null;
let agendaView = "day";
let agendaCursor = new Date();

document.addEventListener("DOMContentLoaded", bootClient);

function bootClient() {
  renderIcons();
  on("login-form", "submit", handleLogin);
  on("logout-button", "click", logout);
  on("notifications-button", "click", openNotificationsModal);
  bindModuleEvents();
  restoreSession();
  registerServiceWorker();
}

function loadPlatform() {
  const base = { companies: [], plans: [], modules: defaultMarketplace(), audit: [], notifications: [], version: 2 };
  try {
    const local = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return { ...base, ...local, companies: [] };
  } catch {
    return base;
  }
}

function savePlatform() {
  const snapshot = { ...platform, companies: [] };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function saveSession() {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function defaultMarketplace() {
  return Object.entries(MODULES).map(([key, cfg]) => ({
    key,
    name: cfg.label,
    icon: cfg.icon,
    category: key === "settings" ? "core" : "operational",
    active: true,
    commercial: key !== "settings"
  }));
}

async function handleLogin(event) {
  event.preventDefault();
  const email = value("login-email").toLowerCase();
  const password = value("login-password");
  showLoginMessage("Validando acesso...");
  const identity = await findLoginIdentity(email).catch(error => {
    console.error(error);
    return null;
  });
  if (!identity?.company || !identity?.user || String(identity.user.password || "") !== password) return showLoginMessage("Credenciais invalidas.");
  const company = identity.company;
  if (company.status !== "active") return showLoginMessage("Acesso bloqueado pela administracao.");
  if (company.license?.status === "expired") return showLoginMessage("Assinatura expirada. Contate a Supreme Tech.");
  const user = identity.user;
  session = { companyId: company.id, userId: user.id, startedAt: Date.now(), lastActivityAt: Date.now() };
  saveSession();
  tenant = ensureTenant(company);
  platform.audit = tenant.audit || [];
  platform.notifications = tenant.notifications || [];
  audit(company.id, "login", "Login realizado no Painel Camaleao");
  await persistTenant("login", "Login realizado no Painel Camaleao", false);
  showLoginMessage("");
  startApp(tenant);
}

async function restoreSession() {
  if (!session) return;
  if (Date.now() - session.lastActivityAt > SESSION_TIMEOUT_MS) {
    logout(false);
    return;
  }
  const company = await findCompanyById(session.companyId).catch(() => null);
  if (company && company.status === "active" && company.license?.status !== "expired") startApp(company);
}

function startApp(company) {
  tenant = ensureTenant(company);
  platform.audit = tenant.audit || [];
  platform.notifications = tenant.notifications || [];
  platform.modules = tenant.marketplace || platform.modules;
  session.lastActivityAt = Date.now();
  saveSession();
  document.getElementById("login-screen").hidden = true;
  document.getElementById("app-shell").hidden = false;
  setText("tenant-name", tenant.name);
  setText("tenant-plan", tenant.planName || "Sem plano");
  renderTenantLogo();
  renderMenu();
  renderNotificationsBadge();
  setActiveModule(firstAllowedModule());
}

function logout(record = true) {
  if (record && tenant) audit(tenant.id, "logout", "Logout realizado no Painel Camaleao");
  session = null;
  tenant = null;
  localStorage.removeItem(SESSION_KEY);
  document.getElementById("app-shell").hidden = true;
  document.getElementById("login-screen").hidden = false;
}

function ensureTenant(company) {
  company.data ||= {};
  company.data.conversations ||= [];
  company.data.leads ||= [];
  company.data.pipelines ||= [];
  company.data.appointments ||= [];
  company.data.tasks ||= [];
  company.data.crmRoutingRules ||= [];
  company.data.management ||= { categories: [], indicators: [], reports: [], goals: [], processes: [] };
  company.data.automations ||= [];
  company.data.dashboardWidgets ||= [];
  company.dashboardConfig ||= defaultDashboardConfig();
  company.instance ||= {};
  company.users ||= [ownerUser(company)];
  company.rbac ||= ROLE_PRESETS;
  company.modules ||= ["dashboard", "settings"];
  company.audit ||= [];
  company.notifications ||= [];
  company.marketplace ||= defaultMarketplace();
  return company;
}

function ownerUser(company) {
  return {
    id: `${company.id}-owner`,
    name: company.responsible || company.name || "Proprietario",
    email: company.email,
    password: company.password,
    role: "proprietario",
    permissions: ROLE_PRESETS.proprietario
  };
}

function renderMenu() {
  const menu = document.getElementById("module-menu");
  const modules = allowedModules();
  menu.innerHTML = modules.map(key => `
    <button type="button" data-module="${key}" class="${key === activeModule ? "active" : ""}" title="${escapeAttr(MODULES[key].label)}" aria-label="${escapeAttr(MODULES[key].label)}">
      ${icon(MODULES[key].icon)}<span>${MODULES[key].label}</span>
    </button>
  `).join("");
  menu.querySelectorAll("button").forEach(btn => btn.addEventListener("click", () => setActiveModule(btn.dataset.module)));
}

function allowedModules() {
  const companyModules = tenant?.modules || ["dashboard", "settings"];
  return companyModules.filter(key => MODULES[key] && hasPermission(key, "view"));
}

function firstAllowedModule() {
  return allowedModules()[0] || "settings";
}

function setActiveModule(moduleKey) {
  if (!hasPermission(moduleKey, "view")) {
    toast("Voce nao tem permissao para acessar este modulo.", "error");
    return;
  }
  activeModule = moduleKey;
  document.querySelectorAll(".module").forEach(section => section.classList.toggle("active", section.id === `module-${moduleKey}`));
  document.querySelectorAll("#module-menu button").forEach(btn => btn.classList.toggle("active", btn.dataset.module === moduleKey));
  renderActiveModule();
}

function renderActiveModule() {
  const renderers = {
    dashboard: renderDashboard,
    inbox: renderInbox,
    crm: renderCrm,
    agenda: renderAgenda,
    management: renderManagement,
    automations: renderAutomations,
    marketplace: renderMarketplace,
    settings: renderSettings
  };
  renderers[activeModule]?.();
  renderIcons();
}

function bindModuleEvents() {
  on("add-widget-button", "click", () => openWidgetModal());
  on("restore-dashboard-button", "click", restoreDashboardDefaults);
  on("toggle-kpi-widget", "click", () => toggleDashboardKind("kpi"));
  on("toggle-chart-widget", "click", () => toggleDashboardKind("chart"));
  on("toggle-table-widget", "click", () => toggleDashboardKind("table"));
  on("toggle-ranking-widget", "click", () => toggleDashboardKind("ranking"));
  on("toggle-calendar-widget", "click", () => toggleDashboardKind("calendar"));
  on("new-conversation-button", "click", () => openConversationModal());
  on("quick-lead-button", "click", createLeadFromActiveConversation);
  on("conversation-search", "input", renderInbox);
  on("conversation-filter", "change", renderInbox);
  on("message-form", "submit", sendMessage);
  on("resolve-conversation-button", "click", resolveConversation);
  on("new-pipeline-button", "click", () => openPipelineModal());
  on("edit-pipeline-button", "click", () => openPipelineModal(document.getElementById("pipeline-select").value));
  on("new-stage-button", "click", () => openStageModal());
  on("new-lead-button", "click", () => openLeadModal());
  on("new-deal-button", "click", () => openDealModal());
  on("pipeline-select", "change", renderCrm);
  on("crm-search", "input", renderCrm);
  on("crm-stage-filter", "change", renderCrm);
  on("new-appointment-button", "click", () => openAppointmentModal());
  document.querySelectorAll("[data-agenda-view]").forEach(btn => btn.addEventListener("click", () => {
    agendaView = btn.dataset.agendaView;
    renderAgenda();
  }));
  on("agenda-prev", "click", () => moveAgenda(-1));
  on("agenda-next", "click", () => moveAgenda(1));
  on("new-category-button", "click", () => openManagementModal("categories"));
  on("new-indicator-button", "click", () => openManagementModal("indicators"));
  on("new-goal-button", "click", () => openManagementModal("goals"));
  on("new-process-button", "click", () => openManagementModal("processes"));
  on("new-automation-button", "click", () => openAutomationModal());
  on("brand-form", "submit", saveBrand);
  on("brand-logo-file", "change", handleBrandLogoUpload);
  on("new-user-button", "click", () => openUserModal());
  on("new-routing-rule-button", "click", () => openRoutingRuleModal());
}

function renderDashboard() {
  const widgets = activeDashboardWidgets();
  document.getElementById("dashboard-hero").innerHTML = renderDashboardHero();
  document.getElementById("dashboard-summary").innerHTML = renderDashboardSummary();
  syncDashboardToggles();
  const list = document.getElementById("dashboard-widgets");
  const empty = document.getElementById("dashboard-empty");
  empty.hidden = widgets.length > 0;
  list.innerHTML = widgets.map(widget => renderDashboardWidget(widget)).join("");
  bindDashboardInteractions();
}

function openWidgetModal(id) {
  const config = tenant.dashboardConfig || defaultDashboardConfig();
  const hidden = dashboardTemplates().filter(widget => config.hiddenWidgets.includes(widget.id));
  const current = hidden.find(item => item.id === id);
  if (!current && !hidden.length) return toast("Todos os widgets principais ja estao visiveis.", "info");
  openFormModal("Adicionar widget", [
    selectField("widgetId", "Bloco", hidden.map(item => ({ value: item.id, label: item.title })), current?.id || hidden[0]?.id)
  ], values => {
    config.hiddenWidgets = config.hiddenWidgets.filter(item => item !== values.widgetId);
    if (!config.order.includes(values.widgetId)) config.order.push(values.widgetId);
    tenant.dashboardConfig = config;
    persistTenant("dashboard_widget_added", "Widget adicionado ao dashboard");
    renderDashboard();
  });
}

function renderDashboardHero() {
  const metrics = dashboardMetrics();
  return `
    <article class="hero-panel">
      <div>
        <p class="eyebrow">Resumo do dia</p>
        <h2>${escapeHtml(tenant.name)}</h2>
        <p class="muted">Acompanhe atendimento, agenda, leads e previsao comercial sem depender de configuracao tecnica.</p>
      </div>
      <div class="hero-metrics">
        <div><span>Conversas abertas</span><strong>${metrics.openConversations}</strong></div>
        <div><span>Leads hoje</span><strong>${metrics.newLeadsToday}</strong></div>
        <div><span>Agendamentos hoje</span><strong>${metrics.appointmentsToday}</strong></div>
      </div>
    </article>
  `;
}

function renderDashboardSummary() {
  const metrics = dashboardMetrics();
  return [
    summaryCard("Semana", `${metrics.appointmentsWeek} agendamentos`, "Agenda prevista"),
    summaryCard("Conversao", `${metrics.conversionRate}%`, "Leads para oportunidades"),
    summaryCard("Meta", `${metrics.goalProgress}%`, "Execucao do mes"),
    summaryCard("Receita", formatCurrency(metrics.revenueMonth), "Previsao mensal")
  ].join("");
}

function summaryCard(label, value, caption) {
  return `<article class="summary-card"><span>${label}</span><strong>${value}</strong><small>${caption}</small></article>`;
}

function renderDashboardWidget(widget) {
  return `
    <article class="dashboard-widget ${widget.kind}" draggable="true" data-widget-id="${widget.id}">
      <header>
        <div>
          <p class="eyebrow">${escapeHtml(widget.group)}</p>
          <h3>${escapeHtml(widget.title)}</h3>
        </div>
        <div class="actions">
          <button class="icon-button" type="button" title="Reordenar">${icon("grip")}</button>
          <button class="icon-button" type="button" data-hide-widget="${widget.id}" title="Ocultar">${icon("chevron-right")}</button>
        </div>
      </header>
      <div class="widget-body">${widget.render()}</div>
    </article>
  `;
}

function activeDashboardWidgets() {
  const config = tenant.dashboardConfig || defaultDashboardConfig();
  const templates = dashboardTemplates().filter(widget => {
    if (config.hiddenWidgets.includes(widget.id)) return false;
    if (!config.visibleKinds[widget.kind]) return false;
    if (widget.id === "leads_overview" && !dashboardModeAllows("leads")) return false;
    if (widget.id === "appointments_overview" && !dashboardModeAllows("agenda")) return false;
    return true;
  });
  const byId = new Map(templates.map(item => [item.id, item]));
  return config.order.map(id => byId.get(id)).filter(Boolean);
}

function dashboardTemplates() {
  const metrics = dashboardMetrics();
  return [
    {
      id: "appointments_overview",
      kind: "calendar",
      group: "Agenda",
      title: "Proximos agendamentos",
      render: () => `
        <div class="mini-stats">
          <div><span>Hoje</span><strong>${metrics.appointmentsToday}</strong></div>
          <div><span>Amanha</span><strong>${metrics.appointmentsTomorrow}</strong></div>
          <div><span>Semana</span><strong>${metrics.appointmentsWeek}</strong></div>
        </div>
        <div class="widget-list">${upcomingAppointments().map(item => `<button class="list-row" type="button" onclick="window.editAppointment('${item.id}')"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.date)} ${escapeHtml(item.time)}</small></button>`).join("") || "<p class='muted'>Nenhum agendamento previsto.</p>"}</div>
      `
    },
    {
      id: "leads_overview",
      kind: "kpi",
      group: "Leads",
      title: "Leads novos hoje",
      render: () => `
        <div class="mini-stats">
          <div><span>Quantidade</span><strong>${metrics.newLeadsToday}</strong></div>
          <div><span>Origem principal</span><strong>${escapeHtml(metrics.topLeadSource)}</strong></div>
          <div><span>Conversao</span><strong>${metrics.conversionRate}%</strong></div>
        </div>
      `
    },
    {
      id: "conversations_overview",
      kind: "table",
      group: "Atendimento",
      title: "Conversas pendentes",
      render: () => `
        <div class="mini-stats">
          <div><span>Sem resposta</span><strong>${metrics.openConversations}</strong></div>
          <div><span>Em andamento</span><strong>${metrics.pendingConversations}</strong></div>
          <div><span>Aguardando cliente</span><strong>${metrics.waitingCustomer}</strong></div>
        </div>
      `
    },
    {
      id: "tasks_overview",
      kind: "ranking",
      group: "Equipe",
      title: "Tarefas da equipe",
      render: () => `
        <div class="mini-stats">
          <div><span>Pendentes</span><strong>${metrics.pendingTasks}</strong></div>
          <div><span>Concluidas</span><strong>${metrics.doneTasks}</strong></div>
          <div><span>Atrasadas</span><strong>${metrics.overdueTasks}</strong></div>
        </div>
      `
    },
    {
      id: "goals_overview",
      kind: "chart",
      group: "Meta",
      title: "Meta do mes",
      render: () => `
        <div class="progress-shell">
          <div class="progress-label"><strong>${formatCurrency(metrics.goalValue)}</strong><small>${metrics.goalProgress}% concluido</small></div>
          <div class="progress-bar"><div class="progress-fill" style="width:${metrics.goalProgress}%"></div></div>
          <p class="muted">Projecao atual: ${formatCurrency(metrics.goalProjection)}</p>
        </div>
      `
    },
    {
      id: "revenue_overview",
      kind: "chart",
      group: "Financeiro",
      title: "Receita prevista",
      render: () => `
        <div class="mini-stats">
          <div><span>Semana</span><strong>${formatCurrency(metrics.revenueWeek)}</strong></div>
          <div><span>Mes</span><strong>${formatCurrency(metrics.revenueMonth)}</strong></div>
          <div><span>Trimestre</span><strong>${formatCurrency(metrics.revenueQuarter)}</strong></div>
        </div>
      `
    }
  ];
}

function bindDashboardInteractions() {
  document.querySelectorAll("[data-hide-widget]").forEach(button => button.addEventListener("click", () => hideDashboardWidget(button.dataset.hideWidget)));
  document.querySelectorAll("[data-widget-id]").forEach(card => {
    card.addEventListener("dragstart", event => event.dataTransfer.setData("text/plain", card.dataset.widgetId));
    card.addEventListener("dragover", event => event.preventDefault());
    card.addEventListener("drop", event => {
      event.preventDefault();
      reorderDashboardWidget(event.dataTransfer.getData("text/plain"), card.dataset.widgetId);
    });
  });
}

function renderInbox() {
  const list = document.getElementById("conversation-list");
  const search = value("conversation-search").toLowerCase();
  const filter = value("conversation-filter") || "all";
  const conversations = tenant.data.conversations.filter(item => {
    const matchesFilter = filter === "all" || item.status === filter;
    const searchable = `${item.contactName} ${item.channel} ${item.phone} ${(item.labels || []).join(" ")} ${(item.messages || []).map(m => m.text).join(" ")}`.toLowerCase();
    return matchesFilter && searchable.includes(search);
  });
  list.innerHTML = conversations.length ? conversations.map(item => `
    <button class="chat-item ${item.id === activeConversationId ? "active" : ""}" type="button" data-open-conversation="${item.id}">
      <div class="avatar">${escapeHtml(initials(item.contactName || item.phone || "ST"))}</div>
      <div class="chat-preview">
        <h4><span>${escapeHtml(item.contactName || "Contato")}</span><span class="chat-time">${formatDate(item.createdAt || nowIso())}</span></h4>
        <p>${escapeHtml(item.channel || "Canal nao informado")} ${item.phone ? `- ${escapeHtml(item.phone)}` : ""}</p>
        <div class="chat-meta-line">
          <span class="status-pill ${item.status}">${statusLabel(item.status)}</span>
          ${(item.labels || []).slice(0, 2).map(label => `<span class="tag">${escapeHtml(label)}</span>`).join("")}
        </div>
      </div>
    </button>
  `).join("") : "<div class='empty-state compact'>Nenhuma conversa registrada.</div>";
  list.querySelectorAll("[data-open-conversation]").forEach(btn => btn.addEventListener("click", () => selectConversation(btn.dataset.openConversation)));
  renderConversation();
}

function openConversationModal() {
  openFormModal("Nova conversa", [
    inputField("contactName", "Nome do contato"),
    inputField("phone", "Telefone"),
    inputField("email", "E-mail", "", "email", false),
    selectField("channel", "Canal", ["WhatsApp", "Instagram", "E-mail", "Telefone"]),
    selectField("status", "Status", ["open", "pending", "resolved"]),
    inputField("labels", "Etiquetas", "", "text", false)
  ], values => {
    const item = { id: uid("conv"), ...values, labels: splitTags(values.labels), messages: [], createdAt: nowIso() };
    tenant.data.conversations.unshift(item);
    activeConversationId = item.id;
    maybeAutoCreateLeadFromConversation(item);
    persistTenant("conversation_created", "Conversa criada");
    renderInbox();
  });
}

function selectConversation(id) {
  activeConversationId = id;
  renderConversation();
}

function renderConversation() {
  const conversation = tenant.data.conversations.find(item => item.id === activeConversationId);
  if (!conversation) {
    setText("active-contact-name", "Nenhuma conversa selecionada");
    setText("active-contact-meta", "Aguardando dados reais");
    document.getElementById("chat-history").innerHTML = "Selecione uma conversa.";
    renderConversationDetails(null);
    return;
  }
  setText("active-contact-name", conversation.contactName);
  const linkedLead = tenant.data.leads.find(item => item.id === conversation.leadId);
  setText("active-contact-meta", `${conversation.channel || "Canal"} - ${conversation.phone || "Sem telefone"}${linkedLead ? ` - Lead: ${linkedLead.name}` : ""}`);
  document.getElementById("chat-history").innerHTML = conversation.messages.length ? conversation.messages.map(message => `
    <div class="message ${message.type}">
      ${escapeHtml(message.text)}
      <small>${formatDate(message.createdAt)}</small>
    </div>
  `).join("") : "<div class='empty-state compact'>Nenhuma mensagem registrada.</div>";
  const button = document.getElementById("quick-lead-button");
  if (button) button.innerHTML = `${icon("sparkles")} ${linkedLead ? "Abrir lead" : "Criar lead"}`;
  renderConversationDetails(conversation, linkedLead);
  renderIcons();
}

function renderConversationDetails(conversation, linkedLead = null) {
  setText("details-avatar", conversation ? initials(conversation.contactName || conversation.phone || "ST") : "ST");
  setText("details-name", conversation?.contactName || "Contato");
  setText("details-company", linkedLead?.company || linkedLead?.name || "Empresa");
  setText("details-channel", conversation?.channel || "-");
  setText("details-phone", conversation?.phone || "-");
  setText("details-email", conversation?.email || linkedLead?.email || "-");
  setText("details-status", conversation ? statusLabel(conversation.status) : "-");
  setText("details-lead", linkedLead ? `${linkedLead.name} - ${pipelineName(linkedLead.pipelineId)} / ${stageName(linkedLead.pipelineId, linkedLead.stageId)}` : "Nenhum lead associado.");
  const tags = document.getElementById("details-tags");
  if (tags) tags.innerHTML = (conversation?.labels || linkedLead?.tags || []).map(label => `<span class="tag">${escapeHtml(label)}</span>`).join("");
}

function sendMessage(event) {
  event.preventDefault();
  const conversation = tenant.data.conversations.find(item => item.id === activeConversationId);
  const text = value("message-input");
  if (!conversation || !text) return;
  conversation.messages.push({
    id: uid("msg"),
    type: document.getElementById("internal-note-toggle").checked ? "note" : "out",
    text,
    createdAt: nowIso()
  });
  document.getElementById("message-input").value = "";
  persistTenant("message_created", "Mensagem registrada");
  renderInbox();
}

function resolveConversation() {
  const conversation = tenant.data.conversations.find(item => item.id === activeConversationId);
  if (!conversation) return;
  conversation.status = "resolved";
  persistTenant("conversation_resolved", "Conversa resolvida");
  renderInbox();
}

function renderCrm() {
  const select = document.getElementById("pipeline-select");
  select.innerHTML = tenant.data.pipelines.map(pipe => `<option value="${pipe.id}">${escapeHtml(pipe.name)}</option>`).join("");
  const pipeline = tenant.data.pipelines.find(item => item.id === select.value) || tenant.data.pipelines[0];
  if (pipeline) select.value = pipeline.id;
  document.getElementById("crm-stage-filter").innerHTML = [`<option value="all">Todas as etapas</option>`, ...(pipeline?.stages || []).sort((a, b) => a.order - b.order).map(stage => `<option value="${stage.id}">${escapeHtml(stage.name)}</option>`)].join("");
  document.getElementById("crm-empty").hidden = Boolean(pipeline);
  const search = value("crm-search").toLowerCase();
  const stageFilter = value("crm-stage-filter") || "all";
  const cards = crmCards(pipeline).filter(item => {
    const matchesStage = stageFilter === "all" || item.stageId === stageFilter;
    const searchable = `${item.title || item.name} ${item.company || ""} ${(item.tags || []).join(" ")}`.toLowerCase();
    return matchesStage && searchable.includes(search);
  });
  document.getElementById("crm-stats").innerHTML = [
    summaryCard("Leads", tenant.data.leads.length, "Base ativa"),
    summaryCard("Oportunidades", (pipeline?.deals || []).length, "Funil atual"),
    summaryCard("Conversao", `${dashboardMetrics().conversionRate}%`, "Lead para oportunidade")
  ].join("");
  document.getElementById("kanban-board").innerHTML = pipeline ? pipeline.stages
    .sort((a, b) => a.order - b.order)
    .map(stage => `
      <section class="kanban-column" data-stage="${stage.id}">
        <header>
          <strong>${escapeHtml(stage.name)}</strong>
          <button class="icon-button" data-edit-stage="${stage.id}" type="button">${icon("settings")}</button>
        </header>
        ${cards.filter(card => card.stageId === stage.id).map(card => `
          <article class="deal-card ${card.kind}" draggable="true" data-record-id="${card.id}" data-record-type="${card.kind}">
            <div class="deal-topline"><span class="status-pill ${card.kind === "lead" ? "suspended" : "active"}">${card.kind === "lead" ? "Lead" : "Oportunidade"}</span><span>${formatCurrency(card.value || 0)}</span></div>
            <strong>${escapeHtml(card.title)}</strong>
            <span>${escapeHtml(card.company || card.phone || "")}</span>
            <div class="tag-row">${(card.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
            ${actionButtons(card.kind === "lead" ? "leads" : "deals", card.id)}
          </article>
        `).join("") || "<p class='muted'>Sem registros nesta etapa.</p>"}
      </section>
    `).join("") : "";
  document.querySelectorAll("[data-edit-stage]").forEach(btn => btn.addEventListener("click", () => openStageModal(btn.dataset.editStage)));
  bindCrmDragAndDrop();
}

function openPipelineModal(id) {
  const current = tenant.data.pipelines.find(item => item.id === id);
  openFormModal(current ? "Editar funil" : "Novo funil", [inputField("name", "Nome do funil", current?.name)], values => {
    const pipeline = upsert(tenant.data.pipelines, { id, ...values, stages: current?.stages || [], deals: current?.deals || [] });
    if (!current && pipeline.stages.length === 0) pipeline.stages = [];
    persistTenant("pipeline_saved", "Funil salvo");
    renderCrm();
  });
}

function openStageModal(id) {
  const pipeline = activePipeline();
  if (!pipeline) return toast("Crie um funil antes de criar etapas.", "error");
  const current = pipeline.stages.find(item => item.id === id);
  openFormModal(current ? "Editar etapa" : "Nova etapa", [
    inputField("name", "Nome da etapa", current?.name),
    inputField("order", "Ordem", current?.order ?? pipeline.stages.length + 1, "number")
  ], values => {
    upsert(pipeline.stages, { id, name: values.name, order: Number(values.order) || pipeline.stages.length + 1 });
    persistTenant("stage_saved", "Etapa do funil salva");
    renderCrm();
  }, current ? [{ label: "Excluir", className: "danger", action: () => deleteStage(pipeline, current.id) }] : []);
}

function deleteStage(pipeline, id) {
  if ((pipeline.deals || []).some(deal => deal.stageId === id)) return toast("Mova ou exclua oportunidades antes de remover esta etapa.", "error");
  pipeline.stages = pipeline.stages.filter(item => item.id !== id);
  closeModal();
  persistTenant("stage_deleted", "Etapa excluida");
  renderCrm();
}

function openDealModal(id) {
  const pipeline = activePipeline();
  if (!pipeline || !pipeline.stages.length) return toast("Crie um funil com etapas antes de registrar oportunidades.", "error");
  const current = (pipeline.deals || []).find(item => item.id === id);
  openFormModal(current ? "Editar oportunidade" : "Nova oportunidade", [
    inputField("title", "Titulo", current?.title),
    inputField("company", "Empresa ou contato", current?.company),
    inputField("value", "Valor", current?.value || 0, "number"),
    selectField("stageId", "Etapa", pipeline.stages.sort((a, b) => a.order - b.order).map(s => ({ value: s.id, label: s.name })), current?.stageId)
  ], values => {
    pipeline.deals ||= [];
    upsert(pipeline.deals, { id, ...values, value: Number(values.value) || 0 });
    persistTenant("deal_saved", "Oportunidade salva");
    renderCrm();
  });
}

function openLeadModal(id, prefill = {}, quick = false) {
  const current = tenant.data.leads.find(item => item.id === id);
  const pipeline = activePipeline();
  const rules = pipeline?.stages?.sort((a, b) => a.order - b.order) || [];
  openFormModal(current ? "Editar lead" : quick ? "Lead rapido" : "Novo lead", [
    inputField("name", "Nome", current?.name || prefill.name || prefill.contactName || ""),
    inputField("phone", "Telefone", current?.phone || prefill.phone || ""),
    ...(quick ? [] : [inputField("email", "E-mail", current?.email || prefill.email || "", "email", true)]),
    ...(rules.length ? [selectField("stageId", "Etapa", rules.map(stage => ({ value: stage.id, label: stage.name })), current?.stageId || prefill.stageId || rules[0]?.id)] : []),
    inputField("source", "Origem", current?.source || prefill.source || prefill.channel || "", "text", false),
    inputField("tags", "Etiquetas", (current?.tags || prefill.tags || []).join(", "), "text", false)
  ], values => {
    const route = resolveRoutingForLabels(splitTags(values.tags), pipeline);
    const lead = upsert(tenant.data.leads, {
      id,
      ...current,
      ...prefill,
      ...values,
      pipelineId: current?.pipelineId || prefill.pipelineId || route.pipelineId || pipeline?.id || "",
      stageId: values.stageId || current?.stageId || prefill.stageId || route.stageId || pipeline?.stages?.[0]?.id || "",
      source: values.source || prefill.channel || "Manual",
      tags: splitTags(values.tags),
      createdAt: current?.createdAt || nowIso(),
      owner: current?.owner || prefill.owner || session?.userId || ""
    });
    persistTenant("lead_saved", "Lead salvo");
    if (prefill.conversationId) associateLeadToConversation(lead.id, prefill.conversationId);
    renderCrm();
    renderDashboard();
  });
}

function createLeadFromActiveConversation() {
  const conversation = tenant.data.conversations.find(item => item.id === activeConversationId);
  if (!conversation) return toast("Selecione uma conversa para criar ou vincular um lead.", "error");
  if (conversation.leadId) return openLeadModal(conversation.leadId, {}, false);
  const existing = findLeadByContact(conversation.phone, conversation.email);
  if (existing) {
    associateLeadToConversation(existing.id, conversation.id);
    persistTenant("lead_linked", "Lead associado a conversa");
    renderConversation();
    renderDashboard();
    return toast("Lead existente associado a esta conversa.", "success");
  }
  openLeadModal(null, {
    conversationId: conversation.id,
    name: conversation.contactName,
    phone: conversation.phone,
    email: conversation.email,
    source: conversation.channel,
    tags: conversation.labels || []
  }, true);
}

function associateLeadToConversation(leadId, conversationId) {
  const conversation = tenant.data.conversations.find(item => item.id === conversationId);
  if (conversation) conversation.leadId = leadId;
}

function maybeAutoCreateLeadFromConversation(conversation) {
  if (!dashboardModeAllows("leads")) return;
  const route = resolveRoutingForLabels(conversation.labels || [], activePipeline());
  if (!route.autoCreate) return;
  const existing = findLeadByContact(conversation.phone, conversation.email);
  if (existing) {
    associateLeadToConversation(existing.id, conversation.id);
    return;
  }
  const lead = upsert(tenant.data.leads, {
    name: conversation.contactName,
    phone: conversation.phone,
    email: conversation.email || "",
    source: conversation.channel || "Chatwoot",
    tags: conversation.labels || [],
    pipelineId: route.pipelineId || activePipeline()?.id || "",
    stageId: route.stageId || activePipeline()?.stages?.[0]?.id || "",
    owner: session?.userId || "",
    createdAt: nowIso()
  });
  associateLeadToConversation(lead.id, conversation.id);
}

function activePipeline() {
  const id = document.getElementById("pipeline-select").value;
  return tenant.data.pipelines.find(item => item.id === id) || tenant.data.pipelines[0];
}

function renderAgenda() {
  const label = document.getElementById("agenda-label");
  label.textContent = agendaView === "month"
    ? agendaCursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : agendaCursor.toLocaleDateString("pt-BR");
  const grid = document.getElementById("agenda-grid");
  if (agendaView === "month") grid.innerHTML = renderMonth();
  else if (agendaView === "week") grid.innerHTML = renderWeek();
  else grid.innerHTML = renderDay();
}

function renderDay() {
  const iso = dateIso(agendaCursor);
  return Array.from({ length: 12 }, (_, idx) => idx + 8).map(hour => {
    const items = tenant.data.appointments.filter(item => item.date === iso && item.time.startsWith(String(hour).padStart(2, "0")));
    return `<div class="agenda-row"><div class="agenda-time">${hour}:00</div><div class="agenda-cell">${items.map(appointmentCard).join("")}</div></div>`;
  }).join("");
}

function renderWeek() {
  const start = startOfWeek(agendaCursor);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const header = `<div class="agenda-week-row"><div class="agenda-day-head"></div>${days.map(day => `<div class="agenda-day-head">${day.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" })}</div>`).join("")}</div>`;
  const rows = Array.from({ length: 12 }, (_, idx) => idx + 8).map(hour => `
    <div class="agenda-week-row">
      <div class="agenda-time">${hour}:00</div>
      ${days.map(day => {
        const iso = dateIso(day);
        const items = tenant.data.appointments.filter(item => item.date === iso && item.time.startsWith(String(hour).padStart(2, "0")));
        return `<div class="agenda-cell">${items.map(appointmentCard).join("")}</div>`;
      }).join("")}
    </div>
  `).join("");
  return header + rows;
}

function renderMonth() {
  const first = new Date(agendaCursor.getFullYear(), agendaCursor.getMonth(), 1);
  const start = startOfWeek(first);
  return `<div class="agenda-month-grid">${Array.from({ length: 42 }, (_, index) => {
    const day = addDays(start, index);
    const iso = dateIso(day);
    const items = tenant.data.appointments.filter(item => item.date === iso);
    return `<div class="agenda-cell"><strong>${day.getDate()}</strong>${items.slice(0, 3).map(appointmentCard).join("")}</div>`;
  }).join("")}</div>`;
}

function appointmentCard(item) {
  return `<button class="appointment" type="button" onclick="window.editAppointment('${item.id}')"><strong>${escapeHtml(item.time)}</strong> ${escapeHtml(item.title)}</button>`;
}

window.editAppointment = id => openAppointmentModal(id);

function openAppointmentModal(id) {
  const current = tenant.data.appointments.find(item => item.id === id);
  openFormModal(current ? "Editar agendamento" : "Novo agendamento", [
    inputField("title", "Titulo", current?.title),
    inputField("date", "Data", current?.date || dateIso(agendaCursor), "date"),
    inputField("time", "Hora", current?.time || "09:00", "time"),
    inputField("responsible", "Responsavel", current?.responsible),
    selectField("status", "Status", ["pending", "confirmed", "done", "cancelled"], current?.status)
  ], values => {
    upsert(tenant.data.appointments, { id, ...values });
    persistTenant("appointment_saved", "Agendamento salvo");
    renderAgenda();
  });
}

function moveAgenda(direction) {
  if (agendaView === "month") agendaCursor.setMonth(agendaCursor.getMonth() + direction);
  else agendaCursor.setDate(agendaCursor.getDate() + (agendaView === "week" ? direction * 7 : direction));
  agendaCursor = new Date(agendaCursor);
  renderAgenda();
}

function renderManagement() {
  const container = document.getElementById("management-grid");
  const groups = tenant.data.management;
  const items = Object.entries(groups).flatMap(([type, values]) => values.map(item => ({ ...item, type })));
  document.getElementById("management-empty").hidden = items.length > 0;
  container.innerHTML = items.map(item => `
    <article class="data-card">
      <small>${managementLabel(item.type)}</small>
      <h2>${escapeHtml(item.name)}</h2>
      <p class="muted">${escapeHtml(item.description || "")}</p>
      ${actionButtons(item.type, item.id)}
    </article>
  `).join("");
}

function openManagementModal(type, id) {
  const current = tenant.data.management[type].find(item => item.id === id);
  openFormModal(current ? "Editar item" : `Novo item: ${managementLabel(type)}`, [
    inputField("name", "Nome", current?.name),
    inputField("description", "Descricao", current?.description)
  ], values => {
    upsert(tenant.data.management[type], { id, ...values });
    persistTenant("management_saved", "Estrutura de gestao salva");
    renderManagement();
  });
}

function renderAutomations() {
  const list = document.getElementById("automation-list");
  list.innerHTML = tenant.data.automations.length ? tenant.data.automations.map(item => `
    <article class="data-card">
      <h2>${escapeHtml(item.name)}</h2>
      <p class="muted">${escapeHtml(item.trigger)} -> ${escapeHtml(item.action)}</p>
      <span class="status-pill ${item.active ? "active" : "suspended"}">${item.active ? "Ativa" : "Inativa"}</span>
      ${actionButtons("automations", item.id)}
    </article>
  `).join("") : "<div class='empty-state compact'>Nenhuma automacao configurada.</div>";
}

function openAutomationModal(id) {
  const current = tenant.data.automations.find(item => item.id === id);
  openFormModal(current ? "Editar automacao" : "Nova automacao", [
    inputField("name", "Nome", current?.name),
    inputField("trigger", "Gatilho", current?.trigger),
    inputField("action", "Acao", current?.action),
    selectField("active", "Status", [{ value: "true", label: "Ativa" }, { value: "false", label: "Inativa" }], String(current?.active ?? true))
  ], values => {
    upsert(tenant.data.automations, { id, ...values, active: values.active === "true" });
    persistTenant("automation_saved", "Automacao salva");
    renderAutomations();
  });
}

function renderMarketplace() {
  const list = document.getElementById("marketplace-list");
  list.innerHTML = platform.modules.map(item => `
    <article class="data-card">
      ${icon(item.icon)}
      <h2>${escapeHtml(item.name)}</h2>
      <p class="muted">${item.commercial ? "Modulo comercial" : "Modulo base"}</p>
      <span class="status-pill ${tenant.modules.includes(item.key) ? "active" : "suspended"}">${tenant.modules.includes(item.key) ? "Liberado" : "Nao liberado"}</span>
    </article>
  `).join("");
}

function renderSettings() {
  document.getElementById("brand-name").value = tenant.brand?.name || tenant.name || "";
  document.getElementById("brand-logo-url").value = tenant.brand?.logoUrl || "";
  document.getElementById("brand-bg").value = tenant.brand?.bg || "#070b16";
  document.getElementById("brand-primary").value = tenant.brand?.primary || "#d4af37";
  document.getElementById("brand-accent").value = tenant.brand?.accent || "#00d2ff";
  renderUsers();
  renderRoutingRules();
  renderAudit();
  renderNotifications();
}

function saveBrand(event) {
  event.preventDefault();
  tenant.brand = {
    name: value("brand-name"),
    logoUrl: tenant.brand?.pendingLogoDataUrl || value("brand-logo-url"),
    bg: value("brand-bg") || "#070b16",
    primary: value("brand-primary"),
    accent: value("brand-accent")
  };
  delete tenant.brand.pendingLogoDataUrl;
  persistTenant("brand_updated", "Identidade visual atualizada");
  renderTenantLogo();
  toast("Identidade salva.", "success");
}

function handleBrandLogoUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
  if (!allowed.includes(file.type)) {
    event.target.value = "";
    return toast("Use PNG, JPG, WEBP ou SVG para a logomarca.", "error");
  }
  if (file.size > 1024 * 1024) {
    event.target.value = "";
    return toast("A logomarca deve ter no maximo 1MB.", "error");
  }
  const reader = new FileReader();
  reader.onload = () => {
    tenant.brand ||= {};
    tenant.brand.pendingLogoDataUrl = String(reader.result || "");
    document.getElementById("brand-logo-url").value = tenant.brand.pendingLogoDataUrl;
    renderTenantLogo();
    toast("Logomarca carregada. Clique em salvar identidade para persistir.", "info");
  };
  reader.onerror = () => toast("Nao foi possivel carregar a logomarca.", "error");
  reader.readAsDataURL(file);
}

function renderTenantLogo() {
  const mark = document.getElementById("tenant-logo");
  const logoUrl = tenant.brand?.pendingLogoDataUrl || tenant.brand?.logoUrl;
  mark.innerHTML = logoUrl ? `<img src="${escapeAttr(logoUrl)}" alt="">` : initials(tenant.name);
  document.documentElement.style.setProperty("--bg", tenant.brand?.bg || "#070b16");
  document.documentElement.style.setProperty("--primary", tenant.brand?.primary || "#d4af37");
  document.documentElement.style.setProperty("--primary-strong", lightenHex(tenant.brand?.primary || "#d4af37", 22));
  document.documentElement.style.setProperty("--accent", tenant.brand?.accent || "#00d2ff");
}

function renderUsers() {
  const list = document.getElementById("users-list");
  list.innerHTML = (tenant.users || []).map(user => `
    <article class="list-item">
      <strong>${escapeHtml(user.name)}</strong>
      <p class="muted">${escapeHtml(user.email)} - ${roleLabel(user.role)}</p>
      <button class="btn ghost" type="button" data-edit-user="${user.id}">Editar</button>
    </article>
  `).join("") || "<div class='empty-state compact'>Nenhum usuario cadastrado.</div>";
  list.querySelectorAll("[data-edit-user]").forEach(btn => btn.addEventListener("click", () => openUserModal(btn.dataset.editUser)));
}

function openUserModal(id) {
  if (!hasPermission("settings", "manage_users")) return toast("Permissao insuficiente.", "error");
  const current = tenant.users.find(item => item.id === id);
  openFormModal(current ? "Editar usuario" : "Novo usuario", [
    inputField("name", "Nome", current?.name),
    inputField("email", "E-mail", current?.email, "email"),
    inputField("password", "Senha", current?.password, "password"),
    selectField("role", "Perfil", Object.keys(ROLE_PRESETS).map(role => ({ value: role, label: roleLabel(role) })), current?.role || "atendente")
  ], values => {
    upsert(tenant.users, { id, ...values, permissions: ROLE_PRESETS[values.role] });
    persistTenant("user_saved", "Usuario salvo");
    renderUsers();
  });
}

function renderRoutingRules() {
  const list = document.getElementById("routing-rules-list");
  const rules = tenant.data.crmRoutingRules || [];
  list.innerHTML = rules.length ? rules.map(rule => `
    <article class="list-item">
      <strong>${escapeHtml(rule.label)}</strong>
      <p class="muted">${escapeHtml(pipelineName(rule.pipelineId))} -> ${escapeHtml(stageName(rule.pipelineId, rule.stageId))}</p>
      <p class="muted">${rule.autoCreate ? "Cria lead automaticamente" : "Somente sugere roteamento"}</p>
      <button class="btn ghost" type="button" onclick="window.editRoutingRule('${rule.id}')">Editar</button>
    </article>
  `).join("") : "<div class='empty-state compact'>Nenhuma regra configurada.</div>";
}

function openRoutingRuleModal(id) {
  const current = (tenant.data.crmRoutingRules || []).find(item => item.id === id);
  if (!tenant.data.pipelines.length) return toast("Crie um pipeline antes de configurar regras por etiqueta.", "error");
  const pipeline = tenant.data.pipelines[0];
  const stageOptions = pipeline?.stages?.sort((a, b) => a.order - b.order).map(stage => ({ value: stage.id, label: stage.name })) || [];
  openFormModal(current ? "Editar regra CRM" : "Nova regra CRM", [
    inputField("label", "Etiqueta", current?.label),
    selectField("pipelineId", "Pipeline", tenant.data.pipelines.map(item => ({ value: item.id, label: item.name })), current?.pipelineId || pipeline?.id),
    selectField("stageId", "Etapa", stageOptions, current?.stageId || stageOptions[0]?.value),
    selectField("autoCreate", "Acao", [{ value: "true", label: "Criar lead automaticamente" }, { value: "false", label: "Apenas sugerir" }], String(current?.autoCreate ?? true))
  ], values => {
    tenant.data.crmRoutingRules ||= [];
    upsert(tenant.data.crmRoutingRules, { id, ...values, autoCreate: values.autoCreate === "true" });
    persistTenant("crm_rule_saved", "Regra de etiquetas salva");
    renderRoutingRules();
  });
}

window.editRoutingRule = id => openRoutingRuleModal(id);

function renderAudit() {
  document.getElementById("audit-list").innerHTML = platform.audit
    .filter(item => item.companyId === tenant.id)
    .slice(0, 60)
    .map(item => `<div class="timeline-item">${escapeHtml(item.description)}<small>${formatDate(item.createdAt)}</small></div>`)
    .join("") || "<div class='empty-state compact'>Nenhum log registrado.</div>";
}

function renderNotifications() {
  document.getElementById("notification-list").innerHTML = tenantNotifications()
    .map(item => `<div class="timeline-item">${escapeHtml(item.title)}<small>${escapeHtml(item.priority)} - ${formatDate(item.createdAt)}</small></div>`)
    .join("") || "<div class='empty-state compact'>Nenhuma notificacao.</div>";
}

function openNotificationsModal() {
  renderNotificationsBadge(true);
  openModal("Notificacoes", `<div class="timeline">${tenantNotifications().map(item => `<div class="timeline-item">${escapeHtml(item.title)}<small>${formatDate(item.createdAt)}</small></div>`).join("") || "Nenhuma notificacao."}</div>`);
}

function tenantNotifications() {
  return platform.notifications.filter(item => item.companyId === tenant?.id);
}

function renderNotificationsBadge(markRead = false) {
  if (!tenant) return;
  if (markRead) {
    tenantNotifications().forEach(item => { item.read = true; });
    tenant.notifications = tenantNotifications();
    persistTenant("notifications_read", "Notificacoes marcadas como lidas", false);
  }
  const unread = tenantNotifications().filter(item => !item.read).length;
  const counter = document.getElementById("notification-count");
  counter.hidden = unread === 0;
  counter.textContent = unread;
  savePlatform();
}

function hasPermission(moduleKey, action) {
  if (!tenant || !session) return false;
  const user = tenant.users.find(item => item.id === session.userId) || ownerUser(tenant);
  return Boolean(user.permissions?.[moduleKey]?.includes(action));
}

function allPermissions() {
  return Object.keys(MODULES).reduce((acc, key) => ({ ...acc, [key]: PERMISSION_ACTIONS.slice() }), {});
}

function permissions(actions) {
  return Object.keys(MODULES).reduce((acc, key) => ({ ...acc, [key]: actions.slice() }), {});
}

function modulePermissions(modules, actions) {
  return modules.reduce((acc, key) => ({ ...acc, [key]: actions.slice() }), {});
}

async function persistTenant(action, description, addAudit = true) {
  if (!tenant) return;
  if (addAudit) audit(tenant.id, action, description);
  try {
    await supabaseRequest("/rest/v1/configuracoes_robo?on_conflict=cliente_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: {
        cliente_id: Number(tenant.id),
        bot_desativado: tenant.status === "active" ? "NAO" : "SIM",
        dados_painel: panelDataFromTenant(),
        atualizado_em: nowIso()
      }
    });
    savePlatform();
  } catch (error) {
    console.error(error);
    toast("Nao foi possivel sincronizar com o Supabase agora.", "error");
  }
}

function audit(companyId, action, description) {
  platform.audit.unshift({ id: uid("audit"), companyId, action, description, createdAt: nowIso() });
  if (tenant) tenant.audit = platform.audit.filter(item => item.companyId === tenant.id);
  savePlatform();
}

async function findCompanyByCredentials(email, password) {
  const rows = await supabaseRequest(`/rest/v1/clientes?select=*&email=eq.${encodeURIComponent(email)}&senha=eq.${encodeURIComponent(password)}&limit=1`);
  const row = rows?.[0];
  return row ? hydrateCompany(row) : null;
}

async function findLoginIdentity(email) {
  const normalizedEmail = normalizeEmail(email);
  const ownerRows = await supabaseRequest(`/rest/v1/clientes?select=*&email=eq.${encodeURIComponent(normalizedEmail)}&limit=1`);
  if (ownerRows?.[0]) {
    const company = await hydrateCompany(ownerRows[0]);
    const owner = (company.users || []).find(user => normalizeEmail(user.email) === normalizedEmail) || ownerUser(company);
    return { company, user: owner };
  }

  const configs = await supabaseRequest("/rest/v1/configuracoes_robo?select=cliente_id,dados_painel");
  const match = (configs || []).find(config => {
    const users = Array.isArray(config.dados_painel?.users) ? config.dados_painel.users : [];
    return users.some(user => normalizeEmail(user.email) === normalizedEmail);
  });
  if (!match?.cliente_id) return null;

  const company = await findCompanyById(match.cliente_id);
  const user = (company?.users || []).find(item => normalizeEmail(item.email) === normalizedEmail);
  return company && user ? { company, user } : null;
}

async function findCompanyById(id) {
  const rows = await supabaseRequest(`/rest/v1/clientes?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
  const row = rows?.[0];
  return row ? hydrateCompany(row) : null;
}

async function hydrateCompany(row) {
  const configs = await supabaseRequest(`/rest/v1/configuracoes_robo?select=*&cliente_id=eq.${encodeURIComponent(row.id)}&limit=1`);
  return companyFromSupabase(row, configs?.[0]?.dados_painel || {});
}

function companyFromSupabase(row, panel = {}) {
  const status = fromSupabaseStatus(row.status);
  const company = {
    id: String(row.id),
    name: row.nome_empresa || "Empresa",
    email: row.email || "",
    password: row.senha || "",
    responsible: panel.responsible || "",
    document: panel.document || "",
    planId: panel.planId || row.plano || "",
    planName: panel.planName || row.plano || "Sem plano",
    monthly: Number(row.valor_mensalidade || 0),
    setup: Number(row.valor_implantacao || 0),
    status,
    modules: normalizeModules(panel.modules || row.segmento),
    license: panel.license || { status: status === "active" ? "active" : "suspended", dueDate: null },
    data: panel.data || emptyCompanyData(),
    users: panel.users || [],
    rbac: panel.rbac || ROLE_PRESETS,
    brand: panel.brand || {},
    audit: panel.audit || [],
    notifications: panel.notifications || [],
    marketplace: panel.marketplace || defaultMarketplace(),
    dashboardConfig: panel.dashboardConfig || defaultDashboardConfig(),
    instance: panel.instance || {},
    integrations: panel.integrations || {},
    createdAt: row.criado_em || panel.createdAt || nowIso()
  };
  company.users = company.users.length ? company.users : [ownerUser(company)];
  return company;
}

function panelDataFromTenant() {
  return {
    responsible: tenant.responsible || "",
    document: tenant.document || "",
    planId: tenant.planId || "",
    planName: tenant.planName || tenant.planId || "",
    modules: tenant.modules || [],
    license: tenant.license || { status: "active", dueDate: null },
    users: tenant.users || [ownerUser(tenant)],
    rbac: tenant.rbac || ROLE_PRESETS,
    data: tenant.data || emptyCompanyData(),
    brand: tenant.brand || {},
    audit: tenant.audit || [],
    notifications: tenant.notifications || [],
    marketplace: tenant.marketplace || platform.modules,
    dashboardConfig: tenant.dashboardConfig || defaultDashboardConfig(),
    instance: tenant.instance || {},
    integrations: tenant.integrations || {},
    updatedAt: nowIso()
  };
}

function emptyCompanyData() {
  return {
    conversations: [],
    leads: [],
    pipelines: [],
    appointments: [],
    tasks: [],
    crmRoutingRules: [],
    management: { categories: [], indicators: [], reports: [], goals: [], processes: [] },
    automations: [],
    dashboardWidgets: []
  };
}

function defaultDashboardConfig() {
  return {
    mode: "both",
    visibleKinds: { kpi: true, chart: true, table: true, ranking: true, calendar: true },
    order: ["appointments_overview", "leads_overview", "conversations_overview", "tasks_overview", "goals_overview", "revenue_overview"],
    hiddenWidgets: []
  };
}

function dashboardMetrics() {
  const today = dateIso(new Date());
  const tomorrow = dateIso(addDays(new Date(), 1));
  const weekLimit = addDays(new Date(), 7);
  const appointments = tenant.data.appointments || [];
  const leads = tenant.data.leads || [];
  const conversations = tenant.data.conversations || [];
  const tasks = tenant.data.tasks || tenant.data.management.processes.map(item => ({ ...item, status: item.status || "pending" }));
  const deals = tenant.data.pipelines.flatMap(pipeline => pipeline.deals || []);
  const goal = tenant.data.management.goals[0] || {};
  const goalValue = Number(goal.target || goal.value || 0);
  const revenueMonth = deals.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const revenueWeek = deals.filter(item => !item.expectedDate || new Date(item.expectedDate) <= weekLimit).reduce((sum, item) => sum + Number(item.value || 0), 0);
  const convertedLeads = leads.filter(item => item.convertedAt).length;
  const pendingConversations = conversations.filter(item => item.status === "pending").length;
  return {
    appointmentsToday: appointments.filter(item => item.date === today).length,
    appointmentsTomorrow: appointments.filter(item => item.date === tomorrow).length,
    appointmentsWeek: appointments.filter(item => new Date(item.date) >= new Date(today) && new Date(item.date) <= weekLimit).length,
    newLeadsToday: leads.filter(item => (item.createdAt || "").slice(0, 10) === today).length,
    topLeadSource: topLabel(leads.map(item => item.source || "Manual")) || "Manual",
    conversionRate: leads.length ? Math.round(convertedLeads / leads.length * 100) : 0,
    openConversations: conversations.filter(item => item.status === "open").length,
    pendingConversations,
    waitingCustomer: conversations.filter(item => item.status === "pending").length,
    pendingTasks: tasks.filter(item => item.status !== "done").length,
    doneTasks: tasks.filter(item => item.status === "done").length,
    overdueTasks: tasks.filter(item => item.status === "overdue").length,
    goalValue,
    goalProgress: goalValue ? Math.min(100, Math.round(revenueMonth / goalValue * 100)) : 0,
    goalProjection: goalValue ? Math.max(revenueMonth, goalValue * 0.82) : revenueMonth,
    revenueWeek,
    revenueMonth,
    revenueQuarter: revenueMonth * 3
  };
}

function topLabel(values) {
  const counts = values.reduce((acc, item) => ({ ...acc, [item]: (acc[item] || 0) + 1 }), {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
}

function upcomingAppointments() {
  return [...(tenant.data.appointments || [])]
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .slice(0, 4);
}

function toggleDashboardKind(kind) {
  tenant.dashboardConfig ||= defaultDashboardConfig();
  tenant.dashboardConfig.visibleKinds[kind] = !tenant.dashboardConfig.visibleKinds[kind];
  persistTenant("dashboard_layout_changed", "Preferencias de dashboard atualizadas");
  renderDashboard();
}

function syncDashboardToggles() {
  const config = tenant.dashboardConfig || defaultDashboardConfig();
  const mapping = {
    "toggle-kpi-widget": "kpi",
    "toggle-chart-widget": "chart",
    "toggle-table-widget": "table",
    "toggle-ranking-widget": "ranking",
    "toggle-calendar-widget": "calendar"
  };
  Object.entries(mapping).forEach(([id, kind]) => document.getElementById(id)?.classList.toggle("active-chip", config.visibleKinds[kind]));
}

function hideDashboardWidget(widgetId) {
  tenant.dashboardConfig ||= defaultDashboardConfig();
  if (!tenant.dashboardConfig.hiddenWidgets.includes(widgetId)) tenant.dashboardConfig.hiddenWidgets.push(widgetId);
  persistTenant("dashboard_widget_hidden", "Widget ocultado");
  renderDashboard();
}

function reorderDashboardWidget(sourceId, targetId) {
  if (!sourceId || !targetId || sourceId === targetId) return;
  tenant.dashboardConfig ||= defaultDashboardConfig();
  const order = tenant.dashboardConfig.order.filter(id => id !== sourceId);
  order.splice(order.indexOf(targetId), 0, sourceId);
  tenant.dashboardConfig.order = order;
  persistTenant("dashboard_widget_reordered", "Widgets reorganizados");
  renderDashboard();
}

function restoreDashboardDefaults() {
  tenant.dashboardConfig = defaultDashboardConfig();
  persistTenant("dashboard_restored", "Dashboard restaurado");
  renderDashboard();
}

function dashboardModeAllows(area) {
  const mode = tenant.dashboardConfig?.mode || "both";
  if (mode === "both") return true;
  if (mode === "none") return false;
  return mode === area;
}

function crmCards(pipeline) {
  if (!pipeline) return [];
  const deals = (pipeline.deals || []).map(item => ({ ...item, kind: "deal", tags: item.tags || [] }));
  const leads = tenant.data.leads.filter(item => item.pipelineId === pipeline.id).map(item => ({ ...item, title: item.name, company: item.company || item.email || "", value: Number(item.value || 0), kind: "lead" }));
  return [...leads, ...deals];
}

function bindCrmDragAndDrop() {
  document.querySelectorAll("[data-record-id]").forEach(card => {
    card.addEventListener("dragstart", event => {
      event.dataTransfer.setData("record-id", card.dataset.recordId);
      event.dataTransfer.setData("record-type", card.dataset.recordType);
    });
  });
  document.querySelectorAll("[data-stage]").forEach(column => {
    column.addEventListener("dragover", event => event.preventDefault());
    column.addEventListener("drop", event => {
      event.preventDefault();
      moveCrmRecord(event.dataTransfer.getData("record-type"), event.dataTransfer.getData("record-id"), column.dataset.stage);
    });
  });
}

function moveCrmRecord(type, id, stageId) {
  const target = type === "lead" ? tenant.data.leads.find(item => item.id === id) : activePipeline().deals.find(item => item.id === id);
  if (!target) return;
  target.stageId = stageId;
  if (type === "lead") target.updatedAt = nowIso();
  persistTenant("crm_record_moved", "Card movido no CRM");
  renderCrm();
}

function resolveRoutingForLabels(labels, fallbackPipeline) {
  const rules = tenant.data.crmRoutingRules || [];
  const labelSet = new Set((labels || []).map(item => item.toLowerCase()));
  const rule = rules.find(item => labelSet.has(String(item.label || "").toLowerCase()));
  return {
    pipelineId: rule?.pipelineId || fallbackPipeline?.id || "",
    stageId: rule?.stageId || fallbackPipeline?.stages?.[0]?.id || "",
    autoCreate: rule?.autoCreate ?? false
  };
}

function findLeadByContact(phone, email) {
  return tenant.data.leads.find(item => (phone && item.phone === phone) || (email && item.email?.toLowerCase() === String(email).toLowerCase()));
}

function splitTags(raw) {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return String(raw || "").split(/[;,]/).map(item => item.trim()).filter(Boolean);
}

function pipelineName(id) {
  return tenant.data.pipelines.find(item => item.id === id)?.name || "Pipeline nao definido";
}

function stageName(pipelineId, stageId) {
  return tenant.data.pipelines.find(item => item.id === pipelineId)?.stages?.find(item => item.id === stageId)?.name || "Etapa nao definida";
}

function normalizeModules(raw) {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string") return raw.split(/[,\s;|]+/).map(item => item.trim()).filter(Boolean);
  return ["dashboard", "settings"];
}

function fromSupabaseStatus(status) {
  return ({ ativo: "active", suspenso: "suspended", cancelado: "cancelled", active: "active", suspended: "suspended", cancelled: "cancelled" })[status] || "active";
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Erro Supabase ${response.status}`);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function openFormModal(title, fields, onSubmit, extraActions = []) {
  const formId = uid("form");
  openModal(title, `<form id="${formId}" class="stack">${fields.join("")}<footer>${extraActions.map((action, index) => `<button class="btn ${action.className || "ghost"}" type="button" data-extra-action="${index}">${action.label}</button>`).join("")}<button class="btn ghost" type="button" data-close-modal>Cancelar</button><button class="btn primary" type="submit">${icon("save")} Salvar</button></footer></form>`);
  document.querySelectorAll("[data-extra-action]").forEach(button => button.addEventListener("click", () => extraActions[Number(button.dataset.extraAction)].action()));
  document.getElementById(formId).addEventListener("submit", event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    onSubmit(data);
    closeModal();
  });
}

function openModal(title, body) {
  const root = document.getElementById("modal-root");
  root.hidden = false;
  root.innerHTML = `<section class="modal"><header><div><p class="eyebrow">Supreme Tech</p><h2>${escapeHtml(title)}</h2></div><button class="icon-button" type="button" data-close-modal>${icon("chevron-left")}</button></header>${body}</section>`;
  root.querySelectorAll("[data-close-modal]").forEach(button => button.addEventListener("click", closeModal));
  renderIcons();
}

function closeModal() {
  const root = document.getElementById("modal-root");
  root.hidden = true;
  root.innerHTML = "";
}

function inputField(name, label, currentValue = "", type = "text", required = true, placeholder = "") {
  return `<label class="field">${label}<input name="${name}" type="${type}" value="${escapeAttr(currentValue ?? "")}" ${required ? "required" : ""} placeholder="${escapeAttr(placeholder)}"></label>`;
}

function selectField(name, label, options, selected = "") {
  const normalized = options.map(item => typeof item === "string" ? { value: item, label: item } : item);
  return `<label class="field">${label}<select name="${name}">${normalized.map(item => `<option value="${escapeAttr(item.value)}" ${String(item.value) === String(selected) ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></label>`;
}

function actionButtons(type, id) {
  return `<div class="actions"><button class="btn ghost" type="button" onclick="window.editRecord('${type}','${id}')">Editar</button><button class="btn danger" type="button" onclick="window.deleteRecord('${type}','${id}')">Excluir</button></div>`;
}

window.editRecord = (type, id) => {
  if (type === "dashboardWidgets") openWidgetModal(id);
  if (type === "deals") openDealModal(id);
  if (type === "leads") openLeadModal(id);
  if (["categories", "indicators", "reports", "goals", "processes"].includes(type)) openManagementModal(type, id);
  if (type === "automations") openAutomationModal(id);
};

window.deleteRecord = (type, id) => {
  if (!confirm("Excluir este registro?")) return;
  if (type === "dashboardWidgets") tenant.data.dashboardWidgets = tenant.data.dashboardWidgets.filter(item => item.id !== id);
  if (type === "deals") activePipeline().deals = activePipeline().deals.filter(item => item.id !== id);
  if (type === "leads") tenant.data.leads = tenant.data.leads.filter(item => item.id !== id);
  if (["categories", "indicators", "reports", "goals", "processes"].includes(type)) tenant.data.management[type] = tenant.data.management[type].filter(item => item.id !== id);
  if (type === "automations") tenant.data.automations = tenant.data.automations.filter(item => item.id !== id);
  persistTenant("record_deleted", "Registro excluido");
  renderActiveModule();
};

function upsert(list, item) {
  if (item.id) {
    const index = list.findIndex(entry => entry.id === item.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...item };
      return list[index];
    }
  }
  const created = { ...item, id: uid("item"), createdAt: nowIso() };
  list.push(created);
  return created;
}

function on(id, event, handler) {
  document.getElementById(id)?.addEventListener(event, handler);
}

function value(id) {
  return document.getElementById(id)?.value.trim() || "";
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function showLoginMessage(message) {
  setText("login-message", message);
}

function toast(message, type = "info") {
  const root = document.getElementById("toast-root");
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.textContent = message;
  root.appendChild(item);
  setTimeout(() => item.remove(), 3600);
}

function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.settings}</svg>`;
}

function renderIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach(el => {
    el.innerHTML = icon(el.dataset.icon);
    el.removeAttribute("data-icon");
  });
}

function escapeHtml(raw) {
  return String(raw ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(raw) {
  return escapeHtml(raw).replaceAll("`", "&#096;");
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function formatDate(raw) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(raw));
}

function formatCurrency(raw) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(raw) || 0);
}

function dateIso(date) {
  return date.toISOString().slice(0, 10);
}

function startOfWeek(date) {
  const current = new Date(date);
  current.setDate(current.getDate() - current.getDay());
  return current;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function initials(name) {
  return String(name || "ST")
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function lightenHex(hex, percentage) {
  const normalized = String(hex || "").replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return "#f6d365";
  const number = parseInt(normalized, 16);
  const amount = Math.round(255 * (percentage / 100));
  const red = Math.min(255, (number >> 16) + amount);
  const green = Math.min(255, ((number >> 8) & 255) + amount);
  const blue = Math.min(255, (number & 255) + amount);
  return `#${((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1)}`;
}

function statusLabel(status) {
  return ({
    open: "Aberto",
    pending: "Pendente",
    resolved: "Resolvido",
    confirmed: "Confirmado",
    done: "Concluido",
    overdue: "Atrasado",
    cancelled: "Cancelado",
    active: "Ativo",
    suspended: "Suspenso"
  })[status] || status;
}

function roleLabel(role) {
  return ({
    proprietario: "Proprietario",
    administrador: "Administrador",
    gerente: "Gerente",
    supervisor: "Supervisor",
    atendente: "Atendente",
    financeiro: "Financeiro",
    comercial: "Comercial",
    suporte: "Suporte"
  })[role] || role;
}

function managementLabel(type) {
  return ({
    categories: "Categoria",
    indicators: "Indicador",
    reports: "Relatorio",
    goals: "Meta",
    processes: "Processo"
  })[type] || type;
}

function registerServiceWorker() {
  if (!["http:", "https:"].includes(location.protocol)) return;
  const manifest = document.createElement("link");
  manifest.rel = "manifest";
  manifest.href = "manifest.webmanifest";
  document.head.appendChild(manifest);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
}
