import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SecondaryButton } from '@/components';
import { Icon } from '@/components/ui';
import { colors, minTouchSize, radius, spacing, typography } from '@/constants/theme';

export function AdminRowIconActions({
  editLabel,
  viewLabel,
  deleteLabel,
  onEdit,
  onView,
  onDelete,
}: {
  editLabel: string;
  viewLabel: string;
  deleteLabel: string;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.iconRow}>
      <IconAction label={editLabel} icon="create-outline" onPress={onEdit} />
      <IconAction label={viewLabel} icon="eye-outline" onPress={onView} />
      <IconAction label={deleteLabel} icon="trash-outline" tone="emergency" onPress={onDelete} />
    </View>
  );
}

export function AdminSelectCheckbox({
  checked,
  label,
  onPress,
}: {
  checked: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={styles.checkHit}
    >
      <Icon
        name={checked ? 'checkbox-outline' : 'checkbox-blank-outline'}
        size={20}
        color={checked ? colors.primary : colors.textMuted}
      />
    </Pressable>
  );
}

export function AdminSelectionToolbar({
  allSelected,
  selectedCount,
  onToggleAll,
  onDeleteSelected,
  onClear,
}: {
  allSelected: boolean;
  selectedCount: number;
  onToggleAll: () => void;
  onDeleteSelected: () => void;
  onClear: () => void;
}) {
  return (
    <View style={styles.selectionBar}>
      <Pressable
        onPress={onToggleAll}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: allSelected }}
        accessibilityLabel="Select all on this page"
        style={styles.selectAll}
      >
        <Icon
          name={allSelected ? 'checkbox-outline' : 'checkbox-blank-outline'}
          size={20}
          color={allSelected ? colors.primary : colors.textMuted}
        />
        <Text style={styles.selectAllLabel}>Select all</Text>
      </Pressable>
      {selectedCount > 0 ? (
        <View style={styles.bulkActions}>
          <Text style={styles.bulkText}>{selectedCount} selected</Text>
          <Pressable
            onPress={onDeleteSelected}
            accessibilityRole="button"
            accessibilityLabel="Delete selected"
            style={({ pressed }) => [styles.deleteSelectedBtn, pressed ? styles.pressed : null]}
          >
            <Icon name="trash-outline" size={16} color={colors.white} />
            <Text style={styles.deleteSelectedLabel}>Delete selected</Text>
          </Pressable>
          <SecondaryButton label="Clear" fullWidth={false} onPress={onClear} />
        </View>
      ) : null}
    </View>
  );
}

function IconAction({
  label,
  icon,
  onPress,
  tone = 'default',
}: {
  label: string;
  icon: 'create-outline' | 'eye-outline' | 'trash-outline';
  onPress: () => void;
  tone?: 'default' | 'emergency';
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.iconBtn, pressed ? styles.pressed : null]}
    >
      <Icon name={icon} size={18} color={tone === 'emergency' ? colors.emergency : colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  selectionBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  bulkActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bulkText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  selectAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: minTouchSize,
  },
  selectAllLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  deleteSelectedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: minTouchSize,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.emergency,
  },
  deleteSelectedLabel: {
    ...typography.captionStrong,
    color: colors.white,
  },
  checkHit: {
    minWidth: minTouchSize,
    minHeight: minTouchSize,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBtn: {
    minWidth: 36,
    minHeight: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.85,
  },
});
