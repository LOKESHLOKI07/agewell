import { mapsNavigationUrl, parseDeliveryDestination } from '../deliveryDestination';

describe('parseDeliveryDestination', () => {
  it('reads address and @pin from delivery location', () => {
    expect(parseDeliveryDestination('Flat 302, Green Heights · @19.205000,72.840000')).toEqual({
      label: 'Flat 302, Green Heights',
      coordinate: { latitude: 19.205, longitude: 72.84 },
    });
  });

  it('reads bare pin', () => {
    expect(parseDeliveryDestination('@19.1,72.8').coordinate).toEqual({
      latitude: 19.1,
      longitude: 72.8,
    });
  });

  it('keeps plain address without inventing coordinates', () => {
    expect(parseDeliveryDestination('Borivali West')).toEqual({
      label: 'Borivali West',
      coordinate: null,
    });
  });
});

describe('mapsNavigationUrl', () => {
  it('prefers coordinates for exact navigation', () => {
    expect(
      mapsNavigationUrl({
        label: 'Home',
        coordinate: { latitude: 19.2, longitude: 72.8 },
      }),
    ).toContain('destination=19.2,72.8');
  });
});
