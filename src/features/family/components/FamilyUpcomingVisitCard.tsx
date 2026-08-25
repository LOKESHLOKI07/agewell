import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, Icon } from '@/components/ui';
import { StatusBadge } from '@/components/StatusBadge';
import { cardSurface, colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { humanizeStatus } from '@/features/home/selectors/homeViewModel';
import type { Visit } from '@/features/home/types/home';
import { formatRelativeDay, formatTime } from '@/utils/date';

interface FamilyUpcomingVisitCardProps {
  visit: Visit;
  onPress: () => void;
}

export function FamilyUpcomingVisitCard({ visit, onPress }: FamilyUpcomingVisitCardProps) {
  const when = visit.scheduledAt
    ? `${formatRelativeDay(visit.scheduledAt)} · ${formatTime(visit.scheduledAt)}`
    : 'Time not set';
  const associate = visit.careManagerName ?? 'Care associate';

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${associate}. Companion Care Associate. ${when}. ${humanizeStatus(visit.status)}`}
        accessibilityHint="Opens this visit"
        style={({ pressed }) => [styles.body, pressed ? styles.pressed : null]}
      >
        <Avatar name={associate} size={52} />
        <View style={styles.copy}>
          <View style={styles.top}>
            <Text style={styles.name}>{associate}</Text>
            <StatusBadge
              presentation={{
                label: humanizeStatus(visit.status),
                color: colors.primary,
                background: colors.primarySoft,
              }}
            />
          </View>
          <Text style={styles.role}>Companion Care Associate</Text>
          <View style={styles.whenRow}>
            <Icon name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.when}>{when}</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardSurface,
    overflow: 'hidden',
  },
  body: {
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
  },
  copy: {
    flex: 1,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    ...typography.subtitle,
    color: colors.text,
    flex: 1,
  },
  role: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  whenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  when: {
    ...typography.captionStrong,
    color: colors.text,
  },
  pressed: {
    opacity: 0.94,
  },
});
