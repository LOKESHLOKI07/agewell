import { resolveHomeScreenVariant } from '../homeVariant';

describe('resolveHomeScreenVariant', () => {
  it('returns non_serviceable when services are not live', () => {
    expect(resolveHomeScreenVariant(false, false)).toBe('non_serviceable');
    expect(resolveHomeScreenVariant(false, true)).toBe('non_serviceable');
  });

  it('returns serviceable_no_membership when live without membership', () => {
    expect(resolveHomeScreenVariant(true, false)).toBe('serviceable_no_membership');
  });

  it('returns serviceable_with_membership when live with membership', () => {
    expect(resolveHomeScreenVariant(true, true)).toBe('serviceable_with_membership');
  });
});
