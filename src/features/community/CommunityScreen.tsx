import { useState, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { ConfirmDialog, EmptyState, ErrorState } from '@/components';
import { colors, spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { SectionTitle } from '@/components/ui';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { useTabScreenBottomPad } from '@/utils/safeBottom';
import { EventCard, EventCardSkeleton } from './components/EventCard';
import { RegistrationRow } from './components/RegistrationRow';
import { useCancelRegistration, useCommunityEvents, useCommunityRegistrations, useRegisterForEvent } from './hooks';
import {
  activeRegistrationForEvent,
  communityEventHref,
  eventDateForRegistration,
  formatEventDate,
  getCommunityErrorMessage,
  registrationsForUser,
} from './selectors';

interface CommunityFeedScreenProps {
  title?: string;
  subtitle?: string | null;
  header?: ReactNode;
  seniorUserId?: string | null;
  registerSeniorId?: string | null;
  eventHref?: (id: string) => Href;
  requireSeniorToRegister?: boolean;
  showRegisterOnCard?: boolean;
}

export function CommunityScreen() {
  return <CommunityFeedScreen />;
}

export function CommunityFeedScreen({
  title = 'Community',
  subtitle = null,
  header,
  seniorUserId = null,
  registerSeniorId = null,
  eventHref = (id) => communityEventHref(id) as Href,
  requireSeniorToRegister = false,
  showRegisterOnCard = true,
}: CommunityFeedScreenProps) {
  const events = useCommunityEvents();
  const registrations = useCommunityRegistrations();
  const register = useRegisterForEvent();
  const cancel = useCancelRegistration();
  const [refreshing, setRefreshing] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const bottomPad = useTabScreenBottomPad(spacing.huge);

  const items = events.data?.items ?? [];
  const mine = registrationsForUser(registrations.data?.items ?? [], seniorUserId);
  const state = getSectionState({
    isPending: events.isPending,
    isError: events.isError,
    isEmpty: items.length === 0,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([events.refetch(), registrations.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  const onRegister = async (eventId: string) => {
    if (requireSeniorToRegister && !registerSeniorId) {
      return;
    }
    setActionError(null);
    try {
      await register.mutateAsync({
        eventId,
        seniorId: registerSeniorId ?? undefined,
      });
    } catch (caught) {
      setActionError(caught);
    }
  };

  const onCancel = async () => {
    if (!pendingCancelId) {
      return;
    }
    setActionError(null);
    try {
      await cancel.mutateAsync(pendingCancelId);
      setPendingCancelId(null);
    } catch (caught) {
      setActionError(caught);
      setPendingCancelId(null);
    }
  };

  return (
    <View style={styles.container}>
      <AgeWellHeader title={title} subtitle={subtitle ?? undefined} showProfile />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {header}

        {state === 'loading' ? (
          <View style={styles.list} accessibilityLabel="Loading community events">
            <EventCardSkeleton />
            <EventCardSkeleton />
            <EventCardSkeleton />
          </View>
        ) : null}

        {state === 'error' ? (
          <ErrorState message={getCommunityErrorMessage(events.error)} onRetry={() => void events.refetch()} />
        ) : null}

        {state === 'empty' ? (
          <EmptyState
            icon="people-outline"
            title="No community events"
            message="There are no upcoming community events right now. Check back soon."
            actionLabel="Refresh"
            onAction={() => void events.refetch()}
          />
        ) : null}

        {state === 'ready' ? (
          <View style={styles.list}>
            {items.map((event) => {
              const registration = activeRegistrationForEvent(mine, event.id, seniorUserId);
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  registration={registration}
                  onPress={() => router.push(eventHref(event.id))}
                  onRegister={
                    showRegisterOnCard && !registration
                      ? () => {
                          void onRegister(event.id);
                        }
                      : undefined
                  }
                  registerDisabled={requireSeniorToRegister && !registerSeniorId}
                  registerLabel={
                    requireSeniorToRegister && !registerSeniorId ? 'Select a senior' : 'Register'
                  }
                />
              );
            })}
          </View>
        ) : null}

        {actionError ? (
          <ErrorState message={getCommunityErrorMessage(actionError)} onRetry={() => setActionError(null)} />
        ) : null}

        <View style={styles.section}>
          <SectionTitle title="My registrations" />
          {registrations.isPending ? (
            <EventCardSkeleton />
          ) : registrations.isError ? (
            <ErrorState
              message={getCommunityErrorMessage(registrations.error)}
              onRetry={() => void registrations.refetch()}
            />
          ) : mine.length === 0 ? (
            <Text style={styles.emptyRegs}>No registrations yet.</Text>
          ) : (
            <View style={styles.list}>
              {mine.map((item) => (
                <RegistrationRow
                  key={item.id}
                  registration={item}
                  eventDate={formatEventDate(eventDateForRegistration(item, items))}
                  onPress={() => router.push(eventHref(item.eventId))}
                  onCancel={
                    item.status === 'REGISTERED' ? () => setPendingCancelId(item.id) : undefined
                  }
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={Boolean(pendingCancelId)}
        title="Cancel registration"
        message="Cancel this community event registration?"
        confirmLabel="Cancel registration"
        cancelLabel="Keep registration"
        onConfirm={() => void onCancel()}
        onCancel={() => setPendingCancelId(null)}
      />
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
    padding: spacing.lg,
    gap: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  emptyRegs: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
