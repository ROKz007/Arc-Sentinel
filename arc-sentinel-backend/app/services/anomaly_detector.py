from __future__ import annotations
from collections import defaultdict, deque
from statistics import mean, pstdev
from app.models.sensor import SensorReading

# Lightweight, in-memory z-score detector with static fallbacks.
HISTORY_LEN = 200
HISTORY = defaultdict(lambda: deque(maxlen=HISTORY_LEN))

# Static safety thresholds when history is too short.
THRESHOLDS = {
    "accelerometer": {"yellow": 2.5, "orange": 4.0, "critical": 6.0},
    "strain_gauge": {"yellow": 350.0, "orange": 550.0, "critical": 800.0},
}


def assess_reading(reading: SensorReading) -> dict | None:
    """Return anomaly dict with severity/score/description or None."""
    key = (reading.node_id, reading.sensor_type)
    history = HISTORY[key]
    history.append(reading.value)

    if len(history) >= 30:
        m = mean(history)
        sd = pstdev(history) or 1e-6
        z = abs(reading.value - m) / sd
        severity = _z_to_severity(z)
        if severity:
            return {
                "severity": severity,
                "score": float(z),
                "description": f"Z-score {z:.2f} vs baseline mean {m:.2f}",
            }

    thresholds = THRESHOLDS.get(reading.sensor_type)
    if thresholds:
        value = reading.value
        if value >= thresholds["critical"]:
            severity = "critical"
        elif value >= thresholds["orange"]:
            severity = "orange"
        elif value >= thresholds["yellow"]:
            severity = "yellow"
        else:
            return None
        return {
            "severity": severity,
            "score": float(value),
            "description": f"{reading.sensor_type} reading {value} crossed {severity} threshold",
        }

    return None


def _z_to_severity(z: float) -> str | None:
    if z >= 3.5:
        return "critical"
    if z >= 2.5:
        return "orange"
    if z >= 1.8:
        return "yellow"
    return None
