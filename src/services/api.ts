import { devTelemetry } from "./devTelemetry";

export const API_BASE = process.env.EXPO_PUBLIC_API_URL || "https://shahinaz.onrender.com";

export async function apiFetch<T>(path: string, token?: string | null, options: RequestInit = {}): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const start = Date.now();
  let logged = false;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const durationMs = Date.now() - start;
    const text = await res.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    logged = true;
    devTelemetry.recordNetwork({
      method,
      path,
      status: res.status,
      ok: res.ok,
      durationMs,
      error: res.ok ? undefined : data?.error || `HTTP ${res.status}`,
    });
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data as T;
  } catch (err) {
    if (!logged) {
      const durationMs = Date.now() - start;
      const msg = err instanceof Error ? err.message : "Network error";
      devTelemetry.recordNetwork({
        method,
        path,
        status: 0,
        ok: false,
        durationMs,
        error: msg,
      });
    }
    throw err;
  }
}
