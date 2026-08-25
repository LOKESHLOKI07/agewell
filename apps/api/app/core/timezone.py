"""Calendar-day filters for AgeWell use Asia/Kolkata (IST).

Seniors, families, and care associates do not currently store a timezone.
Do not add a timezone column until a product requirement exists.

`today=true` and `date=` therefore mean the civil date in Asia/Kolkata,
not the UTC calendar date of a timestamptz value.

Examples:
- 19 Aug 2026 23:30 UTC → 20 Aug 2026 05:00 IST
- 19 Aug 2026 18:00 UTC → 19 Aug 2026 23:30 IST
- 20 Aug 2026 00:30 UTC → 20 Aug 2026 06:00 IST
"""

from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import Date, cast, literal

APP_TIMEZONE_NAME = "Asia/Kolkata"
APP_TIMEZONE = ZoneInfo(APP_TIMEZONE_NAME)


def now_in_app_timezone() -> datetime:
    return datetime.now(APP_TIMEZONE)


def today_in_app_timezone() -> date:
    return now_in_app_timezone().date()


def app_local_date(value: datetime) -> date:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(APP_TIMEZONE).date()


def scheduled_on_app_date(column, on_date: date):
    """SQL: (timestamptz AT TIME ZONE 'Asia/Kolkata')::date = on_date"""
    local_naive = column.op("AT TIME ZONE")(literal(APP_TIMEZONE_NAME))
    return cast(local_naive, Date) == on_date
