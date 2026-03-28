# Arc-Sentinel — Frontend Developer Blueprint

> **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Three.js · Supabase Realtime · shadcn/ui

---

## 1. Project Structure

```
arc-sentinel-frontend/
├── app/
│   ├── layout.tsx                  # Root layout (fonts, global providers)
│   ├── page.tsx                    # Redirects to /dashboard
│   └── dashboard/
│       ├── page.tsx                # Main Vigilance Dashboard
│       └── layout.tsx              # Dashboard shell (sidebar + header)
│
├── components/
│   ├── dashboard/
│   │   ├── IHIGauge.tsx            # Infrastructure Health Index ring gauge
│   │   ├── EMBTicker.tsx           # Emergency Maintenance Broadcast ticker
│   │   ├── AnomalyFeed.tsx         # Real-time anomaly list
│   │   └── SensorChart.tsx         # Vibration / strain time-series chart
│   │
│   ├── twin/
│   │   └── DigitalTwinViewer.tsx   # Three.js 3D bridge model
│   │
│   ├── argus/
│   │   ├── ArgusPanel.tsx          # Chat UI container
│   │   ├── ArgusMessage.tsx        # Individual message bubble
│   │   └── ArgusInput.tsx          # Input bar + send button
│   │
│   └── ui/                         # shadcn/ui primitives (auto-generated)
│
├── hooks/
│   ├── useRealtimeAnomalies.ts     # Supabase Realtime subscription
│   ├── useIHI.ts                   # Polls /ihi endpoint
│   └── useSensorHistory.ts         # Fetches recent sensor_logs
│
├── lib/
│   ├── supabase.ts                 # Supabase browser client
│   ├── api.ts                      # Typed fetch wrappers for backend API
│   └── types.ts                    # Shared TypeScript interfaces
│
├── public/
│   └── models/
│       └── bridge.glb              # 3D bridge model asset (Three.js)
│
├── styles/
│   └── globals.css                 # Tailwind base + custom CSS vars
│
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 2. Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## 3. TypeScript Types (`lib/types.ts`)

```typescript
export type SeverityLevel = "yellow" | "orange" | "critical";

export interface SensorLog {
  id: number;
  created_at: string;
  node_id: string;
  sensor_type: "accelerometer" | "strain_gauge";
  value: number;
  unit: string;
}

export interface Anomaly {
  id: number;
  created_at: string;
  node_id: string;
  sensor_log_id: number;
  severity: SeverityLevel;
  description: string;
  score: number;
  resolved: boolean;
}

export interface IHIResponse {
  score: number;                        // 0.0 – 100.0
  breakdown: Record<string, number>;   // { pier_4: 88.5, cable_east: 72.1, ... }
}

export interface ArgusMessage {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}
```

---

## 4. Supabase Client (`lib/supabase.ts`)

```typescript
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

---

## 5. API Helper (`lib/api.ts`)

```typescript
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function fetchIHI() {
  const res = await fetch(`${BASE}/ihi`);
  if (!res.ok) throw new Error("Failed to fetch IHI");
  return res.json();                     // IHIResponse
}

export async function fetchAnomalies(params?: { severity?: string; limit?: number }) {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  const res = await fetch(`${BASE}/anomalies?${q}`);
  if (!res.ok) throw new Error("Failed to fetch anomalies");
  return res.json();                     // Anomaly[]
}

export async function fetchSensorHistory(node_id: string, limit = 50) {
  const res = await fetch(`${BASE}/latest?node_id=${node_id}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch sensor logs");
  return res.json();                     // SensorLog[]
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
```

---

## 6. Realtime Hook (`hooks/useRealtimeAnomalies.ts`)

```typescript
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Anomaly } from "@/lib/types";

export function useRealtimeAnomalies(initialAnomalies: Anomaly[]) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>(initialAnomalies);

  useEffect(() => {
    const channel = supabase
      .channel("anomalies-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "anomalies" },
        (payload) => {
          const newAnomaly = payload.new as Anomaly;
          setAnomalies((prev) => [newAnomaly, ...prev].slice(0, 50)); // keep latest 50
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return anomalies;
}
```

---

## 7. IHI Hook (`hooks/useIHI.ts`)

```typescript
"use client";
import { useEffect, useState } from "react";
import { fetchIHI } from "@/lib/api";
import { IHIResponse } from "@/lib/types";

export function useIHI(pollIntervalMs = 5000) {
  const [ihi, setIHI] = useState<IHIResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      try { setIHI(await fetchIHI()); } catch { /* fail silently, retry */ }
    };
    load();
    const interval = setInterval(load, pollIntervalMs);
    return () => clearInterval(interval);
  }, [pollIntervalMs]);

  return ihi;
}
```

---

## 8. Component Reference

### 8.1 IHI Gauge (`components/dashboard/IHIGauge.tsx`)

Displays the 0–100 Infrastructure Health Index as an SVG arc gauge.

```typescript
"use client";
import { useIHI } from "@/hooks/useIHI";

