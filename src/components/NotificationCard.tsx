import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cardSurface, colors, spacing, typography } from '@/constants/theme';
import type { Notification } from '@/features/home/types/home';
import { formatRelativeTimestamp } from '@/utils/date';
import { isEmergencyNotification, notificationPriorityLabel } from '@/features/notifications/selectors';
import { Icon, IconWell, type IconName } from '@/components/ui';
import { StatusPill } from '@/components/premium';

interface NotificationCardProps {
  notification: Notification;
  onPress: () => void;
}

function priorityIcon(priority: Notification['priority']): IconName {
  if (priority === 'EMERGENCY') {
    return 'warning-outline';
  }
  if (priority === 'IMPORTANT') {
    return 'alert-circle-outline';
  }
  return 'notifications-outline';
}

function priorityTone(priority: Notification['priority']): 'emergency' | 'warning' | 'primary' {
  if (priority === 'EMERGENCY') {
    return 'emergency';
  }
  if (priority === 'IMPORTANT') {
    return 'warning';
  }
  return 'primary';
}

export function NotificationCard({ notification, onPress }: NotificationCardProps) {
  const emergency = isEmergencyNotification(notification);
  const important = notification.priority === 'IMPORTANT';
  const createdAt = notification.createdAt
    ? formatRelativeTimestamp(notification.createdAt)
    : 'Time not on file';
  const title = notification.title ?? 'Notification';
  const message = notification.message ?? '';
  const tone = priorityTone(notification.priority);
  const fg =
    tone === 'emergency' ? colors.emergency : tone === 'warning' ? colors.warning : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${notification.isRead ? 'Read' : 'Unread'} ${notificationPriorityLabel(notification.priority)} notification. ${title}. ${message}. ${createdAt}`}
      style={({ pressed }) => [
        styles.card,
        emergency ? styles.emergencyCard : important ? styles.importantCard : null,
        emergency ? styles.emergencyBorder : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <IconWell tone={tone} size={48}>
        <Icon name={priorityIcon(notification.priority)} size={20} color={fg} />
      </IconWell>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, emergency ? styles.emergencyTitle : null]}>{title}</Text>
          {!notification.isRead ? (
            <View style={styles.unreadDot} accessibilityLabel="Unread" />
          ) : (
            <Text style={styles.readLabel}>Read</Text>
          )}
        </View>
        <View style={styles.metaRow}>
          <StatusPill
            label={notificationPriorityLabel(notification.priority)}
            tone={tone}
            iconLabel={emergency ? '!' : important ? '★' : 'i'}
          />
          <Text style={styles.time}>{createdAt}</Text>
        </View>
        {message ? <Text style={styles.description}>{message}</Text> : null}
        {emergency ? (
          <Text style={styles.emergencyHint}>Emergency priority · Open for details</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardSurface,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  emergencyCard: {
    backgroundColor: colors.emergencySoft,
  },
  importantCard: {
    backgroundColor: colors.warningSoft,
  },
  emergencyBorder: {
    borderWidth: 2,
    borderColor: colors.emergency,
  },
  pressed: {
    opacity: 0.94,
  },
  body: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
    flex: 1,
  },
  emergencyTitle: {
    color: colors.emergency,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  readLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
  },
  emergencyHint: {
    ...typography.captionStrong,
    color: colors.emergency,
    marginTop: spacing.sm,
  },
});
