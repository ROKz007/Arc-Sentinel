from pydantic import BaseModel
from typing import Literal


class SensorReading(BaseModel):
    node_id: str
    sensor_type: Literal["accelerometer", "strain_gauge"]
    value: float
    unit: str


class SensorResponse(SensorReading):
    id: int
    created_at: str
