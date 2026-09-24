/** Popular pickup / drop spots in the AgeWell service area (Kandivali & Borivali). */

export type LocalTransportPlace = {
  id: string;
  label: string;
  area: string;
  keywords: string[];
};

export const LOCAL_TRANSPORT_PLACES: LocalTransportPlace[] = [
  {
    id: 'kandivali-w-stn',
    label: 'Kandivali West Station',
    area: 'Kandivali West',
    keywords: ['kandivali', 'station', 'west', 'railway'],
  },
  {
    id: 'kandivali-e-stn',
    label: 'Kandivali East Station',
    area: 'Kandivali East',
    keywords: ['kandivali', 'station', 'east', 'railway'],
  },
  {
    id: 'borivali-stn',
    label: 'Borivali Station',
    area: 'Borivali West',
    keywords: ['borivali', 'station', 'railway'],
  },
  {
    id: 'mahavir-nagar',
    label: 'Mahavir Nagar',
    area: 'Kandivali West',
    keywords: ['mahavir', 'nagar', 'kandivali'],
  },
  {
    id: 'thakur-complex',
    label: 'Thakur Complex',
    area: 'Kandivali East',
    keywords: ['thakur', 'complex', 'kandivali'],
  },
  {
    id: 'thakur-village',
    label: 'Thakur Village',
    area: 'Kandivali East',
    keywords: ['thakur', 'village', 'kandivali'],
  },
  {
    id: 'growels',
    label: "Growel's 101 Mall",
    area: 'Kandivali East',
    keywords: ['growel', 'mall', '101', 'kandivali'],
  },
  {
    id: 'oberoi-mall',
    label: 'Oberoi Mall',
    area: 'Goregaon East',
    keywords: ['oberoi', 'mall', 'goregaon'],
  },
  {
    id: 'poisar',
    label: 'Poisar Bus Depot',
    area: 'Kandivali West',
    keywords: ['poisar', 'bus', 'depot', 'kandivali'],
  },
  {
    id: 'charkop',
    label: 'Charkop Market',
    area: 'Kandivali West',
    keywords: ['charkop', 'market', 'kandivali'],
  },
  {
    id: 'ic-colony',
    label: 'IC Colony',
    area: 'Borivali West',
    keywords: ['ic', 'colony', 'borivali'],
  },
  {
    id: 'lokhandwala',
    label: 'Lokhandwala Kandivali',
    area: 'Kandivali East',
    keywords: ['lokhandwala', 'kandivali'],
  },
  {
    id: 'link-road',
    label: 'Link Road, Kandivali',
    area: 'Kandivali West',
    keywords: ['link', 'road', 'kandivali'],
  },
  {
    id: 'sv-road-borivali',
    label: 'S.V. Road, Borivali',
    area: 'Borivali West',
    keywords: ['sv', 'road', 'borivali'],
  },
  {
    id: 'eksera',
    label: 'Eksar Road',
    area: 'Borivali West',
    keywords: ['eksar', 'borivali'],
  },
  {
    id: 'shimpoli',
    label: 'Shimpoli',
    area: 'Borivali West',
    keywords: ['shimpoli', 'borivali'],
  },
  {
    id: 'mhatre-wadi',
    label: 'Mhatre Wadi',
    area: 'Borivali West',
    keywords: ['mhatre', 'wadi', 'borivali'],
  },
  {
    id: 'dahanukarwadi',
    label: 'Dahanukarwadi',
    area: 'Kandivali West',
    keywords: ['dahanukar', 'wadi', 'kandivali'],
  },
  {
    id: 'ajanta',
    label: 'Ajanta Talkies',
    area: 'Borivali West',
    keywords: ['ajanta', 'talkies', 'cinema', 'borivali'],
  },
  {
    id: 'national-park',
    label: 'Sanjay Gandhi National Park',
    area: 'Borivali East',
    keywords: ['national', 'park', 'sgnp', 'borivali'],
  },
];

export type LocalTransportSuggestion = {
  id: string;
  label: string;
  subtitle: string;
  kind: 'place' | 'home' | 'current';
};

export function filterLocalTransportPlaces(
  query: string,
  extras: LocalTransportSuggestion[] = [],
  limit = 6,
): LocalTransportSuggestion[] {
  const q = query.trim().toLowerCase();
  const fromExtras = q
    ? extras.filter(
        (item) =>
          item.label.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q),
      )
    : extras;

  const fromCatalog = LOCAL_TRANSPORT_PLACES.filter((place) => {
    if (!q) return true;
    const hay = `${place.label} ${place.area} ${place.keywords.join(' ')}`.toLowerCase();
    return q.split(/\s+/).every((token) => hay.includes(token));
  }).map(
    (place): LocalTransportSuggestion => ({
      id: place.id,
      label: place.label,
      subtitle: place.area,
      kind: 'place',
    }),
  );

  const seen = new Set<string>();
  const merged: LocalTransportSuggestion[] = [];
  for (const item of [...fromExtras, ...fromCatalog]) {
    const key = item.label.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
    if (merged.length >= limit) break;
  }
  return merged;
}
