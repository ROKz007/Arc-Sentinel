# Arc-Sentinel — Backend Developer Blueprint

> **Stack:** Python · FastAPI · Supabase (PostgreSQL + Realtime) · Lightweight z-score detector (no scikit-learn) · (Optional) LangChain/OpenAI later

---

## 1. Project Structure

```
arc-sentinel-backend/
├── app/
│   ├── main.py                    # FastAPI entry point
│   ├── config.py                  # Env vars & settings
│   ├── database.py                # Supabase client init
│   │
│   ├── routers/
│   │   ├── sensor.py              # POST /ingest, GET /latest
│   │   ├── anomaly.py             # GET /anomalies, GET /anomalies/{id}
│   │   ├── health.py              # GET /ihi (Infrastructure Health Index)
│   │   └── argus.py               # POST /argus/chat
│   │
│   ├── services/
│   │   ├── anomaly_detector.py    # Lightweight z-score + threshold logic (no sklearn)
│   │   ├── ihi_calculator.py      # IHI score fusion logic
│   │   ├── rag_pipeline.py        # Argus stub; swap in LangChain when available
│   │   └── webhook.py             # Threshold triggers & EMB push
│   │
│   ├── models/
│   │   ├── sensor.py              # Pydantic schemas for sensor data
│   │   ├── anomaly.py             # Pydantic schemas for anomaly reports
│   │   └── argus.py               # Pydantic schemas for chat I/O
│   │
│   └── ml/
│       ├── train.py               # (Optional) future model training
│       └── model.pkl              # Placeholder (gitignored)
│
├── simulator/
│   └── virtual_sensor.py          # Synthetic data generator (push to /ingest)
│
├── supabase/
│   └── schema.sql                 # All table definitions (source of truth)
│
├── tests/
│   ├── test_ingest.py
│   ├── test_anomaly.py
│   └── test_argus.py
│
├── .env.example
├── requirements.txt
└── README.md
```

---

## 2. Environment Variables (`.env`)

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
OPENAI_API_KEY=sk-...
CORS_ORIGINS=http://localhost:3000
APP_ENV=development
```

Load with `python-dotenv` and expose via `app/config.py`:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str
    openai_api_key: str
    cors_origins: str = "http://localhost:3000"
    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 3. Supabase Schema (`supabase/schema.sql`)

```sql
-- Stores raw sensor telemetry
CREATE TABLE sensor_logs (
    id          BIGSERIAL PRIMARY KEY,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    node_id     TEXT NOT NULL,            -- e.g. "pier_4", "cable_east"
    sensor_type TEXT NOT NULL,            -- "accelerometer" | "strain_gauge"
    value       FLOAT NOT NULL,           -- raw reading
    unit        TEXT NOT NULL             -- "g" (gravity) | "microstrain"
);

-- Stores detected anomalies
CREATE TABLE anomalies (
    id            BIGSERIAL PRIMARY KEY,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    node_id       TEXT NOT NULL,
    sensor_log_id BIGINT REFERENCES sensor_logs(id),
    severity      TEXT NOT NULL,          -- "yellow" | "orange" | "critical"
    description   TEXT NOT NULL,          -- human-readable AI-generated label
    score         DOUBLE PRECISION NOT NULL,         -- anomaly score (z-score or threshold value)
    resolved      BOOLEAN DEFAULT FALSE
);

-- Stores IHI snapshots over time
CREATE TABLE ihi_snapshots (
    id         BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ihi_score  FLOAT NOT NULL,            -- 0.0 to 100.0
    metadata   TEXT                       -- per-node breakdowns (JSON string)
);

-- Enable Realtime on anomalies table (run inside Supabase SQL editor)
-- ALTER PUBLICATION supabase_realtime ADD TABLE anomalies;
```
**Indexes (create in Supabase UI/SQL when ready):**
```sql
-- CREATE INDEX idx_sensor_logs_node_created ON sensor_logs (node_id, created_at DESC);
-- CREATE INDEX idx_anomalies_severity ON anomalies (severity);
-- CREATE INDEX idx_anomalies_resolved ON anomalies (resolved);
```
```

