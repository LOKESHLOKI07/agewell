import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ConfirmDialog, EmptyState, ErrorState, PrimaryButton, SecondaryButton } from '@/components';
import { Icon, IconWell } from '@/components/ui';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { HealthQueryView } from '@/features/health/components/HealthQueryView';
import { HealthSubScreen } from '@/features/health/components/HealthSubScreen';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import {
  useCancelRegistration,
  useCommunityEvent,
  useCommunityRegistrations,
  useRegisterForEvent,
} from './hooks';
import {
  activeRegistrationForEvent,
  capacityLabel,
  eventTitle,
  formatEventDate,
  formatEventTime,
  getCommunityErrorMessage,
  registrationsForUser,
} from './selectors';

interface EventDetailScreenProps {
  eventId: string | undefined;
  title?: string;
  seniorUserId?: string | null;
  registerSeniorId?: string | null;
  requireSeniorToRegister?: boolean;
}

export function EventDetailScreen({
  eventId,
  title = 'Event',
  seniorUserId = null,
  registerSeniorId = null,
  requireSeniorToRegister = false,
}: EventDetailScreenProps) {
  const query = useCommunityEvent(eventId);
  const registrations = useCommunityRegistrations();
  const register = useRegisterForEvent();
  const cancel = useCancelRegistration();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);

  const event = query.data;
  const mine = registrationsForUser(registrations.data?.items ?? [], seniorUserId);
  const registration = event ? activeRegistrationForEvent(mine, event.id, seniorUserId) : null;
  const registered = Boolean(registration);
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && !query.data,
  });
  const date = event ? formatEventDate(event.eventDate) : null;
  const time = event ? formatEventTime(event.eventDate) : null;
  const canRegister = !requireSeniorToRegister || Boolean(registerSeniorId);

  const onRegister = async () => {
    if (!event || !canRegister) {
      return;
    }
    setActionError(null);
    try {
      await register.mutateAsync({
        eventId: event.id,
        seniorId: registerSeniorId ?? undefined,
      });
    } catch (caught) {
      setActionError(caught);
    }
  };

  const onCancel = async () => {
    if (!registration) {
      return;
    }
    setActionError(null);
    try {
      await cancel.mutateAsync(registration.id);
      setConfirmCancel(false);
    } catch (caught) {
      setActionError(caught);
      setConfirmCancel(false);
    }
  };

  return (
    <HealthSubScreen title={title}>
      <HealthQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading event..."
        emptyIcon="calendar-outline"
        emptyTitle="Event not found"
        emptyMessage="This community event is not available."
      >
        {event ? (
          <View style={styles.card}>
            <Text style={styles.eyebrow}>Community event</Text>
            <Text style={styles.title}>{eventTitle(event)}</Text>
            {event.description ? <Text style={styles.description}>{event.description}</Text> : null}

            {date ? (
              <View style={styles.meta}>
                <IconWell tone="primary" size={40} rounded="full">
                  <Icon name="calendar-outline" size={18} color={colors.primary} />
                </IconWell>
                <View>
                  <Text style={styles.metaLabel}>Date</Text>
                  <Text style={styles.metaValue}>{date}</Text>
                </View>
              </View>
            ) : null}

            {time ? (
              <View style={styles.meta}>
                <IconWell tone="accent" size={40} rounded="full">
                  <Icon name="time-outline" size={18} color={colors.accent} />
                </IconWell>
                <View>
                  <Text style={styles.metaLabel}>Time</Text>
                  <Text style={styles.metaValue}>{time}</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.meta}>
              <IconWell tone="info" size={40} rounded="full">
                <Icon name="people-outline" size={18} color={colors.info} />
              </IconWell>
              <View>
                <Text style={styles.metaLabel}>Capacity</Text>
                <Text style={styles.metaValue}>{capacityLabel(event.capacity)}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {actionError ? (
          <View style={styles.actionError}>
            <ErrorState message={getCommunityErrorMessage(actionError)} onRetry={() => setActionError(null)} />
          </View>
        ) : null}

        {registered ? (
          <View style={styles.actions}>
            <View style={styles.registered}>
              <Icon name="checkmark-circle-outline" size={20} color={colors.safe} />
              <Text style={styles.registeredText}>Registered</Text>
            </View>
            <SecondaryButton label="Cancel registration" onPress={() => setConfirmCancel(true)} />
          </View>
        ) : (
          <View style={styles.actions}>
            {!canRegister ? (
              <EmptyState
                icon="people-outline"
                title="Select a senior"
                message="Choose an authorized senior before registering."
              />
            ) : (
              <PrimaryButton
                label="Register"
                onPress={() => void onRegister()}
                loading={register.isPending}
                accessibilityHint="Registers for this community event"
              />
            )}
          </View>
        )}

        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonTitle}>Transport & companion booking</Text>
          <Text style={styles.comingSoonBody}>
            Event transport and companion booking are coming soon. There is no booking API yet — registration above is
            the supported flow.
          </Text>
        </View>
      </HealthQueryView>

      <ConfirmDialog
        visible={confirmCancel}
        title="Cancel registration"
        message="Cancel this community event registration?"
        confirmLabel="Cancel registration"
        cancelLabel="Keep registration"
        onConfirm={() => void onCancel()}
        onCancel={() => setConfirmCancel(false)}
      />
    </HealthSubScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.card,
  },
  eyebrow: {
    ...typography.label,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metaValue: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  actions: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  registered: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  registeredText: {
    ...typography.bodyStrong,
    color: colors.safe,
  },
  actionError: {
    marginTop: spacing.lg,
  },
  comingSoon: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    gap: spacing.xs,
  },
  comingSoonTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  comingSoonBody: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
