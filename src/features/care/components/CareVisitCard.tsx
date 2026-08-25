import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cardSurface, colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { Icon, IconWell } from '@/components/ui';
import { StatusBadge } from '@/components/StatusBadge';
import { humanizeStatus } from '@/features/home/selectors/homeViewModel';
import type { Visit } from '@/features/home/types/home';
import { formatLongDate, formatTime } from '@/utils/date';
import { visitSeniorLabel } from '../selectors';

interface CareVisitCardProps {
  visit: Visit;
  onPress?: () => void;
}

export function CareVisitCard({ visit, onPress }: CareVisitCardProps) {
  const when = visit.scheduledAt ? `${formatLongDate(visit.scheduledAt)} · ${formatTime(visit.scheduledAt)}` : 'Time not set';
  const status = humanizeStatus(visit.status);
  const senior = visitSeniorLabel(visit.seniorId);
  const lines = [when, visit.careManagerName, visit.notes].filter((line): line is string => Boolean(line));

  const content = (
    <View style={styles.card}>
      <IconWell tone="primary" size={48}>
        <Icon name="people" size={20} color={colors.primary} />
      </IconWell>
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.title}>{senior}</Text>
          <StatusBadge
            presentation={{
              label: status,
              color: colors.primary,
              background: colors.primarySoft,
            }}
          />
        </View>
        {lines.map((line, index) => (
          <Text key={`${index}-${line}`} style={styles.line}>
            {line}
          </Text>
        ))}
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
      accessibilityLabel={`${senior}. ${lines.join('. ')}`}
      accessibilityHint="Opens this visit"
      style={({ pressed }) => [pressed ? styles.pressed : null]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardSurface,
    minHeight: minTouchSize,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
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
  title: {
    ...typography.subtitle,
    color: colors.text,
    flex: 1,
  },
  line: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  pressed: {
    opacity: 0.94,
  },
});
