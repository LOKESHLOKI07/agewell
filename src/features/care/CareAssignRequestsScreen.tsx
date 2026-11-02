import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, type Href } from 'expo-router';
import { PrimaryButton, SecondaryButton, TextField } from '@/components';
import { Icon } from '@/components/ui';
import { cardSurface, colors, radius, spacing, typography } from '@/constants/theme';
import { getApiErrorMessage } from '@/api/errors';
import type { ServiceRequest, ServiceRequestStatus } from '@/features/home/types/home';
import { getSectionState, humanizeStatus } from '@/features/home/selectors/homeViewModel';
import {
  needsServiceCompanionDispatch,
  requestNeedsFieldAssign,
  SERVICE_POLICY_OPTIONS,
  shouldAutoAssignStanding,
  usesDeliveryJob,
} from '@/features/services/servicePolicy';
import { assignableCareAssociates } from './serviceCompanionServices';
import { isServiceCompanionKind, STAFF_KIND_LABELS, parseStaffKind } from './staffKind';
import { CareQueryView } from './components/CareQueryView';
import { CareSubScreen } from './components/CareSubScreen';
import {
  useAssignableCareStaff,
  useAssignCareServiceCompanion,
  useAssignCareServiceRequest,
  useAutoAssignCareServiceRequest,
  useCareManagerProfile,
  useCareServiceRequests,
  useCareUnassignedServiceRequestCounts,
} from './hooks';

const STATUS_OPTIONS: { value: ServiceRequestStatus; label: string }[] = [
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'ASSIGNED', label: 'Assigned' },
];

