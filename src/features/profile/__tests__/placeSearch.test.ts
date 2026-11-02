import { searchPlaces } from '../placeSearch';

describe('searchPlaces', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns empty for short queries without calling the network', async () => {
    globalThis.fetch = jest.fn() as unknown as typeof fetch;
    await expect(searchPlaces('a')).resolves.toEqual([]);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('maps nominatim hits to place results', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          place_id: 1,
          display_name: 'Borivali West, Mumbai',
          lat: '19.2300',
          lon: '72.8600',
        },
      ],
    }) as unknown as typeof fetch;
    await expect(searchPlaces('borivali')).resolves.toEqual([
      {
        id: '1',
        label: 'Borivali West, Mumbai',
        latitude: 19.23,
        longitude: 72.86,
      },
    ]);
  });
});
