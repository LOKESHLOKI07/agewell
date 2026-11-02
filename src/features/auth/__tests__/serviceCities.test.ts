import { isSuperStaff, serviceCityFromTier, staffScopeLabel } from '../serviceCities';

describe('serviceCities', () => {
  it('maps tiers to cities', () => {
    expect(serviceCityFromTier('tier1')).toBe('mumbai');
    expect(serviceCityFromTier('tier2')).toBe('chandrapur');
  });

  it('labels super vs city admins', () => {
    expect(isSuperStaff({ role: 'ADMIN', serviceCity: null })).toBe(true);
    expect(isSuperStaff({ role: 'ADMIN', serviceCity: 'mumbai' })).toBe(false);
    expect(staffScopeLabel({ role: 'ADMIN', serviceCity: null })).toBe('Super admin');
    expect(staffScopeLabel({ role: 'ADMIN', serviceCity: 'mumbai' })).toBe('Mumbai admin');
    expect(staffScopeLabel({ role: 'ADMIN', serviceCity: 'chandrapur' })).toBe('Chandrapur admin');
  });
});
