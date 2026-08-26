const categories = ["Toutes", "Informatique", "Design", "Média", "Éducation", "Digital", "Créatif", "Services physiques"];
const cities = ["Toutes", "Dakar", "Thiès", "Saint-Louis", "Ziguinchor", "Kaolack", "Touba", "Mbour", "Diourbel", "Louga", "Tambacounda"];
const storageKey = "kayjob.v1.state";

function modeLabel(mode) {
  return { remote: "À distance", onsite: "Sur place", both: "Les deux" }[mode] || mode;
}

function makePortfolio(title, type, image, url, description) {
  return { title, type, image, url, description };
}

function makeService(id, name, pseudo, city, category, title, price, rating, score, mode, skills, image) {
  return {
    id,
    name,
    pseudo,
    city,
    category,
    title,
    price,
    rating,
    score,
    mode,
    skills,
    bio: `${name} propose des services ${modeLabel(mode).toLowerCase()} depuis ${city}, avec livraison suivie sur KayJob.`,
    portfolio: [
      makePortfolio("Réalisation image", "Image", image, "https://example.com/kayjob/realisation", `Aperçu d'un projet ${category.toLowerCase()} livré pour un client KayJob.`),
      makePortfolio("Lien de projet", "Lien", image, "https://example.com/kayjob/projet", "Lien externe vers une réalisation, un portfolio ou une livraison validée."),
      makePortfolio("Mission terminée", "Image", image, "https://example.com/kayjob/mission", "Preuve de mission terminée avec contexte, rôle et résultat obtenu.")
    ],
    reviews: ["Livraison rapide et propre.", "Bonne communication, résultat conforme au brief."]
  };
}

const defaultState = {
  activeTab: "client",
  selectedOrderId: "ord-1",
  services: [
    makeService("srv-1", "Awa Diop", "awadesign", "Kaolack", "Design", "Logo et identité visuelle pour PME", 5000, 4.9, 92, "remote", ["Logo", "Flyer", "CV"], "./assets/portfolio-logo.svg"),
    makeService("srv-2", "Mamadou Fall", "mfallcode", "Dakar", "Informatique", "Site vitrine React ou WordPress", 15000, 4.8, 89, "remote", ["Développement web", "WordPress", "SEO"], "./assets/portfolio-web.svg"),
    makeService("srv-3", "Fatou Ndiaye", "fatoulearn", "Saint-Louis", "Éducation", "Cours particuliers maths et rédaction", 3000, 4.7, 86, "both", ["Maths", "Correction", "Rédaction"], "./assets/portfolio-course.svg"),
    makeService("srv-4", "Cheikh Bâ", "cheikhfix", "Thiès", "Services physiques", "Réparation PC et installation réseau", 7000, 4.6, 82, "onsite", ["Réparation informatique", "Linux", "Réseau"], "./assets/portfolio-repair.svg"),
    makeService("srv-5", "Mariama Sarr", "mariamacm", "Ziguinchor", "Digital", "Gestion Instagram et création de contenu", 10000, 4.9, 94, "remote", ["Community management", "Publicité Meta", "Création de contenu"], "./assets/portfolio-social.svg"),
    makeService("srv-6", "Ibrahima Sy", "ibrahimacam", "Mbour", "Média", "Photo événementielle et retouche", 12000, 4.8, 88, "both", ["Photographie", "Retouche", "TikTok"], "./assets/portfolio-photo.svg")
  ],
  missions: [
    { id: "mis-1", title: "Filmer une cérémonie samedi", city: "Kaolack", budget: 18000, mode: "onsite", category: "Média", offers: 4 },
    { id: "mis-2", title: "Créer une affiche pour une conférence", city: "Touba", budget: 6000, mode: "remote", category: "Design", offers: 9 },
    { id: "mis-3", title: "Corriger un mémoire de licence", city: "Dakar", budget: 10000, mode: "remote", category: "Éducation", offers: 6 }
  ],
  orders: [
    { id: "ord-1", serviceId: "srv-2", status: "escrowed", gross: 15000, commission: 1500, net: 13500 },
    { id: "ord-2", serviceId: "srv-1", status: "delivered", gross: 5000, commission: 500, net: 4500 }
  ],
  messages: [
    { orderId: "ord-1", me: false, text: "Bonjour, je peux livrer en 48h avec deux propositions." },
    { orderId: "ord-1", me: true, text: "Parfait. Je paie la commande et j'envoie le brief." }
  ],
  notifications: [
    "Paiement Wave reçu et placé en séquestre.",
    "Mariama a répondu à une mission remote.",
    "Un nouveau document étudiant attend validation."
  ],
  disputes: []
};

