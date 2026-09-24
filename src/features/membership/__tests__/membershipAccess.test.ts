jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
}));

jest.mock('@/features/membership/openMembershipPurchase', () => ({
  openMembershipPurchase: jest.fn(),
}));

jest.mock('@/features/home/components/familyHomeTheme', () => ({
  familyHome: {
    purple: '#7B5EA7',
    purpleSoft: '#F9F6FC',
    blue: '#2F80ED',
    blueSoft: '#F5F8FE',
    green: '#4CAF50',
    greenSoft: '#F3FAF4',
    orange: '#E67E22',
    orangeSoft: '#FFF8F2',
    yellowSoft: '#FFFCF0',
  },
}));

import { ApiError } from '@/api/errors';
import type { CurrentMembership } from '@/features/home/types/home';
import {
  hasActiveMembership,
  isAddonServiceSlug,
  isCareManagerSlug,
  isEmergencySupportSlug,
  isMembershipActive,
  isMembershipNotFound,
  isOpenAccessServiceSlug,
} from '../membershipAccess';

describe('membershipAccess', () => {
  const active: CurrentMembership = {
    membershipId: 'm1',
    planId: 'p1',
    planName: 'Single',
    status: 'ACTIVE',
    startDate: '2026-01-01',
    endDate: '2027-01-01',
    benefits: [],
  };

  it('treats ACTIVE as has membership and EXPIRED / missing as not', () => {
    expect(isMembershipActive(active)).toBe(true);
    expect(isMembershipActive({ ...active, status: 'EXPIRED' })).toBe(false);
    expect(hasActiveMembership(null)).toBe(false);
    expect(hasActiveMembership(undefined, new ApiError('x', 404))).toBe(false);
    expect(isMembershipNotFound(new ApiError('x', 404))).toBe(true);
  });

  it('recognises add-on slugs including food', () => {
    expect(isAddonServiceSlug('food')).toBe(true);
    expect(isAddonServiceSlug('emergency-companion')).toBe(true);
    expect(isAddonServiceSlug('grocery')).toBe(false);
    expect(isAddonServiceSlug('companion')).toBe(false);
  });

  it('lets Emergency Support and Care Manager skip the submit membership check', () => {
    expect(isEmergencySupportSlug('emergency-sos')).toBe(true);
    expect(isEmergencySupportSlug('grocery')).toBe(false);
    expect(isCareManagerSlug('care-manager')).toBe(true);
    expect(isOpenAccessServiceSlug('care-manager')).toBe(true);
    expect(isOpenAccessServiceSlug('grocery')).toBe(false);
  });
});
