"""
Run: python simulator/virtual_sensor.py
Pushes synthetic sensor data every 2 seconds to the backend.
"""
import time
import random
import httpx

API_URL = "http://localhost:8000/ingest"
NODES = ["pier_4", "cable_east", "deck_center"]


def generate_reading(node_id: str, inject_anomaly: bool = False) -> dict:
    if inject_anomaly:
        vibration = random.uniform(4.5, 9.0)
        strain = random.uniform(800, 1200)
    else:
        vibration = random.gauss(0.5, 0.1)
        strain = random.gauss(200, 20)

    if random.random() > 0.5:
        value, unit, sensor_type = vibration, "g", "accelerometer"
    else:
        value, unit, sensor_type = strain, "microstrain", "strain_gauge"

    return {
        "node_id": node_id,
        "sensor_type": sensor_type,
        "value": round(value, 4),
        "unit": unit,
    }


def main():
    print("Virtual sensor running... Ctrl+C to stop.")
    tick = 0
    while True:
        node = random.choice(NODES)
        anomaly = tick % 30 == 0
        payload = generate_reading(node, inject_anomaly=anomaly)
        try:
            r = httpx.post(API_URL, json=payload, timeout=5)
            status = "ANOMALY" if anomaly else "OK"
            print(f"[{status}] {node} -> {payload['value']} {payload['unit']} | HTTP {r.status_code}")
        except Exception as exc:  # pragma: no cover - network noise
            print(f"[ERROR] {exc}")
        tick += 1
        time.sleep(2)


if __name__ == "__main__":
    main()
