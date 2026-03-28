from __future__ import annotations
from app.database import get_supabase
from app.config import get_settings


async def argus_query(user_message: str) -> dict:
    """Lightweight placeholder RAG: echoes message with stub context."""
    supabase = get_supabase()
    # Fetch recent anomalies to ground the reply; keep it shallow to avoid latency.
    try:
        anomalies = supabase.table("anomalies").select("node_id, severity, description, created_at").order("created_at", desc=True).limit(3).execute()
        snippets = [f"[{a['severity']}] {a['node_id']}: {a['description']}" for a in anomalies.data]  # type: ignore[arg-type]
    except Exception:
        snippets = []

    reply = "Argus online. "
    if snippets:
        reply += "Recent issues: " + "; ".join(snippets) + ". "
    reply += f"User asked: {user_message}"

    return {"reply": reply, "sources": [s.split(":")[0].strip() for s in snippets]}
