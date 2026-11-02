export type PlaceSearchHit = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

type NominatimHit = {
  place_id?: number | string;
  display_name?: string;
  lat?: string;
  lon?: string;
};

/** OpenStreetMap Nominatim — no Google Places key required. */
export async function searchPlaces(query: string, limit = 6): Promise<PlaceSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url =
    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0` +
    `&limit=${limit}&countrycodes=in&q=${encodeURIComponent(q)}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
      // Nominatim requires an identifying User-Agent.
      'User-Agent': 'AgeWellEldCare/1.0 (home-address-pin)',
    },
  });
  if (!response.ok) {
    throw new Error('Place search failed');
  }
  const rows = (await response.json()) as NominatimHit[];
  const hits: PlaceSearchHit[] = [];
  for (const row of rows) {
    const latitude = Number(row.lat);
    const longitude = Number(row.lon);
    const label = (row.display_name || '').trim();
    if (!label || !Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    hits.push({
      id: String(row.place_id ?? `${latitude},${longitude}`),
      label,
      latitude,
      longitude,
    });
  }
  return hits;
}

export async function reverseGeocodeLabel(latitude: number, longitude: number): Promise<string | null> {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&addressdetails=0` +
    `&lat=${encodeURIComponent(String(latitude))}&lon=${encodeURIComponent(String(longitude))}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
      'User-Agent': 'AgeWellEldCare/1.0 (home-address-pin)',
    },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { display_name?: string };
  const label = (data.display_name || '').trim();
  return label || null;
}
