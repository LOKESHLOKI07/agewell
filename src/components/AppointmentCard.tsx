import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cardSurface, colors, spacing, typography } from '@/constants/theme';
import type { Appointment } from '@/types';
import { formatRelativeDay, formatTime } from '@/utils/date';
import { appointmentStatusPresentation } from '@/utils/status';
import { Icon } from '@/components/ui';
import { IconWell } from '@/components/ui';
import { StatusBadge } from './StatusBadge';

interface AppointmentCardProps {
  appointment: Appointment;
  onPress?: () => void;
}

export function AppointmentCard({ appointment, onPress }: AppointmentCardProps) {
  const presentation = appointmentStatusPresentation(appointment.status);

  const content = (
    <View style={styles.card}>
      <IconWell tone="accent" size={48}>
        <Icon name="doctor" size={20} color={colors.accent} />
      </IconWell>
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.copy}>
            <Text style={styles.name}>{appointment.doctorName}</Text>
            <Text style={styles.meta}>{appointment.specialty}</Text>
            <Text style={styles.meta}>{appointment.hospital}</Text>
          </View>
          <StatusBadge presentation={presentation} />
        </View>
        <View style={styles.footer}>
          <Text style={styles.when}>
            {formatRelativeDay(appointment.scheduledAt)} · {formatTime(appointment.scheduledAt)}
          </Text>
          <Text style={styles.purpose}>{appointment.purpose}</Text>
        </View>
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
      accessibilityLabel={`${appointment.doctorName}, ${appointment.specialty}, ${formatRelativeDay(appointment.scheduledAt)} at ${formatTime(appointment.scheduledAt)}, ${presentation.label}`}
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
    gap: spacing.md,
  },
  copy: {
    flex: 1,
  },
  name: {
    ...typography.subtitle,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  when: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  purpose: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
