import { Anomaly, IHIResponse, SensorLog } from "@/lib/types";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://arc-sentinel-qjg5.onrender.com";

export async function fetchIHI(): Promise<IHIResponse> {
  const res = await fetch(`${BASE}/ihi`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch IHI");
  return res.json();
}

export async function fetchAnomalies(params?: { severity?: string; limit?: number; resolved?: boolean }): Promise<Anomaly[]> {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  const res = await fetch(`${BASE}/anomalies?${q}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch anomalies");
  return res.json();
}

export async function fetchSensorHistory(node_id: string, limit = 50): Promise<SensorLog[]> {
  const res = await fetch(`${BASE}/latest?node_id=${node_id}&limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch sensor logs");
  return res.json();
}

export async function sendArgusMessage(message: string): Promise<{ reply: string; sources: string[] }> {
  const res = await fetch(`${BASE}/argus/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error("Argus request failed");
  return res.json();
}
