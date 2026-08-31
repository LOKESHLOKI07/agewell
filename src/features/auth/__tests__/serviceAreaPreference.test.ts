import {
  canAvailServices,
  getServiceAreaAvailable,
  resetServiceAreaPreference,
  setServiceAreaAvailable,
} from '../serviceAreaPreference';

describe('service area preference', () => {
  beforeEach(() => {
    resetServiceAreaPreference();
  });

  it('treats unknown preference as available for existing users', () => {
    expect(getServiceAreaAvailable()).toBeNull();
    expect(canAvailServices()).toBe(true);
  });

  it('locks booking when the user is out of area', async () => {
    await setServiceAreaAvailable(false);
    expect(getServiceAreaAvailable()).toBe(false);
    expect(canAvailServices()).toBe(false);
  });

  it('allows booking when the user is in area', async () => {
    await setServiceAreaAvailable(true);
    expect(getServiceAreaAvailable()).toBe(true);
    expect(canAvailServices()).toBe(true);
  });
});
