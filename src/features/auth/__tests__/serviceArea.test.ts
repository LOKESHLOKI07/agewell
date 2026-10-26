import {
  isAddressInServiceArea,
  isCoordinateInServiceArea,
  isPlaceNameInServiceArea,
  matchCoordinate,
  matchPlaceName,
  resolveServiceAreaFromSenior,
  serviceAreaDeliveryLabel,
} from '../serviceArea';

describe('service area matching', () => {
  it('accepts Kandivali and Borivali coordinates', () => {
    expect(isCoordinateInServiceArea(19.204, 72.852)).toBe(true);
    expect(isCoordinateInServiceArea(19.232, 72.859)).toBe(true);
    expect(matchCoordinate(19.204, 72.852).tier).toBe('tier1');
    expect(matchCoordinate(19.204, 72.852).localityLabel).toBe('Kandivali, Mumbai');
    expect(matchCoordinate(19.232, 72.859).localityLabel).toBe('Borivali, Mumbai');
  });

  it('accepts Warora, Bhadravati and Wani coordinates in Chandrapur', () => {
    expect(isCoordinateInServiceArea(20.228, 79.001)).toBe(true);
    expect(isCoordinateInServiceArea(20.108, 79.117)).toBe(true);
    expect(isCoordinateInServiceArea(20.056, 78.953)).toBe(true);
    expect(matchCoordinate(20.228, 79.001).tier).toBe('tier2');
    expect(matchCoordinate(20.228, 79.001).localityLabel).toBe('Warora, Chandrapur');
    expect(matchCoordinate(20.108, 79.117).localityLabel).toBe('Bhadravati, Chandrapur');
    expect(matchCoordinate(20.056, 78.953).localityLabel).toBe('Wani, Chandrapur');
  });

  it('rejects coordinates outside the current launch area', () => {
    expect(isCoordinateInServiceArea(12.9716, 77.5946)).toBe(false);
    expect(isCoordinateInServiceArea(19.076, 72.877)).toBe(false);
    expect(isCoordinateInServiceArea(21.146, 79.088)).toBe(false);
    expect(isCoordinateInServiceArea(13.848, 75.705)).toBe(false);
  });

  it('matches area names even with spelling variants', () => {
    expect(isPlaceNameInServiceArea('Kandivali West')).toBe(true);
    expect(isPlaceNameInServiceArea('Borivli, Mumbai')).toBe(true);
    expect(isPlaceNameInServiceArea('Warora, Chandrapur')).toBe(true);
    expect(isPlaceNameInServiceArea('Bhadravati')).toBe(true);
    expect(isPlaceNameInServiceArea('Wani')).toBe(true);
    expect(isPlaceNameInServiceArea('Pune')).toBe(false);
    expect(isPlaceNameInServiceArea('Nagpur')).toBe(false);
    expect(matchPlaceName('Wani, Chandrapur').tier).toBe('tier2');
    expect(matchPlaceName('Kandivali West').localityLabel).toBe('Kandivali, Mumbai');
    expect(matchPlaceName('Borivli, Mumbai').localityLabel).toBe('Borivali, Mumbai');
  });

  it('reads reverse-geocode address fields', () => {
    expect(isAddressInServiceArea({ district: 'Kandivali', city: 'Mumbai' })).toBe(true);
    expect(isAddressInServiceArea({ city: 'Warora', district: 'Chandrapur' })).toBe(true);
    expect(isAddressInServiceArea({ city: 'Bengaluru' })).toBe(false);
  });

  it('resolves tier from a stored senior location', () => {
    expect(
      resolveServiceAreaFromSenior({
        inServiceArea: true,
        locationQuery: 'Warora',
      }).tier,
    ).toBe('tier2');
  });

  it('uses the specific locality for home banner copy', () => {
    expect(
      serviceAreaDeliveryLabel(
        resolveServiceAreaFromSenior({
          inServiceArea: true,
          locationQuery: 'Kandivali West',
        }),
      ),
    ).toBe('Kandivali, Mumbai');
    expect(
      serviceAreaDeliveryLabel(
        resolveServiceAreaFromSenior({
          inServiceArea: true,
          locationQuery: 'Kandivali & Borivali, Mumbai',
          locationLat: 19.232,
          locationLng: 72.859,
        }),
      ),
    ).toBe('Borivali, Mumbai');
    expect(
      serviceAreaDeliveryLabel(
        resolveServiceAreaFromSenior({
          inServiceArea: true,
          locationQuery: 'Warora',
        }),
      ),
    ).toBe('Warora, Chandrapur');
    expect(
      serviceAreaDeliveryLabel(
        resolveServiceAreaFromSenior({
          inServiceArea: true,
          locationQuery: 'Wani',
        }),
      ),
    ).toBe('Wani, Chandrapur');
  });
});
