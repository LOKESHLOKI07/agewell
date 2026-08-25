import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import { useAdminLayout } from '../useAdminLayout';

export interface AdminColumn<T> {
  key: string;
  label: string;
  flex?: number;
  render: (item: T) => ReactNode;
}

interface AdminCollectionProps<T> {
  items: T[];
  columns: AdminColumn<T>[];
  onPress?: (item: T) => void;
  accessibilityLabel: (item: T) => string;
  keyExtractor: (item: T) => string;
}

export function AdminCollection<T>({ items, columns, onPress, accessibilityLabel, keyExtractor }: AdminCollectionProps<T>) {
  const { isDesktop } = useAdminLayout();

  if (isDesktop) {
    return (
      <View style={styles.table} accessibilityRole="list">
        <View style={styles.headerRow}>
          {columns.map((column) => (
            <Text key={column.key} style={[styles.headerCell, { flex: column.flex ?? 1 }]}>
              {column.label}
            </Text>
          ))}
        </View>
        {items.map((item) => {
          const row = (
            <View style={styles.bodyRow}>
              {columns.map((column) => (
                <View key={column.key} style={[styles.cell, { flex: column.flex ?? 1 }]}>
                  {column.render(item)}
                </View>
              ))}
            </View>
          );
          if (!onPress) {
            return (
              <View key={keyExtractor(item)} accessibilityLabel={accessibilityLabel(item)}>
                {row}
              </View>
            );
          }
          return (
            <Pressable
              key={keyExtractor(item)}
              onPress={() => onPress(item)}
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel(item)}
              style={({ pressed }) => [pressed ? styles.pressed : null]}
            >
              {row}
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.cards}>
      {items.map((item) => {
        const card = (
          <View style={[styles.card, shadows.card]}>
            {columns.map((column) => (
              <View key={column.key} style={styles.cardRow}>
                <Text style={styles.cardLabel}>{column.label}</Text>
                <View style={styles.cardValue}>{column.render(item)}</View>
              </View>
            ))}
          </View>
        );
        if (!onPress) {
          return (
            <View key={keyExtractor(item)} accessibilityLabel={accessibilityLabel(item)}>
              {card}
            </View>
          );
        }
        return (
          <Pressable
            key={keyExtractor(item)}
            onPress={() => onPress(item)}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel(item)}
            style={({ pressed }) => [pressed ? styles.pressed : null]}
          >
            {card}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primarySoft,
    gap: spacing.md,
  },
  headerCell: {
    ...typography.captionStrong,
    color: colors.primary,
  },
  bodyRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    minHeight: minTouchSize,
    alignItems: 'center',
    gap: spacing.md,
  },
  cell: {
    justifyContent: 'center',
  },
  cards: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardRow: {
    marginBottom: spacing.sm,
  },
  cardLabel: {
    ...typography.captionStrong,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  cardValue: {
    minHeight: 22,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
});
