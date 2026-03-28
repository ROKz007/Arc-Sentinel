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
