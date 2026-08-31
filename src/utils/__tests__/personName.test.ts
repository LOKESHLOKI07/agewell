import { joinPersonName } from '../personName';

describe('joinPersonName', () => {
  it('joins distinct first and last names', () => {
    expect(joinPersonName('Lakshmi', 'Sharma')).toBe('Lakshmi Sharma');
  });

  it('does not repeat a single given name stored as both first and last', () => {
    expect(joinPersonName('lokesh', 'lokesh')).toBe('lokesh');
    expect(joinPersonName('Lokesh', 'LOKESH')).toBe('Lokesh');
  });

  it('returns the first name when last name is empty', () => {
    expect(joinPersonName('Lakshmi', '')).toBe('Lakshmi');
    expect(joinPersonName('Lakshmi', null)).toBe('Lakshmi');
  });
});
