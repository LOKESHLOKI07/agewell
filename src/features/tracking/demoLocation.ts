import type { TrackingPoint } from './types';
import { interpolateCoordinate, type MapCoordinate } from './live';

/** Seed login only. Never apply this to any other email. */
export const DEMO_SENIOR_EMAIL = 'senior@example.com';

export const DEMO_TICK_MS = 1000;

/** ~58 km/h so the Velachery ride is visible every second without dragging on. */
export const DEMO_SPEED_MPS = 16;

const HOLD_AT_HOME_MS = 8_000;

/** DGP Apartment, Perungudi — next to Velachery, Chennai. */
export const DEMO_DGP_APARTMENT: MapCoordinate = {
  latitude: 12.964608,
  longitude: 80.244226,
};

/** John Doe demo home in Velachery. */
export const DEMO_SENIOR_HOME: MapCoordinate = {
  latitude: 12.9884,
  longitude: 80.2171,
};

/**
 * Road-like path: DGP Apartment → Perungudi roads → 100 Feet Road → Velachery home.
 */
export const DEMO_CARE_ASSOCIATE_ROUTE: MapCoordinate[] = [
  DEMO_DGP_APARTMENT,
  { latitude: 12.9654, longitude: 80.2428 },
  { latitude: 12.9668, longitude: 80.2402 },
  { latitude: 12.9685, longitude: 80.2369 },
  { latitude: 12.9702, longitude: 80.2335 },
  { latitude: 12.9724, longitude: 80.2301 },
  { latitude: 12.9748, longitude: 80.227 },
  { latitude: 12.9772, longitude: 80.2242 },
  { latitude: 12.9798, longitude: 80.2216 },
  { latitude: 12.9824, longitude: 80.2198 },
  { latitude: 12.9852, longitude: 80.2182 },
  DEMO_SENIOR_HOME,
];

/** @deprecated Use DEMO_DGP_APARTMENT. Kept so older demo helpers still compile. */
export const DEMO_CARE_ASSOCIATE_COORDINATE = {
  latitude: String(DEMO_DGP_APARTMENT.latitude),
  longitude: String(DEMO_DGP_APARTMENT.longitude),
} as const;

export type DemoTripSnapshot = {
  coordinate: MapCoordinate;
  heading: number;
  destination: MapCoordinate;
  origin: MapCoordinate;
  traveled: MapCoordinate[];
  remaining: MapCoordinate[];
  arrived: boolean;
  remainingMeters: number;
  remainingLabel: string;
  point: TrackingPoint;
};

const EARTH_RADIUS_M = 6_371_000;

let demoTripStartedAtMs: number | null = null;

export function isDemoSeniorEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === DEMO_SENIOR_EMAIL;
}

export function startDemoCareAssociateTrip(now: number = Date.now()): number {
  demoTripStartedAtMs = now;
  return now;
}