function getColor(score: number) {
  if (score >= 75) return "#22c55e";   // green
  if (score >= 50) return "#f59e0b";   // amber
  return "#ef4444";                    // red
}

export function IHIGauge() {
  const ihi = useIHI();
  const score = ihi?.score ?? 0;
  const pct = score / 100;

  // SVG arc parameters
  const r = 70, cx = 90, cy = 90;
  const circumference = Math.PI * r;   // half-circle
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 180 110" className="w-52">
        {/* Background arc */}
        <path
          d={`M 20 90 A ${r} ${r} 0 0 1 160 90`}
          fill="none" stroke="#1e293b" strokeWidth="14" strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M 20 90 A ${r} ${r} 0 0 1 160 90`}
          fill="none"
          stroke={getColor(score)}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s ease" }}
        />
        <text x="90" y="85" textAnchor="middle" fontSize="28" fontWeight="bold"
              fill="white">{score.toFixed(1)}</text>
        <text x="90" y="105" textAnchor="middle" fontSize="10" fill="#94a3b8">IHI SCORE</text>
      </svg>
      <p className="text-xs text-slate-400 uppercase tracking-widest">
        {score >= 75 ? "Healthy" : score >= 50 ? "Degraded" : "Critical"}
      </p>
    </div>
  );
}
```

---

### 8.2 EMB Ticker (`components/dashboard/EMBTicker.tsx`)

Scrolling horizontal ticker for anomaly broadcasts.

```typescript
"use client";
import { useRealtimeAnomalies } from "@/hooks/useRealtimeAnomalies";
import { Anomaly } from "@/lib/types";

const SEVERITY_ICON: Record<string, string> = {
  yellow: "🟡", orange: "🟠", critical: "🔴"
};

interface Props { initialAnomalies: Anomaly[]; }

export function EMBTicker({ initialAnomalies }: Props) {
  const anomalies = useRealtimeAnomalies(initialAnomalies);
  const unresolved = anomalies.filter((a) => !a.resolved);

  if (unresolved.length === 0)
    return (
      <div className="bg-slate-800 border border-slate-700 rounded px-4 py-2 text-xs text-green-400">
        ✅ All systems nominal — No active alerts.
      </div>
    );

  const tickerText = unresolved
    .map((a) => `${SEVERITY_ICON[a.severity]} [${a.severity.toUpperCase()}] ${a.description}`)
    .join("   ·   ");

  return (
    <div className="overflow-hidden bg-slate-900 border border-red-800 rounded px-2 py-1.5">
      <div
        className="whitespace-nowrap text-xs text-red-300 font-mono"
        style={{ animation: "marquee 30s linear infinite" }}
      >
        {tickerText}
      </div>
    </div>
  );
}

// Add to globals.css:
// @keyframes marquee { from { transform: translateX(100%); } to { transform: translateX(-100%); } }
```

---

### 8.3 Anomaly Feed (`components/dashboard/AnomalyFeed.tsx`)

```typescript
"use client";
import { useRealtimeAnomalies } from "@/hooks/useRealtimeAnomalies";
import { Anomaly } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

const SEVERITY_STYLE: Record<string, string> = {
  yellow: "border-yellow-500 bg-yellow-500/10 text-yellow-300",
  orange: "border-orange-500 bg-orange-500/10 text-orange-300",
  critical: "border-red-500 bg-red-500/10 text-red-300 animate-pulse",
};

interface Props { initialAnomalies: Anomaly[]; }

export function AnomalyFeed({ initialAnomalies }: Props) {
  const anomalies = useRealtimeAnomalies(initialAnomalies);

  return (
    <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
      {anomalies.map((a) => (
        <div key={a.id} className={`rounded border-l-4 px-3 py-2 text-xs ${SEVERITY_STYLE[a.severity]}`}>
          <div className="flex justify-between items-center mb-0.5">
            <span className="font-semibold uppercase tracking-wide">{a.node_id.replace("_", " ")}</span>
            <span className="opacity-60">{formatDistanceToNow(new Date(a.created_at))} ago</span>
          </div>
          <p>{a.description}</p>
          <p className="opacity-50 mt-0.5">Anomaly score: {a.score.toFixed(3)}</p>
        </div>
      ))}
      {anomalies.length === 0 && (
        <p className="text-slate-500 text-xs text-center py-8">No anomalies recorded.</p>
      )}
    </div>
  );
}
```

---

### 8.4 Sensor Chart (`components/dashboard/SensorChart.tsx`)

Line chart using **Recharts** (install: `npm install recharts`).

```typescript
"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useSensorHistory } from "@/hooks/useSensorHistory";
import { format } from "date-fns";

interface Props { node_id: string; }

export function SensorChart({ node_id }: Props) {
  const { data, loading } = useSensorHistory(node_id);

  const chartData = data.map((d) => ({
    time: format(new Date(d.created_at), "HH:mm:ss"),
    value: d.value,
    type: d.sensor_type,
  }));

  if (loading) return <div className="h-40 animate-pulse bg-slate-800 rounded" />;

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={chartData}>
        <CartesianGrid stroke="#1e293b" />
        <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#64748b" }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
        <Tooltip
          contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
          labelStyle={{ color: "#94a3b8" }}
          itemStyle={{ color: "#38bdf8" }}
        />
        <Line type="monotone" dataKey="value" stroke="#38bdf8" dot={false} strokeWidth={1.5} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

### 8.5 Digital Twin Viewer (`components/twin/DigitalTwinViewer.tsx`)

Three.js bridge with node highlighting. Install: `npm install three @types/three`.

```typescript
"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Anomaly } from "@/lib/types";

// Node positions on the 3D model (tune to your bridge geometry)
const NODE_POSITIONS: Record<string, [number, number, number]> = {
  pier_4:      [0, -1, 0],
  cable_east:  [3, 1.5, 0],
  deck_center: [0, 0.5, 0],
};

const SEVERITY_COLOR: Record<string, number> = {
  yellow: 0xfbbf24,
  orange: 0xf97316,
  critical: 0xef4444,
};

interface Props { anomalies: Anomaly[]; }

export function DigitalTwinViewer({ anomalies }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    const camera = new THREE.PerspectiveCamera(50, el.clientWidth / el.clientHeight, 0.1, 100);
    camera.position.set(0, 3, 10);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // Bridge geometry (simplified box model for MVP)
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.2, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x334155 })
    );
    scene.add(deck);

    // Pier
    const pier = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.25, 3, 8),
      new THREE.MeshStandardMaterial({ color: 0x475569 })
    );
    pier.position.set(0, -1.5, 0);
    scene.add(pier);

    // Highlight anomalous nodes
    const activeNodes = new Set(anomalies.filter((a) => !a.resolved).map((a) => a.node_id));
    const latestSeverity: Record<string, string> = {};
    anomalies.forEach((a) => { if (!a.resolved) latestSeverity[a.node_id] = a.severity; });

    activeNodes.forEach((nodeId) => {
      const pos = NODE_POSITIONS[nodeId];
      if (!pos) return;
      const color = SEVERITY_COLOR[latestSeverity[nodeId]] ?? 0xfbbf24;
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 16, 16),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 })
      );
      sphere.position.set(...pos);
      scene.add(sphere);
    });

    // Animate
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      scene.rotation.y += 0.003;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [anomalies]);

  return <div ref={mountRef} className="w-full h-64 rounded-lg overflow-hidden" />;
}
```

---

### 8.6 Argus Chat Panel (`components/argus/ArgusPanel.tsx`)

```typescript
"use client";
import { useState, useRef, useEffect } from "react";
import { sendArgusMessage } from "@/lib/api";
import { ArgusMessage } from "@/lib/types";

