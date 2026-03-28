from __future__ import annotations
import asyncio
from google import genai
from google.genai import types
from app.database import get_supabase
from app.config import get_settings


settings = get_settings()


async def argus_query(user_message: str) -> dict:
    """RAG-style query backed by Gemini; falls back to a stub if LLM unavailable."""
    supabase = get_supabase()
    try:
        anomalies = supabase.table("anomalies").select("node_id, severity, description, created_at").order("created_at", desc=True).limit(5).execute()
        snippets = [f"[{a['severity']}] {a['node_id']}: {a['description']}" for a in anomalies.data]  # type: ignore[arg-type]
    except Exception:
        anomalies = None
        snippets = []

    if not settings.gemini_api_key:
        return _stub_reply(user_message, snippets)

    context = "\n".join(snippets) if snippets else "No recent anomalies available."
    prompt = (
        "You are Argus, an expert structural-assessment assistant for a bridge monitoring system. "
        "Use the provided recent anomalies as context when answering. "
        "Be concise, provide likely causes and recommended next steps.\n\n"
        f"Recent anomalies:\n{context}\n\n"
        f"User question: {user_message}"
    )

    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        # Run blocking call in a thread so the event loop stays free
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=512,
            ),
        )
        reply = response.text or ""
        sources = list({a["node_id"] for a in anomalies.data}) if anomalies and anomalies.data else []  # type: ignore[index]
        return {"reply": reply, "sources": sources}
    except Exception as exc:
        await asyncio.sleep(0)
        return _stub_reply(user_message, snippets, error=str(exc))


def _stub_reply(user_message: str, snippets: list[str], error: str | None = None) -> dict:
    if error:
        reply = f"Argus AI is temporarily offline. Reason: {error[:200]}"
    else:
        reply = "Argus online (operating in fallback mode — no Gemini API key configured)."
    if snippets:
        reply += " Recent anomaly context: " + "; ".join(snippets) + "."
    node_sources = list({s.split(":")[0].strip().lstrip("[").split("]")[-1].strip() for s in snippets})
    return {"reply": reply, "sources": node_sources}
