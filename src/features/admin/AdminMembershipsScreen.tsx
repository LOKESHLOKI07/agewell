import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';
import { AdminCollection } from './components/AdminCollection';
import { AdminPagination } from './components/AdminPagination';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { useAdminMembershipBenefits, useAdminMembershipPlans, useAdminMembershipRecords } from './hooks';
import { getSectionState, humanizeStatus } from './selectors';
import { ADMIN_PAGE_SIZE } from './types';
import { formatLongDate } from '@/utils/date';

export function AdminMembershipsScreen() {
  const [planOffset, setPlanOffset] = useState(0);
  const [benefitOffset, setBenefitOffset] = useState(0);
  const [recordOffset, setRecordOffset] = useState(0);
  const plans = useAdminMembershipPlans({ limit: ADMIN_PAGE_SIZE, offset: planOffset });
  const benefits = useAdminMembershipBenefits({ limit: ADMIN_PAGE_SIZE, offset: benefitOffset });
  const records = useAdminMembershipRecords({ limit: ADMIN_PAGE_SIZE, offset: recordOffset });

  return (
    <AdminScreen title="Memberships" subtitle="Status is date-derived. Usage remains ledger-based. No payments.">
      <Text style={styles.section}>Plans</Text>
      <AdminQueryView
        state={getSectionState({ isPending: plans.isPending, isError: plans.isError, isEmpty: (plans.data?.items.length ?? 0) === 0 })}
        error={plans.error}
        onRetry={() => void plans.refetch()}
        loadingMessage="Loading plans..."
        emptyTitle="No plans"
        emptyMessage="No membership plans are on file."
      >
        <AdminCollection
          items={plans.data?.items ?? []}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => item.name ?? 'Plan'}
          columns={[
            { key: 'name', label: 'Plan', render: (item) => <Text style={cell}>{item.name ?? 'Unnamed plan'}</Text> },
            { key: 'price', label: 'Price', render: (item) => <Text style={cell}>{item.price != null ? String(item.price) : 'Not on file'}</Text> },
          ]}
        />
        <AdminPagination total={plans.data?.total ?? 0} limit={plans.data?.limit ?? ADMIN_PAGE_SIZE} offset={plans.data?.offset ?? 0} onOffsetChange={setPlanOffset} />
      </AdminQueryView>

      <Text style={styles.section}>Benefits</Text>
      <AdminQueryView
        state={getSectionState({ isPending: benefits.isPending, isError: benefits.isError, isEmpty: (benefits.data?.items.length ?? 0) === 0 })}
        error={benefits.error}
        onRetry={() => void benefits.refetch()}
        loadingMessage="Loading benefits..."
        emptyTitle="No benefits"
        emptyMessage="No membership benefits are on file."
      >
        <AdminCollection
          items={benefits.data?.items ?? []}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => item.benefitName ?? 'Benefit'}
          columns={[
            { key: 'name', label: 'Benefit', render: (item) => <Text style={cell}>{item.benefitName ?? 'Unnamed'}</Text> },
            { key: 'quota', label: 'Quota', render: (item) => <Text style={cell}>{item.quota != null ? String(item.quota) : 'Unlimited'}</Text> },
          ]}
        />
        <AdminPagination total={benefits.data?.total ?? 0} limit={benefits.data?.limit ?? ADMIN_PAGE_SIZE} offset={benefits.data?.offset ?? 0} onOffsetChange={setBenefitOffset} />
      </AdminQueryView>

      <Text style={styles.section}>Membership records</Text>
      <AdminQueryView
        state={getSectionState({ isPending: records.isPending, isError: records.isError, isEmpty: (records.data?.items.length ?? 0) === 0 })}
        error={records.error}
        onRetry={() => void records.refetch()}
        loadingMessage="Loading memberships..."
        emptyTitle="No memberships"
        emptyMessage="No membership records are on file."
      >
        <AdminCollection
          items={records.data?.items ?? []}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => `${item.planName ?? 'Membership'}, ${item.status}`}
          columns={[
            { key: 'plan', label: 'Plan', render: (item) => <Text style={cell}>{item.planName ?? 'Unnamed plan'}</Text> },
            { key: 'senior', label: 'Senior', render: (item) => <Text style={cell}>{item.seniorId ?? 'Not on file'}</Text> },
            { key: 'status', label: 'Status', render: (item) => <Text style={cell}>{humanizeStatus(item.status)}</Text> },
            {
              key: 'dates',
              label: 'Dates',
              render: (item) => (
                <Text style={cell}>
                  {item.startDate ? formatLongDate(item.startDate) : '—'} → {item.endDate ? formatLongDate(item.endDate) : '—'}
                </Text>
              ),
            },
          ]}
        />
        <AdminPagination total={records.data?.total ?? 0} limit={records.data?.limit ?? ADMIN_PAGE_SIZE} offset={records.data?.offset ?? 0} onOffsetChange={setRecordOffset} />
      </AdminQueryView>
    </AdminScreen>
  );
}

const cell = { ...typography.body, color: colors.text };

const styles = StyleSheet.create({
  section: {
    ...typography.subtitle,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
});
