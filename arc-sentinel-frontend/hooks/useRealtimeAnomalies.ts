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
          setAnomalies((prev) => [newAnomaly, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return anomalies;
}
