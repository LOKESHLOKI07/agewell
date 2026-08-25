import { parseSavedHomeCoordinate } from '@/features/tracking/live';

describe('home location integrity', () => {
  it('accepts only lat,lng strings as HOME coordinates', () => {
    expect(parseSavedHomeCoordinate('12.9716, 77.5946')).toEqual({
      latitude: 12.9716,
      longitude: 77.5946,
    });
  });

  it('never treats a street address as GPS coordinates', () => {
    expect(parseSavedHomeCoordinate('12 MG Road, Bengaluru')).toBeNull();
    expect(parseSavedHomeCoordinate('Home')).toBeNull();
    expect(parseSavedHomeCoordinate('')).toBeNull();
    expect(parseSavedHomeCoordinate(null)).toBeNull();
  });
});
