const storageKey = "kayjob.webapp.state";
const stateVersion = 2;
const defaultApiBase = "";
const configuredApiBase = String(globalThis.KAYJOB_API_URL || "").includes("__KAYJOB_API_URL__") ? "" : globalThis.KAYJOB_API_URL;
const apiBase = String(configuredApiBase || localStorage.getItem("kayjob.api.url") || defaultApiBase).replace(/\/$/, "");
const apiAvailable = Boolean(apiBase || location.protocol === "https:" || location.protocol === "http:");
const categories = ["Informatique", "Design", "Média", "Éducation", "Digital", "Créatif", "Services physiques"];
const cities = ["Dakar", "Thiès", "Saint-Louis", "Ziguinchor", "Kaolack", "Touba", "Mbour", "Diourbel"];
const authOverlay = document.querySelector("#authOverlay");
const landingPage = document.querySelector("#landingPage");
const appShell = document.querySelector("#appShell");
const authForm = document.querySelector("#authForm");
const authStatus = document.querySelector("#authStatus");
const fullNameGroup = document.querySelector("#fullNameGroup");
const authTabs = document.querySelectorAll(".auth-tab");
let currentAuthMode = "login";

const seed = {
  version: stateVersion,
  services: [],
  missions: [],
  orders: [],
  messages: [],
  notifications: [],
  disputes: [],
  selectedOrderId: null
};

let state = load();
if (!state.viewingProfileId) state.viewingProfileId = null;
const view = document.querySelector("#view");
const modal = document.querySelector("#modal");
const modalForm = document.querySelector("#modalForm");

function safeSeed() {
  return structuredClone(seed);
}

async function apiFetch(path, options = {}) {
  if (!apiAvailable) throw new Error("API non configurée");
  const headers = { accept: "application/json", ...(options.headers || {}) };
  if (options.body) headers["content-type"] = "application/json";
  const token = sessionStorage.getItem("kayjob.session");
  if (token) headers.authorization = `Bearer ${token}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(options.timeoutMs || 12000));
  try {
    const response = await fetch(`${apiBase}${path}`, { ...options, headers, signal: controller.signal });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(readApiError(body));
    return body.data;
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("API trop lente, réessaie dans un instant.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function readApiError(body) {
  const error = body?.error || body?.message;
  if (!error) return "API indisponible";
  if (typeof error === "string") return error;
  return error.message || JSON.stringify(error);
}

function isEmailLike(value) {
  return /@/.test(value);
}

function setAuthMode(mode) {
  currentAuthMode = mode;
  authTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.authMode === mode));
  const isSignup = mode === "signup";
  fullNameGroup.classList.toggle("hidden", !isSignup);
  authForm.dataset.mode = mode;
  const submitLabel = isSignup ? "Créer mon compte" : "Se connecter";
  const submit = authForm.querySelector(".auth-submit");
  if (submit) submit.textContent = submitLabel;
}

function openAuth(mode = "login") {
  setAuthMode(mode);
  authStatus.textContent = "";
  authOverlay.classList.remove("hidden");
}

function closeAuth() {
  authOverlay.classList.add("hidden");
  authStatus.textContent = "";
}

async function loginWithPassword(contact, password, mode, fullName) {
  const payload = isEmailLike(contact)
    ? { email: contact.trim().toLowerCase(), password }
    : { phone: contact.trim(), password };
  if (mode === "signup") payload.fullName = fullName || "Nouveau membre";

  const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
  const result = await apiFetch(endpoint, { method: "POST", body: JSON.stringify(payload) });
  if (!result?.token) throw new Error("Session API manquante");
  sessionStorage.setItem("kayjob.session", result.token);
  if (result.user) sessionStorage.setItem("kayjob.user", JSON.stringify(result.user));
  return true;
}

function toggleAppVisibility(visible) {
  landingPage.classList.toggle("hidden", visible);
  appShell.classList.toggle("hidden", !visible);
}

async function syncRemote() {
  if (!apiAvailable) return;
  try {
    const services = await apiFetch("/api/services");
    state.services = Array.isArray(services) ? services.map((row) => ({ ...talent(`api-srv-${row.id}`, row.full_name, row.pseudo || "talent", row.city || "Sénégal", row.category || "Compétence", row.title, Number(row.starting_price), row.delivery_mode || "remote", Number(row.sama_score || 0), mapPortfolio(row.portfolio)), apiId: Number(row.id), userId: Number(row.user_id), avatar: row.avatar_url, verificationStatus: row.verification_status })) : [];
    const missions = await apiFetch("/api/missions");
    if (Array.isArray(missions)) {
      state.missions = missions.map((row) => ({ id: `api-mis-${row.id}`, apiId: Number(row.id), title: row.title, city: row.city || "Sénégal", category: row.category || "Mission", budget: Number(row.budget_max), mode: row.delivery_mode || "remote", offers: Number(row.offers || 0) }));
    }
    if (sessionStorage.getItem("kayjob.session")) {
      const orders = await apiFetch("/api/me/orders");
      state.orders = Array.isArray(orders) ? orders.map((row) => ({ id: `KJ-${row.id}`, apiId: Number(row.id), title: row.title, status: row.status, gross: Number(row.amount_total || 0), net: Number(row.amount_net_provider || 0) })) : [];
      if (isUserAdmin()) {
        const disputes = await apiFetch("/api/admin/disputes");
        state.disputes = Array.isArray(disputes) ? disputes.map((row) => ({ id: row.id, orderId: `KJ-${row.order_id}`, apiOrderId: Number(row.order_id), status: row.status, reason: row.reason })) : [];
      }
    }
    state.remote = true;
    save();
    render();
  } catch (error) {
    state.remote = false;
    state.notifications = [...(state.notifications || []), "Connexion backend indisponible. Vérifie Render, CORS_ORIGIN et DATABASE_URL."];
    console.warn("KayJob API indisponible", error.message);
    save();
    render();
  }
}

function mapPortfolio(items) {
  return Array.isArray(items) ? items.map((item) => ({
    title: item.title,
    type: item.item_type === "link" ? "Lien" : item.item_type || "Portfolio",
    image: item.media_url || "./assets/portfolio-web.svg",
    url: item.external_url || item.media_url || "#",
    description: item.description || ""
  })) : [];
}

function talent(id, name, pseudo, city, category, title, price, mode, score, works = []) {
  return {
    id, name, pseudo, city, category, title, price, mode, score, rating: 4.8,
    skills: [category, mode === "onsite" ? "Présentiel" : "Remote"],
    works
  };
}

function makePortfolio(title, type, image, url, description) {
  return {
    title,
    type,
    image,
    url,
    description,
    createdAt: new Date().toISOString()
  };
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return saved?.version === stateVersion ? saved : safeSeed();
  } catch {
    return safeSeed();
  }
}

function save() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function money(value) {
  return Number(value).toLocaleString("fr-FR") + " FCFA";
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function attr(value) {
  return esc(value).replace(/`/g, "&#96;");
}

