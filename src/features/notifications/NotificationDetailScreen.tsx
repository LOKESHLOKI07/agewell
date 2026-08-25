import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { formatRelativeTimestamp } from '@/utils/date';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { NotificationQueryView } from './components/NotificationQueryView';
import { useMarkNotificationRead, useNotification } from './hooks';
import {
  getNotificationActionErrorMessage,
  isEmergencyNotification,
  notificationPriorityLabel,
} from './selectors';

export function NotificationDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useNotification(id);
  const markRead = useMarkNotificationRead();
  const markedId = useRef<string | null>(null);
  const notification = query.data;
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && !query.data,
  });
  const emergency = notification ? isEmergencyNotification(notification) : false;

  useEffect(() => {
    if (!notification || notification.isRead || markedId.current === notification.id) {
      return;
    }
    markedId.current = notification.id;
    void markRead.mutateAsync(notification.id);
  }, [markRead, notification]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Notification" showBack showProfile={false} showBell={false} />
      <View style={styles.body}>
        <NotificationQueryView
          state={state}
          error={query.error}
          onRetry={() => void query.refetch()}
          loadingMessage="Loading notification..."
          emptyIcon="notifications-outline"
          emptyTitle="Notification not found"
          emptyMessage="This notification is not available."
        >
          {notification ? (
            <View style={[styles.card, shadows.card, emergency ? styles.emergencyCard : null]}>
              {emergency ? <Text style={styles.priority}>{notificationPriorityLabel(notification.priority)}</Text> : null}
              <Text style={[styles.title, emergency ? styles.emergencyTitle : null]}>
                {notification.title ?? 'Notification'}
              </Text>
              <Text style={styles.time}>
                {notification.createdAt ? formatRelativeTimestamp(notification.createdAt) : 'Time not on file'}
              </Text>
              {notification.message ? <Text style={styles.message}>{notification.message}</Text> : null}
              {emergency ? (
                <Text style={styles.note}>
                  This is an AgeWell emergency request. AgeWell does not send an ambulance from this notification.
                </Text>
              ) : null}
              {notification.isRead ? (
                <Text style={styles.readState}>Read</Text>
              ) : (
                <PrimaryButton
                  label={markRead.isPending ? 'Marking as read...' : 'Mark as read'}
                  loading={markRead.isPending}
                  onPress={() => void markRead.mutateAsync(notification.id)}
                />
              )}
              {markRead.isError ? (
                <Text style={styles.error} accessibilityRole="alert">
                  {getNotificationActionErrorMessage(markRead.error)}
                </Text>
              ) : null}
            </View>
          ) : null}
        </NotificationQueryView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  emergencyCard: {
    backgroundColor: colors.emergencySoft,
    borderColor: colors.emergency,
  },
  priority: {
    ...typography.label,
    color: colors.emergency,
    textTransform: 'uppercase',
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  emergencyTitle: {
    color: colors.emergency,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
  },
  note: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  readState: {
    ...typography.captionStrong,
    color: colors.textMuted,
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
  },
});
