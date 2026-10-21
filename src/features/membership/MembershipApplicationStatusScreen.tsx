import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getApiErrorMessage } from '@/api/errors';
import { queryClient } from '@/api/queryClient';
import { EmptyState, ErrorState, LoadingState, KeyboardAwareScrollView } from '@/components';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';
import {
  buildApplicationTimeline,
  canPayForApplication,
  displayApplicationId,
  formatApplicationWhen,
  type ApplicationTimelineStep,
} from './applicationStatus';
import { APPLY_NAVY } from './MembershipApplyChrome';
import { confirmMembershipPayment, fetchMembershipRequests } from './membershipApi';
import type { MembershipRequest } from './membershipTypes';
import { membershipQueryKeys } from './queryKeys';

export function MembershipApplicationStatusScreen() {
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((state) => state.status === 'AUTHENTICATED');
  const requests = useQuery({
    queryKey: membershipQueryKeys.requests({ mine: true }),
    queryFn: async () => {
      const [requested, approved, rejected] = await Promise.all([
        fetchMembershipRequests({ status: 'REQUESTED', limit: 5, offset: 0 }),
        fetchMembershipRequests({ status: 'APPROVED', limit: 5, offset: 0 }),
        fetchMembershipRequests({ status: 'REJECTED', limit: 5, offset: 0 }),
      ]);
      const items = [...requested.items, ...approved.items, ...rejected.items].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
      return items[0] ?? null;
    },
    enabled: isAuthenticated,
  });

  const pay = useMutation({
    mutationFn: (id: string) => confirmMembershipPayment(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['membership', 'requests'] }),
        queryClient.invalidateQueries({ queryKey: homeQueryKeys.membershipCurrent }),
        queryClient.invalidateQueries({ queryKey: homeQueryKeys.membershipUsage }),
      ]);
      Alert.alert('Payment confirmed', 'Your AgeWell membership is now active.');
    },
    onError: (error) => {
      Alert.alert('Unable to pay', getApiErrorMessage(error));
    },
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ServicePageHeader showBell={false} />
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Membership Application</Text>
        <Text style={styles.subtitle}>Track the progress of your application.</Text>

        {requests.isPending ? <LoadingState message="Loading application…" /> : null}
        {requests.isError ? (
          <ErrorState
            message={getApiErrorMessage(requests.error)}
            onRetry={() => void requests.refetch()}
          />
        ) : null}
        {requests.isSuccess && !requests.data ? (
          <EmptyState
            icon="clipboard-outline"
            title="No application yet"
            message="Start a Single or Couple membership application to track progress here."
          />
        ) : null}
        {requests.isSuccess && requests.data ? (
          <StatusBody
            request={requests.data}
            paying={pay.isPending}
            onPay={() => pay.mutate(requests.data!.id)}
          />
        ) : null}
      </KeyboardAwareScrollView>
    </View>
  );
}

function StatusBody({
  request,
  paying,
  onPay,
}: {
  request: MembershipRequest;
  paying: boolean;
  onPay: () => void;
}) {
  const steps = buildApplicationTimeline(request);
  const showPay = canPayForApplication(request);

  return (
    <View style={styles.body}>
      <View style={styles.metaCard}>
        <Text style={styles.metaLabel}>Application ID</Text>
        <Text style={styles.metaValue}>{displayApplicationId(request)}</Text>
        <Text style={styles.metaPlan}>{request.planName}</Text>
        {request.createdAt ? (
          <Text style={styles.metaTime}>Submitted {formatApplicationWhen(request.createdAt)}</Text>
        ) : null}
      </View>

      <View style={styles.timeline}>
        {steps.map((step, index) => (
          <TimelineRow key={step.id} step={step} isLast={index === steps.length - 1} />
        ))}
      </View>

      {showPay ? (
        <Pressable
          onPress={onPay}
          disabled={paying}
          accessibilityRole="button"
          accessibilityLabel="Pay Now"
          style={({ pressed }) => [
            styles.payBtn,
            pressed && !paying ? styles.pressed : null,
            paying ? styles.disabled : null,
          ]}
        >
          <Text style={styles.payLabel}>{paying ? 'Confirming…' : 'Pay Now →'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function TimelineRow({ step, isLast }: { step: ApplicationTimelineStep; isLast: boolean }) {
  const completed = step.tone === 'completed';
  const current = step.tone === 'current';

  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <View
          style={[
            styles.dot,
            completed ? styles.dotDone : null,
            current ? styles.dotCurrent : null,
            !completed && !current ? styles.dotPending : null,
          ]}
        >
          {completed ? <Icon name="checkmark" size={12} color={familyHome.white} /> : null}
          {current ? <View style={styles.dotInner} /> : null}
        </View>
        {!isLast ? (
          <View style={[styles.line, completed ? styles.lineDone : styles.linePending]} />
        ) : null}
      </View>
      <View style={[styles.card, current ? styles.cardCurrent : null]}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>{step.title}</Text>
          <Text
            style={[
              styles.badge,
              completed ? styles.badgeDone : null,
              current ? styles.badgeCurrent : null,
              !completed && !current ? styles.badgePending : null,
            ]}
          >
            {completed ? 'Completed' : current ? (step.id === 'payment' ? 'Pending' : 'Upcoming') : 'Pending'}
          </Text>
        </View>
        {step.icon ? (
          <Icon
            name={step.icon}
            size={18}
            color={current ? familyHome.blue : completed ? familyHome.greenDark : familyHome.muted}
          />
        ) : null}
        {step.detail ? <Text style={styles.cardDetail}>{step.detail}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  pageTitle: {
    ...typography.title,
    color: APPLY_NAVY,
    marginBottom: spacing.xs,
  },
  subtitle: { ...typography.body, color: familyHome.muted, marginBottom: spacing.lg },
  body: { gap: spacing.lg },
  metaCard: {
    backgroundColor: familyHome.blueSoft,
    borderRadius: 14,
    padding: spacing.lg,
    gap: 4,
  },
  metaLabel: { ...typography.caption, color: familyHome.muted },
  metaValue: { ...typography.bodyStrong, color: APPLY_NAVY },
  metaPlan: { ...typography.captionStrong, color: familyHome.greenDark, marginTop: 4 },
  metaTime: { ...typography.caption, color: familyHome.muted },
  timeline: { gap: 0 },
  row: { flexDirection: 'row', gap: spacing.md },
  rail: { width: 28, alignItems: 'center' },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: familyHome.greenDark },
  dotCurrent: { backgroundColor: familyHome.blue },
  dotPending: { backgroundColor: '#E5E5E5' },
  dotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: familyHome.white },
  line: { width: 2, flex: 1, minHeight: 28, marginVertical: 4 },
  lineDone: { backgroundColor: familyHome.green },
  linePending: { backgroundColor: '#E5E5E5' },
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: familyHome.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 6,
  },
  cardCurrent: { borderColor: familyHome.blue, backgroundColor: familyHome.blueSoft },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: { ...typography.bodyStrong, color: APPLY_NAVY, flex: 1 },
  badge: {
    ...typography.captionStrong,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  badgeDone: { color: familyHome.greenDark, backgroundColor: familyHome.greenSoft },
  badgeCurrent: { color: familyHome.blue, backgroundColor: '#E8F1FC' },
  badgePending: { color: familyHome.muted, backgroundColor: '#F3F3F3' },
  cardDetail: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  payBtn: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: familyHome.greenDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payLabel: { ...typography.bodyStrong, color: familyHome.white },
  pressed: { opacity: 0.92 },
  disabled: { opacity: 0.7 },
});
