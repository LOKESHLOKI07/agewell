from app.modules.cities.catalog import (
    CITY_CHANDRAPUR,
    CITY_MUMBAI,
    resolve_service_city,
)


def test_resolve_mumbai_from_address_and_gps():
    assert resolve_service_city(address="Kandivali West") == CITY_MUMBAI
    assert resolve_service_city(address="Borivali East, Mumbai") == CITY_MUMBAI
    assert resolve_service_city(location_lat=19.204, location_lng=72.852) == CITY_MUMBAI


def test_resolve_chandrapur_includes_wani():
    assert resolve_service_city(address="Warora") == CITY_CHANDRAPUR
    assert resolve_service_city(location_query="Bhadravati, Chandrapur") == CITY_CHANDRAPUR
    assert resolve_service_city(address="Wani, Chandrapur district") == CITY_CHANDRAPUR
    assert resolve_service_city(location_lat=20.056, location_lng=78.953) == CITY_CHANDRAPUR


def test_resolve_unknown_address_is_none():
    assert resolve_service_city(address="456") is None
    assert resolve_service_city(address="") is None