---

## 4. Pydantic Models

### `app/models/sensor.py`
```python
from pydantic import BaseModel
from typing import Literal

class SensorReading(BaseModel):
    node_id: str                            # "pier_4"
    sensor_type: Literal["accelerometer", "strain_gauge"]
    value: float
    unit: str                               # "g" or "microstrain"

class SensorResponse(SensorReading):
    id: int
    created_at: str
```

### `app/models/anomaly.py`
```python
from pydantic import BaseModel
from typing import Literal

class AnomalyReport(BaseModel):
    node_id: str
    sensor_log_id: int
    severity: Literal["yellow", "orange", "critical"]
    description: str
    score: float
```

### `app/models/argus.py`
```python
from pydantic import BaseModel

class ArgusQuery(BaseModel):
    message: str
    session_id: str | None = None           # for future multi-turn memory

class ArgusResponse(BaseModel):
    reply: str
    sources: list[str] = []                 # referenced node_ids or log IDs
```

---

## 5. API Routes Reference

### Sensor Ingestion

| Method | Endpoint         | Body                  | Returns              |
|--------|------------------|-----------------------|----------------------|
| POST   | `/ingest`        | `SensorReading`       | `SensorResponse`     |
| GET    | `/latest`        | `?node_id=&limit=50`  | `list[SensorResponse]` |

**`POST /ingest` flow:**
1. Validate body via Pydantic.
2. Insert row into `sensor_logs`.
3. Pass reading to `anomaly_detector.predict()`.
4. If anomaly detected → insert into `anomalies` + call `webhook.trigger()`.
5. Recalculate IHI → upsert `ihi_snapshots`.
6. Return inserted sensor log.

---

### Anomaly Endpoints

| Method | Endpoint              | Query Params                        | Returns               |
|--------|-----------------------|-------------------------------------|-----------------------|
| GET    | `/anomalies`          | `?severity=&resolved=&limit=`       | `list[AnomalyReport]` |
| GET    | `/anomalies/{id}`     | —                                   | `AnomalyReport`       |
| PATCH  | `/anomalies/{id}/resolve` | —                               | `{ resolved: true }`  |

---

### Health Index

| Method | Endpoint  | Returns                                   |
|--------|-----------|-------------------------------------------|
| GET    | `/ihi`    | `{ score: float, breakdown: dict }`       |

**IHI Calculation Logic (`services/ihi_calculator.py`):**
```python
def calculate_ihi(node_scores: dict[str, float]) -> float:
    """
    Weighted average of per-node health scores.
    Node score = 100 - (anomaly_severity_weight * recent_anomaly_count)
    Clamp to [0, 100].
    """
    weights = {"pier_4": 0.4, "cable_east": 0.35, "deck_center": 0.25}
    weighted = sum(node_scores[n] * w for n, w in weights.items() if n in node_scores)
    return round(max(0.0, min(100.0, weighted)), 2)
```

---

### Argus AI Chat

| Method | Endpoint       | Body          | Returns          |
|--------|----------------|---------------|------------------|
| POST   | `/argus/chat`  | `ArgusQuery`  | `ArgusResponse`  |

---

## 6. Anomaly Detection Service

**File:** `app/services/anomaly_detector.py`

### Training (`ml/train.py` — run once)
```python
from sklearn.ensemble import IsolationForest
import joblib, numpy as np

# Generate synthetic healthy baseline data (replace with real logs later)
healthy_data = np.random.normal(loc=0.5, scale=0.1, size=(500, 2))  # [vibration, strain]

model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
model.fit(healthy_data)
joblib.dump(model, "app/ml/model.pkl")
```