let state = loadState();
let currentProfileId = null;

const ids = [
  "categoryFilter", "cityFilter", "modeFilter", "searchInput", "budgetFilter", "serviceGrid", "searchNote",
  "resetFilters", "missionBoard", "orderFlow", "selectedOrder", "messages", "messageForm", "messageInput",
  "adminGrid", "verificationQueue", "paymentQueue", "regionStats", "signupDialog", "portfolioDialog",
  "portfolioFormDialog", "portfolioForm", "portfolioFormTitle", "portfolioFormType", "portfolioFormUrl",
  "portfolioFormDescription", "openSignup", "profile", "serviceFormDialog", "serviceForm", "serviceTitle",
  "serviceCategory", "serviceMode", "servicePrice", "publishService", "missionFormDialog", "missionForm", "missionTitle",
  "missionCity", "missionMode", "missionBudget", "workspaceGrid", "markDelivered", "validateDelivery",
  "openDispute", "reviewDialog", "reviewForm", "reviewRating", "reviewComment", "disputeDialog",
  "disputeForm", "disputeReason"
];
const els = Object.fromEntries(ids.map((id) => [id, document.querySelector(`#${id}`)]));

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return saved ? { ...structuredClone(defaultState), ...saved } : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function statusLabel(status) {
  return {
    escrowed: "Paiement bloqué",
    in_progress: "En cours",
    delivered: "Livré",
    validated: "Validé",
    disputed: "Litige",
    paid_out: "Payé"
  }[status] || status;
}

function initials(name) {
  return name.split(" ").map((part) => part[0]).join("");
}

function money(amount) {
  return Number(amount).toLocaleString("fr-FR") + " FCFA";
}

function fillSelect(select, values, skipAll = false) {
  select.innerHTML = values
    .filter((value) => !skipAll || value !== "Toutes")
    .map((value) => `<option value="${value}">${value}</option>`)
    .join("");
}

function byId(collection, id) {
  return collection.find((item) => item.id === id);
}

function bind(selector, eventName, handler) {
  document.querySelectorAll(selector).forEach((node) => node.addEventListener(eventName, () => handler(node)));
}

function filteredServices() {
  const query = els.searchInput.value.trim().toLowerCase();
  const category = els.categoryFilter.value;
  const city = els.cityFilter.value;
  const mode = els.modeFilter.value;
  const budget = Number(els.budgetFilter.value || Infinity);

  return state.services
    .filter((item) => category === "Toutes" || item.category === category)
    .filter((item) => mode === "all" || item.mode === mode || item.mode === "both")
    .filter((item) => item.price <= budget)
    .filter((item) => city === "Toutes" || item.mode === "remote" || item.city === city)
    .filter((item) => !query || `${item.title} ${item.name} ${item.skills.join(" ")}`.toLowerCase().includes(query))
    .sort((a, b) => b.score - a.score || b.rating - a.rating || a.price - b.price);
}

function renderServices() {
  const rows = filteredServices();
  els.searchNote.textContent = els.cityFilter.value === "Toutes"
    ? "Tri par pertinence, SamaScore, note et prix. La ville ne bloque jamais les services à distance."
    : `Ville choisie : ${els.cityFilter.value}. Les services remote restent visibles nationalement.`;
  els.serviceGrid.innerHTML = rows.map((item) => `
    <article class="card">
      <div class="card-top">
        <div class="avatar">${initials(item.name)}</div>
        <div><h3>${item.title}</h3><p class="meta">${item.name} · ${item.city} · ${item.category}</p></div>
      </div>
      <div class="badges">
        <span class="badge">${modeLabel(item.mode)}</span>
        <span class="badge yellow">SamaScore ${item.score}/100</span>
        <span class="badge blue">${item.rating.toFixed(1)}/5</span>
      </div>
      <p>${item.skills.join(" · ")}</p>
      <strong>À partir de ${money(item.price)}</strong>
      <div class="card-actions">
        <button class="secondary" data-profile="${item.id}">Profil</button>
        <button class="primary" data-order="${item.id}">Commander</button>
      </div>
    </article>
  `).join("");
  bind("[data-profile]", "click", (button) => showProfile(button.dataset.profile));
  bind("[data-order]", "click", (button) => createOrder(button.dataset.order));
}

