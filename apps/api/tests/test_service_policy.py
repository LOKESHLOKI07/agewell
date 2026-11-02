from app.modules.services.service_policy import (
    can_assign,
    can_finish,
    photo_required,
    tracks_location,
)


def test_tracking_and_photo_flags_match_checklists():
    assert tracks_location("emergency-sos") is True
    assert tracks_location("companion") is False
    assert photo_required("grocery") is True
    assert photo_required("banking-companion") is False


def test_emergency_companion_cannot_finish():
    assert can_finish("emergency-sos", "COMPANION") is False
    assert can_finish("emergency-sos", "CARE_MANAGER") is True
    assert can_finish("emergency-sos", "ADMIN") is True


def test_service_companion_assignment_uses_covered_services():
    assert can_assign("grocery", "SERVICE_COMPANION", companion_service_slugs=["grocery"]) is True
    assert can_assign("grocery", "SERVICE_COMPANION", companion_service_slugs=["medicine"]) is False
    assert can_assign("medicine", "CARE_MANAGER") is False


def test_diet_plan_defaults_to_admin():
    assert can_assign("personalised-diet-plan", "ADMIN") is True
    assert can_finish("personalised-diet-plan", "ADMIN") is True
    assert photo_required("personalised-diet-plan") is True
