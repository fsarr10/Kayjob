export const cities = ["Dakar", "Thiès", "Saint-Louis", "Ziguinchor", "Kaolack", "Touba", "Mbour", "Diourbel"];

export const services = [
  {
    id: "srv-1",
    name: "Awa Diop",
    pseudo: "awadesign",
    title: "Logo et identité visuelle",
    city: "Kaolack",
    mode: "À distance",
    price: "5 000 FCFA",
    score: 92,
    rating: "4,9",
    work: "3 réalisations",
    category: "Design",
    skills: ["Logo", "Flyer", "CV"],
    portfolio: [
      { title: "Logo restaurant", type: "Image", detail: "Identité visuelle livrée avec fichiers source." },
      { title: "Pack réseaux sociaux", type: "Image", detail: "Templates stories et calendrier éditorial." },
      { title: "Portfolio Behance", type: "Lien", detail: "Lien public vers les projets validés." }
    ]
  },
  {
    id: "srv-2",
    name: "Mamadou Fall",
    pseudo: "mfallcode",
    title: "Site vitrine React",
    city: "Dakar",
    mode: "À distance",
    price: "15 000 FCFA",
    score: 89,
    rating: "4,8",
    work: "Portfolio web",
    category: "Informatique",
    skills: ["React", "WordPress", "SEO"],
    portfolio: [
      { title: "Site association", type: "Lien", detail: "Site vitrine responsive avec formulaire." },
      { title: "Dashboard PME", type: "Image", detail: "Interface de suivi de commandes livrée en 5 jours." }
    ]
  },
  {
    id: "srv-3",
    name: "Fatou Ndiaye",
    pseudo: "fatoulearn",
    title: "Cours particuliers",
    city: "Saint-Louis",
    mode: "Les deux",
    price: "3 000 FCFA",
    score: 86,
    rating: "4,7",
    work: "Supports PDF",
    category: "Éducation",
    skills: ["Maths", "Correction", "Rédaction"],
    portfolio: [
      { title: "Support de révision", type: "Image", detail: "Fiches PDF structurées pour élèves de terminale." },
      { title: "Correction mémoire", type: "Lien", detail: "Extrait anonymisé d'une correction validée." }
    ]
  },
  {
    id: "srv-4",
    name: "Cheikh Bâ",
    pseudo: "cheikhfix",
    title: "Réparation PC",
    city: "Thiès",
    mode: "Sur place",
    price: "7 000 FCFA",
    score: 82,
    rating: "4,6",
    work: "Photos avant/après",
    category: "Services physiques",
    skills: ["Réparation", "Linux", "Réseau"],
    portfolio: [
      { title: "Installation réseau", type: "Image", detail: "Configuration routeur et câblage pour une boutique." },
      { title: "Réparation PC", type: "Image", detail: "Diagnostic, sauvegarde et réinstallation système." }
    ]
  },
  {
    id: "srv-5",
    name: "Mariama Sarr",
    pseudo: "mariamacm",
    title: "Gestion Instagram PME",
    city: "Ziguinchor",
    mode: "À distance",
    price: "10 000 FCFA",
    score: 94,
    rating: "4,9",
    work: "Calendrier contenu",
    category: "Digital",
    skills: ["Meta Ads", "Stories", "Community"],
    portfolio: [
      { title: "Calendrier éditorial", type: "Image", detail: "30 jours de publications pour un commerce local." },
      { title: "Campagne Meta", type: "Lien", detail: "Synthèse de campagne avec résultats anonymisés." }
    ]
  }
];

export const missions = [
  { id: "mis-1", title: "Filmer une cérémonie", city: "Kaolack", budget: "18 000 FCFA", mode: "Sur place", offers: 4 },
  { id: "mis-2", title: "Créer une affiche", city: "Touba", budget: "6 000 FCFA", mode: "À distance", offers: 9 },
  { id: "mis-3", title: "Corriger un mémoire", city: "Dakar", budget: "10 000 FCFA", mode: "À distance", offers: 6 }
];

export const orders = [
  { id: "KJ-1024", title: "Site vitrine React", status: "Paiement bloqué", amount: "15 000 FCFA", net: "13 500 FCFA" },
  { id: "KJ-1025", title: "Logo restaurant", status: "Livré", amount: "5 000 FCFA", net: "4 500 FCFA" }
];

export const messages = [
  { id: "msg-1", from: "Mamadou", text: "Je peux livrer la première version demain soir.", mine: false },
  { id: "msg-2", from: "Client", text: "Parfait, j'ajoute le brief et les images.", mine: true },
  { id: "msg-3", from: "KayJob", text: "Paiement reçu et bloqué en séquestre.", mine: false }
];

export const adminStats = [
  { value: "41", label: "vérifications" },
  { value: "18", label: "litiges ouverts" },
  { value: "2,4M", label: "FCFA escrow" }
];

export const verificationQueue = [
  "Pièce d’identité - Awa Diop",
  "Pièce identité - Cheikh Bâ",
  "Email de contact - Fatou Ndiaye"
];

export const portfolio = [
  ...services[0].portfolio,
  ...services[1].portfolio
];
