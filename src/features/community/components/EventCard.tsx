import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, IconWell } from '@/components/ui';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import type { CommunityEvent, EventRegistration } from '../types';
import { capacityLabel, eventTitle, formatEventDate, formatEventTime } from '../selectors';

interface EventCardProps {
  event: CommunityEvent;
  registration?: EventRegistration | null;
  onPress: () => void;
  onRegister?: () => void;
  registerDisabled?: boolean;
  registerLabel?: string;
}

export function EventCard({
  event,
  registration,
  onPress,
  onRegister,
  registerDisabled = false,
  registerLabel,
}: EventCardProps) {
  const title = eventTitle(event);
  const date = formatEventDate(event.eventDate);
  const time = formatEventTime(event.eventDate);
  const registered = registration?.status === 'REGISTERED';
  const cta = registerLabel ?? (registered ? 'Registered' : 'Register');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${cta}`}
      accessibilityHint="Opens event details"
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <Text style={styles.eyebrow}>Community event</Text>
      <Text style={styles.title}>{title}</Text>
      {event.description ? <Text style={styles.description}>{event.description}</Text> : null}

      <View style={styles.metaRow}>
        {date ? (
          <View style={styles.meta}>
            <IconWell tone="primary" size={36} rounded="full">
              <Icon name="calendar-outline" size={16} color={colors.primary} />
            </IconWell>
            <Text style={styles.metaText}>{date}</Text>
          </View>
        ) : null}
        {time ? (
          <View style={styles.meta}>
            <IconWell tone="accent" size={36} rounded="full">
              <Icon name="time-outline" size={16} color={colors.accent} />
            </IconWell>
            <Text style={styles.metaText}>{time}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.capacity}>
          <Icon name="people-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.capacityText}>{capacityLabel(event.capacity)}</Text>
        </View>
        <Icon name="chevron-forward" size={20} color={colors.textMuted} />
      </View>

      {registered ? (
        <View style={styles.status}>
          <Icon name="checkmark-circle-outline" size={18} color={colors.safe} />
          <Text style={styles.statusText}>Registered</Text>
        </View>
      ) : null}

      {onRegister ? (
        <Pressable
          onPress={onRegister}
          disabled={registerDisabled || registered}
          accessibilityRole="button"
          accessibilityLabel={cta}
          accessibilityState={{ disabled: registerDisabled || registered }}
          style={({ pressed }) => [
            styles.cta,
            registered ? styles.ctaRegistered : null,
            pressed && !registered && !registerDisabled ? styles.ctaPressed : null,
            (registerDisabled || registered) && !registered ? styles.ctaDisabled : null,
          ]}
        >
          <Text style={[styles.ctaLabel, registered ? styles.ctaLabelRegistered : null]}>{cta}</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

export function EventCardSkeleton() {
  return (
    <View style={styles.card} accessibilityLabel="Loading community event">
      <View style={[styles.skel, styles.skelEyebrow]} />
      <View style={[styles.skel, styles.skelTitle]} />
      <View style={[styles.skel, styles.skelBody]} />
      <View style={styles.metaRow}>
        <View style={[styles.skel, styles.skelMeta]} />
        <View style={[styles.skel, styles.skelMeta]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadows.card,
  },
  pressed: {
    opacity: 0.96,
  },
  eyebrow: {
    ...typography.label,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: minTouchSize - 8,
  },
  metaText: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  capacity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  capacityText: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.safeSoft,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  statusText: {
    ...typography.captionStrong,
    color: colors.safe,
  },
  cta: {
    minHeight: minTouchSize,
    marginTop: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaRegistered: {
    backgroundColor: colors.safeSoft,
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaLabel: {
    ...typography.bodyStrong,
    color: colors.textOnPrimary,
  },
  ctaLabelRegistered: {
    color: colors.safe,
  },
  skel: {
    backgroundColor: colors.border,
    borderRadius: radius.sm,
  },
  skelEyebrow: {
    height: 10,
    width: 120,
  },
  skelTitle: {
    height: 22,
    width: '70%',
  },
  skelBody: {
    height: 16,
    width: '90%',
  },
  skelMeta: {
    height: 36,
    width: 120,
    borderRadius: radius.full,
  },
});