export function haversineMeters(from: MapCoordinate, to: MapCoordinate): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function bearingDegrees(from: MapCoordinate, to: MapCoordinate): number {
  if (from.latitude === to.latitude && from.longitude === to.longitude) {
    return 0;
  }
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

export function routeLengthMeters(route: MapCoordinate[] = DEMO_CARE_ASSOCIATE_ROUTE): number {
  let total = 0;
  for (let i = 1; i < route.length; i += 1) {
    const from = route[i - 1];
    const to = route[i];
    if (from && to) {
      total += haversineMeters(from, to);
    }
  }
  return total;
}

export function demoTripDurationMs(route: MapCoordinate[] = DEMO_CARE_ASSOCIATE_ROUTE): number {
  return Math.max(DEMO_TICK_MS, Math.round((routeLengthMeters(route) / DEMO_SPEED_MPS) * 1000));
}

export function pointAlongRoute(
  meters: number,
  route: MapCoordinate[] = DEMO_CARE_ASSOCIATE_ROUTE,
): { coordinate: MapCoordinate; heading: number; traveled: MapCoordinate[]; remaining: MapCoordinate[] } {
  const origin = route[0] ?? DEMO_DGP_APARTMENT;
  const destination = route[route.length - 1] ?? DEMO_SENIOR_HOME;
  if (route.length < 2) {
    return { coordinate: origin, heading: 0, traveled: [origin], remaining: [destination] };
  }

  const total = routeLengthMeters(route);
  const clamped = Math.min(Math.max(0, meters), total);
  let walked = 0;
  const traveled: MapCoordinate[] = [origin];

  for (let i = 1; i < route.length; i += 1) {
    const from = route[i - 1] ?? origin;
    const to = route[i] ?? destination;
    const segment = haversineMeters(from, to);
    if (walked + segment >= clamped || i === route.length - 1) {
      const progress = segment === 0 ? 1 : (clamped - walked) / segment;
      const coordinate = interpolateCoordinate(from, to, progress);
      const heading = bearingDegrees(from, to);
      traveled.push(coordinate);
      const remaining = [coordinate, ...route.slice(i)];
      if (progress >= 1) {
        remaining.splice(0, 1, to);
      }
      return { coordinate, heading, traveled, remaining };
    }
    traveled.push(to);
    walked += segment;
  }

  return {
    coordinate: destination,
    heading: bearingDegrees(route[route.length - 2] ?? origin, destination),
    traveled: [...route],
    remaining: [destination],
  };
}

export function remainingLabel(remainingMeters: number, arrived: boolean): string {
  if (arrived) {
    return 'Arrived';
  }
  const minutes = Math.max(1, Math.ceil(remainingMeters / DEMO_SPEED_MPS / 60));
  return minutes === 1 ? 'Arriving in 1 min' : `Arriving in ${minutes} min`;
}

export function demoTripAt(elapsedMs: number, now: Date = new Date()): DemoTripSnapshot {
  const durationMs = demoTripDurationMs();
  const cycle = durationMs + HOLD_AT_HOME_MS;
  const safeElapsed = Math.max(0, elapsedMs);
  const inCycle = ((safeElapsed % cycle) + cycle) % cycle;
  const arrived = inCycle >= durationMs;
  const meters = arrived ? routeLengthMeters() : (inCycle / 1000) * DEMO_SPEED_MPS;
  const along = pointAlongRoute(meters);
  const remainingMeters = arrived ? 0 : Math.max(0, routeLengthMeters() - meters);

  return {
    coordinate: along.coordinate,
    heading: along.heading,
    destination: DEMO_SENIOR_HOME,
    origin: DEMO_DGP_APARTMENT,
    traveled: along.traveled,
    remaining: along.remaining,
    arrived,
    remainingMeters,
    remainingLabel: remainingLabel(remainingMeters, arrived),
    point: {
      id: 'demo-senior-example-care-associate',
      sessionId: 'demo-senior-example-session',
      latitude: along.coordinate.latitude.toFixed(6),
      longitude: along.coordinate.longitude.toFixed(6),
      timestamp: now.toISOString(),
    },
  };
}

export function getDemoTripSnapshot(input: {
  email: string | null | undefined;
  now?: Date;
  tripStartedAt?: Date;
}): DemoTripSnapshot | null {
  if (!isDemoSeniorEmail(input.email)) {
    return null;
  }
  const now = input.now ?? new Date();
  const startedAt = input.tripStartedAt?.getTime() ?? demoTripStartedAtMs ?? now.getTime();
  if (demoTripStartedAtMs == null && input.tripStartedAt == null) {
    demoTripStartedAtMs = startedAt;
  }
  return demoTripAt(now.getTime() - startedAt, now);
}

export function createDemoCareAssociatePoint(now: Date = new Date()): TrackingPoint {
  return demoTripAt(0, now).point;
}

/**
 * Client-only overlay for senior@example.com: a live Chennai ride from DGP Apartment
 * toward the senior home. Other logins are never given this pin. Nothing is written
 * to the backend.
 */
export function withDemoCareAssociatePoint(input: {
  email: string | null | undefined;
  point: TrackingPoint | null | undefined;
  now?: Date;
  tripStartedAt?: Date;
}): TrackingPoint | null {
  const snapshot = getDemoTripSnapshot(input);
  if (snapshot) {
    return snapshot.point;
  }
  return input.point ?? null;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}
