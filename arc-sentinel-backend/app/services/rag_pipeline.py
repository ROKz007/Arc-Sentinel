from __future__ import annotations
import asyncio
from typing import List
from openai import AsyncOpenAI
from app.database import get_supabase
from app.config import get_settings


settings = get_settings()
client = AsyncOpenAI(api_key=settings.openai_api_key, base_url=settings.openai_base_url)


async def argus_query(user_message: str) -> dict:
    """RAG-style query backed by OpenAI; falls back to a concise stub if LLM unavailable."""
    supabase = get_supabase()
    try:
        anomalies = supabase.table("anomalies").select("node_id, severity, description, created_at").order("created_at", desc=True).limit(5).execute()
        snippets = [f"[{a['severity']}] {a['node_id']}: {a['description']}" for a in anomalies.data]  # type: ignore[arg-type]
    except Exception:
        anomalies = None
        snippets = []

    # If no key configured, short-circuit to stub
    if not settings.openai_api_key:
        return _stub_reply(user_message, snippets)

    system = (
        "You are Argus, an expert structural-assessment assistant. Use the provided recent anomalies as context when answering. "
        "Be concise, provide likely causes and recommended next steps, and list any sources referenced."
    )
    context = "\n".join(snippets) if snippets else "No recent anomalies available."
    messages: List[dict] = [
        {"role": "system", "content": system},
        {"role": "user", "content": f"Context:\n{context}\n\nUser question: {user_message}"},
    ]

    try:
        resp = await client.chat.completions.create(
            model=settings.openai_model,
            messages=messages,
            temperature=0.2,
            max_tokens=512,
        )
        reply = resp.choices[0].message.content or ""
        sources = list({a["node_id"] for a in anomalies.data}) if anomalies and anomalies.data else []  # type: ignore[index]
        return {"reply": reply, "sources": sources}
    except Exception as exc:  # pragma: no cover - external IO
        await asyncio.sleep(0)
        return _stub_reply(user_message, snippets, error=str(exc))


def _stub_reply(user_message: str, snippets: list[str], error: str | None = None) -> dict:
    if error:
        if "quota" in error or "429" in error:
            reply = "Argus AI is currently unavailable — the OpenAI API quota has been exceeded. Please add billing to your OpenAI account to re-enable the AI assistant."
        else:
            reply = f"Argus AI is temporarily offline. Reason: {error[:120]}"
    else:
        reply = "Argus online (operating in fallback mode — no LLM key configured). "
    if snippets:
        reply += " Recent anomaly context: " + "; ".join(snippets) + "."
    node_sources = list({s.split(":")[0].strip().lstrip("[").split("]")[-1].strip() for s in snippets})
    return {"reply": reply, "sources": node_sources}
