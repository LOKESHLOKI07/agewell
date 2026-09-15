import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getApiErrorMessage } from '@/api/errors';
import { queryClient } from '@/api/queryClient';
import { KeyboardAwareScrollView } from '@/components';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import {
  SERVICE_AREA_LOCKED_MESSAGE,
  SERVICE_AREA_LOCKED_TITLE,
} from '@/features/auth/serviceAreaPreference';
import { useServicesLive } from '@/features/auth/useServicesLive';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';
import { useCurrentMembership, useSeniorProfile } from '@/features/home/hooks/queries';
import { createMembershipPurchaseRequest, fetchMembershipRequests } from './membershipApi';
import { MembershipOnboardingForm } from './MembershipOnboardingForm';
import { membershipQueryKeys } from './queryKeys';
import {
  emptyMembershipOnboardingValues,
  toMembershipPurchaseBody,
  type MembershipOnboardingValues,
} from './onboardingForm';
import {
  MEMBERSHIP_ONBOARDING_NOTE,
  MEMBERSHIP_PLAN_CATALOG,
  getMembershipPlanByKey,
  type MembershipPlanKey,
} from './planCatalog';

const PLAN_THEME = {
  single: {
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

type CatalogPlan = (typeof MEMBERSHIP_PLAN_CATALOG)[number];

export function MembershipPurchaseScreen({ planKey }: { planKey?: MembershipPlanKey }) {
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((state) => state.status === 'AUTHENTICATED');
  const servicesLive = useServicesLive();
  const membership = useCurrentMembership();
  const pending = useQuery({
    queryKey: membershipQueryKeys.requests({ status: 'REQUESTED' }),
    queryFn: () => fetchMembershipRequests({ status: 'REQUESTED', limit: 20, offset: 0 }),
    enabled: isAuthenticated,
  });
  const [submittingKey, setSubmittingKey] = useState<MembershipPlanKey | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<CatalogPlan | null>(null);
  const senior = useSeniorProfile();

  const plans = planKey
    ? MEMBERSHIP_PLAN_CATALOG.filter((plan) => plan.key === planKey)
    : [...MEMBERSHIP_PLAN_CATALOG];
  const hasActive = membership.data?.status.toUpperCase() === 'ACTIVE';
  const pendingRequest = pending.data?.items[0] ?? null;

  const onSelectPlan = (plan: CatalogPlan) => {
    if (!servicesLive) {
      Alert.alert(SERVICE_AREA_LOCKED_TITLE, SERVICE_AREA_LOCKED_MESSAGE);
      return;
    }
    if (submittingKey || hasActive || pendingRequest) {
      return;
    }
    setSelectedPlan(plan);
  };

  const onSubmitOnboarding = (values: MembershipOnboardingValues) => {
    if (!selectedPlan) {
      return;
    }
    setSubmittingKey(selectedPlan.key);
    void createMembershipPurchaseRequest(toMembershipPurchaseBody(selectedPlan.key, values))
      .then(async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['membership', 'requests'] }),
          queryClient.invalidateQueries({ queryKey: homeQueryKeys.membershipCurrent }),
          queryClient.invalidateQueries({ queryKey: homeQueryKeys.seniorMe }),
        ]);
        setSelectedPlan(null);
        Alert.alert(
          'Request submitted',
          'AgeWell received your membership request with family contacts and your preferred hospital. Ops will approve it under Admin → Memberships.',
        );
      })
      .catch((error) => {
        Alert.alert('Unable to submit', getApiErrorMessage(error));
      })
      .finally(() => {
        setSubmittingKey(null);
      });
  };

  const formDefaults: MembershipOnboardingValues = {
    ...emptyMembershipOnboardingValues(),
    familyContact1Name: senior.data?.familyContact1Name ?? '',
    familyContact1Phone: senior.data?.familyContact1Phone ?? senior.data?.emergencyContact ?? '',
    familyContact2Name: senior.data?.familyContact2Name ?? '',
    familyContact2Phone: senior.data?.familyContact2Phone ?? '',
    preferredHospital: senior.data?.preferredHospital ?? '',
  };

  if (planKey && !getMembershipPlanByKey(planKey)) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <AgeWellHeader title="Membership" showBack showProfile={false} showBell={false} />
        <Text style={styles.missing}>This plan is not available.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader
        title={selectedPlan ? 'Emergency details' : plans.length > 1 ? 'Membership Plans' : 'Purchase Now'}
        showBack
        showProfile={false}
        showBell={false}
      />
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        {selectedPlan ? (
          <MembershipOnboardingForm
            planName={selectedPlan.name}
            defaultValues={formDefaults}
            submitting={submittingKey === selectedPlan.key}
            onBack={() => setSelectedPlan(null)}
            onSubmit={onSubmitOnboarding}
          />
        ) : (
          plans.map((plan) => (
            <PlanPurchaseCard
              key={plan.key}
              plan={plan}
              hasActive={hasActive}
              pendingPlanName={pendingRequest?.planName ?? null}
              submitting={submittingKey === plan.key}
              locked={Boolean(submittingKey) || hasActive || Boolean(pendingRequest)}
              onPurchase={() => onSelectPlan(plan)}
            />
          ))
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

function PlanPurchaseCard({
  plan,
  hasActive,
  pendingPlanName,
  submitting,
  locked,
  onPurchase,
}: {
  plan: CatalogPlan;
  hasActive: boolean;
  pendingPlanName: string | null;
  submitting: boolean;
  locked: boolean;
  onPurchase: () => void;
}) {
  const theme = PLAN_THEME[plan.key];
  const buttonLabel = hasActive
    ? 'Already a member'
    : pendingPlanName
      ? 'Request pending'
      : submitting
        ? 'Sending…'
        : 'Continue';

  return (
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
      <Text style={styles.onboardingNote}>{MEMBERSHIP_ONBOARDING_NOTE}</Text>
      {pendingPlanName ? (
        <Text style={styles.pendingNote}>
          Your {pendingPlanName} request is waiting for AgeWell to approve.
        </Text>
      ) : null}
      <Text style={styles.noPay}>
        Next you will add two family contacts and a nearby hospital. No payment is taken in the app. Ops
        reviews this request, then your plan becomes active.
      </Text>
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
    gap: spacing.lg,
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
  onboardingNote: {
    ...typography.caption,
    color: familyHome.muted,
    lineHeight: 18,
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
