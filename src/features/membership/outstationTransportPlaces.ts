/** Popular outstation drop destinations from Mumbai / Kandivali–Borivali. */

import {
  LOCAL_TRANSPORT_PLACES,
  type LocalTransportSuggestion,
} from './localTransportPlaces';

export type OutstationPlace = {
  id: string;
  label: string;
  area: string;
  keywords: string[];
};

export const OUTSTATION_DESTINATIONS: OutstationPlace[] = [
  { id: 'pune', label: 'Pune', area: 'Maharashtra', keywords: ['pune', 'puné'] },
  { id: 'lonavala', label: 'Lonavala', area: 'Maharashtra', keywords: ['lonavala', 'lonavla'] },
  { id: 'khandala', label: 'Khandala', area: 'Maharashtra', keywords: ['khandala'] },
  { id: 'nashik', label: 'Nashik', area: 'Maharashtra', keywords: ['nashik', 'nasik'] },
  { id: 'shirdi', label: 'Shirdi', area: 'Maharashtra', keywords: ['shirdi'] },
  { id: 'mahabaleshwar', label: 'Mahabaleshwar', area: 'Maharashtra', keywords: ['mahabaleshwar'] },
  { id: 'alibaug', label: 'Alibaug', area: 'Maharashtra', keywords: ['alibaug', 'alibag'] },
  { id: 'goa', label: 'Goa', area: 'India', keywords: ['goa'] },
  { id: 'igatpuri', label: 'Igatpuri', area: 'Maharashtra', keywords: ['igatpuri'] },
  { id: 'mumbai-airport', label: 'Mumbai Airport (T2)', area: 'Mumbai', keywords: ['airport', 'mumbai', 't2'] },
  { id: 'csmt', label: 'CSMT / VT Station', area: 'Mumbai', keywords: ['csmt', 'vt', 'station'] },
  { id: 'thane', label: 'Thane', area: 'Maharashtra', keywords: ['thane'] },
];

export function filterOutstationPlaces(
  query: string,
  kind: 'pickup' | 'drop',
  extras: LocalTransportSuggestion[] = [],
  limit = 6,
): LocalTransportSuggestion[] {
  const q = query.trim().toLowerCase();
  const catalog = kind === 'pickup' ? LOCAL_TRANSPORT_PLACES : OUTSTATION_DESTINATIONS;

  const fromExtras = q
    ? extras.filter(
        (item) =>
          item.label.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q),
      )
    : extras;

  const fromCatalog = catalog
    .filter((place) => {
      if (!q) return true;
      const hay = `${place.label} ${place.area} ${place.keywords.join(' ')}`.toLowerCase();
      return q.split(/\s+/).every((token) => hay.includes(token));
    })
    .map(
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
