const storageKey = "kayjob.webapp.state";
const apiBase = String(window.KAYJOB_API_URL || "").replace(/\/$/, "");
const categories = ["Informatique", "Design", "Média", "Éducation", "Digital", "Créatif", "Services physiques"];
const cities = ["Dakar", "Thiès", "Saint-Louis", "Ziguinchor", "Kaolack", "Touba", "Mbour", "Diourbel"];
const demoAdminAccounts = ["admin@kayjob.sn", "admin", "+221770000000"];

const demoProfiles = [
  { id: "srv-1", name: "Awa Diop", pseudo: "awadesign", city: "Kaolack", category: "Design", title: "Logo et identité visuelle", price: 5000, mode: "remote", score: 92, image: "././assets/portfolio-logo.svg" },
  { id: "srv-2", name: "Mamadou Fall", pseudo: "mfallcode", city: "Dakar", category: "Informatique", title: "Site vitrine React", price: 15000, mode: "remote", score: 89, image: "././assets/portfolio-web.svg" },
  { id: "srv-3", name: "Fatou Ndiaye", pseudo: "fatoulearn", city: "Saint-Louis", category: "Éducation", title: "Cours particuliers et correction", price: 3000, mode: "both", score: 86, image: "././assets/portfolio-course.svg" },
  { id: "srv-4", name: "Cheikh Bâ", pseudo: "cheikhfix", city: "Thiès", category: "Services physiques", title: "Réparation PC et réseau", price: 7000, mode: "onsite", score: 82, image: "././assets/portfolio-repair.svg" },
  { id: "srv-5", name: "Mariama Sarr", pseudo: "mariamacm", city: "Ziguinchor", category: "Digital", title: "Gestion Instagram et contenu", price: 10000, mode: "remote", score: 94, image: "././assets/portfolio-social.svg" },
  { id: "srv-6", name: "Ibrahima Sy", pseudo: "ibrahimacam", city: "Mbour", category: "Média", title: "Photo événementielle et retouche", price: 12000, mode: "both", score: 88, image: "././assets/portfolio-photo.svg" },
  { id: "srv-7", name: "Ndeye Mbaye", pseudo: "ndeyevideo", city: "Dakar", category: "Média", title: "Montage vidéo et reels TikTok", price: 9000, mode: "remote", score: 91, image: "././assets/portfolio-video.svg" },
  { id: "srv-8", name: "Ousmane Sane", pseudo: "ousmanedev", city: "Louga", category: "Informatique", title: "Maintenance WordPress & SEO", price: 6000, mode: "both", score: 87, image: "././assets/portfolio-web.svg" }
];

const seed = {
  services: demoProfiles.map((profile) => talent(profile.id, profile.name, profile.pseudo, profile.city, profile.category, profile.title, profile.price, profile.mode, profile.score, profile.image)),
  missions: [
    { id: "mis-1", title: "Filmer une cérémonie locale", city: "Kaolack", category: "Média", budget: 18000, mode: "onsite", offers: 4 },
    { id: "mis-2", title: "Créer une affiche de conférence", city: "Touba", category: "Design", budget: 6000, mode: "remote", offers: 9 },
    { id: "mis-3", title: "Corriger un mémoire de licence", city: "Dakar", category: "Éducation", budget: 10000, mode: "remote", offers: 6 },
    { id: "mis-4", title: "Créer des storys pour lancement produit", city: "Thiès", category: "Digital", budget: 8000, mode: "remote", offers: 3 },
    { id: "mis-5", title: "Installer réseau et maintenance informatique", city: "Saint-Louis", category: "Services physiques", budget: 15000, mode: "onsite", offers: 5 }
  ],
  orders: [
    { id: "ord-1", serviceId: "srv-2", status: "escrowed", gross: 15000, commission: 1500, net: 13500 },
    { id: "ord-2", serviceId: "srv-1", status: "delivered", gross: 5000, commission: 500, net: 4500 },
    { id: "ord-3", serviceId: "srv-5", status: "paid_out", gross: 10000, commission: 1000, net: 9000 },
    { id: "ord-4", serviceId: "srv-6", status: "in_progress", gross: 12000, commission: 1200, net: 10800 }
  ],
  messages: [
    {
      orderId: "ord-1",
      peer: "Mamadou Fall",
      role: "Développeur web",
      online: true,
      items: [
        { id: "m-1", me: false, text: "Bonjour, je peux livrer une première version demain.", time: "09:12" },
        { id: "m-2", me: true, text: "Parfait, j'envoie le brief et les couleurs.", time: "09:14" },
        { id: "m-3", me: false, text: "Très bien, je mets aussi le formulaire de contact.", time: "09:16" }
      ]
    },
    {
      orderId: "ord-2",
      peer: "Awa Diop",
      role: "Designer",
      online: false,
      items: [
        { id: "m-4", me: false, text: "Le logo a été livré en formats SVG et PNG.", time: "Hier" },
        { id: "m-5", me: true, text: "Merci, j’ai validé la version finale.", time: "Hier" }
      ]
    },
    {
      orderId: "ord-3",
      peer: "Mariama Sarr",
      role: "Community manager",
      online: true,
      items: [
        { id: "m-6", me: false, text: "Les storys du lancement sont publiées ce soir.", time: "Lun" },
        { id: "m-7", me: true, text: "Très bien, je te réévalue dans 48h.", time: "Lun" }
      ]
    }
  ],
  notifications: [
    "Paiement escrow confirmé.",
    "Nouvelle proposition reçue sur une mission Design.",
    "Document de profil à valider.",
    "Nouvelle commande validée pour un profil média.",
    "Un litige a été signalé en attente de traitement."
  ],
  disputes: [{ id: "lit-1", orderId: "ord-4", status: "open" }],
  selectedOrderId: "ord-1"
};

