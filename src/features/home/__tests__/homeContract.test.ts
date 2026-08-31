import { homeQueryKeys } from '../api/homeQueryKeys';
import { seniorDisplayName } from '../api/mappers';
import { buildHomeViewModel } from '../selectors/homeViewModel';

describe('Home connected sections do not use mock data', () => {
  it('never falls back to the hardcoded senior name', () => {
    expect(seniorDisplayName({ firstName: 'John', lastName: 'Doe' })).toBe('John Doe');
    expect(seniorDisplayName({ firstName: 'John', lastName: 'Doe' })).not.toBe('Meera ji');
    expect(seniorDisplayName({ firstName: 'lokesh', lastName: 'lokesh' })).toBe('lokesh');
    expect(seniorDisplayName({ firstName: 'Lakshmi', lastName: '' })).toBe('Lakshmi');
  });

  it('never fills membership usage from the old mock 32/40 meals data', () => {
    const viewModel = buildHomeViewModel({});
    expect(viewModel.membership).toBeNull();
    expect(viewModel.greetingName).toBeNull();
    expect(viewModel.quickServices).toEqual([]);
    expect(viewModel.unreadNotificationCount).toBe(0);
  });

  it('keeps Home query keys independent from a second fetching system', () => {
    expect(Object.values(homeQueryKeys)).toEqual(
      expect.arrayContaining([
        ['senior', 'me'],
        ['visits', 'today'],
        ['appointments', 'upcoming'],
        ['medications'],
        ['serviceRequests'],
        ['services'],
        ['membership', 'current'],
        ['membership', 'usage'],
        ['notifications', 'unread'],
      ]),
    );
  });
});
