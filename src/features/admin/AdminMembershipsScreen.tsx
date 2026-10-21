import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '@/components';
import { colors, spacing, typography } from '@/constants/theme';
import type { MembershipApplicationStage } from '@/features/membership/membershipTypes';
import { nextAdminStages } from '@/features/membership/applicationStatus';
import { AdminCollection } from './components/AdminCollection';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminPagination } from './components/AdminPagination';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { AdminSearchPicker } from './components/AdminSearchPicker';
import {
  useAdminCareManagers,
  useAdminMembershipBenefits,
  useAdminMembershipPlans,
  useAdminMembershipRecords,
  useAdminMembershipRequests,
  useReviewAdminMembershipRequest,
  useUpdateAdminMembershipRequestStage,
} from './hooks';
import { getAdminErrorMessage, getSectionState, humanizeStatus } from './selectors';
import { ADMIN_PAGE_SIZE } from './types';
import { formatLongDate } from '@/utils/date';
import type { MembershipRequest, MembershipRequestStatus } from '@/features/membership/membershipTypes';
import { ApiError } from '@/api/errors';

const STAGE_API_MISSING_MESSAGE =
  'Could not update this application. Your app is calling an API that does not have the stage endpoint yet. Use local API http://localhost:8001 (and restart Expo), or deploy the latest backend to the VPS.';

function stageUpdateErrorMessage(error: unknown): string {
  const status = error instanceof ApiError ? error.status : undefined;
  if (status === 404) {
    return STAGE_API_MISSING_MESSAGE;
  }
  return getAdminErrorMessage(error);
}

const REQUEST_STATUSES: { value: MembershipRequestStatus; label: string }[] = [
  { value: 'REQUESTED', label: 'In progress' },
  { value: 'APPROVED', label: 'Paid / active' },
  { value: 'REJECTED', label: 'Rejected' },
];

function formatPlanPrice(price: number | null): string {
  if (price == null) {
    return 'Not on file';
  }
  return `₹${price.toLocaleString('en-IN')}`;
}

function stageLabel(stage: MembershipApplicationStage): string {
  switch (stage) {
    case 'SUBMITTED':
      return 'Submitted';
    case 'VISIT_PLANNED':
      return 'Visit planned';
    case 'VISIT_SCHEDULED':
      return 'Visit scheduled';
    case 'VISIT_COMPLETED':
      return 'Visit completed';
    case 'IN_REVIEW':
      return 'In review';
    case 'ACCEPTED':
      return 'Accepted — awaiting payment';
    case 'APPROVED':
      return 'Paid / membership active';
    case 'REJECTED':
      return 'Rejected';
    default:
      return stage;
  }
}

export function AdminMembershipsScreen() {
  const [planOffset, setPlanOffset] = useState(0);
  const [benefitOffset, setBenefitOffset] = useState(0);
  const [recordOffset, setRecordOffset] = useState(0);
  const [requestOffset, setRequestOffset] = useState(0);
  const [requestStatus, setRequestStatus] = useState<MembershipRequestStatus | undefined>('REQUESTED');
  const [formError, setFormError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const plans = useAdminMembershipPlans({ limit: ADMIN_PAGE_SIZE, offset: planOffset });
  const benefits = useAdminMembershipBenefits({ limit: ADMIN_PAGE_SIZE, offset: benefitOffset });
  const records = useAdminMembershipRecords({ limit: ADMIN_PAGE_SIZE, offset: recordOffset });
  const requests = useAdminMembershipRequests({
    limit: ADMIN_PAGE_SIZE,
    offset: requestOffset,
    status: requestStatus,
  });
  const review = useReviewAdminMembershipRequest();
  const stageUpdate = useUpdateAdminMembershipRequestStage();
  const careManagers = useAdminCareManagers();

  const careOptions = useMemo(
    () =>
      (careManagers.data ?? [])
        .filter((item) => item.staffKind === 'CARE_MANAGER' && item.status === 'ACTIVE')
        .map((item) => ({
          id: item.id,
          title: item.name ?? item.employeeId ?? item.id,
          subtitle: item.employeeId ?? undefined,
        })),
    [careManagers.data],
  );
  const companionOptions = useMemo(
    () =>
      (careManagers.data ?? [])
        .filter((item) => item.staffKind === 'COMPANION' && item.status === 'ACTIVE')
        .map((item) => ({
          id: item.id,
          title: item.name ?? item.employeeId ?? item.id,
          subtitle: item.employeeId ?? undefined,
        })),
    [careManagers.data],
  );

  return (
    <AdminScreen
      title="Memberships"
      subtitle="Advance each application step, assign Care Manager / Companion for the visit, then accept. Member pays after acceptance."
    >
      <Text style={styles.section}>Membership applications</Text>
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
        loadingMessage="Loading applications..."
        emptyTitle="No applications"
        emptyMessage="No membership applications match this filter."
      >
        <AdminCollection
          items={requests.data?.items ?? []}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) =>
            `${item.seniorName ?? 'Senior'}, ${item.planName}, ${stageLabel(item.stage)}`
          }
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
              key: 'stage',
              label: 'Stage',
              flex: 1.2,
              render: (item) => <Text style={cell}>{stageLabel(item.stage)}</Text>,
            },
            {
              key: 'staff',
              label: 'Assigned',
              flex: 1.2,
              render: (item) => (
                <Text style={cell}>
                  {[item.careManagerName, item.companionName].filter(Boolean).join(' · ') || '—'}
                </Text>
              ),
            },
            {
              key: 'actions',
              label: 'Workflow',
              flex: 1.4,
              render: (item) => (
                <View style={styles.actions}>
                  <SecondaryButton
                    label={expandedId === item.id ? 'Hide' : 'Manage'}
                    fullWidth={false}
                    onPress={() => setExpandedId((current) => (current === item.id ? null : item.id))}
                  />
                  {item.status === 'REQUESTED' ? (
                    <SecondaryButton
                      label="Reject"
                      fullWidth={false}
                      disabled={review.isPending || stageUpdate.isPending}
                      onPress={() => {
                        setFormError(null);
                        review.mutate(
                          { id: item.id, status: 'REJECTED' },
                          { onError: (error) => setFormError(getAdminErrorMessage(error)) },
                        );
                      }}
                    />
                  ) : null}
                </View>
              ),
            },
          ]}
        />
        {(requests.data?.items ?? [])
          .filter((item) => item.id === expandedId)
          .map((item) => (
            <RequestWorkflowPanel
              key={`workflow-${item.id}`}
              request={item}
              careOptions={careOptions}
              companionOptions={companionOptions}
              busy={stageUpdate.isPending}
              onError={(message) => setFormError(message)}
              onAdvance={(input) => {
                setFormError(null);
                stageUpdate.mutate(
                  { id: item.id, ...input },
                  { onError: (error) => setFormError(stageUpdateErrorMessage(error)) },
                );
              }}
            />
          ))}
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

