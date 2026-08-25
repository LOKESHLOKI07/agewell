import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/ui';
import { colors, minTouchSize, radius, spacing, typography } from '@/constants/theme';
import { humanizeStatus } from '@/features/home/selectors/homeViewModel';
import type { EventRegistration } from '../types';
import { eventTitle } from '../selectors';

interface RegistrationRowProps {
  registration: EventRegistration;
  eventDate?: string | null;
  onPress: () => void;
  onCancel?: () => void;
}

export function RegistrationRow({ registration, eventDate, onPress, onCancel }: RegistrationRowProps) {
  const title = eventTitle(registration);
  const status = humanizeStatus(registration.status);
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${status}`}
        style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
      >
        <View style={styles.body}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.meta}>{status}</Text>
          {eventDate ? <Text style={styles.meta}>{eventDate}</Text> : null}
        </View>
        <Icon name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
      {onCancel && registration.status === 'REGISTERED' ? (
        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={`Cancel registration for ${title}`}
          style={({ pressed }) => [styles.cancel, pressed ? styles.pressed : null]}
        >
          <Text style={styles.cancelText}>Cancel registration</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  row: {
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.primarySoft,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cancel: {
    minHeight: minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.emergency,
  },
  cancelText: {
    ...typography.captionStrong,
    color: colors.emergency,
  },
});