function safeUrl(value) {
  const url = String(value || "").trim();
  return /^(https?:|mailto:)/i.test(url) ? url : "#";
}

async function withBusyButton(button, label, task) {
  if (button?.disabled) return;
  const previous = button?.textContent;
  if (button) {
    button.disabled = true;
    button.textContent = label;
  }
  try {
    return await task();
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = previous;
    }
  }
}

function mode(modeValue) {
  return { remote: "À distance", onsite: "Sur place", both: "Les deux" }[modeValue];
}

function orderStatus(status) {
  return { awaiting_payment: "Paiement attendu", escrowed: "Paiement bloqué", in_progress: "En cours", preview_delivered: "Aperçu livré", final_delivered: "Livré", client_review: "À valider", completed_released: "Payé", delivered: "Livré", paid_out: "Payé", disputed: "Litige", dispute_opened: "Litige" }[status] || status;
}

function getApiOrderId(order) {
  return Number(order?.apiId || String(order?.id || "").replace(/\D+/g, "") || 0);
}

async function loadMessagesForOrder(order) {
  const orderId = getApiOrderId(order);
  if (!orderId || !sessionStorage.getItem("kayjob.session")) return;
  const rows = await apiFetch(`/api/orders/${orderId}/messages`);
  const thread = {
    orderId: order.id,
    peer: order.title || "Commande KayJob",
    role: "Commande",
    loaded: true,
    items: Array.isArray(rows) ? rows.map((message) => ({
      id: String(message.id),
      me: Boolean(message.me),
      text: message.body,
      time: new Date(message.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      status: message.me ? "Envoyé" : ""
    })) : []
  };
  state.messages = [...(state.messages || []).filter((item) => item.orderId !== order.id), thread];
  save();
  if (currentRoute() === "messages") render();
}

function currentRoute() {
  return location.hash.replace("#", "") || "dashboard";
}

function setTitle(route) {
  const titles = {
    dashboard: ["Application", "Tableau de bord"],
    discover: ["Marketplace", "Découvrir les talents"],
    missions: ["Demandes clients", "Missions ouvertes"],
    orders: ["Escrow", "Commandes"],
    messages: ["Temps réel", "Messages"],
    portfolio: ["Profil public", "Portfolio"],
    admin: ["Back-office", "Administration"],
    login: ["Sécurité", "Connexion"]
  };
  const [eyebrow, title] = titles[route] || titles.dashboard;
  document.querySelector("#routeEyebrow").textContent = eyebrow;
  document.querySelector("#routeTitle").textContent = title;
  document.querySelectorAll("[data-route]").forEach((link) => link.classList.toggle("active", link.dataset.route === route));
}

function hasActiveSession() {
  return Boolean(sessionStorage.getItem("kayjob.session"));
}

function isUserAdmin() {
  const userJson = sessionStorage.getItem("kayjob.user");
  if (!userJson) return false;
  try {
    const user = JSON.parse(userJson);
    return user.role === "admin" || user.isAdmin === true || (user.email === "admin@kayjob.sn" || user.phone === "+221770000000");
  } catch { return false; }
}

function getCurrentUser() {
  try {
    return JSON.parse(sessionStorage.getItem("kayjob.user") || "null");
  } catch {
    return null;
  }
}

function getCurrentProfile() {
  const user = getCurrentUser();
  if (!user) return null;

  const identifiers = new Set();
  if (user.full_name) identifiers.add(String(user.full_name).trim().toLowerCase());
  if (user.email) identifiers.add(String(user.email).trim().toLowerCase());
  if (user.phone) identifiers.add(String(user.phone).trim().toLowerCase());
  const shortEmail = user.email ? String(user.email).trim().split("@")[0].toLowerCase() : "";
  if (shortEmail) identifiers.add(shortEmail);

  return state.services.find((service) => {
    const serviceName = String(service.name || "").trim().toLowerCase();
    const servicePseudo = String(service.pseudo || "").trim().toLowerCase();
    return [...identifiers].some((identifier) => {
      if (!identifier) return false;
      return identifier === serviceName || identifier === servicePseudo ||
        serviceName.includes(identifier) || servicePseudo.includes(identifier) ||
        identifier.includes(serviceName) || identifier.includes(servicePseudo);
    });
  }) || null;
}

function getMyProfileId() {
  return getCurrentProfile()?.id || null;
}

function ensureLoggedInForAction(modalType = "auth") {
  if (!sessionStorage.getItem("kayjob.session")) {
    openModal(modalType);
    return false;
  }
  return true;
}

function render() {
  const route = currentRoute();
  if (route === "admin" && !isUserAdmin()) {
    location.hash = "dashboard";
    return;
  }
  const pages = { dashboard, discover, missions, orders, messages, portfolio, admin, login };
  const hash = route;
  if (hash === "portfolio" && !state.viewingProfileId) {
    const myProfile = getCurrentProfile();
    if (myProfile) state.viewingProfileId = myProfile.id;
  }
  if (hash !== "portfolio") state.viewingProfileId = null;
  setTitle(route);
  const page = pages[hash] || pages.dashboard;
  view.innerHTML = page();
  const isAdmin = isUserAdmin();
  const adminLink = document.querySelector("[data-route='admin']");
  if (adminLink) adminLink.style.display = isAdmin ? "" : "none";
  const authButton = document.querySelector("#authButton");
  if (authButton) authButton.textContent = "Mon compte";
  const quickMission = document.querySelector("#quickMission");
  if (quickMission) quickMission.style.display = hasActiveSession() ? "" : "none";
  const apiStatus = document.querySelector("#apiStatus");
  if (apiStatus) {
    apiStatus.textContent = state.remote ? "API connectée" : apiAvailable ? "API à vérifier" : "API absente";
    apiStatus.classList.toggle("online", Boolean(state.remote));
    apiStatus.classList.toggle("offline", !state.remote);
  }
  bindActions();
}

function dashboard() {
  const gmv = state.orders.reduce((sum, order) => sum + order.gross, 0);
  const recentOrders = state.orders.length ? state.orders.map(orderRow).join("") : emptyState("Aucune commande", "Les commandes apparaîtront ici après un paiement initié depuis un service.", "discover", "Découvrir les talents");
  const quickActions = hasActiveSession() ? `
    <div class="actions">
      <button class="primary" data-modal="service">Publier un service</button>
      <button class="secondary" data-modal="mission">Publier une mission</button>
      <button class="secondary" data-route-to="portfolio">Voir portfolio</button>
    </div>` : `
    <div class="actions">
      <button class="primary" data-route-to="discover">Découvrir les talents</button>
      <button class="secondary" data-route-to="login">Se connecter</button>
    </div>`;
  return `
    <section class="grid four">
      ${metric(state.services.length, "Prestataires", "profils actifs")}
      ${metric(state.missions.length, "Missions", "besoins ouverts")}
      ${metric(money(gmv), "GMV", "volume commandes")}
      ${metric(state.disputes.length, "Litiges", "à arbitrer")}
    </section>
    <section class="split" style="margin-top:16px">
      <div class="panel">
        <h2>Commandes récentes</h2>
	        <div class="list">${recentOrders}</div>
      </div>
      <div class="panel">
        <h2>Actions rapides</h2>
        ${quickActions}
      </div>
    </section>`;
}

function metric(value, label, detail) {
  return `<article class="metric"><strong>${esc(value)}</strong><h3>${esc(label)}</h3><p class="meta">${esc(detail)}</p></article>`;
}

function login() {
  return `<section class="split"><div class="panel"><p class="eyebrow">Espace sécurisé</p><h2>Connecte-toi à KayJob</h2><p class="meta">Utilise ton email ou ton téléphone avec un mot de passe.</p><form id="loginForm" class="modal-card" style="width:auto;padding:0;box-shadow:none"><label>Email ou téléphone<input name="accountEmail" required placeholder="vous@exemple.com ou +221 77 000 00 00" /></label><label>Mot de passe<input name="accountPassword" type="password" required placeholder="••••••••" /></label><div class="actions"><button class="primary" value="login">Se connecter</button></div><p id="loginStatus" class="meta" aria-live="polite"></p></form></div><aside class="panel"><h2>Une seule identité</h2><p class="meta">Commande comme client, propose tes compétences et retrouve ton portfolio avec le même compte.</p><span class="badge">Paiement protégé</span></aside></section>`;
}

function discover() {
  return `
    <section class="filters">
      <label>Recherche<input id="q" placeholder="logo, dev, cours..." /></label>
      <label>Catégorie<select id="cat"><option>Toutes</option>${categories.map(option).join("")}</select></label>
      <label>Ville<select id="city"><option>Toutes</option>${cities.map(option).join("")}</select></label>
      <label>Budget max<input id="budget" type="number" placeholder="15000" /></label>
    </section>
    <section class="grid" id="serviceResults">${serviceCards(state.services)}</section>`;
}

function serviceCards(rows) {
  if (!rows.length) return emptyState("Aucun service publié", "Publie ton premier service ou reviens quand de nouveaux profils auront été validés.", "dashboard", "Retour tableau de bord");
  return rows.map((item) => `
    <article class="card service-card">
      <div class="card-head"><div class="avatar" style="${item.avatar ? `background-image:url('${attr(safeUrl(item.avatar))}');background-size:cover` : ""}">${item.avatar ? "" : esc(item.name.split(" ").map((p) => p[0]).join(""))}</div><div><h3>${esc(item.title)}</h3><p class="meta">${esc(item.name)} · ${esc(item.city)}</p></div></div>
      <div class="row"><span class="badge">${mode(item.mode)}</span><span class="badge yellow">SamaScore ${item.score}/100</span></div>
      <p>${item.skills.map(esc).join(" · ")}</p>
      <strong>${money(item.price)}</strong>
      <div class="actions"><button class="secondary" data-profile="${attr(item.id)}">Portfolio</button><button class="primary" data-order="${attr(item.id)}">Commander</button></div>
    </article>`).join("");
}

function missions() {
  const publishButton = hasActiveSession() ? `<div class="actions" style="margin-bottom:16px"><button class="primary" data-modal="mission">Publier une mission</button></div>` : `<p class="meta" style="margin-bottom:16px">Connecte-toi pour publier une mission et recevoir des devis.</p>`;
  return `
    ${publishButton}
    <section class="list">${state.missions.length ? state.missions.map((item) => `
      <article class="list-item">
        <div><h3>${esc(item.title)}</h3><p class="meta">${esc(item.city)} · ${esc(item.category)} · ${mode(item.mode)} · ${Number(item.offers || 0)} devis</p></div>
        <div class="actions"><strong>${money(item.budget)}</strong>${hasActiveSession() ? `<button class="secondary" data-offer="${attr(item.id)}">Faire un devis</button>` : ""}</div>
      </article>`).join("") : emptyState("Aucune mission ouverte", "Les nouvelles missions publiées depuis l’app apparaîtront ici.", null, "")}</section>`;
}

function orders() {
  return `<section class="list">${state.orders.length ? state.orders.map(orderRow).join("") : emptyState("Aucune commande", "Commande un service pour créer un escrow, une conversation et un suivi de livraison.", "discover", "Trouver un service")}</section>`;
}

function orderRow(order) {
  const item = state.services.find((service) => service.id === order.serviceId);
  const adminButtons = isUserAdmin() ? `<button class="primary" data-paid="${order.id}">Valider</button><button class="danger" data-dispute="${order.id}">Litige</button>` : "";
  return `<article class="list-item"><div><h3>${esc(order.id)} · ${esc(item?.title || order.title || "Commande KayJob")}</h3><p class="meta">${money(order.gross ?? order.amount_total ?? 0)} · ${esc(orderStatus(order.status))}</p></div><div class="actions"><button class="secondary" data-select-order="${attr(order.id)}">Messages</button>${adminButtons}</div></article>`;
}

function isViewingOwnProfile() {
  const myProfileId = getMyProfileId();
  if (!myProfileId) return false;
  return !state.viewingProfileId || state.viewingProfileId === myProfileId;
}

function getViewingProfile() {
  if (state.viewingProfileId) {
    return state.services.find((service) => service.id === state.viewingProfileId) || getCurrentProfile() || state.services[0] || null;
  }
  return getCurrentProfile() || state.services[0] || null;
}

function messages() {
  const order = state.orders.find((item) => item.id === state.selectedOrderId) || state.orders[0];
  if (!order) return `<section class="panel"><h2>Messages</h2><p class="meta">Connecte-toi et ouvre une commande pour démarrer une conversation.</p></section>`;
  state.selectedOrderId = order.id;
  const conversation = (state.messages || []).find((thread) => thread.orderId === order.id) || (state.messages || [])[0] || { orderId: order.id, peer: "Prestataire", role: "Partenaire", online: true, items: [] };
  if (sessionStorage.getItem("kayjob.session") && getApiOrderId(order) && !conversation.loaded) {
    loadMessagesForOrder(order).catch((error) => console.warn("Messages indisponibles", error.message));
    conversation.loaded = true;
  }
  const service = state.services.find((item) => item.id === order.serviceId) || state.services[0];
  const rows = conversation.items || [];
  return `
    <section class="chat-shell">
      <aside class="chat-list">
        <div class="chat-list-header">
          <h2>Conversations</h2>
        </div>
        ${(state.messages || []).map((thread) => {
          const active = thread.orderId === order.id ? "active" : "";
          const last = thread.items[thread.items.length - 1];
          return `<button class="chat-thread ${active}" type="button" data-select-order="${attr(thread.orderId)}">
            <div class="avatar chat-avatar">${esc((thread.peer || "P").split(" ").map((part) => part[0]).slice(0,2).join("").toUpperCase())}</div>
            <div class="chat-thread-body">
              <div class="chat-thread-head"><strong>${esc(thread.peer)}</strong><span>${esc(last ? last.time : "maintenant")}</span></div>
              <div class="chat-thread-meta"><span>${esc(thread.role)}</span><span class="status-pill ${thread.online ? "online" : "offline"}"></span></div>
              <p>${esc(last ? last.text : "Commencez la discussion")}</p>
            </div>
          </button>`;
        }).join("")}
      </aside>
      <section class="chat-pane">
        <header class="chat-header">
          <div class="chat-header-user">
            <div class="avatar chat-avatar large">${esc((conversation.peer || service?.name || "P").split(" ").map((part) => part[0]).slice(0,2).join("").toUpperCase())}</div>
            <div>
              <h3>${esc(conversation.peer || service?.name || "Prestataire")}</h3>
              <p>${conversation.online ? "En ligne" : "Dernière activité il y a 10 min"}</p>
            </div>
          </div>
          <div class="chat-header-actions"></div>
        </header>

        <div class="chat-messages">
          ${rows.map((message) => `<div class="chat-message ${message.me ? "me" : "them"}">
            <div class="bubble-wrap">
              ${message.attachment ? `<div class="bubble-doc">Fichier joint · ${esc(message.text.replace("Pièce jointe : ", ""))}</div>` : `<div class="bubble-text">${esc(message.text)}</div>`}
              <div class="bubble-meta"><span>${esc(message.time)}</span>${message.me ? `<span>${esc(message.status || "Vu")}</span>` : ''}</div>
            </div>
          </div>`).join("")}
        </div>

        <div class="quick-replies">
          <button type="button" class="reply-pill" data-quick-reply="D’accord">D’accord</button>
          <button type="button" class="reply-pill" data-quick-reply="J’envoie le brief">J’envoie le brief</button>
          <button type="button" class="reply-pill" data-quick-reply="C’est validé">C’est validé</button>
        </div>

        <form class="chat-composer" id="messageForm">
          <button type="button" class="secondary" data-attach="file">Pièce jointe</button>
          <input id="messageText" placeholder="Écrire un message..." maxlength="400" />
          <button class="primary" type="submit">Envoyer</button>
        </form>
      </section>
    </section>`;
}

function portfolio() {
  const profile = getViewingProfile();
  if (!profile) return `<section class="panel"><h2>Portfolio</h2><p class="meta">Aucun profil prestataire disponible pour le moment.</p></section>`;
  const isOwn = isViewingOwnProfile();
  const addWorkButton = isOwn ? `<button class="primary" data-modal="work">Ajouter une réalisation</button>` : "";
  const backButton = isOwn ? "" : `<button class="secondary" data-route-to="discover">← Retour</button>`;
  return `
    <section class="split">
      <aside class="panel">
        <h2>kayjob.sn/${esc(profile.pseudo)}</h2>
        <p>${esc(profile.name)} · ${esc(profile.city)}</p>
        <span class="badge yellow">SamaScore ${profile.score}/100</span>
        <div class="actions" style="margin-top:14px">${addWorkButton}${backButton}</div>
      </aside>
      <div class="work-grid">${profile.works.length ? profile.works.map((work) => `<article class="work-card"><img src="${attr(safeUrl(work.image))}" alt="" /><div><span class="badge ${work.type === "Lien" ? "blue" : ""}">${esc(work.type)}</span><h3>${esc(work.title)}</h3><p class="meta">${esc(work.description)}</p>${safeUrl(work.url) !== "#" ? `<a class="primary" href="${attr(safeUrl(work.url))}" target="_blank" rel="noreferrer">Ouvrir</a>` : ""}</div></article>`).join("") : `<article class="panel"><p class="meta">Aucune réalisation publiée pour ce profil.</p></article>`}</div>
    </section>`;
}

function admin() {
  const pendingVerifs = state.services.length > 3 ? state.services.slice(0, 3) : state.services;
  const pendingLitiges = state.disputes || [];
  const escrowedOrders = (state.orders || []).filter((o) => o.status === "escrowed");
  return `
    <section class="grid four">
      ${metric(state.services.length, "Utilisateurs", "profils actifs")}
      ${metric(pendingVerifs.length, "Vérifications", "en attente")}
      ${metric(escrowedOrders.length, "Escrow", "transactions bloquées")}
      ${metric(pendingLitiges.length, "Litiges", "à arbitrer")}
    </section>
    
    <section class="split" style="margin-top:16px">
      <div class="panel">
        <h2>Vérifications en attente</h2>
	        <div class="list">${pendingVerifs.length ? pendingVerifs.map((service) => `
	          <article class="list-item">
            <div><h3>${esc(service.name)}</h3><p class="meta">${esc(service.pseudo)} · ${esc(service.city)}</p></div>
	            <div class="actions"><button class="secondary" data-verify="${service.userId}">Valider</button><button class="danger" data-reject="${service.userId}">Rejeter</button></div>
	          </article>`).join("") : emptyState("Aucune vérification", "Les profils en attente apparaîtront ici.", null, "")}</div>
      </div>
      
      <div class="panel">
        <h2>Escrow en attente</h2>
	        <div class="list">${escrowedOrders.length ? escrowedOrders.map((order) => {
	          const service = state.services.find((s) => s.id === order.serviceId);
	          return `<article class="list-item">
            <div><h3>${esc(order.id)}</h3><p class="meta">${money(order.gross)} · ${esc(service?.title || "Commande")}</p></div>
	            <div class="actions"><button class="primary" data-release="${order.id}">Libérer</button><button class="danger" data-hold="${order.id}">Bloquer</button></div>
	          </article>`;
	        }).join("") : emptyState("Aucun escrow bloqué", "Les commandes payées en attente de libération apparaîtront ici.", null, "")}</div>
      </div>
    </section>
    
    <div class="panel" style="margin-top:16px">
      <h2>Litiges ouverts</h2>
	      <div class="list">${pendingLitiges.length ? pendingLitiges.map((litige) => `
	        <article class="list-item">
          <div><h3>Litige ${esc(litige.id)}</h3><p class="meta">Commande ${esc(litige.orderId)} · Statut : ${esc(litige.status)}</p></div>
	          <div class="actions"><button class="secondary" data-review="${litige.id}">Examiner</button><button class="primary" data-resolve="${litige.id}">Résoudre</button></div>
	        </article>`).join("") : emptyState("Aucun litige ouvert", "Les litiges client ou prestataire arriveront ici.", null, "")}</div>
	    </div>`;
}

function emptyState(title, body, route, actionLabel) {
  const action = route && actionLabel ? `<button class="secondary" data-route-to="${attr(route)}">${esc(actionLabel)}</button>` : "";
  return `<article class="empty-state"><h3>${esc(title)}</h3><p>${esc(body)}</p>${action}</article>`;
}

function option(item) {
  return `<option>${item}</option>`;
}

function openModal(type) {
  if ((type === "service" || type === "mission") && !sessionStorage.getItem("kayjob.session")) {
    const forms = {
      auth: `<h2>Connexion KayJob</h2><p class="meta">Utilise ton email ou ton téléphone avec un mot de passe.</p><label>Email ou téléphone<input name="accountEmail" required placeholder="vous@exemple.com ou +221 77 000 00 00" /></label><label>Mot de passe<input name="accountPassword" type="password" required placeholder="••••••••" /></label><div class="actions"><button class="secondary" value="cancel">Annuler</button><button class="primary" value="auth-login">Se connecter</button></div>`
    };
    modalForm.innerHTML = forms.auth;
    modal.showModal();
    return;
  }
  if (type === "work" && !isViewingOwnProfile()) {
    alert("Tu ne peux modifier que ton propre portfolio.");
    return;
  }
  const forms = {
    auth: `<h2>Connexion KayJob</h2><p class="meta">Utilise ton email ou ton téléphone avec un mot de passe.</p><label>Email ou téléphone<input name="accountEmail" required placeholder="vous@exemple.com ou +221 77 000 00 00" /></label><label>Mot de passe<input name="accountPassword" type="password" required placeholder="••••••••" /></label><div class="actions"><button class="secondary" value="cancel">Annuler</button><button class="primary" value="auth-login">Se connecter</button></div>`,
    service: `<h2>Nouveau service</h2><label>Titre<input name="title" required /></label><label>Catégorie<select name="category">${categories.map(option).join("")}</select></label><label>Prix<input name="price" type="number" required /></label><div class="actions"><button class="secondary" value="cancel">Annuler</button><button class="primary" value="service">Publier</button></div>`,
    mission: `<h2>Nouvelle mission</h2><label>Titre<input name="title" required /></label><label>Ville<select name="city">${cities.map(option).join("")}</select></label><label>Budget<input name="budget" type="number" required /></label><div class="actions"><button class="secondary" value="cancel">Annuler</button><button class="primary" value="mission">Publier</button></div>`,
    work: `<h2>Nouvelle réalisation</h2><label>Titre<input name="title" required /></label><label>Lien<input name="url" placeholder="https://..." /></label><label>Description<textarea name="description" required></textarea></label><div class="actions"><button class="secondary" value="cancel">Annuler</button><button class="primary" value="work">Ajouter</button></div>`
  };
  modalForm.innerHTML = forms[type];
  modal.showModal();
}

function bindActions() {
  const adminLink = document.querySelector("[data-route='admin']");
  if (adminLink) adminLink.style.display = isUserAdmin() ? "" : "none";
  document.querySelector("#authButton")?.addEventListener("click", () => {
    if (sessionStorage.getItem("kayjob.session")) {
      const myProfile = getCurrentProfile();
      if (myProfile) state.viewingProfileId = myProfile.id;
      location.hash = "portfolio";
      return;
    }
    location.hash = "login";
  });
  document.querySelectorAll("[data-route-to]").forEach((button) => button.addEventListener("click", () => { location.hash = button.dataset.routeTo; }));
  document.querySelectorAll("[data-modal]").forEach((button) => button.addEventListener("click", () => openModal(button.dataset.modal)));
  document.querySelectorAll("[data-order]").forEach((button) => button.addEventListener("click", () => {
    if (!ensureLoggedInForAction("auth")) return;
    withBusyButton(button, "Création...", () => createOrder(button.dataset.order));
  }));
  document.querySelectorAll("[data-offer]").forEach((button) => button.addEventListener("click", () => {
    if (!ensureLoggedInForAction("auth")) return;
    withBusyButton(button, "Envoi...", () => addOffer(button.dataset.offer));
  }));
  document.querySelectorAll("[data-paid]").forEach((button) => button.addEventListener("click", () => withBusyButton(button, "Validation...", () => updateOrder(button.dataset.paid, "completed_released"))));
  document.querySelectorAll("[data-dispute]").forEach((button) => button.addEventListener("click", () => withBusyButton(button, "Ouverture...", () => openDispute(button.dataset.dispute))));
  document.querySelectorAll("[data-verify]").forEach((button) => button.addEventListener("click", () => withBusyButton(button, "Validation...", () => adminVerifyUser(button.dataset.verify, "verify"))));
  document.querySelectorAll("[data-reject]").forEach((button) => button.addEventListener("click", () => withBusyButton(button, "Rejet...", () => adminVerifyUser(button.dataset.reject, "reject"))));
  document.querySelectorAll("[data-release]").forEach((button) => button.addEventListener("click", () => withBusyButton(button, "Libération...", () => adminReleaseOrder(button.dataset.release))));
  document.querySelectorAll("[data-hold]").forEach((button) => button.addEventListener("click", () => withBusyButton(button, "Blocage...", () => adminDisputeOrder(button.dataset.hold))));
  document.querySelectorAll("[data-resolve]").forEach((button) => button.addEventListener("click", () => withBusyButton(button, "Résolution...", () => adminResolveDispute(button.dataset.resolve))));
  document.querySelectorAll("[data-review]").forEach((button) => button.addEventListener("click", () => alert((state.disputes || []).find((item) => String(item.id) === String(button.dataset.review))?.reason || "Aucun détail disponible.")));
  document.querySelectorAll("[data-select-order]").forEach((button) => button.addEventListener("click", () => { state.selectedOrderId = button.dataset.selectOrder; save(); location.hash = "messages"; }));
  document.querySelectorAll("[data-profile]").forEach((button) => button.addEventListener("click", () => {
    state.viewingProfileId = button.dataset.profile;
    save();
    location.hash = "portfolio";
  }));
  document.querySelectorAll("[data-quick-reply]").forEach((button) => button.addEventListener("click", () => {
    const input = document.querySelector("#messageText");
    if (input) input.value = button.dataset.quickReply;
    input?.focus();
  }));
  document.querySelectorAll("[data-attach]").forEach((button) => button.addEventListener("click", () => alert("Pièce jointe : vous pouvez ajouter un fichier ou une preuve de livraison en toute sécurité.")));
  const q = document.querySelector("#q");
  if (q) ["input", "change"].forEach((eventName) => document.querySelectorAll("#q,#cat,#city,#budget").forEach((field) => field.addEventListener(eventName, filterDiscover)));
  const hash = window.location.hash.slice(1) || "dashboard";
  if (hash !== "portfolio") state.viewingProfileId = null;
  const form = document.querySelector("#messageForm");
  if (form) form.addEventListener("submit", sendMessage);
  const loginForm = document.querySelector("#loginForm");
  if (loginForm) loginForm.addEventListener("submit", handleLogin);
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const destination = String(data.get("accountEmail") || data.get("destination") || "").trim();
  const password = String(data.get("accountPassword") || data.get("password") || "").trim();
  const status = document.querySelector("#loginStatus");
  try {
    if (!destination || !password) throw new Error("Email/phone et mot de passe requis.");
    const result = await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify(isEmailLike(destination) ? { email: destination.toLowerCase(), password } : { phone: destination, password }) });
    sessionStorage.setItem("kayjob.session", result.token);
    if (result.user) sessionStorage.setItem("kayjob.user", JSON.stringify(result.user));
    status.textContent = "Connexion réussie.";
    await syncRemote();
    toggleAppVisibility(true);
    location.hash = "dashboard";
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Connexion impossible";
  }
}