export function ArgusPanel() {
  const [messages, setMessages] = useState<ArgusMessage[]>([
    { role: "assistant", content: "I'm Argus. Ask me anything about the infrastructure's current state." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await sendArgusMessage(msg);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.reply, sources: res.sources }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠ Argus is temporarily unavailable." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-slate-700">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-sm font-semibold text-slate-200">Argus AI</span>
        <span className="text-xs text-slate-500 ml-auto">Structural Intelligence Layer</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm
              ${m.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-200 border border-slate-700"}`}>
              {m.content}
              {m.sources && m.sources.length > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  Sources: {m.sources.join(", ")}
                </p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-400">
              Argus is thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-700 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder='Ask Argus — e.g. "Strain on Pier 4?"'
          className="flex-1 bg-slate-800 text-sm text-slate-200 placeholder-slate-500 rounded-lg px-3 py-2 outline-none border border-slate-700 focus:border-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
```

---

## 9. Dashboard Page Layout (`app/dashboard/page.tsx`)

```typescript
import { fetchAnomalies, fetchIHI } from "@/lib/api";
import { IHIGauge } from "@/components/dashboard/IHIGauge";
import { EMBTicker } from "@/components/dashboard/EMBTicker";
import { AnomalyFeed } from "@/components/dashboard/AnomalyFeed";
import { SensorChart } from "@/components/dashboard/SensorChart";
import { DigitalTwinViewer } from "@/components/twin/DigitalTwinViewer";
import { ArgusPanel } from "@/components/argus/ArgusPanel";

export const revalidate = 0;   // No ISR — always fresh SSR

export default async function DashboardPage() {
  const [anomalies] = await Promise.allSettled([fetchAnomalies({ limit: 50 })]);
  const initialAnomalies = anomalies.status === "fulfilled" ? anomalies.value : [];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 flex flex-col gap-4">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight text-slate-100">
          🏗 Arc-Sentinel <span className="text-slate-500 font-normal text-sm">· Vigilance Dashboard</span>
        </h1>
        <span className="text-xs text-slate-500">{new Date().toLocaleString()}</span>
      </div>

      {/* EMB Ticker (full width) */}
      <EMBTicker initialAnomalies={initialAnomalies} />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">

        {/* Left column — IHI + Anomaly Feed */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col items-center">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Infrastructure Health Index</p>
            <IHIGauge />
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col gap-2 flex-1">
            <p className="text-xs text-slate-500 uppercase tracking-widest">Live Anomaly Feed</p>
            <AnomalyFeed initialAnomalies={initialAnomalies} />
          </div>
        </div>

        {/* Center column — 3D Twin + Charts */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">3D Digital Twin</p>
            <DigitalTwinViewer anomalies={initialAnomalies} />
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Pier 4 — Vibration</p>
            <SensorChart node_id="pier_4" />
          </div>
        </div>

        {/* Right column — Argus AI */}
        <div className="h-[600px] lg:h-auto">
          <ArgusPanel />
        </div>

      </div>
    </div>
  );
}
```

---

## 10. Tailwind Config (`tailwind.config.ts`)

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sentinel: {
          bg:      "#0f172a",
          surface: "#1e293b",
          border:  "#334155",
        }
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      }
    },
  },
  plugins: [],
};

export default config;
```

Add to `styles/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@keyframes marquee {
  from { transform: translateX(100vw); }
  to   { transform: translateX(-100%); }
}
```

---

## 11. Dependencies (`package.json` additions)

```json
{
  "dependencies": {
    "next": "14.2.4",
    "react": "^18",
    "react-dom": "^18",
    "typescript": "^5",
    "@supabase/ssr": "^0.3.0",
    "@supabase/supabase-js": "^2.43.4",
    "three": "^0.165.0",
    "recharts": "^2.12.7",
    "date-fns": "^3.6.0",
    "tailwindcss": "^3.4.4",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "@types/three": "^0.165.0",
    "@types/node": "^20",
    "@types/react": "^18",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38"
  }
}
```

---

## 12. Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Copy env and fill in keys
cp .env.local.example .env.local

# 3. Start dev server
npm run dev

# Open http://localhost:3000/dashboard
```

---

## 13. Component & Data Flow Map

```
Supabase (anomalies table)
   │
   └─► useRealtimeAnomalies hook (WebSocket subscription)
           │
           ├─► EMBTicker     — scrolling alert broadcast
           ├─► AnomalyFeed   — live anomaly cards
           └─► DigitalTwinViewer — red spheres on 3D model

Backend /ihi (polled every 5s)
   └─► useIHI hook
           └─► IHIGauge — animated arc gauge

Backend /latest (polled every 10s)
   └─► useSensorHistory hook
           └─► SensorChart — recharts time-series

User input → ArgusPanel → POST /argus/chat
   └─► ArgusMessage bubbles with source attribution
```

---

## 14. Key Design Decisions for MVP

| Decision | Rationale |
|---|---|
| **Server-side initial data fetch** | Next.js SSR pre-populates anomaly feed; Realtime subscription then takes over |
| **Three.js without OrbitControls** | Keeps the bundle light; auto-rotation gives the "live" feel without user interaction |
| **Recharts over D3** | Faster to build, React-native, zero SVG boilerplate |
| **Polling for IHI** | IHI changes on every sensor ingest — polling is simpler than a second Realtime channel |
| **No auth for MVP** | Dashboard is read-only public; add Supabase Auth with Row Level Security in v2 |

---

## 15. Future Enhancements

- Add **Supabase Auth** with role-based access (engineer vs. admin vs. viewer).
- Add **node selector UI** to switch SensorChart between monitoring points.
- Replace box geometry with a real **GLTF bridge asset** loaded via `GLTFLoader`.
- Add **dark/light theme** toggle via `next-themes`.
- Implement **mobile PWA** manifest for field inspector use on tablets.
