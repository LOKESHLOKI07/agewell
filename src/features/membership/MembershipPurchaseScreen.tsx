import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getApiErrorMessage } from '@/api/errors';
import { queryClient } from '@/api/queryClient';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import {
  canAvailServices,
  SERVICE_AREA_LOCKED_MESSAGE,
  SERVICE_AREA_LOCKED_TITLE,
} from '@/features/auth/serviceAreaPreference';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';
import { useCurrentMembership } from '@/features/home/hooks/queries';
import { createMembershipPurchaseRequest, fetchMembershipRequests } from './membershipApi';
import { membershipQueryKeys } from './queryKeys';
import { getMembershipPlanByKey, type MembershipPlanKey } from './planCatalog';

const PLAN_THEME = {
  basic: {
    color: familyHome.green,
    soft: familyHome.greenSoft,
    button: familyHome.greenDark,
  },
  couple: {
    color: familyHome.blue,
    soft: familyHome.blueSoft,
    button: familyHome.blueDark,
  },
} as const;

export function MembershipPurchaseScreen({ planKey }: { planKey: MembershipPlanKey }) {
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((state) => state.status === 'AUTHENTICATED');
  const plan = getMembershipPlanByKey(planKey);
  const theme = PLAN_THEME[planKey];
  const membership = useCurrentMembership();
  const pending = useQuery({
    queryKey: membershipQueryKeys.requests({ status: 'REQUESTED' }),
    queryFn: () => fetchMembershipRequests({ status: 'REQUESTED', limit: 20, offset: 0 }),
    enabled: isAuthenticated,
  });
  const [submitting, setSubmitting] = useState(false);

  const hasActive = membership.data?.status.toUpperCase() === 'ACTIVE';
  const pendingRequest = pending.data?.items[0] ?? null;

  const onPurchase = () => {
    if (!canAvailServices()) {
      Alert.alert(SERVICE_AREA_LOCKED_TITLE, SERVICE_AREA_LOCKED_MESSAGE);
      return;
    }
    if (!plan || submitting || hasActive || pendingRequest) {
      return;
    }
    setSubmitting(true);
    void createMembershipPurchaseRequest({
      planKey,
      notes: `${plan.name} purchase request`,
    })
      .then(async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['membership', 'requests'] }),
          queryClient.invalidateQueries({ queryKey: homeQueryKeys.membershipCurrent }),
        ]);
        Alert.alert(
          'Request submitted',
          'AgeWell received your membership request. No payment is taken in the app — ops will approve it under Admin → Memberships.',
        );
      })
      .catch((error) => {
        Alert.alert('Unable to submit', getApiErrorMessage(error));
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  if (!plan) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <AgeWellHeader title="Membership" showBack showProfile={false} showBell={false} />
        <Text style={styles.missing}>This plan is not available.</Text>
      </View>
    );
  }

  const buttonLabel = hasActive
    ? 'Already a member'
    : pendingRequest
      ? 'Request pending'
      : submitting
        ? 'Sending…'
        : 'Purchase Now';
  const locked = submitting || hasActive || Boolean(pendingRequest);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Purchase Now" showBack showProfile={false} showBell={false} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: theme.soft }]}>
          <Text style={[styles.planName, { color: theme.color }]}>{plan.name}</Text>
          <Text style={styles.blurb}>{plan.blurb}</Text>
          <View style={styles.features}>
            {plan.features.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Icon name="checkmark" size={16} color={theme.color} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.price, { color: theme.color }]}>
            {plan.price} <Text style={styles.period}>/ month</Text>
          </Text>
          <Text style={styles.priceNote}>{plan.priceNote}</Text>
          {pendingRequest ? (
            <Text style={styles.pendingNote}>
              Your {pendingRequest.planName} request is waiting for AgeWell to approve.
            </Text>
          ) : null}
          <Text style={styles.noPay}>No payment is taken in the app. Ops reviews this request, then your plan becomes active.</Text>
          <Pressable
            onPress={onPurchase}
            disabled={locked}
            accessibilityRole="button"
            accessibilityLabel={`Purchase ${plan.name}`}
            accessibilityState={{ disabled: locked }}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.button },
              pressed && !locked ? styles.pressed : null,
              locked ? styles.disabled : null,
            ]}
          >
            <Text style={styles.buttonLabel}>{buttonLabel}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: familyHome.white,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  missing: {
    ...typography.body,
    color: familyHome.muted,
    padding: spacing.xl,
  },
  card: {
    borderRadius: 18,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  planName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  blurb: {
    ...typography.body,
    color: familyHome.muted,
  },
  features: {
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  featureText: {
    ...typography.body,
    color: familyHome.text,
    flex: 1,
  },
  price: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  },
  period: {
    ...typography.body,
    color: familyHome.muted,
    fontWeight: '500',
  },
  priceNote: {
    ...typography.caption,
    color: familyHome.muted,
  },
  pendingNote: {
    ...typography.captionStrong,
    color: familyHome.orange,
  },
  noPay: {
    ...typography.caption,
    color: familyHome.muted,
    lineHeight: 18,
  },
  button: {
    marginTop: spacing.sm,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    ...typography.bodyStrong,
    color: familyHome.white,
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.7,
  },
});
