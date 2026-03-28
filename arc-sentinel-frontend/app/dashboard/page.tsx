import { EMBTicker } from "@/components/dashboard/EMBTicker";
import { AnomalyFeed } from "@/components/dashboard/AnomalyFeed";
import { IHIGauge } from "@/components/dashboard/IHIGauge";
import { SensorChart } from "@/components/dashboard/SensorChart";
import { ArgusPanel } from "@/components/argus/ArgusPanel";
import { DigitalTwinViewer } from "@/components/twin/DigitalTwinViewer";
import { Anomaly } from "@/lib/types";

const SAMPLE_ANOMALIES: Anomaly[] = [
  {
    id: 1,
    created_at: new Date().toISOString(),
    node_id: "pier_4",
    sensor_log_id: 1,
    severity: "yellow",
    description: "Sample anomaly placeholder",
    score: 1.0,
    resolved: false,
  },
];

async function getInitialAnomalies(): Promise<Anomaly[]> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  const offline = !apiBase || apiBase.includes("xxxx");

  if (offline) {
    return SAMPLE_ANOMALIES;
  }

  try {
    const res = await fetch(`${apiBase}/anomalies?limit=10`, { cache: "no-store" });
    if (!res.ok) throw new Error("failed");
    return res.json();
  } catch {
    return SAMPLE_ANOMALIES;
  }
}

export default async function DashboardPage() {
  const anomalies = await getInitialAnomalies();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded border border-slate-800 bg-panel p-4 flex items-center justify-center">
          <IHIGauge />
        </div>
        <div className="rounded border border-slate-800 bg-panel p-4">
          <EMBTicker initialAnomalies={anomalies} />
        </div>
        <div className="md:col-span-2 rounded border border-slate-800 bg-panel p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-2">Anomaly Feed</h3>
          <AnomalyFeed initialAnomalies={anomalies} />
        </div>
        <div className="rounded border border-slate-800 bg-panel p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-2">Pier 4</h3>
          <SensorChart node_id="pier_4" />
        </div>
        <div className="rounded border border-slate-800 bg-panel p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-2">Cable East</h3>
          <SensorChart node_id="cable_east" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <DigitalTwinViewer />
        <ArgusPanel />
      </div>
    </div>
  );
}
