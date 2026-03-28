"use client";
import { useEffect, useState } from "react";
import { fetchIHI } from "@/lib/api";
import { IHIResponse } from "@/lib/types";

export function useIHI(pollIntervalMs = 5000) {
  const [ihi, setIHI] = useState<IHIResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIHI(await fetchIHI());
      } catch {
        /* silent retry */
      }
    };
    load();
    const interval = setInterval(load, pollIntervalMs);
    return () => clearInterval(interval);
  }, [pollIntervalMs]);

  return ihi;
}
