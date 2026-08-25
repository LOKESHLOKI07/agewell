import { useState } from 'react';
import { Text } from 'react-native';
import { colors, typography } from '@/constants/theme';
import { formatLongDate, formatTime } from '@/utils/date';
import { AdminCollection } from './components/AdminCollection';
import { AdminPagination } from './components/AdminPagination';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { useAdminAuditLogs } from './hooks';
import { AUDIT_ACTOR_NOTICE, getSectionState } from './selectors';
import type { AdminAuditLog } from './types';
import { ADMIN_PAGE_SIZE } from './types';

export function AdminAuditScreen() {
  const [offset, setOffset] = useState(0);
  const query = useAdminAuditLogs({ limit: ADMIN_PAGE_SIZE, offset });
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: (query.data?.items.length ?? 0) === 0,
  });

  return (
    <AdminScreen title="Audit Logs" subtitle={AUDIT_ACTOR_NOTICE}>
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading audit logs..."
        emptyTitle="No audit logs"
        emptyMessage="Admin mutations will appear here when they are recorded."
      >
        <AdminCollection
          items={query.data?.items ?? []}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => `${item.action ?? 'change'} ${item.entityName ?? ''}`}
          columns={[
            { key: 'entity', label: 'Entity', render: (item: AdminAuditLog) => <Text style={cell}>{item.entityName ?? 'Unknown'}</Text> },
            { key: 'id', label: 'Entity ID', render: (item) => <Text style={cell}>{item.entityId ?? 'Unknown'}</Text> },
            { key: 'action', label: 'Action', render: (item) => <Text style={cell}>{item.action ?? 'Unknown'}</Text> },
            { key: 'changes', label: 'Changes', flex: 1.4, render: (item) => <Text style={cell}>{item.changes ?? 'None'}</Text> },
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