### Inference
```python
import joblib, numpy as np

model = joblib.load("app/ml/model.pkl")

SEVERITY_MAP = {
    (-0.1, 0.0): "yellow",
    (-0.3, -0.1): "orange",
    (float("-inf"), -0.3): "critical",
}

def predict(vibration: float, strain: float) -> dict | None:
    """Returns anomaly dict or None if healthy."""
    features = np.array([[vibration, strain]])
    prediction = model.predict(features)[0]   # -1 = anomaly, 1 = normal
    score = model.score_samples(features)[0]   # lower = more anomalous

    if prediction == -1:
        severity = next(
            (sev for (lo, hi), sev in SEVERITY_MAP.items() if lo <= score < hi),
            "yellow"
        )
        return {"score": score, "severity": severity}
    return None
```

---

## 7. RAG Pipeline for Argus AI

**File:** `app/services/rag_pipeline.py`

```python
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.chains import RetrievalQA
from langchain.schema import Document
from langchain_community.vectorstores import FAISS
from app.database import supabase
from app.config import settings

def build_context_docs() -> list[Document]:
    """Fetch recent sensor logs and anomaly reports from Supabase."""
    logs = supabase.table("sensor_logs").select("*").order("created_at", desc=True).limit(100).execute()
    anomalies = supabase.table("anomalies").select("*").eq("resolved", False).order("created_at", desc=True).limit(20).execute()

    docs = []
    for row in logs.data:
        docs.append(Document(
            page_content=f"[{row['created_at']}] Node {row['node_id']} | {row['sensor_type']}: {row['value']} {row['unit']}",
            metadata={"type": "sensor_log", "node": row["node_id"]}
        ))
    for row in anomalies.data:
        docs.append(Document(
            page_content=f"[ANOMALY][{row['severity'].upper()}] Node {row['node_id']}: {row['description']} (score: {row['score']})",
            metadata={"type": "anomaly", "severity": row["severity"]}
        ))
    return docs

async def argus_query(user_message: str) -> dict:
    docs = build_context_docs()
    embeddings = OpenAIEmbeddings(api_key=settings.openai_api_key)
    vectorstore = FAISS.from_documents(docs, embeddings)

    llm = ChatOpenAI(model="gpt-4o-mini", api_key=settings.openai_api_key, temperature=0.2)
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
        return_source_documents=True
    )

    system_preamble = (
        "You are Argus, an expert AI structural health monitoring assistant. "
        "Answer questions about sensor readings, anomalies, and structural integrity. "
        "Be concise and technical. Reference specific nodes and timestamps when available."
    )

    result = qa_chain.invoke({"query": f"{system_preamble}\n\nUser: {user_message}"})
    sources = list({doc.metadata.get("node", "") for doc in result["source_documents"]})

    return {"reply": result["result"], "sources": [s for s in sources if s]}
```

---

## 8. Virtual Sensor Simulator

**File:** `simulator/virtual_sensor.py`

```python
"""
Run: python simulator/virtual_sensor.py
Pushes synthetic sensor data every 2 seconds to the backend.
Occasionally injects anomalous spikes to test detection.
"""
import time, random, httpx

API_URL = "http://localhost:8000/ingest"
NODES = ["pier_4", "cable_east", "deck_center"]

def generate_reading(node_id: str, inject_anomaly: bool = False) -> dict:
    if inject_anomaly:
        vibration = random.uniform(4.5, 9.0)   # extreme values
        strain = random.uniform(800, 1200)
    else:
        vibration = random.gauss(0.5, 0.1)      # normal healthy range
        strain = random.gauss(200, 20)

    return {
        "node_id": node_id,
        "sensor_type": random.choice(["accelerometer", "strain_gauge"]),
        "value": round(vibration if random.random() > 0.5 else strain, 4),
        "unit": "g" if random.random() > 0.5 else "microstrain"
    }

if __name__ == "__main__":
    print("Virtual sensor running... Ctrl+C to stop.")
    tick = 0
    while True:
        node = random.choice(NODES)
        anomaly = (tick % 30 == 0)              # inject anomaly every 30 ticks
        payload = generate_reading(node, inject_anomaly=anomaly)
        try:
            r = httpx.post(API_URL, json=payload, timeout=5)
            status = "⚠ ANOMALY" if anomaly else "OK"
            print(f"[{status}] {node} → {payload['value']} {payload['unit']} | HTTP {r.status_code}")
        except Exception as e:
            print(f"[ERROR] {e}")
        tick += 1
        time.sleep(2)
```