let state = load();
const view = document.querySelector("#view");
const modal = document.querySelector("#modal");
const modalForm = document.querySelector("#modalForm");

function safeSeed() {
  return structuredClone(seed);
}

async function apiFetch(path, options = {}) {
  const headers = { "content-type": "application/json", ...(options.headers || {}) };
  const token = sessionStorage.getItem("kayjob.session");
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`${apiBase}${path}`, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "API indisponible");
  return body.data;
}

async function syncRemote() {
  if (!apiBase) return;
  try {
    const services = await apiFetch("/api/services");
    if (Array.isArray(services) && services.length) {
      state.services = services.map((row) => ({ ...talent(row.id, row.full_name, row.pseudo || "talent", row.city || "Sénégal", row.category || "Compétence", row.title, Number(row.starting_price), row.delivery_mode || "remote", Number(row.sama_score || 0), "./assets/portfolio-web.svg"), avatar: row.avatar_url }));
    }
    const missions = await apiFetch("/api/missions");
    if (Array.isArray(missions)) {
      state.missions = missions.map((row) => ({ id: row.id, title: row.title, city: row.city || "Sénégal", category: row.category || "Mission", budget: Number(row.budget_max), mode: row.delivery_mode || "remote", offers: 0 }));
    }
    if (sessionStorage.getItem("kayjob.session")) {
      const orders = await apiFetch("/api/me/orders");
      state.orders = Array.isArray(orders) ? orders.map((row) => ({ id: `KJ-${row.id}`, apiId: row.id, title: row.title, status: row.status, gross: Number(row.amount_total), net: Number(row.amount_net_provider) })) : [];
    }
    state.remote = true;
    save();
    render();
  } catch (error) {
    state.remote = false;
    state = { ...safeSeed(), ...state, notifications: [...(state.notifications || []), "Le backend est indisponible, le mode démonstration reste actif."], disputes: state.disputes || [] };
    console.warn("KayJob API offline, mode démo activé", error.message);
    save();
    render();
  }
}

