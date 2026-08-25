import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, minTouchSize, radius, spacing, typography } from '@/constants/theme';

interface AdminPaginationProps {
  total: number;
  limit: number;
  offset: number;
  onOffsetChange: (offset: number) => void;
}

export function AdminPagination({ total, limit, offset, onOffsetChange }: AdminPaginationProps) {
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <View style={styles.row} accessibilityRole="adjustable" accessibilityLabel={`Showing ${from} to ${to} of ${total}`}>
      <Text style={styles.meta}>
        {from}–{to} of {total}
      </Text>
      <View style={styles.actions}>
        <Pressable
          onPress={() => onOffsetChange(Math.max(0, offset - limit))}
          disabled={!canPrev}
          accessibilityRole="button"
          accessibilityLabel="Previous page"
          accessibilityState={{ disabled: !canPrev }}
          style={({ pressed }) => [styles.button, !canPrev ? styles.disabled : null, pressed && canPrev ? styles.pressed : null]}
        >
          <Text style={styles.label}>Previous</Text>
        </Pressable>
        <Pressable
          onPress={() => onOffsetChange(offset + limit)}
          disabled={!canNext}
          accessibilityRole="button"
          accessibilityLabel="Next page"
          accessibilityState={{ disabled: !canNext }}
          style={({ pressed }) => [styles.button, !canNext ? styles.disabled : null, pressed && canNext ? styles.pressed : null]}
        >
          <Text style={styles.label}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    minHeight: minTouchSize,
    minWidth: 96,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.primarySoft,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    ...typography.captionStrong,
    color: colors.text,
  },
});
