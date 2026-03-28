from app.services import ihi_calculator


def test_calculate_ihi():
    breakdown = {"pier_4": 90.0, "cable_east": 80.0, "deck_center": 70.0}
    score = ihi_calculator.calculate(breakdown)
    assert 0.0 <= score <= 100.0
