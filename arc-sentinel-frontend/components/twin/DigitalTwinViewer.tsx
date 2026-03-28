"use client";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useRealtimeAnomalies } from "@/hooks/useRealtimeAnomalies";

// Load the real TwinScene (client-only). Falls back to placeholder if model is missing.
const Scene = dynamic(() => import("./TwinScene"), { ssr: false, loading: () => <div className="h-64 bg-slate-800 animate-pulse rounded" /> });

export function DigitalTwinViewer() {
  const key = useMemo(() => Date.now(), []);
  // Hook supplies realtime anomalies via Supabase realtime channel when configured
  const anomalies = useRealtimeAnomalies([]);

  return (
    <div className="rounded border border-slate-800 bg-panel p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Digital Twin</h3>
        <span className="text-[10px] text-slate-500">Three.js ready</span>
      </div>
      <Scene key={key} anomalies={anomalies} />
    </div>
  );
}
