from app.services import anomaly_detector
from app.models.sensor import SensorReading


def test_assess_reading_threshold():
    reading = SensorReading(node_id="pier_4", sensor_type="accelerometer", value=5.0, unit="g")
    anomaly = anomaly_detector.assess_reading(reading)
    assert anomaly is not None
    assert anomaly["severity"] in {"yellow", "orange", "critical"}
