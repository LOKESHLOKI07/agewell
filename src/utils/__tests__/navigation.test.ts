import { fallbackHomeHref, safeGoBack } from '../navigation';

const back = jest.fn();
const replace = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    back: (...args: unknown[]) => back(...args),
    replace: (...args: unknown[]) => replace(...args),
  },
}));

describe('safeGoBack', () => {
  beforeEach(() => {
    back.mockReset();
    replace.mockReset();
  });

  it('goes back when the navigator has a screen', () => {
    safeGoBack(true, 'SENIOR');
    expect(back).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
  });

  it('opens the role home when there is no screen to go back to', () => {
    safeGoBack(false, 'SENIOR');
    expect(back).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/(tabs)');
    expect(fallbackHomeHref('FAMILY')).toBe('/(family)');
    expect(fallbackHomeHref('CARE_MANAGER')).toBe('/(care)');
  });
});
