import { filterOutstationPlaces, OUTSTATION_DESTINATIONS } from '../outstationTransportPlaces';

describe('filterOutstationPlaces', () => {
  it('suggests local pickup spots', () => {
    const rows = filterOutstationPlaces('borivali', 'pickup', [], 3);
    expect(rows.some((row) => /borivali/i.test(row.label))).toBe(true);
  });

  it('suggests outstation drop cities', () => {
    const rows = filterOutstationPlaces('pune', 'drop');
    expect(rows[0]?.label).toBe('Pune');
    expect(OUTSTATION_DESTINATIONS.some((place) => place.id === 'pune')).toBe(true);
  });
});
