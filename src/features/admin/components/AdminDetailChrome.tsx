import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon, IconWell, type IconName } from '@/components/ui';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';

export function DetailBackLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.back, pressed ? styles.pressed : null]}
    >
      <Icon name="chevron-back" size={16} color={colors.primary} />
      <Text style={styles.backLabel}>{label}</Text>
    </Pressable>
  );
}

export function DetailActionCard({
  label,
  value,
  action,
  onPress,
  emphasis,
}: {
  label: string;
  value: string;
  action: string;
  onPress: () => void;
  emphasis?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [
        styles.actionCard,
        emphasis ? styles.actionCardEmphasis : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionValue} numberOfLines={2}>
        {value}
      </Text>
      <Text style={styles.actionCta}>{action}</Text>
    </Pressable>
  );
}

export function DetailStatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <View style={styles.actionCard}>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionValue}>{value}</Text>
      {hint ? <Text style={styles.actionHint}>{hint}</Text> : null}
    </View>
  );
}

export function DetailTabBar<T extends string>({
  tabs,
  active,
  onChange,
  accessibilityLabel,
}: {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
  accessibilityLabel: string;
}) {
  return (
    <View style={styles.tabBar} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {tabs.map((item) => {
          const selected = active === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => onChange(item.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={item.label}
              style={({ pressed }) => [styles.tab, selected ? styles.tabActive : null, pressed ? styles.pressed : null]}
            >
              <Text style={[styles.tabLabel, selected ? styles.tabLabelActive : null]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function DetailPanel({
  title,
  action,
  onAction,
  children,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <View style={styles.panel}>
      <View style={styles.panelHead}>
        <Text style={styles.panelTitle}>{title}</Text>
        {action && onAction ? (
          <Pressable
            onPress={onAction}
            accessibilityRole="button"
            accessibilityLabel={action}
            style={styles.panelActionBtn}
          >
            <Text style={styles.panelAction}>{action}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function DetailInfoField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export function DetailEmptyBlock({
  icon,
  title,
  action,
  onAction,
}: {
  icon: IconName;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyBlock}>
      <IconWell tone="primary" size={40}>
        <Icon name={icon} size={18} color={colors.primary} />
      </IconWell>
      <Text style={styles.emptyTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={action}>
          <Text style={styles.emptyAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function DetailEmptyOrList({
  title,
  empty,
  emptyTitle,
  emptyIcon,
  action,
  onAction,
  children,
}: {
  title: string;
  empty: boolean;
  emptyTitle: string;
  emptyIcon: IconName;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <DetailPanel title={title} action={empty ? undefined : action} onAction={empty ? undefined : onAction}>
      {empty ? (
        <DetailEmptyBlock icon={emptyIcon} title={emptyTitle} action={action} onAction={onAction} />
      ) : (
        children
      )}
    </DetailPanel>
  );
}

const styles = StyleSheet.create({
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: minTouchSize,
    alignSelf: 'flex-start',
  },
  backLabel: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  actionCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexGrow: 1,
    flexBasis: 160,
    minWidth: 150,
    minHeight: 96,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    gap: spacing.xs,
    justifyContent: 'center',
  },
  actionCardEmphasis: {
    borderColor: colors.primaryMuted,
    backgroundColor: colors.primarySoft,
  },
  actionLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  actionValue: {
    ...typography.subtitle,
    color: colors.text,
  },
  actionCta: {
    ...typography.captionStrong,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  actionHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabRow: {
    gap: spacing.xs,
    paddingBottom: 0,
  },
  tab: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    justifyContent: 'center',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  panel: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadows.card,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 36,
  },
  panelTitle: {
    ...typography.heading,
    color: colors.text,
    flex: 1,
  },
  panelActionBtn: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  panelAction: {
    ...typography.captionStrong,
    color: colors.primary,
  },
  field: {
    gap: 2,
    paddingVertical: spacing.xs,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  fieldValue: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  emptyBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  emptyTitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyAction: {
    ...typography.captionStrong,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  pressed: {
    opacity: 0.92,
  },
});
