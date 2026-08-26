const categories = ["Toutes", "Informatique", "Design", "Média", "Éducation", "Digital", "Créatif", "Services physiques"];
const cities = ["Toutes", "Dakar", "Thiès", "Saint-Louis", "Ziguinchor", "Kaolack", "Touba", "Mbour", "Diourbel"];

const services = [
  profile("Awa Diop", "awadesign", "Kaolack", "Design", "Logo et identité visuelle pour PME", 5000, 4.9, 92, "remote", ["Logo", "Flyer", "CV"], "./assets/portfolio-logo.svg"),
  profile("Mamadou Fall", "mfallcode", "Dakar", "Informatique", "Site vitrine React ou WordPress", 15000, 4.8, 89, "remote", ["Développement web", "WordPress", "SEO"], "./assets/portfolio-web.svg"),
  profile("Fatou Ndiaye", "fatoulearn", "Saint-Louis", "Éducation", "Cours particuliers maths et rédaction", 3000, 4.7, 86, "both", ["Maths", "Correction", "Rédaction"], "./assets/portfolio-course.svg"),
  profile("Cheikh Bâ", "cheikhfix", "Thiès", "Services physiques", "Réparation PC et installation réseau", 7000, 4.6, 82, "onsite", ["Réparation informatique", "Linux", "Réseau"], "./assets/portfolio-repair.svg"),
  profile("Mariama Sarr", "mariamacm", "Ziguinchor", "Digital", "Gestion Instagram et création de contenu", 10000, 4.9, 94, "remote", ["Community management", "Publicité Meta", "Création de contenu"], "./assets/portfolio-social.svg"),
  profile("Ibrahima Sy", "ibrahimacam", "Mbour", "Média", "Photo événementielle et retouche", 12000, 4.8, 88, "both", ["Photographie", "Retouche", "TikTok"], "./assets/portfolio-photo.svg")
];

function profile(name, pseudo, city, category, title, price, rating, score, mode, skills, image) {
  return {
    id: Math.random().toString(36).slice(2),
    name, pseudo, city, category, title, price, rating, score, mode, skills,
    bio: `${name} propose des services ${modeLabel(mode).toLowerCase()} depuis ${city}, avec livraison suivie sur KayJob.`,
    portfolio: [
      { title: "Réalisation image", type: "Image", image, url: "https://example.com/kayjob/realisation", description: `Aperçu d'un projet ${category.toLowerCase()} livré pour un client KayJob.` },
      { title: "Lien de projet", type: "Lien", image, url: "https://example.com/kayjob/projet", description: "Lien externe vers une réalisation, un portfolio ou une livraison validée." },
      { title: "Mission terminée", type: "Image", image, url: "https://example.com/kayjob/mission", description: "Preuve de mission terminée avec contexte, rôle et résultat obtenu." }
    ],
    reviews: ["Livraison rapide et propre.", "Bonne communication, résultat conforme au brief."]
  };
}

const missions = [
  { title: "Filmer une cérémonie samedi", city: "Kaolack", budget: 18000, mode: "onsite", offers: 4 },
  { title: "Créer une affiche pour une conférence", city: "Touba", budget: 6000, mode: "remote", offers: 9 },
  { title: "Corriger un mémoire de licence", city: "Dakar", budget: 10000, mode: "remote", offers: 6 }
];
const orderSteps = [["Commande", "Le client choisit un service ou accepte un devis."], ["Paiement", "Le montant est bloqué en séquestre."], ["Travail", "Le prestataire échange et livre."], ["Validation", "Le client valide ou ouvre un litige."], ["Reversement", "KayJob libère le net après commission."]];
const messages = [{ me: false, text: "Bonjour, je peux livrer en 48h avec deux propositions." }, { me: true, text: "Parfait. Je paie la commande et j'envoie le brief." }];
let currentProfileId = null;

const els = Object.fromEntries(["categoryFilter","cityFilter","modeFilter","searchInput","budgetFilter","serviceGrid","searchNote","resetFilters","missionBoard","orderFlow","messages","messageForm","messageInput","adminGrid","verificationQueue","paymentQueue","regionStats","signupDialog","portfolioDialog","portfolioFormDialog","portfolioForm","portfolioFormTitle","portfolioFormType","portfolioFormUrl","portfolioFormDescription","openSignup","profile"].map((id) => [id, document.querySelector(`#${id}`)]));

function modeLabel(mode) { return { remote: "À distance", onsite: "Sur place", both: "Les deux" }[mode]; }
function initials(name) { return name.split(" ").map((part) => part[0]).join(""); }
function fillSelect(select, values) { select.innerHTML = values.map((value) => `<option value="${value}">${value}</option>`).join(""); }

