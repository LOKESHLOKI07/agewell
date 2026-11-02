"""Initial credit amounts from membership plan configuration.

Screenshot / product amounts: Service ₹2,500, Emergency ₹15,000.
Stored on membership_plans so they are not hardcoded at allocation time.
"""

from decimal import Decimal
from typing import Any

DEFAULT_INITIAL_SERVICE_CREDIT = Decimal("2500.00")
DEFAULT_INITIAL_EMERGENCY_CREDIT = Decimal("15000.00")

# Membership catalogue services that spend Emergency Credit.
EMERGENCY_SERVICE_SLUGS = frozenset({"emergency-sos"})


def as_money(value: Any, fallback: Decimal) -> Decimal:
    if value is None:
        return fallback
    amount = Decimal(str(value))
    if amount < 0:
        return fallback
    return amount.quantize(Decimal("0.01"))


def initial_service_credit(plan) -> Decimal:
    return as_money(getattr(plan, "initial_service_credit", None), DEFAULT_INITIAL_SERVICE_CREDIT)


def initial_emergency_credit(plan) -> Decimal:
    return as_money(getattr(plan, "initial_emergency_credit", None), DEFAULT_INITIAL_EMERGENCY_CREDIT)


def money_float(value: Any) -> float:
    return float(Decimal(str(value)).quantize(Decimal("0.01")))