function talent(id, name, pseudo, city, category, title, price, mode, score, image) {
  return {
    id, name, pseudo, city, category, title, price, mode, score, rating: 4.8,
    skills: [category, mode === "onsite" ? "Présentiel" : "Remote"],
    works: [
      { title: "Réalisation client", type: "Image", image, url: "https://kayjob.sn/portfolio", description: "Mission validée avec livrables et avis." },
      { title: "Lien portfolio", type: "Lien", image, url: "https://kayjob.sn/projets", description: "Projet externe visible par les recruteurs." }
    ]
  };
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return saved || safeSeed();
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

function mode(modeValue) {
  return { remote: "À distance", onsite: "Sur place", both: "Les deux" }[modeValue];
}

function orderStatus(status) {
  return { awaiting_payment: "Paiement attendu", escrowed: "Paiement bloqué", in_progress: "En cours", preview_delivered: "Aperçu livré", final_delivered: "Livré", client_review: "À valider", completed_released: "Payé", delivered: "Livré", paid_out: "Payé", disputed: "Litige", dispute_opened: "Litige" }[status] || status;
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

function isUserAdmin() {
  const userJson = sessionStorage.getItem("kayjob.user");
  if (!userJson) return false;
  try {
    const user = JSON.parse(userJson);
    return user.role === "admin" || user.isAdmin === true || (user.email === "admin@kayjob.sn" || user.phone === "+221770000000");
  } catch { return false; }
}

function render() {
  const route = currentRoute();
  if (route === "admin" && !isUserAdmin()) {
    location.hash = "dashboard";
    return;
  }
  setTitle(route);
  const pages = { dashboard, discover, missions, orders, messages, portfolio, admin, login };
  view.innerHTML = (pages[route] || dashboard)();
  bindActions();
  const authButton = document.querySelector("#authButton");
  if (authButton) authButton.textContent = sessionStorage.getItem("kayjob.session") ? "Session active" : "Se connecter";
}

function dashboard() {
  const gmv = state.orders.reduce((sum, order) => sum + order.gross, 0);
  return `
    <section class="grid four">
      ${metric(state.services.length, "Prestataires", "profils actifs")}
      ${metric(state.missions.length, "Missions", "besoins ouverts")}
      ${metric(money(gmv), "GMV", "commandes simulées")}
      ${metric(state.disputes.length, "Litiges", "à arbitrer")}
    </section>
    <section class="split" style="margin-top:16px">
      <div class="panel">
        <h2>Commandes récentes</h2>
        <div class="list">${state.orders.map(orderRow).join("")}</div>
      </div>
      <div class="panel">
        <h2>Actions rapides</h2>
        <div class="actions">
          <button class="primary" data-modal="service">Publier un service</button>
          <button class="secondary" data-modal="mission">Publier une mission</button>
          <button class="secondary" data-route-to="portfolio">Voir portfolio</button>
        </div>
      </div>
    </section>`;
}

function metric(value, label, detail) {
  return `<article class="metric"><strong>${value}</strong><h3>${label}</h3><p class="meta">${detail}</p></article>`;
}

function login() {
  return `<section class="split"><div class="panel"><p class="eyebrow">Espace sécurisé</p><h2>Connecte-toi à KayJob</h2><p class="meta">Un code OTP sera envoyé par téléphone ou email.</p><form id="loginForm" class="modal-card" style="width:auto;padding:0;box-shadow:none"><label>Téléphone ou email<input name="destination" required placeholder="+221 77 000 00 00" /></label><label>Code OTP<input name="code" inputmode="numeric" placeholder="Après l’envoi du code" /></label><div class="actions"><button class="secondary" value="request">Recevoir le code</button><button class="primary" value="verify">Se connecter</button></div><p id="loginStatus" class="meta" aria-live="polite"></p></form></div><aside class="panel"><h2>Une seule identité</h2><p class="meta">Commande comme client, propose tes compétences et retrouve ton portfolio avec le même compte.</p><span class="badge">Paiement protégé</span></aside></section>`;
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
  return rows.map((item) => `
    <article class="card service-card">
      <div class="card-head"><div class="avatar" style="${item.avatar ? `background-image:url('${item.avatar}');background-size:cover` : ""}">${item.avatar ? "" : item.name.split(" ").map((p) => p[0]).join("")}</div><div><h3>${item.title}</h3><p class="meta">${item.name} · ${item.city}</p></div></div>
      <div class="row"><span class="badge">${mode(item.mode)}</span><span class="badge yellow">SamaScore ${item.score}/100</span></div>
      <p>${item.skills.join(" · ")}</p>
      <strong>${money(item.price)}</strong>
      <div class="actions"><button class="secondary" data-profile="${item.id}">Portfolio</button><button class="primary" data-order="${item.id}">Commander</button></div>
    </article>`).join("");
}

function missions() {
  return `
    <div class="actions" style="margin-bottom:16px"><button class="primary" data-modal="mission">Publier une mission</button></div>
    <section class="list">${state.missions.map((item) => `
      <article class="list-item">
        <div><h3>${item.title}</h3><p class="meta">${item.city} · ${item.category} · ${mode(item.mode)} · ${item.offers} devis</p></div>
        <div class="actions"><strong>${money(item.budget)}</strong><button class="secondary" data-offer="${item.id}">Faire un devis</button></div>
      </article>`).join("")}</section>`;
}

function orders() {
  return `<section class="list">${state.orders.map(orderRow).join("")}</section>`;
}

function orderRow(order) {
  const item = state.services.find((service) => service.id === order.serviceId);
  const adminButtons = isUserAdmin() ? `<button class="primary" data-paid="${order.id}">Valider</button><button class="danger" data-dispute="${order.id}">Litige</button>` : "";
  return `<article class="list-item"><div><h3>${order.id} · ${item?.title || order.title || "Commande KayJob"}</h3><p class="meta">${money(order.gross ?? order.amount_total ?? 0)} · ${orderStatus(order.status)}</p></div><div class="actions"><button class="secondary" data-select-order="${order.id}">Messages</button>${adminButtons}</div></article>`;
}

function messages() {
  const order = state.orders.find((item) => item.id === state.selectedOrderId) || state.orders[0];
  if (!order) return `<section class="panel"><h2>Messages</h2><p class="meta">Connecte-toi et ouvre une commande pour démarrer une conversation.</p></section>`;
  state.selectedOrderId = order.id;
  const conversation = (state.messages || []).find((thread) => thread.orderId === order.id) || (state.messages || [])[0] || { orderId: order.id, peer: "Prestataire", role: "Partenaire", online: true, items: [] };
  const service = state.services.find((item) => item.id === order.serviceId) || state.services[0];
  const rows = conversation.items || [];
  return `
    <section class="chat-shell">
      <aside class="chat-list">
        <div class="chat-list-header">
          <h2>Conversations</h2>
          <button class="secondary" type="button">Nouveau</button>
        </div>
        ${(state.messages || []).map((thread) => {
          const active = thread.orderId === order.id ? "active" : "";
          const last = thread.items[thread.items.length - 1];
          return `<button class="chat-thread ${active}" type="button" data-select-order="${thread.orderId}">
            <div class="avatar chat-avatar">${(thread.peer || "P").split(" ").map((part) => part[0]).slice(0,2).join("").toUpperCase()}</div>
            <div class="chat-thread-body">
              <div class="chat-thread-head"><strong>${thread.peer}</strong><span>${last ? last.time : "maintenant"}</span></div>
              <div class="chat-thread-meta"><span>${thread.role}</span><span class="status-pill ${thread.online ? "online" : "offline"}"></span></div>
              <p>${last ? last.text : "Commencez la discussion"}</p>
            </div>
          </button>`;
        }).join("")}
      </aside>
      <section class="chat-pane">
        <header class="chat-header">
          <div class="chat-header-user">
            <div class="avatar chat-avatar large">${(conversation.peer || service?.name || "P").split(" ").map((part) => part[0]).slice(0,2).join("").toUpperCase()}</div>
            <div>
              <h3>${conversation.peer || service?.name || "Prestataire"}</h3>
              <p>${conversation.online ? "En ligne" : "Dernière activité il y a 10 min"}</p>
            </div>
          </div>
          <div class="chat-header-actions">
            <button class="secondary" type="button">Appel</button>
            <button class="secondary" type="button">Vidéos</button>
            <button class="primary" type="button">Commande</button>
          </div>
        </header>

        <div class="chat-messages">
          ${rows.map((message) => `<div class="chat-message ${message.me ? "me" : "them"}">
            <div class="bubble-wrap">
              ${message.attachment ? `<div class="bubble-doc">📎 ${message.text.replace("Pièce jointe : ", "")}</div>` : `<div class="bubble-text">${message.text}</div>`}
              <div class="bubble-meta"><span>${message.time}</span>${message.me ? `<span>${message.status || "Vu"}</span>` : ''}</div>
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
  const profile = state.services[0];
  if (!profile) return `<section class="panel"><h2>Portfolio</h2><p class="meta">Aucun profil prestataire disponible pour le moment.</p></section>`;
  return `
    <section class="split">
      <aside class="panel"><h2>kayjob.sn/${profile.pseudo}</h2><p>${profile.name} · ${profile.city}</p><span class="badge yellow">SamaScore ${profile.score}/100</span><div class="actions" style="margin-top:14px"><button class="primary" data-modal="work">Ajouter une réalisation</button></div></aside>
      <div class="work-grid">${profile.works.map((work) => `<article class="work-card"><img src="${work.image}" alt="" /><div><span class="badge ${work.type === "Lien" ? "blue" : ""}">${work.type}</span><h3>${work.title}</h3><p class="meta">${work.description}</p><a class="primary" href="${work.url}" target="_blank" rel="noreferrer">Ouvrir</a></div></article>`).join("")}</div>
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
        <div class="list">${pendingVerifs.map((service) => `
          <article class="list-item">
            <div><h3>${service.name}</h3><p class="meta">${service.pseudo} · ${service.city}</p></div>
            <div class="actions"><button class="secondary" data-verify="${service.id}">Valider</button><button class="danger" data-reject="${service.id}">Rejeter</button></div>
          </article>`).join("")}</div>
      </div>
      
      <div class="panel">
        <h2>Escrow en attente</h2>
        <div class="list">${escrowedOrders.map((order) => {
          const service = state.services.find((s) => s.id === order.serviceId);
          return `<article class="list-item">
            <div><h3>${order.id}</h3><p class="meta">${money(order.gross)} · ${service?.title || "Commande"}</p></div>
            <div class="actions"><button class="primary" data-release="${order.id}">Libérer</button><button class="danger" data-hold="${order.id}">Bloquer</button></div>
          </article>`;
        }).join("")}</div>
      </div>
    </section>
    
    <div class="panel" style="margin-top:16px">
      <h2>Litiges ouverts</h2>
      <div class="list">${pendingLitiges.map((litige) => `
        <article class="list-item">
          <div><h3>Litige ${litige.id}</h3><p class="meta">Commande ${litige.orderId} · Statut : ${litige.status}</p></div>
          <div class="actions"><button class="secondary" data-review="${litige.id}">Examiner</button><button class="primary" data-resolve="${litige.id}">Résoudre</button></div>
        </article>`).join("")}</div>
    </div>`;
}

function option(item) {
  return `<option>${item}</option>`;
}

function openModal(type) {
  const forms = {
    auth: `<h2>Connexion KayJob</h2><p class="meta">Reçois un code OTP par téléphone ou email.</p><label>Téléphone ou email<input name="destination" required placeholder="+221 77 000 00 00" /></label><label>Code OTP<input name="code" inputmode="numeric" placeholder="À remplir après l'envoi" /></label><div class="actions"><button class="secondary" value="cancel">Annuler</button><button class="secondary" value="auth-request">Recevoir le code</button><button class="primary" value="auth-verify">Se connecter</button></div>`,
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
  document.querySelector("#authButton")?.addEventListener("click", () => { location.hash = "login"; });
  document.querySelectorAll("[data-route-to]").forEach((button) => button.addEventListener("click", () => { location.hash = button.dataset.routeTo; }));
  document.querySelectorAll("[data-modal]").forEach((button) => button.addEventListener("click", () => openModal(button.dataset.modal)));
  document.querySelectorAll("[data-order]").forEach((button) => button.addEventListener("click", () => createOrder(button.dataset.order)));
  document.querySelectorAll("[data-offer]").forEach((button) => button.addEventListener("click", () => addOffer(button.dataset.offer)));
  document.querySelectorAll("[data-paid]").forEach((button) => button.addEventListener("click", () => updateOrder(button.dataset.paid, "paid_out")));
  document.querySelectorAll("[data-dispute]").forEach((button) => button.addEventListener("click", () => openDispute(button.dataset.dispute)));
  document.querySelectorAll("[data-verify]").forEach((button) => button.addEventListener("click", () => { alert(`Profil ${button.dataset.verify} vérifié et activé.`); state.notifications.unshift(`Vérification acceptée pour ${button.dataset.verify}`); save(); render(); }));
  document.querySelectorAll("[data-reject]").forEach((button) => button.addEventListener("click", () => { alert(`Profil ${button.dataset.reject} rejeté. Notification envoyée.`); state.notifications.unshift(`Vérification rejetée pour ${button.dataset.reject}`); save(); render(); }));
  document.querySelectorAll("[data-release]").forEach((button) => button.addEventListener("click", () => { const order = state.orders.find((o) => o.id === button.dataset.release); if (order) { order.status = "paid_out"; state.notifications.unshift(`Paiement libéré : ${button.dataset.release}`); save(); render(); } }));
  document.querySelectorAll("[data-hold]").forEach((button) => button.addEventListener("click", () => { const order = state.orders.find((o) => o.id === button.dataset.hold); if (order) { order.status = "disputed"; state.notifications.unshift(`Escrow bloqué : ${button.dataset.hold}`); save(); render(); } }));
  document.querySelectorAll("[data-review]").forEach((button) => button.addEventListener("click", () => alert(`Examen du litige ${button.dataset.review} - collecte des preuves en cours.`)));
  document.querySelectorAll("[data-resolve]").forEach((button) => button.addEventListener("click", () => { const litige = state.disputes.find((l) => l.id === button.dataset.resolve); if (litige) { litige.status = "resolved"; state.notifications.unshift(`Litige ${button.dataset.resolve} résolu`); save(); render(); } }));
  document.querySelectorAll("[data-select-order]").forEach((button) => button.addEventListener("click", () => { state.selectedOrderId = button.dataset.selectOrder; save(); location.hash = "messages"; }));
  document.querySelectorAll("[data-profile]").forEach((button) => button.addEventListener("click", () => { state.services.unshift(...state.services.splice(state.services.findIndex((item) => item.id === button.dataset.profile), 1)); save(); location.hash = "portfolio"; }));
  document.querySelectorAll("[data-quick-reply]").forEach((button) => button.addEventListener("click", () => {
    const input = document.querySelector("#messageText");
    if (input) input.value = button.dataset.quickReply;
    input?.focus();
  }));
  document.querySelectorAll("[data-attach]").forEach((button) => button.addEventListener("click", () => {
    const input = document.querySelector("#messageText");
    if (input) {
      input.value = "Pièce jointe : preuve-livraison.pdf";
      input.focus();
    }
  }));
  const q = document.querySelector("#q");
  if (q) ["input", "change"].forEach((eventName) => document.querySelectorAll("#q,#cat,#city,#budget").forEach((field) => field.addEventListener(eventName, filterDiscover)));
  const form = document.querySelector("#messageForm");
  if (form) form.addEventListener("submit", sendMessage);
  const loginForm = document.querySelector("#loginForm");
  if (loginForm) loginForm.addEventListener("submit", handleLogin);
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const destination = String(data.get("destination") || "").trim();
  const status = document.querySelector("#loginStatus");
  try {
    if (event.submitter?.value === "request") {
      const result = await apiFetch("/api/auth/request-otp", { method: "POST", body: JSON.stringify(destination.includes("@") ? { email: destination } : { phone: destination }) });
      if (result.devCode) form.querySelector('[name="code"]').value = result.devCode;
      status.textContent = result.devCode ? `Code de test : ${result.devCode}` : "Code envoyé. Vérifie ton téléphone ou ton email.";
      return;
    }
    const result = await apiFetch("/api/auth/verify-otp", { method: "POST", body: JSON.stringify(destination.includes("@") ? { email: destination, code: String(data.get("code") || "") } : { phone: destination, code: String(data.get("code") || "") }) });
    sessionStorage.setItem("kayjob.session", result.token);
    status.textContent = "Connexion réussie.";
    await syncRemote();
    location.hash = "dashboard";
  } catch (error) { status.textContent = error instanceof Error ? error.message : "Connexion impossible"; }
}

function filterDiscover() {
  const q = document.querySelector("#q").value.toLowerCase();
  const cat = document.querySelector("#cat").value;
  const city = document.querySelector("#city").value;
  const budget = Number(document.querySelector("#budget").value || Infinity);
  const rows = state.services
    .filter((item) => cat === "Toutes" || item.category === cat)
    .filter((item) => city === "Toutes" || item.mode === "remote" || item.city === city)
    .filter((item) => item.price <= budget)
    .filter((item) => !q || `${item.title} ${item.name} ${item.skills.join(" ")}`.toLowerCase().includes(q));
  document.querySelector("#serviceResults").innerHTML = serviceCards(rows);
  bindActions();
}

function createOrder(serviceId) {
  const service = state.services.find((item) => item.id === serviceId);
  if (apiBase) {
    if (!sessionStorage.getItem("kayjob.session")) return openModal("auth");
    apiFetch("/api/orders", { method: "POST", body: JSON.stringify({ serviceId: Number(serviceId), amountTotal: Number(service.price) }) }).then(() => syncRemote()).then(() => { location.hash = "orders"; }).catch((error) => alert(error.message));
    return;
  }
  const commission = Math.max(250, Math.round(service.price * .1));
  const order = { id: `ord-${Date.now()}`, serviceId, status: "escrowed", gross: service.price, commission, net: service.price - commission };
  state.orders.unshift(order);
  state.selectedOrderId = order.id;
  state.notifications.unshift(`Commande créée : ${money(service.price)} placés en escrow.`);
  save();
  location.hash = "orders";
  render();
}

function addOffer(id) {
  const mission = state.missions.find((item) => item.id === id);
  if (apiBase) {
    if (!sessionStorage.getItem("kayjob.session")) return openModal("auth");
    return apiFetch(`/api/missions/${Number(id)}/offers`, { method: "POST", body: JSON.stringify({ amountXof: Number(mission.budget), deliveryDays: 3, message: "Je peux réaliser cette mission avec un suivi clair." }) }).then(() => syncRemote()).catch((error) => alert(error.message));
  }
  mission.offers += 1;
  state.notifications.unshift(`Devis ajouté sur ${mission.title}.`);
  save();
  render();
}

function updateOrder(id, status) {
  state.orders.find((item) => item.id === id).status = status;
  state.notifications.unshift(`Commande ${id} mise à jour : ${orderStatus(status)}.`);
  save();
  render();
}

function openDispute(id) {
  state.disputes.unshift({ id: `lit-${Date.now()}`, orderId: id, status: "open" });
  updateOrder(id, "disputed");
}

async function sendMessage(event) {
  event.preventDefault();
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
  if (!thread.items) thread.items = [];
  thread.items.push(message);
  if (!state.messages.some((item) => item.orderId === state.selectedOrderId)) state.messages.push(thread);
  input.value = "";
  save();
  if (apiBase && sessionStorage.getItem("kayjob.session") && order) {
    try {
      const apiOrderId = Number(order.apiId || state.selectedOrderId.replace(/\D+/g, "") || 0);
      const payload = { body: message.attachment ? value.replace("Pièce jointe : ", "") : value, attachmentUrl: message.attachment ? "https://storage.kayjob.sn/preuves/preuve-livraison.pdf" : null };
      if (apiOrderId) await apiFetch(`/api/orders/${apiOrderId}/messages`, { method: "POST", body: JSON.stringify(payload) });
    } catch (error) {
      console.warn("Message API non synchronisé", error.message);
    }
  }
  render();
}

modalForm.addEventListener("submit", (event) => {
  const action = event.submitter?.value;
  if (action === "cancel") {
    event.preventDefault();
    modal.close();
    return;
  }
  if (action === "auth-request" || action === "auth-verify") {
    event.preventDefault();
    const data = new FormData(modalForm);
    const destination = String(data.get("destination") || "").trim();
    const code = String(data.get("code") || "").trim();
    const request = action === "auth-request" ? apiFetch("/api/auth/request-otp", { method: "POST", body: JSON.stringify(destination.includes("@") ? { email: destination } : { phone: destination }) }).then((result) => { if (result.devCode) modalForm.querySelector('[name="code"]').value = result.devCode; alert(result.devCode ? `Code de test : ${result.devCode}` : "Code envoyé."); }) : apiFetch("/api/auth/verify-otp", { method: "POST", body: JSON.stringify(destination.includes("@") ? { email: destination, code } : { phone: destination, code }) }).then((result) => { sessionStorage.setItem("kayjob.session", result.token); modal.close(); return syncRemote(); });
    request.catch((error) => alert(error.message));
    return;
  }
  if (!["service", "mission", "work"].includes(action)) return;
  const data = new FormData(modalForm);
  if (action === "service") {
    state.services.unshift(talent(`srv-${Date.now()}`, "Nouveau talent", "nouveautalent", "Dakar", data.get("category"), data.get("title"), Number(data.get("price")), "remote", 72, "././assets/portfolio-web.svg"));
  }
  if (action === "mission") {
    state.missions.unshift({ id: `mis-${Date.now()}`, title: data.get("title"), city: data.get("city"), category: "Design", budget: Number(data.get("budget")), mode: "remote", offers: 0 });
  }
  if (action === "work") {
    state.services[0].works.unshift(makePortfolio(data.get("title"), "Lien", "././assets/portfolio-web.svg", data.get("url") || "https://kayjob.sn/projets", data.get("description")));
  }
  state.notifications.unshift("Action enregistrée dans KayJob.");
  save();
  render();
});

document.querySelector("#quickMission").addEventListener("click", () => openModal("mission"));
document.querySelector("#resetDemo").addEventListener("click", () => {
  localStorage.removeItem(storageKey);
  state = structuredClone(seed);
  render();
});
window.addEventListener("hashchange", render);
render();
syncRemote();
