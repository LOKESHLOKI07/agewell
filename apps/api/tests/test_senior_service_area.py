from app.modules.seniors.service_area import address_in_service_area, resolve_in_service_area


class _Senior:
    def __init__(self, address=None, in_service_area=None):
        self.address = address
        self.in_service_area = in_service_area


def test_address_in_service_area_keywords():
    assert address_in_service_area("Flat 12, Kandivali West, Mumbai") is True
    assert address_in_service_area("Borivali East") is True
    assert address_in_service_area("Andheri West") is False
    assert address_in_service_area("") is False
    assert address_in_service_area(None) is False


def test_resolve_prefers_stored_flag_over_address():
    assert resolve_in_service_area(_Senior(address="Andheri", in_service_area=True)) is True
    assert resolve_in_service_area(_Senior(address="Kandivali", in_service_area=False)) is False
    assert resolve_in_service_area(_Senior(address="Andheri", in_service_area=None)) is False
    assert resolve_in_service_area(_Senior(address="Kandivali West", in_service_area=None)) is True
