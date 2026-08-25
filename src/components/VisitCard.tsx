import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cardSurface, colors, spacing, typography } from '@/constants/theme';
import type { CareManager, Visit } from '@/types';
import { formatRelativeDay, formatTime } from '@/utils/date';
import { fullName } from '@/utils/greeting';
import { visitStatusPresentation } from '@/utils/status';
import { Icon } from '@/components/ui';
import { IconWell } from '@/components/ui';
import { StatusBadge } from './StatusBadge';

interface VisitCardProps {
  visit: Visit;
  careManager?: CareManager | null;
  onPress?: () => void;
}

export function VisitCard({ visit, careManager, onPress }: VisitCardProps) {
  const presentation = visitStatusPresentation(visit.status);
  const managerName = careManager ? fullName(careManager.firstName, careManager.lastName) : undefined;

  const content = (
    <View style={styles.card}>
      <IconWell tone="primary" size={48}>
        <Icon name="people" size={20} color={colors.primary} />
      </IconWell>
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.copy}>
            <Text style={styles.type}>{visit.type}</Text>
            <Text style={styles.when}>
              {formatRelativeDay(visit.scheduledAt)} · {formatTime(visit.scheduledAt)}
            </Text>
          </View>
          <StatusBadge presentation={presentation} />
        </View>
        {managerName ? <Text style={styles.meta}>Care Manager: {managerName}</Text> : null}
      </View>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${visit.type}, ${formatRelativeDay(visit.scheduledAt)} at ${formatTime(visit.scheduledAt)}, ${presentation.label}`}
      style={({ pressed }) => [pressed ? styles.pressed : null]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardSurface,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.94,
  },
  body: {
    flex: 1,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
  },
  type: {
    ...typography.subtitle,
    color: colors.text,
  },
  when: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
