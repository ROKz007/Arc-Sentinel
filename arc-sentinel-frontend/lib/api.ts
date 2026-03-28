import { Anomaly, IHIResponse, SensorLog } from "@/lib/types";


const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!BASE) {
  console.error('[Arc-Sentinel] NEXT_PUBLIC_API_BASE_URL is not set!');
}


export async function fetchIHI() {
  const res = await fetch(`${BASE}/ihi`, { next: { revalidate: 5 } });
  if (!res.ok) throw new Error(`IHI fetch failed: ${res.status}`);
  return res.json();
}


export async function fetchAnomalies(params?: { severity?: string; limit?: number }) {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  const res = await fetch(`${BASE}/anomalies?${q}`, { next: { revalidate: 5 } });
  if (!res.ok) throw new Error(`Anomalies fetch failed: ${res.status}`);
  return res.json();
}


export async function fetchSensorHistory(node_id: string, limit = 50) {
  const res = await fetch(`${BASE}/latest?node_id=${node_id}&limit=${limit}`, {
    next: { revalidate: 10 }
  });
  if (!res.ok) throw new Error(`Sensor fetch failed: ${res.status}`);
  return res.json();
}


export async function sendArgusMessage(message: string) {
  const res = await fetch(`${BASE}/argus/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(`Argus request failed: ${res.status}`);
  return res.json();
}
