import { Image, StyleSheet } from 'react-native';

const logoDefault = require('../../assets/logo_splash.png');
const logoOnDark = require('../../assets/logo_sidebar.png');

export const brandGreen = '#3D8B40';

export function AgeWellLogo({
  compact = false,
  width,
  height,
  variant = 'default',
}: {
  compact?: boolean;
  width?: number;
  height?: number;
  /** `onDark` uses a transparent mark tuned for purple/dark chrome (admin sidebar). */
  variant?: 'default' | 'onDark';
}) {
  const style = width != null && height != null ? { width, height } : compact ? styles.compact : styles.full;
  return (
    <Image
      source={variant === 'onDark' ? logoOnDark : logoDefault}
      style={style}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="AgeWell. Your Comfort Our Care."
    />
  );
}

const styles = StyleSheet.create({
  full: {
    width: 220,
    height: 220,
  },
  compact: {
    width: 140,
    height: 140,
  },
});
