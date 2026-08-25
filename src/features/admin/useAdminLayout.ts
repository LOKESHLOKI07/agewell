import { useWindowDimensions } from 'react-native';
import { isDesktopWidth } from './selectors';

export function useAdminLayout() {
  const { width } = useWindowDimensions();
  return {
    width,
    isDesktop: isDesktopWidth(width),
  };
}