function filterDiscover() {
  const qField = document.querySelector("#q");
  const catField = document.querySelector("#cat");
  const cityField = document.querySelector("#city");
  const budgetField = document.querySelector("#budget");

  if (!qField || !catField || !cityField || !budgetField) return;

  const q = qField.value.toLowerCase();
  const cat = catField.value;
  const city = cityField.value;
  const budget = Number(budgetField.value || Infinity);

  const rows = state.services
    .filter((item) => cat === "Toutes" || item.category === cat)
    .filter((item) => city === "Toutes" || item.city === city || (item.mode === "both" && city !== "Toutes"))
    .filter((item) => Number(item.price) <= budget)
    .filter((item) => !q || `${item.title} ${item.name} ${item.skills.join(" ")}`.toLowerCase().includes(q));

  const grid = document.querySelector("#serviceResults");
  if (grid) {
    grid.innerHTML = serviceCards(rows);
    bindActions();
  }
}

async function createOrder(serviceId) {
  if (!sessionStorage.getItem("kayjob.session")) {
    openModal("auth");
    return;
  }
  const service = state.services.find((item) => item.id === serviceId);
  if (!service) return;
  if (apiBase && Number.isInteger(service.apiId)) {
    try {
      const order = await apiFetch("/api/orders", { method: "POST", body: JSON.stringify({ serviceId: service.apiId, amountTotal: Number(service.price) }) });
      const payment = await apiFetch(`/api/orders/${order.id}/pay`, { method: "POST", body: JSON.stringify({}) });
      await syncRemote();
      if (payment?.checkoutUrl) location.href = payment.checkoutUrl;
      else {
        alert(`Paiement créé. Référence : ${payment.reference || order.id}`);
        location.hash = "orders";
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Commande impossible");
    }
    return;
  }
  alert("Ce service n'est pas synchronisé avec la base de données.");
}

function addOffer(id) {
  if (!sessionStorage.getItem("kayjob.session")) {
    openModal("auth");
    return;
  }
  const mission = state.missions.find((item) => item.id === id);
  if (!mission) return;
  if (apiBase && Number.isInteger(mission.apiId)) {
    return apiFetch(`/api/missions/${mission.apiId}/offers`, { method: "POST", body: JSON.stringify({ amountXof: Number(mission.budget), deliveryDays: 3, message: "Je peux réaliser cette mission avec un suivi clair." }) }).then(() => syncRemote()).catch((error) => alert(error.message));
  }
  alert("Cette mission n'est pas synchronisée avec la base de données.");
}

function updateOrder(id, status) {
  const order = state.orders.find((item) => item.id === id);
  const orderId = getApiOrderId(order);
  if (!orderId || status !== "completed_released") return alert("Cette action doit passer par une commande synchronisée.");
  apiFetch(`/api/orders/${orderId}/validate`, { method: "POST", body: JSON.stringify({}) }).then(syncRemote).catch((error) => alert(error.message));
}

function openDispute(id) {
  const order = state.orders.find((item) => item.id === id);
  const orderId = getApiOrderId(order);
  if (!orderId) return alert("Cette commande n'est pas synchronisée avec la base de données.");
  apiFetch(`/api/orders/${orderId}/dispute`, { method: "POST", body: JSON.stringify({ reason: "Litige ouvert depuis le tableau de bord." }) }).then(syncRemote).catch((error) => alert(error.message));
}

async function adminVerifyUser(userId, action) {
  if (!userId || userId === "undefined") return alert("Utilisateur introuvable.");
  try {
    await apiFetch(`/api/admin/users/${userId}/${action}`, { method: "POST", body: JSON.stringify({}) });
    await syncRemote();
  } catch (error) {
    alert(error instanceof Error ? error.message : "Action admin impossible");
  }
}

async function adminReleaseOrder(id) {
  const order = state.orders.find((item) => item.id === id);
  const orderId = getApiOrderId(order);
  if (!orderId) return alert("Commande API introuvable.");
  try {
    await apiFetch(`/api/admin/orders/${orderId}/release`, { method: "POST", body: JSON.stringify({}) });
    await syncRemote();
  } catch (error) {
    alert(error instanceof Error ? error.message : "Libération impossible");
  }
}

async function adminDisputeOrder(id) {
  const order = state.orders.find((item) => item.id === id);
  const orderId = getApiOrderId(order);
  if (!orderId) return alert("Commande API introuvable.");
  try {
    await apiFetch(`/api/admin/orders/${orderId}/dispute`, { method: "POST", body: JSON.stringify({ reason: "Blocage administratif depuis le back-office." }) });
    await syncRemote();
  } catch (error) {
    alert(error instanceof Error ? error.message : "Blocage impossible");
  }
}

async function adminResolveDispute(disputeId) {
  const winner = prompt("Gagnant du litige : client ou provider ?", "client");
  if (!["client", "provider"].includes(String(winner || "").trim())) return;
  try {
    await apiFetch(`/api/admin/disputes/${disputeId}/resolve`, { method: "POST", body: JSON.stringify({ winner: String(winner).trim() }) });
    await syncRemote();
  } catch (error) {
    alert(error instanceof Error ? error.message : "Résolution impossible");
  }
}

async function sendMessage(event) {
  event.preventDefault();
  const submitter = event.submitter;
  const input = document.querySelector("#messageText");
  const value = input?.value.trim();
  if (!value) return;
  const order = state.orders.find((item) => item.id === state.selectedOrderId) || state.orders[0];
  const thread = (state.messages || []).find((item) => item.orderId === state.selectedOrderId) || {
    orderId: state.selectedOrderId,
    peer: "Prestataire",
    role: "Partenaire",
    online: true,
    items: []
  };
  const message = {
    id: `m-${Date.now()}`,
    me: true,
    text: value,
    time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    status: "Vu",
    attachment: value.startsWith("Pièce jointe :")
  };
  if (apiBase && sessionStorage.getItem("kayjob.session") && order) {
    try {
      await withBusyButton(submitter, "Envoi...", async () => {
        const apiOrderId = getApiOrderId(order);
        const payload = { body: message.attachment ? value.replace("Pièce jointe : ", "") : value, attachmentUrl: message.attachment ? "https://storage.kayjob.sn/preuves/preuve-livraison.pdf" : null };
        if (apiOrderId) await apiFetch(`/api/orders/${apiOrderId}/messages`, { method: "POST", body: JSON.stringify(payload) });
      });
      if (!thread.items) thread.items = [];
      thread.items.push(message);
      if (!state.messages.some((item) => item.orderId === state.selectedOrderId)) state.messages.push(thread);
      input.value = "";
      save();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Message non envoyé");
    }
  }
  render();
}

modalForm.addEventListener("submit", async (event) => {
  const action = event.submitter?.value;
  if (action === "cancel") {
    event.preventDefault();
    modal.close();
    return;
  }
  if (!sessionStorage.getItem("kayjob.session") && ["service", "mission", "work"].includes(action)) {
    event.preventDefault();
    alert("Tu dois être connecté pour publier ou modifier du contenu.");
    modal.close();
    openModal("auth");
    return;
  }
  if (action === "auth-login" || action === "auth-signup") {
    event.preventDefault();
    const data = new FormData(modalForm);
    const accountEmail = String(data.get("accountEmail") || "").trim();
    const password = String(data.get("accountPassword") || "").trim();
    const mode = action === "auth-signup" ? "signup" : "login";
    const payload = { accountEmail, password };
    if (!payload.accountEmail || !payload.password) return alert("Email/phone et mot de passe requis.");
    loginWithPassword(payload.accountEmail, payload.password, mode, String(data.get("fullName") || "")).then((success) => {
      if (!success) return;
      modal.close();
      syncRemote();
      toggleAppVisibility(true);
      location.hash = "dashboard";
    }).catch((error) => alert(error.message));
    return;
  }
  if (!["service", "mission", "work"].includes(action)) return;
  const data = new FormData(modalForm);
  if (action === "service") {
    try {
      await apiFetch("/api/me/services", { method: "POST", body: JSON.stringify({ title: String(data.get("title") || ""), description: String(data.get("description") || data.get("title") || ""), category: String(data.get("category") || ""), price: Number(data.get("price")), deliveryMode: "remote", deliveryDays: 3 }) });
      modal.close();
      await syncRemote();
      location.hash = "portfolio";
      return;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Publication impossible");
      return;
    }
  }
  if (action === "mission") {
    try {
      await apiFetch("/api/missions", { method: "POST", body: JSON.stringify({ title: String(data.get("title") || ""), description: String(data.get("description") || data.get("title") || ""), cityId: null, categoryId: null, budgetMax: Number(data.get("budget")), deliveryMode: "remote" }) });
      modal.close();
      await syncRemote();
      location.hash = "missions";
      return;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Publication impossible");
      return;
    }
  }
  if (action === "work") {
    if (!isViewingOwnProfile()) {
      alert("Tu ne peux modifier que ton propre portfolio.");
      modal.close();
      return;
    }
    const profile = getViewingProfile();
    if (!profile) {
      alert("Aucun profil à modifier.");
      modal.close();
      return;
    }
    try {
      await apiFetch("/api/me/portfolio", { method: "POST", body: JSON.stringify({ title: String(data.get("title") || ""), description: String(data.get("description") || ""), externalUrl: String(data.get("url") || ""), itemType: "link" }) });
      modal.close();
      await syncRemote();
      return;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Ajout impossible");
      return;
    }
  }
  save();
  render();
});

document.querySelector("#quickMission").addEventListener("click", () => {
  if (!ensureLoggedInForAction("auth")) return;
  openModal("mission");
});

document.querySelector("#showLogin")?.addEventListener("click", () => openAuth("login"));
document.querySelector("#showSignup")?.addEventListener("click", () => openAuth("signup"));
document.querySelector("#ctaCreateAccount")?.addEventListener("click", () => openAuth("signup"));
document.querySelector("#ctaBrowse")?.addEventListener("click", () => { toggleAppVisibility(true); location.hash = "discover"; });
document.querySelector("#footerSignUp")?.addEventListener("click", () => openAuth("signup"));
document.querySelector("#closeAuth")?.addEventListener("click", closeAuth);
authTabs.forEach((tab) => tab.addEventListener("click", () => setAuthMode(tab.dataset.authMode)));
authForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(authForm);
  const contact = String(formData.get("accountEmail") || "").trim();
  const password = String(formData.get("accountPassword") || "").trim();
  const fullName = String(formData.get("fullName") || "").trim();
  if (!contact || !password) {
    authStatus.textContent = "Email/phone et mot de passe requis.";
    return;
  }
  try {
    const mode = authForm.dataset.mode || "login";
    const success = await loginWithPassword(contact, password, mode, fullName);
    if (!success) throw new Error("Impossible de créer ou d’authentifier le compte.");
    closeAuth();
    toggleAppVisibility(true);
    location.hash = "dashboard";
    authStatus.textContent = "";
    await syncRemote();
  } catch (error) {
    authStatus.textContent = error instanceof Error ? error.message : "Authentication impossible";
  }
});

window.addEventListener("hashchange", () => {
  const hasSession = Boolean(sessionStorage.getItem("kayjob.session"));
  if (hasSession && landingPage && !landingPage.classList.contains("hidden")) toggleAppVisibility(true);
  render();
});

if (sessionStorage.getItem("kayjob.session")) {
  toggleAppVisibility(true);
} else {
  toggleAppVisibility(false);
}
render();
syncRemote();
