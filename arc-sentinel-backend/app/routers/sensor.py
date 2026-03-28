from fastapi import APIRouter, HTTPException, Query
from app.database import get_supabase
from app.models.sensor import SensorReading, SensorResponse
from app.services import anomaly_detector, ihi_calculator, webhook

router = APIRouter(tags=["sensor"])


@router.post("/ingest", response_model=SensorResponse)
async def ingest(reading: SensorReading):
    supabase = get_supabase()
    try:
        result = supabase.table("sensor_logs").insert(reading.dict()).execute()
        inserted = result.data[0]
    except Exception as exc:  # pragma: no cover - external IO
        raise HTTPException(status_code=500, detail=f"Supabase insert failed: {exc}")

    anomaly = anomaly_detector.assess_reading(reading)
    if anomaly:
        anomaly_payload = {
            **anomaly,
            "node_id": reading.node_id,
            "sensor_log_id": inserted["id"],
            "resolved": False,
        }
        try:
            supabase.table("anomalies").insert(anomaly_payload).execute()
            webhook.trigger(anomaly_payload)
            _recalculate_ihi(supabase)
        except Exception:
            # Non-fatal for ingestion path
            pass

    return SensorResponse(**inserted)


@router.get("/latest", response_model=list[SensorResponse])
async def latest(node_id: str | None = None, limit: int = Query(50, le=200)):
    supabase = get_supabase()
    query = supabase.table("sensor_logs").select("*").order("created_at", desc=True).limit(limit)
    if node_id:
        query = query.eq("node_id", node_id)
    try:
        result = query.execute()
        return [SensorResponse(**row) for row in result.data]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}")


def _recalculate_ihi(supabase):
    try:
        res = supabase.table("anomalies").select("node_id").eq("resolved", False).execute()
        counts = {}
        for row in res.data:
            counts[row["node_id"]] = counts.get(row["node_id"], 0) + 1
        breakdown = ihi_calculator.synthesize_breakdown(counts)
        ihi_score = ihi_calculator.calculate(breakdown)
        supabase.table("ihi_snapshots").insert({"ihi_score": ihi_score, "metadata": breakdown}).execute()
    except Exception:
        return None
