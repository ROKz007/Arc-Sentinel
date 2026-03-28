from fastapi import APIRouter, HTTPException, Path, Query
from app.database import get_supabase
from app.models.anomaly import AnomalyResponse

router = APIRouter(prefix="/anomalies", tags=["anomalies"])


@router.get("")
async def list_anomalies(severity: str | None = None, resolved: bool | None = None, limit: int = Query(50, le=200)):
    supabase = get_supabase()
    query = supabase.table("anomalies").select("*").order("created_at", desc=True).limit(limit)
    if severity:
        query = query.eq("severity", severity)
    if resolved is not None:
        query = query.eq("resolved", resolved)
    try:
        result = query.execute()
        return [AnomalyResponse(**row) for row in result.data]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}")


@router.get("/{anomaly_id}", response_model=AnomalyResponse)
async def get_anomaly(anomaly_id: int = Path(...)):
    supabase = get_supabase()
    try:
        result = supabase.table("anomalies").select("*").eq("id", anomaly_id).single().execute()
    except Exception as exc:
        raise HTTPException(status_code=404, detail=f"Anomaly not found: {exc}")
    return AnomalyResponse(**result.data)


@router.patch("/{anomaly_id}/resolve")
async def resolve_anomaly(anomaly_id: int):
    supabase = get_supabase()
    try:
        supabase.table("anomalies").update({"resolved": True}).eq("id", anomaly_id).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to resolve anomaly: {exc}")
    return {"resolved": True}
