export type SeverityLevel = "yellow" | "orange" | "critical";

export interface SensorLog {
  id: number;
  created_at: string;
  node_id: string;
  sensor_type: "accelerometer" | "strain_gauge";
  value: number;
  unit: string;
}

export interface Anomaly {
  id: number;
  created_at: string;
  node_id: string;
  sensor_log_id: number;
  severity: SeverityLevel;
  description: string;
  score: number;
  resolved: boolean;
}

export interface IHIResponse {
  score: number;
  breakdown: Record<string, number>;
}

export interface ArgusMessage {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}
