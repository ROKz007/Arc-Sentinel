import { HudTwinViewport } from "@/components/twin/HudTwinViewport";

export default function DashboardPage() {
  return (
    <div className="text-on-surface font-body selection:bg-primary/30 selection:text-primary overflow-hidden min-h-screen flex flex-col">
      <div className="fixed inset-0 neural-mesh pointer-events-none animate-mesh z-0" />

      {/* Ticker bar */}
      <div className="h-10 w-full hazard-stripe flex items-center justify-center overflow-hidden z-[110] border-b border-black shrink-0">
        <div className="bg-obsidian/95 px-8 flex items-center space-x-6 w-full h-full">
          <span className="font-mono text-xs font-bold text-hazard-red animate-pulse uppercase tracking-widest whitespace-nowrap">CRITICAL TELEMETRY STREAM // HAZARD DETECTED</span>
          <div className="flex-1 overflow-hidden whitespace-nowrap relative">
            <span className="inline-block font-mono text-[11px] text-on-surface/90 uppercase tracking-[0.2em] animate-ticker">
              BRIDGE SPAN 4: STRESS RATIO 0.0024 // WIND SPEED 12KT // VERTICAL DISPLACEMENT 2mm // AI ANALYSIS: OPTIMAL STRUCTURAL INTEGRITY // SENSOR NODE 88-X STATUS: ACTIVE // NEXT SCAN IN 04:59s // ANOMALY COUNT: 004 // HAZARD LEVEL: ELEVATED //
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="glass text-primary tracking-[0.2em] uppercase text-xl fixed top-10 w-full border-b border-primary/20 flex justify-between items-center px-8 h-16 z-[100]">
        <div className="flex items-center gap-6">
          <span className="material-symbols-outlined text-3xl cursor-pointer hover:text-secondary transition-all" aria-hidden>grid_view</span>
          <h1 className="font-grit text-2xl">ARC-SENTINEL // MISSION CONTROL</h1>
        </div>
        <div className="hidden lg:flex gap-10 text-xs font-bold h-full">
          <a className="nav-link flex items-center px-2 text-secondary drop-shadow-[0_0_8px_rgba(253,224,71,0.5)] border-b-2 border-secondary" href="#">DASHBOARD</a>
          <a className="nav-link flex items-center px-2 text-primary/70 hover:text-primary transition-all border-b-2 border-transparent" href="#">TWIN</a>
          <a className="nav-link flex items-center px-2 text-primary/70 hover:text-primary transition-all border-b-2 border-transparent" href="#">SENSORS</a>
          <a className="nav-link flex items-center px-2 text-primary/70 hover:text-primary transition-all border-b-2 border-transparent" href="#">COMMAND</a>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-mono text-[10px] text-right">
            <p className="text-secondary">UPLINK_ESTABLISHED</p>
            <p className="opacity-50">LATENCY: 12ms</p>
          </div>
          <span className="material-symbols-outlined text-3xl cursor-pointer hover:text-secondary transition-all" aria-hidden>settings_input_antenna</span>
        </div>
      </header>

      <div className="flex flex-1 pt-28 pb-4 overflow-hidden relative z-10 px-6 gap-6">
        <main className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-6">
          {/* Hero layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
            <div className="lg:col-span-8 relative glass backdrop-blur-xl cyber-clip holographic-glow overflow-hidden group border border-primary/30 bg-obsidian/40">
              <div className="absolute inset-0 crt-overlay z-40" />
              <div className="absolute inset-x-0 h-[2px] bg-primary/60 top-0 animate-scan z-20 shadow-[0_0_15px_#0EA5E9]" />
              <div className="absolute inset-0 scanline opacity-30 z-10" />
              <div className="absolute inset-0 z-20 pointer-events-auto">
                <HudTwinViewport />
              </div>
              <div className="absolute inset-0 z-30 pointer-events-none">
                <div className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: "linear-gradient(rgba(14, 165, 233, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.3) 1px, transparent 1px)",
                    backgroundSize: "50px 50px",
                    backgroundPosition: "center bottom",
                    transform: "perspective(1000px) rotateX(60deg) scale(2)",
                    transformOrigin: "center bottom",
                    height: "200%",
                    top: "-50%",
                  }}
                />
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-12 font-mono text-[9px] text-primary/40 uppercase tracking-widest">
                  <div className="flex items-center gap-2"><span className="w-3 h-[1px] bg-red-500/50" />X_AXIS</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-[1px] bg-green-500/50" />Y_AXIS</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-[1px] bg-blue-500/50" />Z_AXIS</div>
                </div>
              </div>
              <div className="absolute top-6 left-6 z-50 font-mono text-[11px] text-primary/90 space-y-2 bg-obsidian/60 p-3 border-l-2 border-primary backdrop-blur-md">
                <p className="animate-pulse">LAT: 40.7128° N</p>
                <p className="animate-pulse" style={{ animationDelay: "0.1s" }}>LONG: 74.0060° W</p>
                <p className="animate-pulse" style={{ animationDelay: "0.2s" }}>STRAIN_VAL: 0.0042</p>
                <p className="animate-pulse" style={{ animationDelay: "0.3s" }}>ELEV: 135.4m</p>
              </div>
              <div className="absolute bottom-6 right-6 z-50 font-mono text-[11px] text-secondary/90 text-right bg-obsidian/60 p-3 border-r-2 border-secondary backdrop-blur-md">
                <p>STREAMING_UHD_DATA</p>
                <p>FPS: 60.00</p>
                <p>BITRATE: 45.2 MBPS</p>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="flex-1 glass backdrop-blur-xl cyber-clip holographic-glow p-8 flex flex-col items-center justify-center relative border border-primary/30 group hover:border-secondary/40 transition-colors bg-obsidian/40">
                <h3 className="font-headline text-xs tracking-[0.3em] text-primary mb-10 group-hover:text-secondary transition-colors uppercase">INTEGRITY_HEALTH_INDEX</h3>
                <div className="relative w-56 h-56 flex items-center justify-center animate-pulse">
                  <div className="absolute inset-0 rounded-full bg-primary/10 shadow-[0_0_60px_rgba(14,165,233,0.4)]" />
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30 animate-[spin_12s_linear_infinite]" />
                  <div className="absolute inset-4 rounded-full border border-secondary/20 animate-[spin_8s_linear_infinite_reverse]" />
                  <div className="absolute inset-0 rounded-full border border-primary/20 backdrop-blur-sm" />
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <span className="font-mono text-7xl font-bold text-glow-primary group-hover:text-glow-secondary group-hover:text-secondary transition-all">98.4</span>
                    <span className="font-mono text-[12px] opacity-70 tracking-widest mt-2 uppercase">STABLE_PULSE</span>
                  </div>
                </div>
                <div className="mt-10 w-full font-mono text-[10px] flex justify-between px-6 opacity-60 uppercase tracking-tighter">
                  <span>MIN: 94.2</span>
                  <span>MAX: 99.1</span>
                  <span>AVG: 97.8</span>
                </div>
              </div>
              <button className="h-20 bg-primary text-obsidian font-headline font-black uppercase tracking-[0.3em] flex items-center justify-center relative hover:bg-secondary transition-all group overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-secondary group-hover:bg-obsidian transition-colors" />
                <span className="relative z-10">INITIATE SCAN_PROTOCOL</span>
                <span className="material-symbols-outlined ml-4 relative z-10 text-3xl" aria-hidden>android_fingerprint</span>
              </button>
            </div>
          </div>

          {/* Analytics grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6">
            <div className="glass backdrop-blur-xl cyber-clip p-5 border border-primary/20 hover:border-primary/50 transition-all group relative overflow-hidden bg-obsidian/40">
              <div className="absolute inset-0 scanline opacity-10 pointer-events-none" />
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-primary group-hover:text-secondary" aria-hidden>monitor_heart</span>
                <span className="font-mono text-[9px] px-2 py-1 bg-primary/10 rounded uppercase">LIVE_FEED</span>
              </div>
              <p className="font-mono text-3xl font-bold text-primary text-glow-primary mb-1">2.44 <span className="text-xs font-normal font-body">mm/s</span></p>
              <p className="font-headline text-[10px] tracking-widest opacity-60 uppercase">VIBRATION_AMPLITUDE</p>
              <div className="mt-6 h-16 flex items-end gap-1">
                <div className="flex-1 bg-primary/20 h-[40%]" />
                <div className="flex-1 bg-primary/40 h-[60%]" />
                <div className="flex-1 bg-primary/20 h-[30%]" />
                <div className="flex-1 bg-primary/60 h-[80%]" />
                <div className="flex-1 bg-primary h-[100%]" />
                <div className="flex-1 bg-primary/30 h-[50%]" />
              </div>
            </div>

            <div className="glass backdrop-blur-xl cyber-clip p-5 border border-secondary/20 hover:border-secondary/50 transition-all group relative overflow-hidden bg-obsidian/40">
              <div className="absolute inset-0 scanline opacity-10 pointer-events-none" />
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-secondary animate-pulse" aria-hidden>warning</span>
                <span className="font-mono text-[9px] px-2 py-1 bg-secondary/20 text-secondary rounded uppercase">CRITICAL_SCAN</span>
              </div>
              <p className="font-mono text-3xl font-bold text-secondary text-glow-secondary mb-1">004</p>
              <p className="font-headline text-[10px] tracking-widest opacity-60 uppercase">ACTIVE_ANOMALIES</p>
              <p className="font-mono text-[10px] mt-6 text-secondary/80 uppercase leading-tight">Thermal deviation detected: Segment 42B-Delta</p>
            </div>

            <div className="md:col-span-2 glass backdrop-blur-xl cyber-clip p-5 border border-primary/10 hover:border-primary/40 transition-all group flex flex-col bg-obsidian/40 relative overflow-hidden">
              <div className="absolute inset-0 scanline opacity-5 pointer-events-none" />
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary" aria-hidden>psychology</span>
                  <span className="font-headline text-[10px] tracking-[0.2em]">ARGUS_AI_INSIGHT</span>
                </div>
                <span className="font-mono text-[9px] px-3 py-1 border border-primary/30 text-primary uppercase">PREDICTIVE_ENGINE_V4.2</span>
              </div>
              <div className="flex-1 mb-6">
                <p className="font-mono text-[13px] leading-relaxed text-on-surface/80 cursor-blink inline">
                  &gt; Structural fatigue simulation predicts a 0.05% increase in stress at Pylon A between 0200h-0500h due to forecasted tidal currents. Recommended maintenance: No immediate action, continue observation. Cross-referencing with historical telemetry 08-B...
                </p>
              </div>
              <div className="flex gap-4">
                <button className="text-[10px] font-headline border border-primary/30 px-5 py-2 hover:bg-primary/10 transition-colors uppercase tracking-widest">View Simulation</button>
                <button className="text-[10px] font-headline bg-primary/10 border border-primary/30 px-5 py-2 hover:bg-primary/20 transition-colors uppercase tracking-widest">Acknowledge</button>
              </div>
            </div>
          </div>
        </main>

        <aside className="hidden xl:flex flex-col w-72 glass backdrop-blur-xl border-l border-primary/20 p-6 shrink-0 z-50 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none opacity-5 flex justify-between px-4">
            <div className="matrix-text text-primary animate-matrix">X01Y02Z03_ALPHA_SIGMA_77_KILO_88_V_99</div>
            <div className="matrix-text text-primary animate-matrix" style={{ animationDelay: "-5s" }}>BETA_GRID_SCAN_909_OMNI_READY_STREAM</div>
            <div className="matrix-text text-primary animate-matrix" style={{ animationDelay: "-12s" }}>SENTINEL_ACT_9_PROC_LOAD_74_PERCENT</div>
          </div>
          <div className="absolute inset-0 scanline opacity-5 pointer-events-none" />
          <div className="mb-8 relative z-10">
            <p className="font-mono text-[10px] text-primary/60 mb-2 tracking-tighter uppercase">PROCESSOR_LOAD</p>
            <div className="h-1 w-full bg-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-primary w-[74%]" />
            </div>
          </div>
          <div className="flex-1 space-y-6 relative z-10">
            <div className="space-y-2">
              <p className="font-headline text-[10px] text-primary tracking-widest uppercase">Navigation</p>
              <nav className="space-y-1 font-mono text-xs">
                <div className="flex items-center gap-3 p-3 bg-primary/10 text-primary border-l-2 border-secondary cursor-pointer hover:bg-primary/20 transition-all">
                  <span className="material-symbols-outlined text-lg" aria-hidden>dashboard</span>
                  <span>MAIN_CORE</span>
                </div>
                <div className="flex items-center gap-3 p-3 text-on-surface/50 hover:bg-primary/5 hover:text-primary transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-lg" aria-hidden>visibility</span>
                  <span>NODES_VIEW</span>
                </div>
                <div className="flex items-center gap-3 p-3 text-on-surface/50 hover:bg-primary/5 hover:text-primary transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-lg" aria-hidden>history</span>
                  <span>ARCHIVES</span>
                </div>
              </nav>
            </div>
            <div className="p-4 border border-primary/20 bg-primary/5 rounded">
              <p className="font-headline text-[9px] text-secondary tracking-widest mb-2 uppercase">System_Alert</p>
              <p className="font-mono text-[10px] text-on-surface/70 leading-tight">Environmental sensors report 15% increase in atmospheric salinity.</p>
            </div>
          </div>
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
        <div className="flex flex-col items-center justify-center text-primary/50">
          <span className="material-symbols-outlined text-2xl" aria-hidden>biometric_setup</span>
          <span>SCAN</span>
        </div>
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
