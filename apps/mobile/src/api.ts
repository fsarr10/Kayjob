import { Platform } from "react-native";

const API_URL = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/$/, "");
let sessionToken = "";
const REQUEST_TIMEOUT_MS = 12000;

export const apiConfigured = Boolean(API_URL);
export function setSessionToken(token: string) { sessionToken = token; }
export function getSessionToken() { return sessionToken; }

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new Error("API locale non configurée. Lance `npm run start:tunnel` depuis apps/mobile.");
  const headers = new Headers(options.headers);
  headers.set("accept", "application/json");
  if (options.body) headers.set("content-type", "application/json");
  headers.set("x-client", `kayjob-mobile/${Platform.OS}`);
  if (sessionToken) headers.set("authorization", `Bearer ${sessionToken}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers, signal: options.signal || controller.signal }).finally(() => clearTimeout(timeout));
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Une erreur est survenue");
  return body.data as T;
}

export async function requestOtp(destination: string, fullName?: string) {
  return api<{ channel: string; destination: string; expiresIn: number; devCode?: string }>("/api/auth/request-otp", {
    method: "POST", body: JSON.stringify(destination.includes("@") ? { email: destination, fullName } : { phone: destination, fullName, deviceName: `KayJob ${Platform.OS}` })
  });
}

export async function verifyOtp(destination: string, code: string) {
  const result = await api<{ token: string; user: { id: number; full_name: string; pseudo: string | null } }>("/api/auth/verify-otp", {
    method: "POST", body: JSON.stringify(destination.includes("@") ? { email: destination, code } : { phone: destination, code })
  });
  setSessionToken(result.token);
  return result;
}
