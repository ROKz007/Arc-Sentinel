from __future__ import annotations
from typing import Dict

WEIGHTS = {"pier_4": 0.4, "cable_east": 0.35, "deck_center": 0.25}


def calculate(node_scores: Dict[str, float]) -> float:
    weighted = sum(node_scores.get(node, 100.0) * weight for node, weight in WEIGHTS.items())
    return round(max(0.0, min(100.0, weighted)), 2)


def synthesize_breakdown(anomaly_counts: Dict[str, int]) -> Dict[str, float]:
    breakdown: Dict[str, float] = {}
    for node in WEIGHTS:
        penalty = anomaly_counts.get(node, 0) * 5.0
        breakdown[node] = max(0.0, 100.0 - penalty)
    return breakdown
