import { useState } from 'react';
import { Text } from 'react-native';
import { colors, typography } from '@/constants/theme';
import type { NotificationPriority } from '@/features/home/types/home';
import { formatLongDate, formatTime } from '@/utils/date';
import { AdminCollection } from './components/AdminCollection';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminPagination } from './components/AdminPagination';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { TextField } from '@/components';
import { useAdminNotifications } from './hooks';
import { getSectionState, humanizeStatus } from './selectors';
import type { AdminNotification } from './types';
import { ADMIN_PAGE_SIZE } from './types';

const PRIORITIES: { value: NotificationPriority; label: string }[] = [
  { value: 'INFO', label: 'Info' },
  { value: 'IMPORTANT', label: 'Important' },
  { value: 'EMERGENCY', label: 'Emergency' },
];

export function AdminNotificationsScreen() {
  const [offset, setOffset] = useState(0);
  const [userId, setUserId] = useState('');
  const [appliedUserId, setAppliedUserId] = useState<string | undefined>();
  const [priority, setPriority] = useState<NotificationPriority | undefined>();
  const [isRead, setIsRead] = useState<boolean | undefined>();
  const query = useAdminNotifications({
    limit: ADMIN_PAGE_SIZE,
    offset,
    userId: appliedUserId,
    priority,
    isRead,
  });
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: (query.data?.items.length ?? 0) === 0,
  });

  return (
    <AdminScreen title="Notifications" subtitle="Operational inbox. No SMS, push, or WhatsApp delivery.">
      <TextField
        label="Filter by user ID"
        value={userId}
        onChangeText={setUserId}
        autoCapitalize="none"
        onSubmitEditing={() => {
          setOffset(0);
          setAppliedUserId(userId.trim() || undefined);
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
        emptyMessage="No notifications match this filter."
      >
        <AdminCollection
          items={query.data?.items ?? []}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => `${item.title ?? 'Notification'}, ${humanizeStatus(item.priority)}`}
          columns={[
            { key: 'user', label: 'User', render: (item: AdminNotification) => <Text style={cell}>{item.userId ?? 'Not on file'}</Text> },
            { key: 'title', label: 'Title', render: (item) => <Text style={cell}>{item.title ?? 'Untitled'}</Text> },
            { key: 'message', label: 'Message', flex: 1.4, render: (item) => <Text style={cell}>{item.message ?? ''}</Text> },
            { key: 'priority', label: 'Priority', render: (item) => <Text style={cell}>{humanizeStatus(item.priority)}</Text> },
            { key: 'read', label: 'Read', render: (item) => <Text style={cell}>{item.isRead ? 'Read' : 'Unread'}</Text> },
            {
              key: 'created',
              label: 'Created',
              render: (item) => (
                <Text style={cell}>
                  {item.createdAt ? `${formatLongDate(item.createdAt)} ${formatTime(item.createdAt)}` : 'Not on file'}
                </Text>
              ),
            },
          ]}
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

const cell = { ...typography.body, color: colors.text };
