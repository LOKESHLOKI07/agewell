import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '@/components';
import { getApiErrorMessage } from '@/api/errors';
import { cardSurface, colors, spacing, typography } from '@/constants/theme';
import type { ServiceRequest } from '@/features/home/types/home';
import { dispatchModeFor } from '@/features/services/servicePolicy';
import { AssignServiceCompanionSheet } from './AssignServiceCompanionSheet';
import {
  useAssignCareServiceCompanion,
  useCareDispatchQueue,
  useCareManagerProfile,
  useTakeCareServiceRequest,
} from './hooks';
import { parseStaffKind } from './staffKind';

export function CareDispatchQueue() {
  const profile = useCareManagerProfile();
  const canTake = parseStaffKind(profile.data?.staffKind) === 'COMPANION';
  const queue = useCareDispatchQueue(true);
  const take = useTakeCareServiceRequest();
  const assignSc = useAssignCareServiceCompanion();
  const [pending, setPending] = useState<ServiceRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const myId = profile.data?.id;
  const items = (queue.data?.items ?? []).filter(
    (item) => item.awaitingDispatch !== false && (!myId || !item.dispatcherId || item.dispatcherId === myId),
  );

  if (queue.isPending) {
    return null;
  }
  if (queue.isError) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Action needed</Text>
        <Text style={styles.error}>{getApiErrorMessage(queue.error)}</Text>
      </View>
    );
  }
  if (items.length === 0) {
    return null;
  }

  const mode = dispatchModeFor(pending?.serviceSlug);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Action needed</Text>
      <Text style={styles.hint}>
        Jobs assigned to you that need a Service Companion handoff
        {items.some((item) => dispatchModeFor(item.serviceSlug) === 'take_or_assign')
          ? ', or you can take the task yourself.'
          : '.'}
      </Text>
      {items.map((item) => {
        const itemMode = item.dispatchMode ?? dispatchModeFor(item.serviceSlug);
        return (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{item.serviceName}</Text>
            <Text style={styles.cardMeta}>{item.seniorName?.trim() || 'Senior'}</Text>
            {itemMode === 'take_or_assign' && canTake ? (
              <View style={styles.row}>
                <PrimaryButton
                  label="Take task"
                  loading={take.isPending}
                  onPress={() => {
                    setError(null);
                    take.mutate(item.id, {
                      onError: (err) => setError(getApiErrorMessage(err)),
                    });
                  }}
                />
                <SecondaryButton
                  label="Assign to Service Companion"
                  onPress={() => {
                    setError(null);
                    setPending(item);
                  }}
                />
              </View>
            ) : (
              <PrimaryButton
                label="Assign to Service Companion"
                onPress={() => {
                  setError(null);
                  setPending(item);
                }}
              />
            )}
          </View>
        );
      })}
      {error && !pending ? <Text style={styles.error}>{error}</Text> : null}

      <AssignServiceCompanionSheet
        visible={Boolean(pending)}
        serviceSlug={pending?.serviceSlug}
        serviceLabel={pending?.serviceName}
        hint={
          mode === 'assign_sc_only'
            ? 'Only a Service Companion can finish this job. Pick one from the list.'
            : 'Pick an available Service Companion from the list.'
        }
        loading={assignSc.isPending}
        onClose={() => {
          setPending(null);
          setError(null);
        }}
        onConfirm={(serviceCompanionId) => {
          if (!pending) return;
          setError(null);
          assignSc.mutate(
            { id: pending.id, serviceCompanionId },
            {
              onError: (err) => Alert.alert('Assign failed', getApiErrorMessage(err)),
              onSuccess: () => {
                setPending(null);
              },
            },
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  hint: {
    ...typography.body,
    color: colors.textSecondary,
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
  row: {
    gap: spacing.sm,
  },
  error: {
    ...typography.body,
    color: colors.emergency,
  },
});
