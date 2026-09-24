import {
  filterLocalTransportPlaces,
  LOCAL_TRANSPORT_PLACES,
} from '../localTransportPlaces';

describe('filterLocalTransportPlaces', () => {
  it('returns popular places when query is empty', () => {
    const rows = filterLocalTransportPlaces('', [], 3);
    expect(rows).toHaveLength(3);
    expect(rows[0]?.label).toBe(LOCAL_TRANSPORT_PLACES[0]?.label);
  });

  it('filters by landmark keyword', () => {
    const rows = filterLocalTransportPlaces('borivali station');
    expect(rows.some((row) => /borivali station/i.test(row.label))).toBe(true);
  });

  it('includes home extra ahead of catalog matches', () => {
    const rows = filterLocalTransportPlaces('home', [
      { id: 'home', label: '12 Home Lane, Kandivali', subtitle: 'Saved home address', kind: 'home' },
    ]);
    expect(rows[0]?.kind).toBe('home');
  });
});