function showProfile(id) {
  const item = byId(state.services, id);
  currentProfileId = id;
  document.querySelector("#profileName").textContent = item.name;
  document.querySelector("#profileAvatar").textContent = initials(item.name);
  document.querySelector("#profilePseudo").textContent = `kayjob.sn/${item.pseudo}`;
  document.querySelector("#profileBio").textContent = item.bio;
  document.querySelector("#profileTrust").innerHTML = `<span class="badge">Identité vérifiée</span><span class="badge yellow">SamaScore ${item.score}/100</span><span class="badge blue">${item.rating.toFixed(1)}/5 · avis bidirectionnels</span>`;
  document.querySelector("#portfolioGrid").innerHTML = item.portfolio.map((work, index) => `
    <article class="portfolio-item">
      <img src="${work.image}" alt="Aperçu ${work.title}" />
      <div class="portfolio-body">
        <span class="badge ${work.type === "Lien" ? "blue" : ""}">${work.type}</span>
        <h3>${work.title}</h3>
        <p>${work.description}</p>
      </div>
      <div class="portfolio-actions">
        <button class="secondary small" data-preview="${id}:${index}">Ouvrir</button>
        <a class="primary small" href="${work.url}" target="_blank" rel="noreferrer">Voir le lien</a>
      </div>
    </article>
  `).join("");
  document.querySelector("#profileReviews").innerHTML = item.reviews.map((text) => `<div class="review"><strong>Avis client</strong><p>${text}</p></div>`).join("");
  bind("[data-preview]", "click", (button) => {
    const [serviceId, itemIndex] = button.dataset.preview.split(":");
    showPortfolioItem(serviceId, Number(itemIndex));
  });
  els.profile.hidden = false;
  location.hash = "#profile";
}

function showPortfolioItem(serviceId, itemIndex) {
  const item = byId(state.services, serviceId);
  const work = item.portfolio[itemIndex];
  document.querySelector("#portfolioPreview").src = work.image;
  document.querySelector("#portfolioTitle").textContent = work.title;
  document.querySelector("#portfolioDescription").textContent = `${item.name} - ${work.description}`;
  document.querySelector("#portfolioLink").href = work.url;
  els.portfolioDialog.showModal();
}

function createOrder(serviceId) {
  const item = byId(state.services, serviceId);
  const commission = Math.max(250, Math.round(item.price * 0.1));
  const order = { id: `ord-${Date.now()}`, serviceId, status: "escrowed", gross: item.price, commission, net: item.price - commission };
  state.orders.unshift(order);
  state.selectedOrderId = order.id;
  state.notifications.unshift(`Commande ${order.id} créée : ${money(item.price)} bloqués en escrow.`);
  saveState();
  renderAll();
  location.hash = "#orders";
}

function renderMissions() {
  els.missionBoard.innerHTML = state.missions.map((mission) => `
    <article class="mission">
      <div><h3>${mission.title}</h3><p class="meta">${mission.city} · ${mission.category} · ${modeLabel(mission.mode)} · ${mission.offers} devis reçus</p></div>
      <div><strong>${money(mission.budget)}</strong><button class="secondary small" data-offer="${mission.id}">Faire un devis</button></div>
    </article>
  `).join("");
  bind("[data-offer]", "click", (button) => {
    const mission = byId(state.missions, button.dataset.offer);
    mission.offers += 1;
    state.notifications.unshift(`Nouveau devis reçu pour : ${mission.title}.`);
    saveState();
    renderAll();
  });
}

