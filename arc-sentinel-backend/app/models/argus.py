from pydantic import BaseModel


class ArgusQuery(BaseModel):
    message: str
    session_id: str | None = None


class ArgusResponse(BaseModel):
    reply: str
    sources: list[str] = []
