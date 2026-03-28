"use client";
import { useRealtimeAnomalies } from "@/hooks/useRealtimeAnomalies";
import { Anomaly } from "@/lib/types";

const SEVERITY_ICON: Record<string, string> = {
  yellow: "[Y]",
  orange: "[O]",
  red: "[R]",
  critical: "[C]",
};

interface Props { initialAnomalies: Anomaly[]; }

export function EMBTicker({ initialAnomalies }: Props) {
  const anomalies = useRealtimeAnomalies(initialAnomalies);
  const unresolved = anomalies.filter((a) => !a.resolved);

  if (unresolved.length === 0)
    return (
      <div className="bg-slate-800 border border-slate-700 rounded px-4 py-2 text-xs text-green-400">
        OK All systems nominal -- No active alerts.
      </div>
    );

  const tickerText = unresolved
    .map((a) => `${SEVERITY_ICON[a.severity]} [${a.severity.toUpperCase()}] ${a.description}`)
    .join("   |   ");

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