function renderOrder() {
  const order = byId(state.orders, state.selectedOrderId) || state.orders[0];
  state.selectedOrderId = order.id;
  const item = byId(state.services, order.serviceId);
  const steps = ["escrowed", "in_progress", "delivered", "validated", "paid_out"];
  els.selectedOrder.textContent = `${order.id} : ${item.title} · ${money(order.gross)} brut · ${money(order.net)} net prestataire · ${statusLabel(order.status)}.`;
  els.orderFlow.innerHTML = [
    ["Commande", "Service choisi ou devis accepté."],
    ["Paiement", "Montant bloqué en séquestre."],
    ["Travail", "Échanges et livrables dans la commande."],
    ["Validation", "Client valide ou ouvre un litige."],
    ["Reversement", "Commission déduite, net transféré."]
  ].map(([title, copy], index) => `<div class="order-step ${steps.indexOf(order.status) >= index ? "active" : ""}"><span class="badge ${index === 1 ? "yellow" : ""}">${index + 1}</span><h3>${title}</h3><p class="meta">${copy}</p></div>`).join("");
  renderMessages();
}

function renderMessages() {
  const rows = state.messages.filter((message) => message.orderId === state.selectedOrderId);
  els.messages.innerHTML = rows.map((message) => `<div class="bubble ${message.me ? "me" : ""}">${message.text}</div>`).join("");
}

function renderWorkspace() {
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === state.activeTab));
  const orderCards = state.orders.map((order) => {
    const item = byId(state.services, order.serviceId);
    return `<article><h3>${order.id}</h3><p>${item.title}</p><p class="meta">${statusLabel(order.status)} · ${money(order.gross)}</p><button class="secondary small" data-select-order="${order.id}">Ouvrir</button></article>`;
  }).join("");
  const serviceCards = state.services.slice(0, 4).map((item) => `<article><h3>${item.title}</h3><p class="meta">${item.city} · ${modeLabel(item.mode)}</p><strong>${money(item.price)}</strong></article>`).join("");
  const notifications = state.notifications.map((item) => `<article><h3>Notification</h3><p>${item}</p></article>`).join("");
  els.workspaceGrid.innerHTML = state.activeTab === "client" ? orderCards : state.activeTab === "student" ? serviceCards : notifications;
  bind("[data-select-order]", "click", (button) => {
    state.selectedOrderId = button.dataset.selectOrder;
    saveState();
    renderAll();
    location.hash = "#orders";
  });
}

function renderAdmin() {
  const remote = state.services.filter((item) => item.mode !== "onsite").length;
  const onsite = state.services.filter((item) => item.mode !== "remote").length;
  const score = Math.round(state.services.reduce((sum, item) => sum + item.score, 0) / state.services.length);
  const volume = state.orders.reduce((sum, item) => sum + item.gross, 0);
  els.adminGrid.innerHTML = [
    ["Prestataires", state.services.length, "Profils vérifiables"],
    ["Remote", remote, "Capacité nationale"],
    ["Présentiel", onsite, "Couverture locale"],
    ["SamaScore moyen", `${score}/100`, "Confiance publique"],
    ["GMV", money(volume), "Commandes simulées"],
    ["Litiges", state.disputes.length, "À arbitrer"],
    ["Vérifications", 3, "Documents privés"],
    ["Catégories", categories.length - 1, "Administrables"]
  ].map(([label, value, detail]) => `<article class="admin-tile"><strong>${value}</strong><h3>${label}</h3><p class="meta">${detail}</p></article>`).join("");
  els.verificationQueue.innerHTML = ["Awa Diop - carte étudiant à valider", "Cheikh Bâ - téléphone confirmé", "Mariama Sarr - email universitaire vérifié"].map((item) => `<li>${item}</li>`).join("");
  els.paymentQueue.innerHTML = state.orders.map((order) => `<li>${order.id} - ${money(order.gross)} - ${statusLabel(order.status)}</li>`).join("");
  els.regionStats.innerHTML = ["Dakar : forte demande web", "Thiès : services physiques", "Ziguinchor : profils remote", "Kaolack : acquisition clients"].map((item) => `<li>${item}</li>`).join("");
  document.querySelector("#metricStudents").textContent = state.services.length;
  document.querySelector("#metricRemote").textContent = remote;
}

function renderAll() {
  renderServices();
  renderMissions();
  renderOrder();
  renderWorkspace();
  renderAdmin();
}

function updateOrder(status, notification) {
  const order = byId(state.orders, state.selectedOrderId);
  order.status = status;
  state.notifications.unshift(notification);
  saveState();
  renderAll();
}