---

## 9. Webhook / EMB Trigger

**File:** `app/services/webhook.py`

```python
from app.database import supabase

SEVERITY_COLORS = {"yellow": "🟡", "orange": "🟠", "critical": "🔴"}

async def trigger(anomaly: dict):
    """
    Called after an anomaly is inserted. For MVP, logs to console and
    could POST to an external EMB webhook URL (Slack, custom dashboard, etc.)
    """
    icon = SEVERITY_COLORS.get(anomaly["severity"], "⚪")
    message = (
        f"{icon} [{anomaly['severity'].upper()}] "
        f"Node {anomaly['node_id']}: {anomaly['description']} "
        f"(score: {anomaly['score']:.3f})"
    )
    print(f"[EMB BROADCAST] {message}")

    # Future: POST to an external webhook
    # async with httpx.AsyncClient() as client:
    #     await client.post(settings.emb_webhook_url, json={"text": message})
```

---

## 10. FastAPI Entry Point (`app/main.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import sensor, anomaly, health, argus

app = FastAPI(title="Arc-Sentinel API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sensor.router, tags=["Sensor"])
app.include_router(anomaly.router, tags=["Anomaly"])
app.include_router(health.router, tags=["Health"])
app.include_router(argus.router, tags=["Argus AI"])

@app.get("/")
def root():
    return {"status": "Arc-Sentinel backend online"}
```

---

## 11. Dependencies (`requirements.txt`)

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
pydantic-settings==2.2.1
supabase==2.4.2
python-dotenv==1.0.1
scikit-learn==1.4.2
joblib==1.4.2
numpy==1.26.4
langchain==0.2.6
langchain-openai==0.1.13
langchain-community==0.2.6
faiss-cpu==1.8.0
httpx==0.27.0
```

---

## 12. Running Locally

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Copy env file and fill in keys
cp .env.example .env

# 3. Run DB schema in Supabase SQL editor
#    (paste contents of supabase/schema.sql)

# 4. Train anomaly model (one-time)
python app/ml/train.py

# 5. Start FastAPI
uvicorn app.main:app --reload --port 8000

# 6. In a new terminal, start the virtual sensor
python simulator/virtual_sensor.py

# 7. Visit API docs
open http://localhost:8000/docs
```

---

## 13. Key Design Decisions for MVP

| Decision | Rationale |
|---|---|
| **Isolation Forest** over SVM | Faster training, no labeled data needed, works well on tabular time-series |
| **FAISS in-memory vector store** | No external vector DB needed for hackathon; rebuild per-query is acceptable at small scale |
| **Supabase Realtime** on `anomalies` only | Reduces noise; the frontend only needs push updates for anomalies, not every sensor tick |
| **IHI recalculated on each ingest** | Simple and correct for MVP; cache with Redis later for scale |
| **Virtual sensor as separate process** | Clean separation; swap out for real IoT SDK later without touching the API |

---

## 14. Future Scalability Hooks

- Replace FAISS with **Supabase pgvector** for persistent embeddings.
- Add **Redis** for IHI caching and rate-limiting the `/ingest` endpoint.
- Migrate simulator to **MQTT + EMQX broker** for real IoT device compatibility.
- Add **Celery + Redis** for async anomaly detection at high ingest rates.
- Wrap ML model in **MLflow** for versioning and A/B experimentation.
