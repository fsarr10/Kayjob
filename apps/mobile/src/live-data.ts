import { api, apiConfigured, getSessionToken } from "./api";

export type LiveService = { id: string; name: string; pseudo: string; title: string; city: string; mode: string; price: string; score: number; rating: string; work: string; category: string; skills: string[] };
export type LiveMission = { id: string; title: string; city: string; budget: string; mode: string; offers: number };
export type LiveOrder = { id: string; title: string; status: string; amount: string; net: string };
export type LivePortfolioItem = { id: string; title: string; description: string; type: string; url: string };
export type LivePortfolio = { name: string; pseudo: string; city: string; headline: string; bio: string; score: number; services: LiveService[]; items: LivePortfolioItem[] };

const deliveryModeLabel = (value: string) => value === "remote" ? "À distance" : value === "onsite" ? "Sur place" : "Les deux";
const orderStatusLabel = (value: string) => ({
  awaiting_payment: "Paiement attendu",
  escrowed: "Paiement bloqué",
  in_progress: "En cours",
  preview_delivered: "Aperçu livré",
  final_delivered: "Livré",
  client_review: "Validation client",
  completed_released: "Payé",
  dispute_opened: "Litige ouvert"
}[value] || value);

export async function loadServices(): Promise<LiveService[]> {
  if (!apiConfigured) throw new Error("EXPO_PUBLIC_API_URL is required");
  const rows = await api<any[]>("/api/services");
  return rows.map((row) => ({ id: String(row.id), name: row.full_name, pseudo: row.pseudo || "talent", title: row.title, city: row.city || "Sénégal", mode: deliveryModeLabel(row.delivery_mode), price: `${Number(row.starting_price).toLocaleString("fr-FR")} FCFA`, score: Number(row.sama_score || 0), rating: "Nouveau", work: "Portfolio", category: row.category || "Compétence", skills: [row.category || "Compétence"] }));
}
export async function loadMissions(): Promise<LiveMission[]> {
  if (!apiConfigured) throw new Error("EXPO_PUBLIC_API_URL is required");
  const rows = await api<any[]>("/api/missions");
  return rows.map((row) => ({ id: String(row.id), title: row.title, city: row.city || "Sénégal", mode: deliveryModeLabel(row.delivery_mode), budget: `${Number(row.budget_max).toLocaleString("fr-FR")} FCFA`, offers: Number(row.offers || 0) }));
}
export async function loadOrders(): Promise<LiveOrder[]> {
  if (!apiConfigured) throw new Error("EXPO_PUBLIC_API_URL is required");
  if (!getSessionToken()) return [];
  const rows = await api<any[]>("/api/me/orders");
  return rows.map((row) => ({ id: `KJ-${row.id}`, title: row.title || "Commande KayJob", status: orderStatusLabel(row.status), amount: `${Number(row.amount_total || 0).toLocaleString("fr-FR")} FCFA`, net: `${Number(row.amount_net_provider || 0).toLocaleString("fr-FR")} FCFA` }));
}

export async function loadMyPortfolio(): Promise<LivePortfolio | null> {
  if (!apiConfigured) throw new Error("EXPO_PUBLIC_API_URL is required");
  if (!getSessionToken()) return null;
  const row = await api<any>("/api/me/portfolio");
  const services = Array.isArray(row.services) ? row.services.map((service: any) => ({
    id: String(service.id),
    name: row.full_name,
    pseudo: row.pseudo || "talent",
    title: service.title,
    city: row.city || "Sénégal",
    mode: deliveryModeLabel(service.delivery_mode),
    price: `${Number(service.starting_price).toLocaleString("fr-FR")} FCFA`,
    score: Number(row.sama_score || 0),
    rating: "Nouveau",
    work: "Portfolio",
    category: "Service",
    skills: ["Service"]
  })) : [];
  const items = Array.isArray(row.portfolio) ? row.portfolio.map((item: any) => ({
    id: String(item.id),
    title: item.title,
    description: item.description || "",
    type: item.item_type || "portfolio",
    url: item.external_url || item.media_url || ""
  })) : [];
  return { name: row.full_name, pseudo: row.pseudo || "talent", city: row.city || "Sénégal", headline: row.headline || "Profil KayJob", bio: row.bio || "", score: Number(row.sama_score || 0), services, items };
}