function init() {
  fillSelect(els.categoryFilter, categories);
  fillSelect(els.cityFilter, cities);
  fillSelect(els.serviceCategory, categories, true);
  fillSelect(els.missionCity, cities, true);
  [els.categoryFilter, els.cityFilter, els.modeFilter, els.searchInput, els.budgetFilter].forEach((el) => el.addEventListener("input", renderServices));
  els.resetFilters.addEventListener("click", () => {
    els.searchInput.value = "";
    els.categoryFilter.value = "Toutes";
    els.cityFilter.value = "Toutes";
    els.modeFilter.value = "all";
    els.budgetFilter.value = "";
    renderServices();
  });
  document.querySelector("#closeProfile").addEventListener("click", () => {
    els.profile.hidden = true;
    location.hash = "#services";
  });
  els.openSignup.addEventListener("click", () => els.signupDialog.showModal());
  document.querySelector("#addPortfolioItem").addEventListener("click", () => {
    els.portfolioForm.reset();
    els.portfolioFormDialog.showModal();
  });
  document.querySelector("#publishMission").addEventListener("click", () => {
    els.missionForm.reset();
    els.missionFormDialog.showModal();
  });
  els.publishService.addEventListener("click", () => {
    els.serviceForm.reset();
    els.serviceFormDialog.showModal();
  });
  document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => {
    state.activeTab = tab.dataset.tab;
    saveState();
    renderWorkspace();
  }));
  els.messageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = els.messageInput.value.trim();
    if (!text) return;
    state.messages.push({ orderId: state.selectedOrderId, me: true, text });
    els.messageInput.value = "";
    saveState();
    renderMessages();
  });
  els.portfolioForm.addEventListener("submit", (event) => {
    if (!event.submitter || event.submitter.value !== "confirm" || !currentProfileId) return;
    const item = byId(state.services, currentProfileId);
    item.portfolio.unshift(makePortfolio(
      els.portfolioFormTitle.value.trim(),
      els.portfolioFormType.value,
      els.portfolioFormType.value === "Lien" ? "./assets/portfolio-web.svg" : "./assets/portfolio-logo.svg",
      els.portfolioFormUrl.value.trim() || "https://example.com/kayjob/nouvelle-realisation",
      els.portfolioFormDescription.value.trim()
    ));
    saveState();
    showProfile(currentProfileId);
  });
  els.serviceForm.addEventListener("submit", (event) => {
    if (!event.submitter || event.submitter.value !== "confirm") return;
    state.services.unshift(makeService(`srv-${Date.now()}`, "Nouveau talent", "nouveautalent", "Dakar", els.serviceCategory.value, els.serviceTitle.value.trim(), Number(els.servicePrice.value), 5, 70, els.serviceMode.value, [els.serviceCategory.value], "./assets/portfolio-web.svg"));
    state.notifications.unshift("Nouveau service publié et envoyé en modération.");
    saveState();
    renderAll();
  });
  els.missionForm.addEventListener("submit", (event) => {
    if (!event.submitter || event.submitter.value !== "confirm") return;
    state.missions.unshift({ id: `mis-${Date.now()}`, title: els.missionTitle.value.trim(), city: els.missionCity.value, budget: Number(els.missionBudget.value), mode: els.missionMode.value, category: "Design", offers: 0 });
    state.notifications.unshift("Mission publiée, les prestataires peuvent envoyer un devis.");
    saveState();
    renderAll();
  });
  els.markDelivered.addEventListener("click", () => updateOrder("delivered", "Livraison déposée dans la commande."));
  els.validateDelivery.addEventListener("click", () => {
    updateOrder("paid_out", "Livraison validée, paiement net libéré.");
    els.reviewDialog.showModal();
  });
  els.openDispute.addEventListener("click", () => els.disputeDialog.showModal());
  els.reviewForm.addEventListener("submit", (event) => {
    if (!event.submitter || event.submitter.value !== "confirm") return;
    const order = byId(state.orders, state.selectedOrderId);
    byId(state.services, order.serviceId).reviews.unshift(`${els.reviewRating.value}/5 - ${els.reviewComment.value.trim()}`);
    saveState();
    renderAll();
  });
  els.disputeForm.addEventListener("submit", (event) => {
    if (!event.submitter || event.submitter.value !== "confirm") return;
    state.disputes.unshift({ orderId: state.selectedOrderId, reason: els.disputeReason.value.trim() });
    updateOrder("disputed", "Litige ouvert et envoyé au back-office.");
  });
  renderAll();
}

init();