function filteredServices() {
  const query = els.searchInput.value.trim().toLowerCase();
  const category = els.categoryFilter.value;
  const city = els.cityFilter.value;
  const mode = els.modeFilter.value;
  const budget = Number(els.budgetFilter.value || Infinity);
  return services
    .filter((service) => category === "Toutes" || service.category === category)
    .filter((service) => mode === "all" || service.mode === mode || service.mode === "both")
    .filter((service) => service.price <= budget)
    .filter((service) => city === "Toutes" || service.mode === "remote" || service.city === city)
    .filter((service) => !query || `${service.title} ${service.name} ${service.skills.join(" ")}`.toLowerCase().includes(query))
    .sort((a, b) => b.score - a.score || b.rating - a.rating || a.price - b.price);
}

function renderServices() {
  const rows = filteredServices();
  els.searchNote.textContent = els.cityFilter.value === "Toutes" ? "La ville ne bloque jamais les services à distance." : `Ville choisie : ${els.cityFilter.value}. Les services remote restent visibles nationalement.`;
  els.serviceGrid.innerHTML = rows.map((service) => `<article class="card"><div class="card-top"><div class="avatar">${initials(service.name)}</div><div><h3>${service.title}</h3><p class="meta">${service.name} · ${service.city} · ${service.category}</p></div></div><div class="badges"><span class="badge">${modeLabel(service.mode)}</span><span class="badge yellow">SamaScore ${service.score}/100</span><span class="badge blue">${service.rating.toFixed(1)}/5</span></div><p>${service.skills.join(" · ")}</p><strong>À partir de ${service.price.toLocaleString("fr-FR")} FCFA</strong><div class="card-actions"><button class="secondary" data-profile="${service.id}">Profil</button><button class="primary" data-order="${service.id}">Commander</button></div></article>`).join("");
  document.querySelectorAll("[data-profile]").forEach((button) => button.addEventListener("click", () => showProfile(button.dataset.profile)));
  document.querySelectorAll("[data-order]").forEach((button) => button.addEventListener("click", () => { location.hash = "#orders"; renderOrder(button.dataset.order); }));
}

function showProfile(id) {
  const service = services.find((item) => item.id === id);
  currentProfileId = id;
  document.querySelector("#profileName").textContent = service.name;
  document.querySelector("#profileAvatar").textContent = initials(service.name);
  document.querySelector("#profilePseudo").textContent = `kayjob.sn/${service.pseudo}`;
  document.querySelector("#profileBio").textContent = service.bio;
  document.querySelector("#profileTrust").innerHTML = `<span class="badge">Identité vérifiée</span><span class="badge yellow">SamaScore ${service.score}/100</span><span class="badge blue">${service.rating.toFixed(1)}/5 · avis bidirectionnels</span>`;
  document.querySelector("#portfolioGrid").innerHTML = service.portfolio.map((item, index) => `<article class="portfolio-item"><img src="${item.image}" alt="Aperçu ${item.title}" /><div class="portfolio-body"><span class="badge ${item.type === "Lien" ? "blue" : ""}">${item.type}</span><h3>${item.title}</h3><p>${item.description}</p></div><div class="portfolio-actions"><button class="secondary small" data-preview="${id}:${index}">Ouvrir</button><a class="primary small" href="${item.url}" target="_blank" rel="noreferrer">Voir le lien</a></div></article>`).join("");
  document.querySelector("#profileReviews").innerHTML = service.reviews.map((text) => `<div class="review"><strong>Avis client</strong><p>${text}</p></div>`).join("");
  document.querySelectorAll("[data-preview]").forEach((button) => button.addEventListener("click", () => { const [serviceId, itemIndex] = button.dataset.preview.split(":"); showPortfolioItem(serviceId, Number(itemIndex)); }));
  els.profile.hidden = false;
  location.hash = "#profile";
}

function showPortfolioItem(serviceId, itemIndex) {
  const service = services.find((item) => item.id === serviceId);
  const item = service.portfolio[itemIndex];
  document.querySelector("#portfolioPreview").src = item.image;
  document.querySelector("#portfolioTitle").textContent = item.title;
  document.querySelector("#portfolioDescription").textContent = `${service.name} - ${item.description}`;
  document.querySelector("#portfolioLink").href = item.url;
  els.portfolioDialog.showModal();
}

function renderMissions() {
  els.missionBoard.innerHTML = missions.map((mission) => `<article class="mission"><div><h3>${mission.title}</h3><p class="meta">${mission.city} · ${modeLabel(mission.mode)} · ${mission.offers} devis reçus</p></div><div><strong>${mission.budget.toLocaleString("fr-FR")} FCFA</strong><button class="secondary small">Faire un devis</button></div></article>`).join("");
}

