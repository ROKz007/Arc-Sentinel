"use client";
import { useRealtimeAnomalies } from "@/hooks/useRealtimeAnomalies";
import { Anomaly } from "@/lib/types";
import TwinScene from "./TwinScene";

// Thin wrapper to drop the twin scene into the HUD viewport with realtime anomalies when available.
export function HudTwinViewport({ initialAnomalies = [] }: { initialAnomalies?: Anomaly[] }) {
  const anomalies = useRealtimeAnomalies(initialAnomalies);
  return <TwinScene anomalies={anomalies} />;
}
