import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';

export function BrandMark({ size = 'large' }: { size?: 'large' | 'small' }) {
  const isLarge = size === 'large';

  return (
    <View style={styles.wrap} accessibilityRole="image" accessibilityLabel="AgeWell India">
      <View style={[styles.mark, isLarge ? styles.markLarge : styles.markSmall]}>
        <Text style={[styles.letter, isLarge ? styles.letterLarge : styles.letterSmall]}>A</Text>
      </View>
      <Text style={[styles.wordmark, isLarge ? styles.wordmarkLarge : styles.wordmarkSmall]}>
        AGEWELL INDIA
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  mark: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  markLarge: {
    width: 84,
    height: 84,
    borderRadius: 28,
  },
  markSmall: {
    width: 56,
    height: 56,
    borderRadius: 18,
  },
  letter: {
    color: colors.white,
    fontWeight: '700',
  },
  letterLarge: {
    fontSize: 36,
  },
  letterSmall: {
    fontSize: 24,
  },
  wordmark: {
    letterSpacing: 2.4,
    color: colors.primary,
    fontWeight: '700',
  },
  wordmarkLarge: {
    fontSize: 18,
  },
  wordmarkSmall: {
    fontSize: 14,
  },
});
