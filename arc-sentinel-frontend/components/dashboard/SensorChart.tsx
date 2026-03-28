"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useSensorHistory } from "@/hooks/useSensorHistory";
import { format } from "date-fns";

interface Props { node_id: string; }

export function SensorChart({ node_id }: Props) {
  const { data, loading } = useSensorHistory(node_id);

  const chartData = data.map((d) => ({
    time: format(new Date(d.created_at), "HH:mm:ss"),
    value: d.value,
    type: d.sensor_type,
  }));

  if (loading) return <div className="h-40 animate-pulse bg-slate-800 rounded" />;

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={chartData}>
        <CartesianGrid stroke="#1e293b" />
        <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#64748b" }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
        <Tooltip
          contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
          labelStyle={{ color: "#94a3b8" }}
          itemStyle={{ color: "#38bdf8" }}
        />
        <Line type="monotone" dataKey="value" stroke="#38bdf8" dot={false} strokeWidth={1.5} />
      </LineChart>
    </ResponsiveContainer>
  );
}
