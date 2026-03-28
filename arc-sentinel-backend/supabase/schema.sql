-- Raw sensor telemetry
CREATE TABLE sensor_logs (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    node_id TEXT NOT NULL,
    sensor_type TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    unit TEXT NOT NULL
);

-- Detected anomalies
CREATE TABLE anomalies (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    node_id TEXT NOT NULL,
    sensor_log_id BIGINT REFERENCES sensor_logs(id),
    severity TEXT NOT NULL,
    description TEXT NOT NULL,
    score DOUBLE PRECISION NOT NULL,
    resolved BOOLEAN DEFAULT FALSE
);

-- IHI snapshots
CREATE TABLE ihi_snapshots (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ihi_score DOUBLE PRECISION NOT NULL,
    metadata TEXT
);

-- Realtime publication (execute in Supabase SQL)
-- ALTER PUBLICATION supabase_realtime ADD TABLE anomalies;
