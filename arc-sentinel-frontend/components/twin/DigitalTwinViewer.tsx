"use client";
import dynamic from "next/dynamic";
import { useMemo } from "react";

// Placeholder for future Three.js scene. Dynamic import keeps bundle light when unused.
const Scene = dynamic(() => import("./TwinScenePlaceholder"), { ssr: false, loading: () => <div className="h-64 bg-slate-800 animate-pulse rounded" /> });

export function DigitalTwinViewer() {
  const key = useMemo(() => Date.now(), []);
  return (
    <div className="rounded border border-slate-800 bg-panel p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Digital Twin</h3>
        <span className="text-[10px] text-slate-500">Three.js ready</span>
      </div>
      <Scene key={key} />
    </div>
  );
}
