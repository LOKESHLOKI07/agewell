import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';

interface MapLegendProps {
  home: boolean;
  senior: boolean;
  associate: boolean;
}

export function MapLegend({ home, senior, associate }: MapLegendProps) {
  if (!home && !senior && !associate) {
    return null;
  }
  return (
    <View style={[styles.card, shadows.float]} accessibilityRole="summary" accessibilityLabel="Map legend">
      {home ? <Text style={styles.item}>🏠 Home</Text> : null}
      {senior ? <Text style={styles.item}>📍 Senior</Text> : null}
      {associate ? <Text style={styles.item}>🚗 Care Associate</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  item: {
    ...typography.captionStrong,
    color: colors.text,
  },
});
