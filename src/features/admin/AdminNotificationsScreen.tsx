import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { SecondaryButton } from '@/components';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import type { NotificationPriority } from '@/features/home/types/home';
import { formatLongDate, formatTime } from '@/utils/date';
import { AdminCollection } from './components/AdminCollection';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminPagination } from './components/AdminPagination';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { useAdminNotifications } from './hooks';
import { getSectionState, humanizeStatus } from './selectors';
import type { AdminNotification } from './types';
import { ADMIN_PAGE_SIZE } from './types';

const PRIORITIES: { value: NotificationPriority; label: string }[] = [
  { value: 'INFO', label: 'Info' },
  { value: 'IMPORTANT', label: 'Important' },
  { value: 'EMERGENCY', label: 'Emergency' },
];

type InboxScope = 'mine' | 'all';

function priorityTone(priority: NotificationPriority) {
  if (priority === 'EMERGENCY') return { fg: colors.emergency, bg: colors.emergencySoft };
  if (priority === 'IMPORTANT') return { fg: colors.warning, bg: colors.warningSoft };
  return { fg: colors.info, bg: colors.infoSoft };
}

function splitMessageParts(message: string | null): string[] {
  if (!message?.trim()) return [];
  return message
    .split(' · ')
    .map((part) => part.trim())
    .filter(Boolean);
}

function expenseIdFromActionRef(actionRef: string | null): string | null {
  if (!actionRef) return null;
  const match = /^expense:([0-9a-f-]{36})$/i.exec(actionRef.trim());
  return match?.[1] ?? null;
}

function notificationAction(item: AdminNotification): { label: string; href: Href } | null {
  const title = (item.title ?? '').toLowerCase();
  const expenseId = expenseIdFromActionRef(item.actionRef);
  if (title.includes('expense') || expenseId) {
    const query = expenseId
      ? `status=PENDING&expenseId=${encodeURIComponent(expenseId)}`
      : 'status=PENDING';
    return { label: 'Open Credits', href: `/(admin)/credit-expenses?${query}` as Href };
  }
  if (title.includes('sos') || title.includes('emergency') || item.priority === 'EMERGENCY') {
    return { label: 'Open Emergencies', href: '/(admin)/emergencies' as Href };
  }
  return null;
}

function NotificationSummary({ item }: { item: AdminNotification }) {
  const parts = splitMessageParts(item.message);
  return (
    <View style={styles.summary}>
      <Text style={styles.title}>{item.title ?? 'Untitled'}</Text>
      {parts.length > 1 ? (
        parts.map((part, index) => (
          <Text key={`${index}-${part}`} style={styles.detailLine}>
            {part}
          </Text>
        ))
      ) : item.message ? (
        <Text style={styles.detailLine}>{item.message}</Text>
      ) : null}
    </View>
  );
}

function PriorityBadge({ priority }: { priority: NotificationPriority }) {
  const tone = priorityTone(priority);
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.badgeText, { color: tone.fg }]}>{humanizeStatus(priority)}</Text>
    </View>
  );
}

export function AdminNotificationsScreen() {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [offset, setOffset] = useState(0);
  const [scope, setScope] = useState<InboxScope>('mine');
  const [priority, setPriority] = useState<NotificationPriority | undefined>();
  const [isRead, setIsRead] = useState<boolean | undefined>(false);

  const scopedUserId = scope === 'mine' ? currentUserId : undefined;
  const query = useAdminNotifications({
    limit: ADMIN_PAGE_SIZE,
    offset,
    userId: scopedUserId,
    priority,
    isRead,
  });
  const state = getSectionState({
    isPending: query.isPending || (scope === 'mine' && !currentUserId),
    isError: query.isError,
    isEmpty: (query.data?.items.length ?? 0) === 0,
  });

  const columns = useMemo(() => {
    const base = [
      {
        key: 'when',
        label: 'When',
        flex: 0.9,
        render: (item: AdminNotification) => (
          <Text style={styles.cell}>
            {item.createdAt ? `${formatLongDate(item.createdAt)} ${formatTime(item.createdAt)}` : 'Not on file'}
          </Text>
        ),
      },
      {
        key: 'priority',
        label: 'Priority',
        flex: 0.7,
        render: (item: AdminNotification) => <PriorityBadge priority={item.priority} />,
      },
      {
        key: 'alert',
        label: 'Alert',
        flex: 2.2,
        render: (item: AdminNotification) => <NotificationSummary item={item} />,
      },
      {
        key: 'status',
        label: 'Status',
        flex: 0.6,
        render: (item: AdminNotification) => (
          <Text style={[styles.cell, item.isRead ? styles.read : styles.unread]}>
            {item.isRead ? 'Read' : 'Unread'}
          </Text>
        ),
      },
    ];
    if (scope === 'all') {
      base.splice(3, 0, {
        key: 'recipient',
        label: 'Sent to',
        flex: 1.1,
        render: (item: AdminNotification) => (
          <Text style={styles.cell} numberOfLines={2}>
            {item.userEmail ?? item.userId ?? 'Not on file'}
          </Text>
        ),
      });
    }
    return base;
  }, [scope]);

  return (
    <AdminScreen
      title="Notifications"
      subtitle="Your operational inbox. Expense approvals open Credits; SOS alerts open Emergencies."
    >
      <AdminFilterChips
        label="Inbox"
        value={scope}
        allowAll={false}
        options={[
          { value: 'mine', label: 'Mine' },
          { value: 'all', label: 'All staff' },
        ]}
        onChange={(next) => {
          if (!next) return;
          setOffset(0);
          setScope(next);
        }}
      />
      <AdminFilterChips
        label="Priority"
        value={priority}
        options={PRIORITIES}
        onChange={(next) => {
          setOffset(0);
          setPriority(next);
        }}
      />
      <AdminFilterChips
        label="Read state"
        value={isRead === undefined ? undefined : isRead ? 'read' : 'unread'}
        options={[
          { value: 'unread', label: 'Unread' },
          { value: 'read', label: 'Read' },
        ]}
        onChange={(next) => {
          setOffset(0);
          setIsRead(next === undefined ? undefined : next === 'read');
        }}
      />
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading notifications..."
        emptyTitle="No notifications"
        emptyMessage={
          isRead === false
            ? 'Nothing unread in this inbox.'
            : 'No notifications match this filter.'
        }
      >
        <AdminCollection
          items={query.data?.items ?? []}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => `${item.title ?? 'Notification'}, ${humanizeStatus(item.priority)}`}
          columns={columns}
          actionsLabel="Go to"
          actions={(item) => {
            const action = notificationAction(item);
            if (!action) return null;
            return (
              <SecondaryButton
                label={action.label}
                fullWidth={false}
                onPress={() => router.push(action.href)}
              />
            );
          }}
        />
        <AdminPagination
          total={query.data?.total ?? 0}
          limit={query.data?.limit ?? ADMIN_PAGE_SIZE}
          offset={query.data?.offset ?? offset}
          onOffsetChange={setOffset}
        />
      </AdminQueryView>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  cell: {
    ...typography.body,
    color: colors.text,
  },
  summary: {
    gap: spacing.xs,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  detailLine: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    ...typography.captionStrong,
  },
  unread: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  read: {
    color: colors.textMuted,
  },
});
