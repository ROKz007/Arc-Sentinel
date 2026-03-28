import logging

logger = logging.getLogger("arc_sentinel.webhook")

SEVERITY_COLORS = {"yellow": "🟡", "orange": "🟠", "critical": "🔴"}


def format_message(anomaly: dict) -> str:
    icon = SEVERITY_COLORS.get(anomaly.get("severity"), "⚪")
    return (
        f"{icon} [{anomaly.get('severity', 'unknown').upper()}] "
        f"Node {anomaly.get('node_id', '?')}: {anomaly.get('description', '')} "
        f"(score: {anomaly.get('score')})"
    )


def trigger(anomaly: dict) -> None:
    message = format_message(anomaly)
    logger.warning(message)
