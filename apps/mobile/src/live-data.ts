import { api, apiConfigured } from "./api";
import { missions as demoMissions, orders as demoOrders, services as demoServices } from "./data";

export type LiveService = typeof demoServices[number] & { price?: string; score?: number; rating?: string };
export async function loadServices(): Promise<LiveService[]> {
  if (!apiConfigured) return demoServices;
  const rows = await api<any[]>("/api/services");
  return rows.map((row) => ({ ...row, name: row.full_name, title: row.title, mode: row.delivery_mode === "remote" ? "À distance" : row.delivery_mode === "onsite" ? "Sur place" : "Les deux", price: `${Number(row.starting_price).toLocaleString("fr-FR")} FCFA`, score: Number(row.sama_score || 0), rating: "Nouveau", work: "Portfolio", skills: [row.category || "Compétence"] }));
}
export async function loadMissions() {
  if (!apiConfigured) return demoMissions;
  const rows = await api<any[]>("/api/missions");
  return rows.map((row) => ({ ...row, city: row.city || "Sénégal", mode: row.delivery_mode === "remote" ? "À distance" : "Sur place", budget: `${Number(row.budget_max).toLocaleString("fr-FR")} FCFA`, offers: 0 }));
}
export async function loadOrders() {
  if (!apiConfigured) return demoOrders;
  const rows = await api<any[]>("/api/me/orders");
  return rows.map((row) => ({ id: `KJ-${row.id}`, title: row.title || "Commande KayJob", status: row.status, amount: `${Number(row.amount_total).toLocaleString("fr-FR")} FCFA`, net: `${Number(row.amount_net_provider).toLocaleString("fr-FR")} FCFA` }));
}
