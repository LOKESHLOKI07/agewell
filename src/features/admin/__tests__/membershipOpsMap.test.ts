import { MEMBERSHIP_OPS_MAP, findMembershipOps } from '../membershipOpsMap';

describe('membershipOpsMap', () => {
  it('covers all 21 membership slugs', () => {
    expect(MEMBERSHIP_OPS_MAP).toHaveLength(21);
  });

  it('maps SOS to emergencies and grocery to orders', () => {
    expect(findMembershipOps('emergency-sos')?.adminInbox).toBe('emergencies');
    expect(findMembershipOps('grocery')?.adminInbox).toBe('orders');
    expect(findMembershipOps('cyber-security')?.adminHref).toContain('offerings');
    expect(findMembershipOps('health-check')?.adminInbox).toBe('appointments');
  });
});
