import { resolveMembershipServicePageVariant } from '../membershipServicePageVariant';

describe('resolveMembershipServicePageVariant', () => {
  it('shows coming soon when the senior is outside the service area', () => {
    expect(
      resolveMembershipServicePageVariant({
        inServiceArea: false,
        hasMembership: true,
        areaReady: true,
        membershipReady: true,
      }),
    ).toBe('non_serviceable');
  });

  it('shows membership required when in area without membership', () => {
    expect(
      resolveMembershipServicePageVariant({
        inServiceArea: true,
        hasMembership: false,
        areaReady: true,
        membershipReady: true,
      }),
    ).toBe('serviceable_no_membership');
  });

  it('shows the live service when in area with membership', () => {
    expect(
      resolveMembershipServicePageVariant({
        inServiceArea: true,
        hasMembership: true,
        areaReady: true,
        membershipReady: true,
      }),
    ).toBe('serviceable_with_membership');
  });

  it('waits until area and membership are known so members do not flash the gate', () => {
    expect(
      resolveMembershipServicePageVariant({
        inServiceArea: true,
        hasMembership: false,
        areaReady: false,
        membershipReady: false,
      }),
    ).toBe('loading');
    expect(
      resolveMembershipServicePageVariant({
        inServiceArea: true,
        hasMembership: true,
        areaReady: true,
        membershipReady: false,
      }),
    ).toBe('loading');
  });

  it('lets add-ons skip membership required when in area', () => {
    expect(
      resolveMembershipServicePageVariant({
        inServiceArea: true,
        hasMembership: false,
        areaReady: true,
        membershipReady: true,
        requireMembership: false,
      }),
    ).toBe('serviceable_with_membership');
  });

  it('still shows coming soon for add-ons outside the service area', () => {
    expect(
      resolveMembershipServicePageVariant({
        inServiceArea: false,
        hasMembership: false,
        areaReady: true,
        membershipReady: true,
        requireMembership: false,
      }),
    ).toBe('non_serviceable');
  });
});
