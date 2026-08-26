import { api, apiConfigured } from "./api";
export type LiveService = { id: string; name: string; pseudo: string; title: string; city: string; mode: string; price: string; score: number; rating: string; work: string; category: string; skills: string[] };
export async function loadServices(): Promise<LiveService[]> {
  if (!apiConfigured) throw new Error("EXPO_PUBLIC_API_URL is required for live data");
  const rows = await api<any[]>("/api/services");
  return rows.map((row) => ({ id: String(row.id), name: row.full_name, pseudo: row.pseudo || "talent", title: row.title, city: row.city || "Sénégal", mode: row.delivery_mode === "remote" ? "À distance" : row.delivery_mode === "onsite" ? "Sur place" : "Les deux", price: `${Number(row.starting_price).toLocaleString("fr-FR")} FCFA`, score: Number(row.sama_score || 0), rating: "Nouveau", work: "Portfolio", category: row.category || "Compétence", skills: [row.category || "Compétence"] }));
}
export async function loadMissions() {
  if (!apiConfigured) throw new Error("EXPO_PUBLIC_API_URL is required for live data");
  const rows = await api<any[]>("/api/missions");
  return rows.map((row) => ({ ...row, id: String(row.id), city: row.city || "Sénégal", mode: row.delivery_mode === "remote" ? "À distance" : "Sur place", budget: `${Number(row.budget_max).toLocaleString("fr-FR")} FCFA`, offers: 0 }));
}
export async function loadOrders() {
  if (!apiConfigured) throw new Error("EXPO_PUBLIC_API_URL is required for live data");
  const rows = await api<any[]>("/api/me/orders");
  return rows.map((row) => ({ id: `KJ-${row.id}`, title: row.title || "Commande KayJob", status: row.status, amount: `${Number(row.amount_total).toLocaleString("fr-FR")} FCFA`, net: `${Number(row.amount_net_provider).toLocaleString("fr-FR")} FCFA` }));
}