function RequestWorkflowPanel({
  request,
  careOptions,
  companionOptions,
  busy,
  onAdvance,
  onError,
}: {
  request: MembershipRequest;
  careOptions: { id: string; title: string; subtitle?: string }[];
  companionOptions: { id: string; title: string; subtitle?: string }[];
  busy: boolean;
  onAdvance: (input: {
    stage?: string;
    visitScheduledStart?: string;
    visitScheduledEnd?: string;
    careManagerId?: string | null;
    companionId?: string | null;
  }) => void;
  onError: (message: string) => void;
}) {
  const [careId, setCareId] = useState<string | null>(request.careManagerId);
  const [companionId, setCompanionId] = useState<string | null>(request.companionId);
  const [visitStart, setVisitStart] = useState(
    request.visitScheduledStart
      ? request.visitScheduledStart.slice(0, 16)
      : defaultVisitStartLocal(),
  );
  const [visitEnd, setVisitEnd] = useState(
    request.visitScheduledEnd ? request.visitScheduledEnd.slice(0, 16) : defaultVisitEndLocal(),
  );
  const nextSteps = nextAdminStages(request.stage);

  return (
    <View style={styles.workflow}>
      <Text style={styles.workflowTitle}>
        {request.seniorName ?? 'Senior'} · {stageLabel(request.stage)}
      </Text>
      {request.notes ? <Text style={styles.notes}>{request.notes}</Text> : null}

      <AdminSearchPicker
        label="Assign Care Manager"
        options={careOptions}
        value={careId}
        onChange={setCareId}
        emptyMessage="No active care managers."
      />
      <AdminSearchPicker
        label="Assign Companion"
        options={companionOptions}
        value={companionId}
        onChange={setCompanionId}
        emptyMessage="No active companions."
      />
      <PrimaryButton
        label="Save staff assignment"
        fullWidth={false}
        loading={busy}
        onPress={() =>
          onAdvance({
            careManagerId: careId,
            companionId: companionId,
          })
        }
      />

      <Text style={styles.scheduleLabel}>Visit window (for schedule step)</Text>
      <Text style={styles.scheduleHint}>ISO local: YYYY-MM-DDTHH:mm</Text>
      <TextInput
        value={visitStart}
        onChangeText={setVisitStart}
        placeholder="Start 2026-10-02T11:00"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCapitalize="none"
      />
      <TextInput
        value={visitEnd}
        onChangeText={setVisitEnd}
        placeholder="End 2026-10-02T12:00"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCapitalize="none"
      />

      <View style={styles.stageActions}>
        {nextSteps.length === 0 ? (
          <Text style={cell}>No further stage actions.</Text>
        ) : (
          nextSteps.map((action) => (
            <PrimaryButton
              key={action.stage}
              label={action.label}
              fullWidth={false}
              loading={busy}
              onPress={() => {
                if (action.needsSchedule) {
                  const startIso = toIsoOrNull(visitStart);
                  const endIso = toIsoOrNull(visitEnd);
                  if (!startIso) {
                    onError('Enter a valid visit start time before scheduling.');
                    return;
                  }
                  onAdvance({
                    stage: action.stage,
                    visitScheduledStart: startIso,
                    visitScheduledEnd: endIso ?? undefined,
                    careManagerId: careId,
                    companionId: companionId,
                  });
                  return;
                }
                onAdvance({
                  stage: action.stage,
                  careManagerId: careId,
                  companionId: companionId,
                });
              }}
            />
          ))
        )}
      </View>
    </View>
  );
}

function defaultVisitStartLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(11, 0, 0, 0);
  return toLocalInput(d);
}

function defaultVisitEndLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(12, 0, 0, 0);
  return toLocalInput(d);
}

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIsoOrNull(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
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
  workflow: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    gap: spacing.md,
  },
  workflowTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  notes: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  scheduleLabel: {
    ...typography.captionStrong,
    color: colors.text,
  },
  scheduleHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.white,
  },
  stageActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
