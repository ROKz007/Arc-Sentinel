from fastapi import APIRouter, HTTPException
from app.database import get_supabase
from app.services import ihi_calculator

router = APIRouter(tags=["health"])


@router.get("/ihi")
async def get_ihi():
    supabase = get_supabase()
    try:
        result = supabase.table("ihi_snapshots").select("*").order("created_at", desc=True).limit(1).execute()
        if result.data:
            latest = result.data[0]
            return {"score": latest.get("ihi_score", 0.0), "breakdown": latest.get("metadata", {})}
    except Exception:
        pass

    # Fallback synthetic IHI when no data is present
    breakdown = {"pier_4": 100.0, "cable_east": 100.0, "deck_center": 100.0}
    return {"score": ihi_calculator.calculate(breakdown), "breakdown": breakdown}
