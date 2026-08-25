import { StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '@/components';
import { colors, spacing, typography } from '@/constants/theme';

export function SplashScreen() {
  return (
    <View style={styles.screen} accessibilityLabel="AgeWell India. Your Parents. Our Care.">
      <BrandMark />
      <Text style={styles.tagline}>Your Parents. Our Care.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  tagline: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
});
