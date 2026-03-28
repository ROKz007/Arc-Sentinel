from pydantic import BaseModel
from typing import Literal


class AnomalyReport(BaseModel):
    node_id: str
    sensor_log_id: int
    severity: Literal["yellow", "orange", "critical"]
    description: str
    score: float
    resolved: bool = False


class AnomalyResponse(AnomalyReport):
    id: int
    created_at: str
