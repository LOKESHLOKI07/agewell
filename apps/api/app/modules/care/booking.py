"""Care Manager call hours and visit booking rules (Asia/Kolkata)."""

from datetime import date, datetime, time, timedelta, timezone

from app.core.timezone import APP_TIMEZONE, now_in_app_timezone

CALL_START_HOUR = 10
CALL_END_HOUR = 18
CALL_HOURS_MESSAGE = (
    "Care Manager calling service is available between 10:00 AM and 6:00 PM. "
    "Please try again during service hours."
)
VISIT_SLOT_HOURS = (10, 11, 12, 14, 15, 16)
VISIT_BOOKING_DAYS = 14
SAME_DAY_LEAD_HOURS = 2


def _as_app_dt(value: datetime | None = None) -> datetime:
    if value is None:
        return now_in_app_timezone()
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(APP_TIMEZONE)


def is_care_manager_call_open(now: datetime | None = None) -> bool:
    local = _as_app_dt(now)
    minutes = local.hour * 60 + local.minute
    return 10 * 60 <= minutes < 18 * 60


def visit_slot_at(on_date: date, hour: int) -> datetime:
    return datetime.combine(on_date, time(hour=hour), tzinfo=APP_TIMEZONE)


def is_visit_slot_bookable(slot_at: datetime, now: datetime | None = None) -> bool:
    local_now = _as_app_dt(now)
    local_slot = _as_app_dt(slot_at)
    if local_slot.hour not in VISIT_SLOT_HOURS:
        return False
    if local_slot.date() < local_now.date():
        return False
    if local_slot.date() > local_now.date() + timedelta(days=VISIT_BOOKING_DAYS):
        return False
    if local_slot <= local_now + timedelta(hours=SAME_DAY_LEAD_HOURS):
        return False
    return True


def list_visit_slots(on_date: date, now: datetime | None = None) -> list[datetime]:
    return [visit_slot_at(on_date, hour) for hour in VISIT_SLOT_HOURS if is_visit_slot_bookable(visit_slot_at(on_date, hour), now)]
