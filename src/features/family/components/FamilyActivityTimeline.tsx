import { StyleSheet, Text, View } from 'react-native';
import { Icon, IconWell } from '@/components/ui';
import { colors, spacing, tones, typography } from '@/constants/theme';
import { formatRelativeDay, formatTime } from '@/utils/date';
import type { FamilyActivityItem } from '../selectors';

interface FamilyActivityTimelineProps {
  items: FamilyActivityItem[];
}

export function FamilyActivityTimeline({ items }: FamilyActivityTimelineProps) {
  if (items.length === 0) {
    return <Text style={styles.empty}>No recent activity yet.</Text>;
  }

  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <View key={item.id} style={[styles.row, index === items.length - 1 ? styles.rowLast : null]}>
          <IconWell tone={item.tone} size={40} rounded="full">
            <Icon name={item.icon} size={18} color={tones[item.tone === 'default' ? 'primary' : item.tone].fg} />
          </IconWell>
          <View style={styles.copy}>
            <View style={styles.top}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.time}>{formatActivityTime(item.at)}</Text>
            </View>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function formatActivityTime(value: string | null): string {
  if (!value) {
    return '';
  }
  return `${formatRelativeDay(value)}, ${formatTime(value)}`;
}

const styles = StyleSheet.create({
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  copy: {
    flex: 1,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
    flex: 1,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    paddingVertical: spacing.md,
  },
});
