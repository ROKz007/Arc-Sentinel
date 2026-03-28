"use client";
import { useState } from "react";
import { HudTwinViewport } from "@/components/twin/HudTwinViewport";
import { BackendStatus } from "@/components/dashboard/BackendStatus";
import { ArgusChat } from "@/components/dashboard/ArgusChat";
import { fetchAnomalies, fetchIHI, fetchSensorHistory } from "@/lib/api";
import { Anomaly, SensorLog } from "@/lib/types";

type ScanState = "idle" | "scanning" | "done";

function ihiLabel(score: number) {
  if (score >= 80) return "NOMINAL";
  if (score >= 60) return "DEGRADED";
  if (score >= 40) return "CRITICAL";
  return "FAILURE";
}

function ihiColor(score: number) {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
}

export default function DashboardPage() {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [ihi, setIhi] = useState({ score: 0, breakdown: {} as Record<string, number> });
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [latestSensor, setLatestSensor] = useState<SensorLog | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const unresolvedCount = anomalies.filter((a) => !a.resolved).length;
  const latestAnomaly = anomalies.find((a) => !a.resolved);

  async function runScan() {
    if (scanState === "scanning") return;
    setScanState("scanning");
    try {
      const [ihiData, anomalyData, sensorData] = await Promise.all([
        fetchIHI().catch(() => ({ score: 0, breakdown: {} })),
        fetchAnomalies({ limit: 50 }).catch(() => []),
        fetchSensorHistory("deck_mid", 10).catch(() => []),
      ]);
      setIhi(ihiData);
      setAnomalies(anomalyData);
      const accel = (sensorData as SensorLog[]).find((s) => s.sensor_type === "accelerometer");
      setLatestSensor(accel ?? (sensorData as SensorLog[])[0] ?? null);
      setLastScanned(new Date().toLocaleTimeString());
      setScanState("done");
    } catch {
      setScanState("done");
    }
  }

  const tickerContent = scanState === "idle"
    ? "AWAITING SENSOR SCAN — PRESS RUN SENSOR SCAN TO FETCH LATEST READINGS"
    : scanState === "scanning"
    ? "SCAN IN PROGRESS — POLLING ALL SENSOR NODES..."
    : unresolvedCount > 0
    ? anomalies.filter((a) => !a.resolved).map((a) => `[${a.severity.toUpperCase()}] ${a.node_id.replace("_", " ")}: ${a.description}`).join("   //   ")
    : "ALL SYSTEMS NOMINAL — NO ACTIVE ALERTS DETECTED";

  const tickerAlert = scanState === "done" && unresolvedCount > 0;

  return (
    <div className="text-on-surface font-body selection:bg-primary/30 selection:text-primary overflow-hidden min-h-screen flex flex-col">
      <div className="fixed inset-0 neural-mesh pointer-events-none animate-mesh z-0" />

      {/* Ticker bar */}
      <div className="h-10 w-full hazard-stripe flex items-center justify-center overflow-hidden z-[110] border-b border-black shrink-0">
        <div className="bg-obsidian/95 px-8 flex items-center space-x-6 w-full h-full">
          <span className={`font-mono text-xs font-bold uppercase tracking-widest whitespace-nowrap ${tickerAlert ? "text-hazard-red animate-pulse" : "text-primary/60"}`}>
            {tickerAlert ? "HAZARD DETECTED" : scanState === "scanning" ? "SCANNING..." : "TELEMETRY STREAM"}
          </span>
          <div className="flex-1 overflow-hidden whitespace-nowrap relative">
            <span className="inline-block font-mono text-[11px] text-on-surface/90 uppercase tracking-[0.2em] animate-ticker">
              {tickerContent}
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="glass text-primary tracking-[0.2em] uppercase text-xl fixed top-10 w-full border-b border-primary/20 flex justify-between items-center px-8 h-16 z-[100]">
        <div className="flex items-center gap-6">
          <span className="material-symbols-outlined text-3xl" aria-hidden>grid_view</span>
          <h1 className="font-grit text-2xl">ARC-SENTINEL // MISSION CONTROL</h1>
        </div>
        <div className="hidden lg:flex gap-10 text-xs font-bold h-full">
          <span className="nav-link flex items-center px-2 text-secondary drop-shadow-[0_0_8px_rgba(253,224,71,0.5)] border-b-2 border-secondary">DASHBOARD</span>
          <span className="nav-link flex items-center px-2 text-primary/30 border-b-2 border-transparent cursor-not-allowed">TWIN</span>
          <span className="nav-link flex items-center px-2 text-primary/30 border-b-2 border-transparent cursor-not-allowed">SENSORS</span>
          <span className="nav-link flex items-center px-2 text-primary/30 border-b-2 border-transparent cursor-not-allowed">COMMAND</span>
        </div>
        <div className="flex items-center gap-4">
          <BackendStatus />
        </div>
      </header>

      <div className="flex flex-1 pt-28 pb-4 overflow-hidden relative z-10 px-6 gap-6">
        <main className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-6">

          {/* Hero layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">

            {/* 3D Twin Viewer */}
            <div className="lg:col-span-8 relative glass backdrop-blur-xl cyber-clip holographic-glow overflow-hidden group border border-primary/30 bg-obsidian/40">
              <div className="absolute inset-0 crt-overlay z-40" />
              <div className="absolute inset-x-0 h-[2px] bg-primary/60 top-0 animate-scan z-20 shadow-[0_0_15px_#0EA5E9]" />
              <div className="absolute inset-0 scanline opacity-30 z-10" />
              <div className="absolute inset-0 z-20 pointer-events-auto">
                <HudTwinViewport initialAnomalies={anomalies} />
              </div>
              {/* Last scan timestamp */}
              {lastScanned && (
                <div className="absolute top-4 left-4 z-50 font-mono text-[10px] text-primary/60 bg-obsidian/70 px-2 py-1 border-l-2 border-primary/40 backdrop-blur-md">
                  LAST SCAN: {lastScanned}
                </div>
              )}
              {/* Node count */}
              {scanState === "done" && (
                <div className="absolute bottom-4 right-4 z-50 font-mono text-[10px] text-secondary/80 bg-obsidian/70 px-2 py-1 border-r-2 border-secondary/40 backdrop-blur-md text-right">
                  <p>NODES MONITORED: {Object.keys(ihi.breakdown).length || 1}</p>
                  <p>ANOMALIES FLAGGED: {unresolvedCount}</p>
                </div>
              )}
            </div>

            {/* IHI + Scan Button */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="flex-1 glass backdrop-blur-xl cyber-clip holographic-glow p-8 flex flex-col items-center justify-center relative border border-primary/30 group hover:border-secondary/40 transition-colors bg-obsidian/40">
                <h3 className="font-headline text-xs tracking-[0.3em] text-primary mb-10 group-hover:text-secondary transition-colors uppercase">
                  INTEGRITY_HEALTH_INDEX
                </h3>
                <div className={`relative w-56 h-56 flex items-center justify-center ${scanState === "done" ? "animate-none" : "animate-pulse"}`}>
                  <div className="absolute inset-0 rounded-full bg-primary/10 shadow-[0_0_60px_rgba(14,165,233,0.4)]" />
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30 animate-[spin_12s_linear_infinite]" />
                  <div className="absolute inset-4 rounded-full border border-secondary/20 animate-[spin_8s_linear_infinite_reverse]" />
                  <div className="absolute inset-0 rounded-full border border-primary/20 backdrop-blur-sm" />
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <span className={`font-mono text-7xl font-bold transition-all ${scanState === "done" ? ihiColor(ihi.score) : "text-primary/30"}`}>
                      {ihi.score > 0 ? ihi.score.toFixed(1) : "—"}
                    </span>
                    <span className={`font-mono text-[12px] opacity-70 tracking-widest mt-2 uppercase ${scanState === "done" ? ihiColor(ihi.score) : "text-primary/30"}`}>
                      {scanState === "done" ? ihiLabel(ihi.score) : "AWAITING SCAN"}
                    </span>
                  </div>
                </div>
                {/* IHI breakdown */}
                {scanState === "done" && Object.keys(ihi.breakdown).length > 0 && (
                  <div className="mt-8 w-full space-y-1">
                    {Object.entries(ihi.breakdown).map(([node, val]) => (
                      <div key={node} className="flex justify-between font-mono text-[10px] opacity-60 uppercase">
                        <span>{node.replace("_", " ")}</span>
                        <span>{typeof val === "number" ? val.toFixed(1) : val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scan button */}
              <button
                onClick={runScan}
                disabled={scanState === "scanning"}
                className="h-16 bg-primary text-obsidian font-headline font-black uppercase tracking-[0.15em] flex items-center justify-center relative hover:bg-secondary transition-all group overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-secondary group-hover:bg-obsidian transition-colors" />
                <span className="material-symbols-outlined mr-3 relative z-10 text-2xl" aria-hidden>
                  {scanState === "scanning" ? "sync" : "radar"}
                </span>
                <span className="relative z-10 text-sm">
                  {scanState === "scanning" ? "SCANNING..." : "RUN SENSOR SCAN"}
                </span>
              </button>
            </div>
          </div>

          {/* Analytics grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6">

            {/* Vibration card */}
            <div className="glass backdrop-blur-xl cyber-clip p-5 border border-primary/20 hover:border-primary/50 transition-all group relative overflow-hidden bg-obsidian/40">
              <div className="absolute inset-0 scanline opacity-10 pointer-events-none" />
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-primary group-hover:text-secondary" aria-hidden>monitor_heart</span>
                <span className="font-mono text-[9px] px-2 py-1 bg-primary/10 rounded uppercase">
                  {scanState === "scanning" ? "POLLING..." : scanState === "done" ? "LIVE_FEED" : "AWAITING"}
                </span>
              </div>
              <p className="font-mono text-3xl font-bold text-primary text-glow-primary mb-1">
                {latestSensor
                  ? <>{latestSensor.value.toFixed(2)} <span className="text-xs font-normal font-body">{latestSensor.unit}</span></>
                  : <span className="text-primary/30">—</span>
                }
              </p>
              <p className="font-headline text-[10px] tracking-widest opacity-60 uppercase">
                {latestSensor ? latestSensor.sensor_type.replace("_", " ") : "SENSOR READING"}
              </p>
              <p className="font-mono text-[10px] mt-4 text-primary/40 uppercase">
                {latestSensor ? `NODE: ${latestSensor.node_id.replace("_", " ")}` : "No scan performed"}
              </p>
            </div>

            {/* Active anomalies card */}
            <div className="glass backdrop-blur-xl cyber-clip p-5 border border-secondary/20 hover:border-secondary/50 transition-all group relative overflow-hidden bg-obsidian/40">
              <div className="absolute inset-0 scanline opacity-10 pointer-events-none" />
              <div className="flex justify-between items-start mb-4">
                <span className={`material-symbols-outlined text-secondary ${scanState === "done" && unresolvedCount > 0 ? "animate-pulse" : ""}`} aria-hidden>warning</span>
                <span className="font-mono text-[9px] px-2 py-1 bg-secondary/20 text-secondary rounded uppercase">ANOMALIES</span>
              </div>
              <p className="font-mono text-3xl font-bold text-secondary text-glow-secondary mb-1">
                {scanState === "done" ? unresolvedCount.toString().padStart(3, "0") : <span className="text-secondary/30">—</span>}
              </p>
              <p className="font-headline text-[10px] tracking-widest opacity-60 uppercase">ACTIVE ALERTS</p>
              <p className="font-mono text-[10px] mt-4 text-secondary/70 uppercase leading-tight">
                {scanState === "done"
                  ? latestAnomaly
                    ? `${latestAnomaly.node_id.replace("_", " ")}: ${latestAnomaly.description.slice(0, 48)}...`
                    : "No active anomalies"
                  : "Run scan to check"}
              </p>
            </div>

            {/* Argus AI chat */}
            <div className="md:col-span-2 glass backdrop-blur-xl cyber-clip p-5 border border-primary/10 hover:border-primary/40 transition-all group flex flex-col bg-obsidian/40 relative overflow-hidden">
              <div className="absolute inset-0 scanline opacity-5 pointer-events-none" />
              <ArgusChat />
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="hidden xl:flex flex-col w-72 glass backdrop-blur-xl border-l border-primary/20 p-6 shrink-0 z-50 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none opacity-5 flex justify-between px-4">
            <div className="matrix-text text-primary animate-matrix">X01Y02Z03_ALPHA_SIGMA_77_KILO_88_V_99</div>
            <div className="matrix-text text-primary animate-matrix" style={{ animationDelay: "-5s" }}>BETA_GRID_SCAN_909_OMNI_READY_STREAM</div>
            <div className="matrix-text text-primary animate-matrix" style={{ animationDelay: "-12s" }}>SENTINEL_ACT_9_PROC_LOAD_74_PERCENT</div>
          </div>
          <div className="absolute inset-0 scanline opacity-5 pointer-events-none" />

          <div className="flex-1 space-y-6 relative z-10">
            <div className="space-y-2">
              <p className="font-headline text-[10px] text-primary tracking-widest uppercase">Navigation</p>
              <nav className="space-y-1 font-mono text-xs">
                <div className="flex items-center gap-3 p-3 bg-primary/10 text-primary border-l-2 border-secondary">
                  <span className="material-symbols-outlined text-lg" aria-hidden>dashboard</span>
                  <span>MAIN_CORE</span>
                </div>
                <div className="flex items-center gap-3 p-3 text-on-surface/30 cursor-not-allowed">
                  <span className="material-symbols-outlined text-lg" aria-hidden>visibility</span>
                  <span>NODES_VIEW</span>
                </div>
                <div className="flex items-center gap-3 p-3 text-on-surface/30 cursor-not-allowed">
                  <span className="material-symbols-outlined text-lg" aria-hidden>history</span>
                  <span>ARCHIVES</span>
                </div>
              </nav>
            </div>

            {/* System alert — real data from scan */}
            <div className={`p-4 border rounded ${scanState === "done" && latestAnomaly ? "border-secondary/40 bg-secondary/5" : "border-primary/20 bg-primary/5"}`}>
              <p className={`font-headline text-[9px] tracking-widest mb-2 uppercase ${scanState === "done" && latestAnomaly ? "text-secondary" : "text-primary/60"}`}>
                SYSTEM_STATUS
              </p>
              <p className="font-mono text-[10px] text-on-surface/70 leading-tight">
                {scanState === "idle"
                  ? "No scan performed. Press RUN SENSOR SCAN to fetch live readings."
                  : scanState === "scanning"
                  ? "Scanning all sensor nodes..."
                  : latestAnomaly
                  ? `[${latestAnomaly.severity.toUpperCase()}] ${latestAnomaly.node_id.replace("_", " ")}: ${latestAnomaly.description}`
                  : "All sensor nodes reporting nominal. No anomalies detected."}
              </p>
            </div>
          </div>

          {/* Argus listening indicator */}
          <div className="mt-auto pt-8 border-t border-primary/10 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[10px] text-secondary text-glow-secondary tracking-[0.2em] uppercase">ARGUS_LISTENING</p>
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            </div>
            <div className="flex items-end justify-between h-12 gap-1 px-2">
              <div className="waveform-bar w-full bg-primary/40" style={{ animationDelay: "0.1s", height: "30%" }} />
              <div className="waveform-bar w-full bg-primary/60" style={{ animationDelay: "0.2s", height: "60%" }} />
              <div className="waveform-bar w-full bg-primary/80" style={{ animationDelay: "0.3s", height: "90%" }} />
              <div className="waveform-bar w-full bg-primary" style={{ animationDelay: "0.4s", height: "50%" }} />
              <div className="waveform-bar w-full bg-primary/80" style={{ animationDelay: "0.5s", height: "80%" }} />
              <div className="waveform-bar w-full bg-primary/60" style={{ animationDelay: "0.6s", height: "40%" }} />
              <div className="waveform-bar w-full bg-primary/40" style={{ animationDelay: "0.7s", height: "70%" }} />
              <div className="waveform-bar w-full bg-primary/20" style={{ animationDelay: "0.8s", height: "30%" }} />
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden glass backdrop-blur-xl text-primary font-mono text-[10px] uppercase fixed bottom-0 w-full h-20 border-t border-primary/20 z-[120] flex justify-around items-center px-6">
        <div className="flex flex-col items-center justify-center text-secondary text-glow-secondary">
          <span className="material-symbols-outlined text-2xl" aria-hidden>monitor_heart</span>
          <span>PULSE</span>
        </div>
        <button onClick={runScan} disabled={scanState === "scanning"} className="flex flex-col items-center justify-center text-primary/50 hover:text-primary transition-all disabled:opacity-40">
          <span className="material-symbols-outlined text-2xl" aria-hidden>radar</span>
          <span>SCAN</span>
        </button>
        <div className="flex flex-col items-center justify-center text-primary/50">
          <span className="material-symbols-outlined text-2xl" aria-hidden>warning</span>
          <span>ALERTS</span>
        </div>
        <div className="flex flex-col items-center justify-center text-primary/50">
          <span className="material-symbols-outlined text-2xl" aria-hidden>terminal</span>
          <span>LOGS</span>
        </div>
      </nav>
    </div>
  );
}
