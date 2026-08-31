import { isAddressInServiceArea, isCoordinateInServiceArea, isPlaceNameInServiceArea } from '../serviceArea';

describe('service area matching', () => {
  it('accepts Kandivali and Borivali coordinates', () => {
    expect(isCoordinateInServiceArea(19.204, 72.852)).toBe(true);
    expect(isCoordinateInServiceArea(19.232, 72.859)).toBe(true);
  });

  it('rejects coordinates outside the current launch area', () => {
    expect(isCoordinateInServiceArea(12.9716, 77.5946)).toBe(false);
    expect(isCoordinateInServiceArea(19.076, 72.877)).toBe(false);
  });

  it('matches area names even with spelling variants', () => {
    expect(isPlaceNameInServiceArea('Kandivali West')).toBe(true);
    expect(isPlaceNameInServiceArea('Borivli, Mumbai')).toBe(true);
    expect(isPlaceNameInServiceArea('Pune')).toBe(false);
  });

  it('reads reverse-geocode address fields', () => {
    expect(isAddressInServiceArea({ district: 'Kandivali', city: 'Mumbai' })).toBe(true);
    expect(isAddressInServiceArea({ city: 'Bengaluru' })).toBe(false);
  });
});
