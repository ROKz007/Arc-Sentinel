from __future__ import annotations
import asyncio
from typing import List
import httpx
from app.database import get_supabase
from app.config import get_settings


async def _call_openai(api_key: str, messages: List[dict], model: str, base_url: str | None) -> str:
    base = (base_url.rstrip("/")) if base_url else "https://api.openai.com/v1"
    url = f"{base}/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {"model": model, "messages": messages, "temperature": 0.2, "max_tokens": 512}
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def argus_query(user_message: str) -> dict:
    """RAG-style query: when `OPENAI` key present, call LLM, otherwise fall back to a concise stub reply."""
    settings = get_settings()
    supabase = get_supabase()
    try:
        anomalies = supabase.table("anomalies").select("node_id, severity, description, created_at").order("created_at", desc=True).limit(5).execute()
        snippets = [f"[{a['severity']}] {a['node_id']}: {a['description']}" for a in anomalies.data]  # type: ignore[arg-type]
    except Exception:
        snippets = []

    if settings.openai_api_key:
        system = (
            "You are Argus, an expert structural-assessment assistant. Use the provided recent anomalies as context when answering. "
            "Be concise, provide likely causes and recommended next steps, and list any sources referenced."
        )
        context = "\n".join(snippets) if snippets else "No recent anomalies available."
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": f"Context:\n{context}\n\nUser question: {user_message}"},
        ]
        try:
            reply = await _call_openai(settings.openai_api_key, messages, settings.openai_model, settings.openai_base_url)
            sources = [s.split(":")[0].strip() for s in snippets]
            return {"reply": reply, "sources": sources}
        except Exception as exc:
            # Non-fatal: fall back to stub but include hint
            await asyncio.sleep(0)
            snippets.append(f"LLM offline: {exc}")

    # Fallback lightweight reply when no API key or LLM call fails
    reply = "Argus online. "
    if snippets:
        reply += "Recent issues: " + "; ".join(snippets) + ". "
    reply += f"User asked: {user_message}"
    return {"reply": reply, "sources": [s.split(":")[0].strip() for s in snippets]}
