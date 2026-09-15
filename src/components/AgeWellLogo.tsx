import { Image, StyleSheet } from 'react-native';

const logo = require('../../assets/logo_splash.png');

export const brandGreen = '#3D8B40';

export function AgeWellLogo({
  compact = false,
  width,
  height,
}: {
  compact?: boolean;
  width?: number;
  height?: number;
}) {
  const style = width != null && height != null ? { width, height } : compact ? styles.compact : styles.full;
  return (
    <Image
      source={logo}
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
