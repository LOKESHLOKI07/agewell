import { parseMapCoordinate, type MapCoordinate } from '@/features/tracking/live';

/** Delivery.location may be "Address · @19.12,72.83" or plain text / @coords. */
export function parseDeliveryDestination(location: string | null | undefined): {
  label: string | null;
  coordinate: MapCoordinate | null;
} {
  const raw = (location ?? '').trim();
  if (!raw) {
    return { label: null, coordinate: null };
  }

  const atMatch = raw.match(/@(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (atMatch) {
    const coordinate = parseMapCoordinate(atMatch[1], atMatch[2]);
    const label = raw
      .slice(0, atMatch.index)
      .replace(/\s*·\s*$/, '')
      .trim();
    return { label: label || null, coordinate };
  }

  const bare = parseMapCoordinate(
    raw.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/)?.[1] ?? null,
    raw.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/)?.[2] ?? null,
  );
  if (bare) {
    return { label: null, coordinate: bare };
  }

  return { label: raw, coordinate: null };
}

export function mapsNavigationUrl(destination: {
  label: string | null;
  coordinate: MapCoordinate | null;
}): string | null {
  if (destination.coordinate) {
    const { latitude, longitude } = destination.coordinate;
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }
  if (destination.label) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination.label)}`;
  }
  return null;
}
