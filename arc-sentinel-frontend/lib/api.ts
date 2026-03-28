
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

export async function fetchIHI() {
  const res = await fetchWithTimeout(`${BASE}/ihi`, { cache: 'no-store' }, 8000);
  if (!res.ok) throw new Error(`IHI fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchAnomalies(params?: { severity?: string; limit?: number; resolved?: boolean }) {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params ?? {}).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
  ).toString();
  const res = await fetchWithTimeout(`${BASE}/anomalies?${q}`, { cache: 'no-store' }, 8000);
  if (!res.ok) throw new Error(`Anomalies fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchSensorHistory(node_id: string, limit = 50) {
  const res = await fetchWithTimeout(
    `${BASE}/latest?node_id=${node_id}&limit=${limit}`,
    { cache: 'no-store' },
    8000
  );
  if (!res.ok) throw new Error(`Sensor history fetch failed: ${res.status}`);
  return res.json();
}

export async function sendArgusMessage(message: string): Promise<{ reply: string; sources: string[] }> {
  const res = await fetchWithTimeout(
    `${BASE}/argus/chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
      cache: 'no-store',
    },
    30000  // Argus needs more time — LLM call can take up to 30s
  );
  if (!res.ok) {
    const text = await res.text().catch(() => 'no body');
    throw new Error(`Argus API ${res.status}: ${text}`);
  }
  return res.json();
}

export async function pingBackend(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${BASE}/`, { cache: 'no-store' }, 5000);
    return res.ok;
  } catch {
    return false;
  }
}
