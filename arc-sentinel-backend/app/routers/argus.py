from fastapi import APIRouter
from app.models.argus import ArgusQuery, ArgusResponse
from app.services import rag_pipeline

router = APIRouter(prefix="/argus", tags=["argus"])


@router.post("/chat", response_model=ArgusResponse)
async def chat(payload: ArgusQuery):
    result = await rag_pipeline.argus_query(payload.message)
    return ArgusResponse(**result)
