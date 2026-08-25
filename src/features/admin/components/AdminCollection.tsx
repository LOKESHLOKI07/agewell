import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import { useAdminLayout } from '../useAdminLayout';

export interface AdminColumn<T> {
  key: string;
  label: string;
  flex?: number;
  render: (item: T) => ReactNode;
  /** Optional custom header cell (e.g. select-all checkbox). Falls back to `label`. */
  header?: ReactNode;
}

interface AdminCollectionProps<T> {
  items: T[];
  columns: AdminColumn<T>[];
  onPress?: (item: T) => void;
  accessibilityLabel: (item: T) => string;
  keyExtractor: (item: T) => string;
  actions?: (item: T) => ReactNode;
  actionsLabel?: string;
  /** Optional toolbar above the table (e.g. select-all + bulk actions). */
  headerLeading?: ReactNode;
}

export function AdminCollection<T>({
  items,
  columns,
  onPress,
  accessibilityLabel,
  keyExtractor,
  actions,
  actionsLabel = 'Actions',
  headerLeading,
}: AdminCollectionProps<T>) {
  const { isDesktop } = useAdminLayout();
  const contentFlex = columns.reduce((sum, column) => sum + (column.flex ?? 1), 0);

  if (isDesktop) {
    return (
      <View style={styles.table} accessibilityRole="list">
        {headerLeading ? <View style={styles.toolbar}>{headerLeading}</View> : null}
        <View style={styles.headerRow}>
          {columns.map((column) => (
            <View key={column.key} style={[styles.headerCellWrap, { flex: column.flex ?? 1 }]}>
              {column.header ?? <Text style={styles.headerCell}>{column.label}</Text>}
            </View>
          ))}
          {actions ? (
            <View style={[styles.headerCellWrap, { flex: 1 }]}>
              <Text style={styles.headerCell}>{actionsLabel}</Text>
            </View>
          ) : null}
        </View>
        {items.map((item) => {
          const cells = columns.map((column) => (
            <View key={column.key} style={[styles.cell, { flex: column.flex ?? 1 }]}>
              {column.render(item)}
            </View>
          ));
          const actionCell = actions ? <View style={[styles.cell, { flex: 1 }]}>{actions(item)}</View> : null;

          if (!onPress) {
            return (
              <View key={keyExtractor(item)} style={styles.bodyRow} accessibilityLabel={accessibilityLabel(item)}>
                {cells}
                {actionCell}
              </View>
            );
          }

          if (!actions) {
            return (
              <Pressable
                key={keyExtractor(item)}
                onPress={() => onPress(item)}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel(item)}
                style={({ pressed }) => [pressed ? styles.pressed : null]}
              >
                <View style={styles.bodyRow}>{cells}</View>
              </Pressable>
            );
          }

          return (
            <View key={keyExtractor(item)} style={styles.bodyRow}>
              <Pressable
                onPress={() => onPress(item)}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel(item)}
                style={({ pressed }) => [styles.rowMain, { flex: contentFlex }, pressed ? styles.pressed : null]}
              >
                {cells}
              </Pressable>
              {actionCell}
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.cards}>
      {headerLeading ? <View style={styles.toolbar}>{headerLeading}</View> : null}
      {items.map((item) => {
        const rows = columns.map((column) => (
          <View key={column.key} style={styles.cardRow}>
            <Text style={styles.cardLabel}>{column.label}</Text>
            <View style={styles.cardValue}>{column.render(item)}</View>
          </View>
        ));
        const actionBlock = actions ? <View style={styles.cardActions}>{actions(item)}</View> : null;

        if (!onPress) {
          return (
            <View key={keyExtractor(item)} style={[styles.card, shadows.card]} accessibilityLabel={accessibilityLabel(item)}>
              {rows}
              {actionBlock}
            </View>
          );
        }

        return (
          <View key={keyExtractor(item)} style={[styles.card, shadows.card]}>
            <Pressable
              onPress={() => onPress(item)}
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel(item)}
              style={({ pressed }) => [pressed ? styles.pressed : null]}
            >
              {rows}
            </Pressable>
            {actionBlock}
          </View>
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
    width: '100%',
  },
  toolbar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surfaceElevated,
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primarySoft,
    gap: spacing.md,
  },
  headerCellWrap: {
    justifyContent: 'center',
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
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: minTouchSize,
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
  cardActions: {
    marginTop: spacing.sm,
  },
  pressed: {
    opacity: 0.88,
  },
});