function renderOrder(serviceId = services[1].id) {
  const service = services.find((item) => item.id === serviceId);
  document.querySelector("#selectedOrder").textContent = `Commande simulée : ${service.title}, ${service.price.toLocaleString("fr-FR")} FCFA bloqués.`;
  els.orderFlow.innerHTML = orderSteps.map(([title, copy], index) => `<div class="order-step ${index === 1 ? "active" : ""}"><span class="badge ${index === 1 ? "yellow" : ""}">${index + 1}</span><h3>${title}</h3><p class="meta">${copy}</p></div>`).join("");
  renderMessages();
}
function renderMessages() { els.messages.innerHTML = messages.map((message) => `<div class="bubble ${message.me ? "me" : ""}">${message.text}</div>`).join(""); }
function renderAdmin() {
  const remote = services.filter((service) => service.mode !== "onsite").length;
  const onsite = services.filter((service) => service.mode !== "remote").length;
  const score = Math.round(services.reduce((sum, service) => sum + service.score, 0) / services.length);
  const volume = services.reduce((sum, service) => sum + service.price, 0);
  els.adminGrid.innerHTML = [["Prestataires", services.length, "Profils vérifiables"], ["Remote", remote, "Capacité nationale"], ["Présentiel", onsite, "Couverture locale"], ["SamaScore moyen", `${score}/100`, "Confiance publique"], ["GMV simulé", `${volume.toLocaleString("fr-FR")} FCFA`, "Base transaction"], ["Litiges", 1, "À arbitrer"], ["Vérifications", 3, "Documents privés"], ["Catégories", categories.length - 1, "Administrables"]].map(([label, value, detail]) => `<article class="admin-tile"><strong>${value}</strong><h3>${label}</h3><p class="meta">${detail}</p></article>`).join("");
  els.verificationQueue.innerHTML = ["Awa Diop - carte étudiant à valider", "Cheikh Bâ - téléphone confirmé", "Mariama Sarr - email universitaire vérifié"].map((item) => `<li>${item}</li>`).join("");
  els.paymentQueue.innerHTML = ["KJ-1024 - 15 000 FCFA escrow Wave", "KJ-1025 - 7 000 FCFA livraison", "KJ-1026 - 10 000 FCFA libération"].map((item) => `<li>${item}</li>`).join("");
  els.regionStats.innerHTML = ["Dakar : forte demande web", "Thiès : services physiques", "Ziguinchor : profils remote", "Kaolack : acquisition clients"].map((item) => `<li>${item}</li>`).join("");
  document.querySelector("#metricStudents").textContent = services.length;
  document.querySelector("#metricRemote").textContent = remote;
}

function init() {
  fillSelect(els.categoryFilter, categories);
  fillSelect(els.cityFilter, cities);
  [els.categoryFilter, els.cityFilter, els.modeFilter, els.searchInput, els.budgetFilter].forEach((el) => el.addEventListener("input", renderServices));
  els.resetFilters.addEventListener("click", () => { els.searchInput.value = ""; els.categoryFilter.value = "Toutes"; els.cityFilter.value = "Toutes"; els.modeFilter.value = "all"; els.budgetFilter.value = ""; renderServices(); });
  document.querySelector("#closeProfile").addEventListener("click", () => { els.profile.hidden = true; location.hash = "#services"; });
  els.messageForm.addEventListener("submit", (event) => { event.preventDefault(); const text = els.messageInput.value.trim(); if (!text) return; messages.push({ me: true, text }); els.messageInput.value = ""; renderMessages(); });
  els.openSignup.addEventListener("click", () => els.signupDialog.showModal());
  document.querySelector("#publishMission").addEventListener("click", () => { missions.unshift({ title: "Nouvelle mission : site vitrine", city: "Diourbel", budget: 12000, mode: "remote", offers: 0 }); renderMissions(); });
  document.querySelector("#addPortfolioItem").addEventListener("click", () => { els.portfolioForm.reset(); els.portfolioFormDialog.showModal(); });
  els.portfolioForm.addEventListener("submit", (event) => { if (!event.submitter || event.submitter.value !== "confirm" || !currentProfileId) return; const service = services.find((item) => item.id === currentProfileId); service.portfolio.unshift({ title: els.portfolioFormTitle.value.trim(), type: els.portfolioFormType.value, image: els.portfolioFormType.value === "Lien" ? "./assets/portfolio-web.svg" : "./assets/portfolio-logo.svg", url: els.portfolioFormUrl.value.trim() || "https://example.com/kayjob/nouvelle-realisation", description: els.portfolioFormDescription.value.trim() }); showProfile(currentProfileId); });
  renderServices(); renderMissions(); renderOrder(); renderAdmin();
}
init();
