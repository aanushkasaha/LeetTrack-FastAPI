from datetime import datetime, timedelta, timezone


def sm2_next_interval(
    ease_factor: float,
    interval_days: int,
    confidence: int,
) -> tuple[int, float]:
    if confidence < 3:
        interval_days = 1
        ease_factor = max(1.3, ease_factor - 0.2)
    elif confidence == 3:
        interval_days = max(1, interval_days)
        ease_factor = max(1.3, ease_factor - 0.14)
    elif confidence == 4:
        interval_days = max(1, round(interval_days * ease_factor))
    else:
        interval_days = max(1, round(interval_days * ease_factor))
        ease_factor = min(2.5, ease_factor + 0.1)

    return interval_days, ease_factor


def compute_next_revisit(interval_days: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=interval_days)