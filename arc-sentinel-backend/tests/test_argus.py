import asyncio
from app.services import rag_pipeline


def test_argus_query_runs():
    result = asyncio.run(rag_pipeline.argus_query("status?"))
    assert "reply" in result
    assert "sources" in result
