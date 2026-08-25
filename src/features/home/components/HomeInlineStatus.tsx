import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { getApiErrorMessage } from '@/api/errors';

export function HomeSkeletonRow() {
  return (
    <View style={styles.row} accessibilityLabel="Loading">
      <View style={styles.avatar} />
      <View style={styles.lines}>
        <View style={[styles.line, styles.lineTitle]} />
        <View style={[styles.line, styles.lineSub]} />
      </View>
    </View>
  );
}

export function HomeSkeletonTile() {
  return <View style={styles.tile} accessibilityLabel="Loading" />;
}

export function HomeInlineError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <View style={styles.errorWrap} accessibilityRole="alert">
      <Text style={styles.errorMessage}>{getApiErrorMessage(error)}</Text>
      <Pressable onPress={onRetry} accessibilityRole="button" accessibilityLabel="Try again">
        <Text style={styles.retry}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    marginRight: spacing.md,
  },
  lines: {
    flex: 1,
    gap: 6,
  },
  line: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 4,
  },
  lineTitle: {
    width: '55%',
  },
  lineSub: {
    width: '35%',
  },
  tile: {
    width: '47%',
    minHeight: 110,
    backgroundColor: colors.border,
    borderRadius: radius.lg,
  },
  errorWrap: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  errorMessage: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retry: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
});
