import { resolveEmergencySupportVariant } from '../emergencySupportVariant';

describe('resolveEmergencySupportVariant', () => {
  it('shows coming soon when the senior is outside the service area', () => {
    expect(
      resolveEmergencySupportVariant({
        role: 'SENIOR',
        inServiceArea: false,
        hasMembership: true,
        areaReady: true,
        membershipReady: true,
      }),
    ).toBe('non_serviceable');
  });

  it('shows membership required when in area without membership', () => {
    expect(
      resolveEmergencySupportVariant({
        role: 'SENIOR',
        inServiceArea: true,
        hasMembership: false,
        areaReady: true,
        membershipReady: true,
      }),
    ).toBe('serviceable_no_membership');
  });

  it('shows the SOS button when in area with membership', () => {
    expect(
      resolveEmergencySupportVariant({
        role: 'SENIOR',
        inServiceArea: true,
        hasMembership: true,
        areaReady: true,
        membershipReady: true,
      }),
    ).toBe('serviceable_with_membership');
  });

  it('waits until area and membership are known so members do not flash the gate', () => {
    expect(
      resolveEmergencySupportVariant({
        role: 'SENIOR',
        inServiceArea: true,
        hasMembership: false,
        areaReady: false,
        membershipReady: false,
      }),
    ).toBe('loading');
    expect(
      resolveEmergencySupportVariant({
        role: 'SENIOR',
        inServiceArea: true,
        hasMembership: true,
        areaReady: true,
        membershipReady: false,
      }),
    ).toBe('loading');
  });

  it('lets family open the live status layout without the hold button', () => {
    expect(
      resolveEmergencySupportVariant({
        role: 'FAMILY',
        inServiceArea: false,
        hasMembership: false,
        areaReady: false,
        membershipReady: false,
      }),
    ).toBe('serviceable_with_membership');
  });
});
