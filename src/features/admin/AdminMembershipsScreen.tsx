import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '@/components';
import { colors, spacing, typography } from '@/constants/theme';
import { AdminCollection } from './components/AdminCollection';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminPagination } from './components/AdminPagination';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import {
  useAdminMembershipBenefits,
  useAdminMembershipPlans,
  useAdminMembershipRecords,
  useAdminMembershipRequests,
  useReviewAdminMembershipRequest,
} from './hooks';
import { getAdminErrorMessage, getSectionState, humanizeStatus } from './selectors';
import { ADMIN_PAGE_SIZE } from './types';
import { formatLongDate } from '@/utils/date';
import type { MembershipRequestStatus } from '@/features/membership/membershipTypes';

const REQUEST_STATUSES: { value: MembershipRequestStatus; label: string }[] = [
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

function formatPlanPrice(price: number | null): string {
  if (price == null) {
    return 'Not on file';
  }
  return `₹${price.toLocaleString('en-IN')}`;
}

export function AdminMembershipsScreen() {
  const [planOffset, setPlanOffset] = useState(0);
  const [benefitOffset, setBenefitOffset] = useState(0);
  const [recordOffset, setRecordOffset] = useState(0);
  const [requestOffset, setRequestOffset] = useState(0);
  const [requestStatus, setRequestStatus] = useState<MembershipRequestStatus | undefined>('REQUESTED');
  const [formError, setFormError] = useState<string | null>(null);
  const plans = useAdminMembershipPlans({ limit: ADMIN_PAGE_SIZE, offset: planOffset });
  const benefits = useAdminMembershipBenefits({ limit: ADMIN_PAGE_SIZE, offset: benefitOffset });
  const records = useAdminMembershipRecords({ limit: ADMIN_PAGE_SIZE, offset: recordOffset });
  const requests = useAdminMembershipRequests({
    limit: ADMIN_PAGE_SIZE,
    offset: requestOffset,
    status: requestStatus,
  });
  const review = useReviewAdminMembershipRequest();

  return (
    <AdminScreen title="Memberships" subtitle="Approve purchase requests to activate a plan. Status on records is date-derived. No in-app payments.">
      <Text style={styles.section}>Purchase requests</Text>
      <AdminFilterChips
        label="Status"
        value={requestStatus}
        options={REQUEST_STATUSES}
        onChange={(next) => {
          setRequestOffset(0);
          setRequestStatus(next);
        }}
      />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <AdminQueryView
        state={getSectionState({
          isPending: requests.isPending,
          isError: requests.isError,
          isEmpty: (requests.data?.items.length ?? 0) === 0,
        })}
        error={requests.error}
        onRetry={() => void requests.refetch()}
        loadingMessage="Loading purchase requests..."
        emptyTitle="No purchase requests"
        emptyMessage="No membership purchase requests match this filter."
      >
        <AdminCollection
          items={requests.data?.items ?? []}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => `${item.seniorName ?? 'Senior'}, ${item.planName}, ${humanizeStatus(item.status)}`}
          columns={[
            {
              key: 'senior',
              label: 'Senior',
              render: (item) => <Text style={cell}>{item.seniorName ?? item.seniorId}</Text>,
            },
            {
              key: 'plan',
              label: 'Plan',
              render: (item) => (
                <Text style={cell}>
                  {item.planName} · {formatPlanPrice(item.planPrice)}
                </Text>
              ),
            },
            {
              key: 'status',
              label: 'Status',
              render: (item) => <Text style={cell}>{humanizeStatus(item.status)}</Text>,
            },
            {
              key: 'requested',
              label: 'Requested',
              render: (item) => <Text style={cell}>{item.createdAt ? formatLongDate(item.createdAt) : '—'}</Text>,
            },
            {
              key: 'actions',
              label: 'Review',
              flex: 1.3,
              render: (item) =>
                item.status === 'REQUESTED' ? (
                  <View style={styles.actions}>
                    <PrimaryButton
                      label="Approve"
                      fullWidth={false}
                      loading={review.isPending}
                      onPress={() => {
                        setFormError(null);
                        review.mutate(
                          { id: item.id, status: 'APPROVED' },
                          { onError: (error) => setFormError(getAdminErrorMessage(error)) },
                        );
                      }}
                    />
                    <SecondaryButton
                      label="Reject"
                      fullWidth={false}
                      onPress={() => {
                        setFormError(null);
                        review.mutate(
                          { id: item.id, status: 'REJECTED' },
                          { onError: (error) => setFormError(getAdminErrorMessage(error)) },
                        );
                      }}
                    />
                  </View>
                ) : (
                  <Text style={cell}>Reviewed</Text>
                ),
            },
          ]}
        />
        <AdminPagination
          total={requests.data?.total ?? 0}
          limit={requests.data?.limit ?? ADMIN_PAGE_SIZE}
          offset={requests.data?.offset ?? 0}
          onOffsetChange={setRequestOffset}
        />
      </AdminQueryView>

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
            { key: 'price', label: 'Price', render: (item) => <Text style={cell}>{item.price != null ? formatPlanPrice(item.price) : 'Not on file'}</Text> },
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
  error: {
    ...typography.caption,
    color: colors.emergency,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
});
