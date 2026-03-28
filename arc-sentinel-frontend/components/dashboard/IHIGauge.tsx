"use client";
import { useIHI } from "@/hooks/useIHI";

function getColor(score: number) {
  if (score >= 75) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

export function IHIGauge() {
  const ihi = useIHI();
  const score = ihi?.score ?? 0;
  const pct = score / 100;
  const r = 70, cx = 90, cy = 90;
  const circumference = Math.PI * r;
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 180 110" className="w-52">
        <path d={`M 20 90 A ${r} ${r} 0 0 1 160 90`} fill="none" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" />
        <path
          d={`M 20 90 A ${r} ${r} 0 0 1 160 90`}
          fill="none"
          stroke={getColor(score)}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s ease" }}
        />
        <text x="90" y="85" textAnchor="middle" fontSize="28" fontWeight="bold" fill="white">{score.toFixed(1)}</text>
        <text x="90" y="105" textAnchor="middle" fontSize="10" fill="#94a3b8">IHI SCORE</text>
      </svg>
      <p className="text-xs text-slate-400 uppercase tracking-widest">
        {score >= 75 ? "Healthy" : score >= 50 ? "Degraded" : "Critical"}
      </p>
    </div>
  );
}
