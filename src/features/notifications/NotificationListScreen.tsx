import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationCard, SecondaryButton } from '@/components';
import { colors, spacing, typography } from '@/constants/theme';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { NotificationQueryView } from './components/NotificationQueryView';
import { useMarkAllNotificationsRead, useNotifications } from './hooks';
import { getNotificationActionErrorMessage, notificationDetailHref, unreadCountLabel } from './selectors';

interface NotificationListScreenProps {
  showBack?: boolean;
  subtitle?: string;
  emptyMessage?: string;
}

export function NotificationListScreen({
  showBack = true,
  subtitle,
  emptyMessage = 'In-app notifications will appear here.',
}: NotificationListScreenProps) {
  const insets = useSafeAreaInsets();
  const query = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const [refreshing, setRefreshing] = useState(false);
  const items = query.data?.items ?? [];
  const unreadCount = items.filter((item) => !item.isRead).length;
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: items.length === 0,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await query.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [query]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Notifications" showBack={showBack} showProfile={false} showBell={false} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.primary} />
        }
      >
        <Text style={styles.subtitle}>{subtitle ?? unreadCountLabel(unreadCount)}</Text>
        {unreadCount > 0 ? (
          <View style={styles.action}>
            <SecondaryButton
              label={markAll.isPending ? 'Marking as read...' : 'Mark all as read'}
              onPress={() => void markAll.mutateAsync()}
              disabled={markAll.isPending}
            />
            {markAll.isError ? (
              <Text style={styles.error} accessibilityRole="alert">
                {getNotificationActionErrorMessage(markAll.error)}
              </Text>
            ) : null}
          </View>
        ) : null}
        <NotificationQueryView
          state={state}
          error={query.error}
          onRetry={() => void query.refetch()}
          loadingMessage="Loading notifications..."
          emptyIcon="notifications-outline"
          emptyTitle="No notifications"
          emptyMessage={emptyMessage}
        >
          <View style={styles.list}>
            {items.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onPress={() => router.push(notificationDetailHref(notification.id) as unknown as Href)}
              />
            ))}
          </View>
        </NotificationQueryView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  action: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
  },
  list: {
    gap: spacing.md,
  },
});