export function CareAssignRequestsScreen() {
  const profile = useCareManagerProfile();
  const staffKind = parseStaffKind(profile.data?.staffKind);
  const canAssign = profile.isSuccess && staffKind === 'CARE_MANAGER';

  const [status, setStatus] = useState<ServiceRequestStatus | undefined>(undefined);
  const [serviceSlug, setServiceSlug] = useState<string | undefined>();
  const [pendingAssign, setPendingAssign] = useState<ServiceRequest | null>(null);
  const [autoAssigningId, setAutoAssigningId] = useState<string | null>(null);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const query = useCareServiceRequests({ limit: 50, offset: 0, status, serviceSlug }, canAssign);
  const counts = useCareUnassignedServiceRequestCounts(canAssign);
  const staff = useAssignableCareStaff(canAssign);
  const assign = useAssignCareServiceRequest();
  const autoAssign = useAutoAssignCareServiceRequest();
  const assignSc = useAssignCareServiceCompanion();

  const scOnlyAssign = Boolean(
    pendingAssign &&
      needsServiceCompanionDispatch(pendingAssign.serviceSlug) &&
      (pendingAssign.awaitingDispatch || pendingAssign.dispatcherId),
  );

  const assignOptions = useMemo(() => {
    if (!pendingAssign) {
      return [];
    }
    let list = assignableCareAssociates(staff.data ?? [], { serviceSlug: pendingAssign.serviceSlug });
    if (scOnlyAssign) {
      list = list.filter((item) => isServiceCompanionKind(item.staffKind));
    }
    return list.map((item) => ({
      id: item.id,
      title: item.name?.trim() || item.employeeId || 'Care associate',
      subtitle: [STAFF_KIND_LABELS[parseStaffKind(item.staffKind)], item.employeeId]
        .filter(Boolean)
        .join(' · '),
    }));
  }, [pendingAssign, scOnlyAssign, staff.data]);

  const filteredAssignOptions = useMemo(() => {
    const q = assigneeSearch.trim().toLowerCase();
    if (!q) return assignOptions;
    return assignOptions.filter((item) => {
      const haystack = `${item.title} ${item.subtitle ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [assignOptions, assigneeSearch]);

  useEffect(() => {
    if (!pendingAssign || assigneeIds.length > 0 || assignOptions.length !== 1) {
      return;
    }
    setAssigneeIds([assignOptions[0].id]);
  }, [assigneeIds.length, assignOptions, pendingAssign]);

  if (profile.isSuccess && staffKind !== 'CARE_MANAGER') {
    return <Redirect href={'/care/profile' as Href} />;
  }

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: (query.data?.items.length ?? 0) === 0,
  });

  const closeAssign = () => {
    setPendingAssign(null);
    setAssigneeIds([]);
    setAssigneeSearch('');
    setFormError(null);
  };

  const toggleAssignee = (id: string) => {
    setFormError(null);
    setAssigneeIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const confirmAssign = () => {
    if (!pendingAssign) return;
    if (assigneeIds.length === 0) {
      setFormError(scOnlyAssign ? 'Select a Service Companion.' : 'Select at least one person.');
      return;
    }
    setFormError(null);
    const onSuccess = () => {
      const names = assigneeIds
        .map((id) => assignOptions.find((item) => item.id === id)?.title)
        .filter(Boolean);
      const label =
        names.length === 0 ? 'staff' : names.length === 1 ? names[0] : `${names.length} people`;
      setSuccessMessage(`Assigned ${pendingAssign.serviceName} to ${label}.`);
      closeAssign();
    };
    if (scOnlyAssign && assigneeIds.length === 1) {
      assignSc.mutate(
        { id: pendingAssign.id, serviceCompanionId: assigneeIds[0] },
        { onError: (error) => setFormError(getApiErrorMessage(error)), onSuccess },
      );
      return;
    }
    assign.mutate(
      { id: pendingAssign.id, careManagerIds: assigneeIds },
      { onError: (error) => setFormError(getApiErrorMessage(error)), onSuccess },
    );
  };

  const items = (query.data?.items ?? []).filter(
    (item) =>
      requestNeedsFieldAssign(item.serviceSlug) &&
      item.status !== 'COMPLETED' &&
      item.status !== 'CANCELLED' &&
      !item.executorId,
  );

  return (
    <CareSubScreen title="Assign requests">
      <Text style={styles.hint}>
        Assign Companions or Service Companions to open requests. Admin can still assign Care Managers
        directly.
      </Text>
      {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        <Pressable
          onPress={() => setStatus(undefined)}
          style={[styles.chip, !status ? styles.chipActive : null]}
        >
          <Text style={[styles.chipLabel, !status ? styles.chipLabelActive : null]}>All open</Text>
        </Pressable>
        {STATUS_OPTIONS.map((option) => {
          const active = status === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setStatus(option.value)}
              style={[styles.chip, active ? styles.chipActive : null]}
            >
              <Text style={[styles.chipLabel, active ? styles.chipLabelActive : null]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        <Pressable
          onPress={() => setServiceSlug(undefined)}
          style={[styles.chip, !serviceSlug ? styles.chipActive : null]}
        >
          <Text style={[styles.chipLabel, !serviceSlug ? styles.chipLabelActive : null]}>
            All services
            {(counts.data ? Object.values(counts.data).reduce((a, b) => a + b, 0) : 0) > 0
              ? ` · ${Object.values(counts.data ?? {}).reduce((a, b) => a + b, 0)}`
              : ''}
          </Text>
        </Pressable>
        {SERVICE_POLICY_OPTIONS.map((option) => {
          const active = serviceSlug === option.value;
          const count = counts.data?.[option.value];
          return (
            <Pressable
              key={option.value}
              onPress={() => setServiceSlug(option.value)}
              style={[styles.chip, active ? styles.chipActive : null]}
            >
              <Text style={[styles.chipLabel, active ? styles.chipLabelActive : null]}>
                {option.label}
                {count ? ` · ${count}` : ''}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <CareQueryView
        state={
          items.length === 0 && query.isSuccess
            ? 'empty'
            : state
        }
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading requests..."
        emptyIcon="clipboard-outline"
        emptyTitle="No requests to assign"
        emptyMessage="Open field requests will appear here."
      >
        <View style={styles.list}>
          {items.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardTitle}>{item.serviceName}</Text>
              <Text style={styles.cardMeta}>
                {item.seniorName?.trim() || 'Senior'} · {humanizeStatus(item.status)}
              </Text>
              {item.notes ? (
                <Text style={styles.cardNotes} numberOfLines={2}>
                  {item.notes}
                </Text>
              ) : null}
              <PrimaryButton
                label={
                  item.awaitingDispatch
                    ? 'Assign SC'
                    : item.status === 'ASSIGNED'
                      ? 'Reassign'
                      : shouldAutoAssignStanding(item.serviceSlug)
                        ? 'Auto-assign'
                        : 'Assign'
                }
                loading={autoAssigningId === item.id}
                onPress={() => {
                  setSuccessMessage(null);
                  setFormError(null);
                  if (
                    shouldAutoAssignStanding(item.serviceSlug) &&
                    item.status !== 'ASSIGNED' &&
                    !item.awaitingDispatch
                  ) {
                    setAutoAssigningId(item.id);
                    autoAssign.mutate(item.id, {
                      onSettled: () => setAutoAssigningId(null),
                      onError: (error) => {
                        setFormError(getApiErrorMessage(error));
                        setPendingAssign(item);
                        setAssigneeIds([]);
                      },
                      onSuccess: (assigned) => {
                        setSuccessMessage(
                          `Auto-assigned ${assigned.serviceName} to standing staff${
                            assigned.seniorName ? ` for ${assigned.seniorName}` : ''
                          }.`,
                        );
                      },
                    });
                    return;
                  }
                  setPendingAssign(item);
                  setAssigneeIds([]);
                }}
              />
            </View>
          ))}
        </View>
      </CareQueryView>

      <Modal visible={Boolean(pendingAssign)} transparent animationType="fade" onRequestClose={closeAssign}>
        <View style={styles.assignOverlay}>
          <Pressable
            style={styles.assignBackdrop}
            onPress={closeAssign}
            accessibilityRole="button"
            accessibilityLabel="Close assign"
          />
          <View style={styles.assignSheet}>
            <Text style={styles.cardTitle}>
              Assign {pendingAssign?.serviceName}
              {pendingAssign?.seniorName ? ` · ${pendingAssign.seniorName}` : ''}
            </Text>
            <Text style={styles.hint}>
              {usesDeliveryJob(pendingAssign?.serviceSlug)
                ? 'Creates a delivery for each selected Service Companion.'
                : 'Creates a visit for each selected Companion or Service Companion.'}
            </Text>
            {assignOptions.length > 0 ? (
              <TextField
                label="Search staff"
                value={assigneeSearch}
                onChangeText={(next) => {
                  setAssigneeSearch(next);
                  setFormError(null);
                }}
                placeholder="Name or employee ID"
                autoCapitalize="none"
                autoCorrect={false}
              />
            ) : null}
            {staff.isPending ? <Text style={styles.hint}>Loading staff…</Text> : null}
            {!staff.isPending && assignOptions.length === 0 ? (
              <Text style={styles.error}>No ACTIVE Companion or Service Companion matches this service.</Text>
            ) : null}
            {!staff.isPending && assignOptions.length > 0 && filteredAssignOptions.length === 0 ? (
              <Text style={styles.error}>No staff match “{assigneeSearch.trim()}”.</Text>
            ) : null}
            <ScrollView style={styles.assignList} keyboardShouldPersistTaps="handled">
              {filteredAssignOptions.map((item) => {
                const selected = assigneeIds.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleAssignee(item.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    style={[styles.assignOption, selected ? styles.assignOptionSelected : null]}
                  >
                    <View style={styles.assignOptionRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        {item.subtitle ? <Text style={styles.cardMeta}>{item.subtitle}</Text> : null}
                      </View>
                      {selected ? <Icon name="checkmark-circle" size={22} color={colors.primary} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            {formError ? <Text style={styles.error}>{formError}</Text> : null}
            <PrimaryButton
              label={
                scOnlyAssign
                  ? 'Confirm Service Companion'
                  : assigneeIds.length > 1
                    ? `Confirm assign (${assigneeIds.length})`
                    : 'Confirm assign'
              }
              loading={assign.isPending || assignSc.isPending}
              onPress={confirmAssign}
            />
            <SecondaryButton label="Cancel" onPress={closeAssign} />
          </View>
        </View>
      </Modal>
    </CareSubScreen>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  success: {
    ...typography.bodyStrong,
    color: colors.safe,
    marginBottom: spacing.md,
  },
  error: {
    ...typography.body,
    color: colors.emergency,
    marginBottom: spacing.sm,
  },
  chipRow: {
    marginBottom: spacing.md,
    flexGrow: 0,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  chipLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  chipLabelActive: {
    color: colors.primary,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    ...cardSurface,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  cardMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cardNotes: {
    ...typography.body,
    color: colors.textSecondary,
  },
  assignOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  assignBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  assignSheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xxl,
    gap: spacing.md,
    maxHeight: '85%',
  },
  assignList: {
    maxHeight: 240,
  },
  assignOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  assignOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  assignOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
