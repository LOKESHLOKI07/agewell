import { Image, StyleSheet } from 'react-native';

const logo = require('../../assets/splash/agewell_logo.png');

export const brandGreen = '#3D8B40';

export function AgeWellLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Image
      source={logo}
      style={compact ? styles.compact : styles.full}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="AgeWell. Your Parents. Our Care."
    />
  );
}

const styles = StyleSheet.create({
  full: {
    width: 220,
    height: 147,
  },
  compact: {
    width: 168,
    height: 112,
  },
});
