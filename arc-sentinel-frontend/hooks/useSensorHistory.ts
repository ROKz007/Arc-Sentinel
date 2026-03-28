"use client";
import { useEffect, useState } from "react";
import { fetchSensorHistory } from "@/lib/api";
import { SensorLog } from "@/lib/types";

export function useSensorHistory(node_id: string, limit = 50) {
  const [data, setData] = useState<SensorLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setData(await fetchSensorHistory(node_id, limit));
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [node_id, limit]);

  return { data, loading };
}
