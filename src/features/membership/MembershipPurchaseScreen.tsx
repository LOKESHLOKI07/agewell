import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '@/components';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import {
  SERVICE_AREA_LOCKED_MESSAGE,
  SERVICE_AREA_LOCKED_TITLE,
} from '@/features/auth/serviceAreaPreference';
import { useServicesLive } from '@/features/auth/useServicesLive';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { useCurrentMembership } from '@/features/home/hooks/queries';
import { fetchMembershipRequests } from './membershipApi';
import { membershipQueryKeys } from './queryKeys';
import {
  MEMBERSHIP_ONBOARDING_NOTE,
  MEMBERSHIP_PLAN_CATALOG,
  getMembershipPlanByKey,
  membershipApplyHref,
  type MembershipPlanKey,
} from './planCatalog';

const APPLICATION_STATUS_HREF = '/account/application-status' as Href;

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

  const plans = planKey
    ? MEMBERSHIP_PLAN_CATALOG.filter((plan) => plan.key === planKey)
    : [...MEMBERSHIP_PLAN_CATALOG];
  const hasActive = membership.data?.status.toUpperCase() === 'ACTIVE';
  const pendingRequest = pending.data?.items[0] ?? null;

  const onPlanPress = (plan: CatalogPlan) => {
    if (hasActive) {
      return;
    }
    if (pendingRequest) {
      router.push(APPLICATION_STATUS_HREF);
      return;
    }
    if (!servicesLive) {
      Alert.alert(SERVICE_AREA_LOCKED_TITLE, SERVICE_AREA_LOCKED_MESSAGE);
      return;
    }
    router.push(membershipApplyHref(plan.key));
  };

  if (planKey && !getMembershipPlanByKey(planKey)) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <ServicePageHeader showBell={false} />
        <Text style={styles.missing}>This plan is not available.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ServicePageHeader showBell={false} />
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>
          {plans.length > 1 ? 'Membership Plans' : 'Purchase Now'}
        </Text>
        {plans.map((plan) => (
          <PlanPurchaseCard
            key={plan.key}
            plan={plan}
            hasActive={hasActive}
            pendingPlanName={pendingRequest?.planName ?? null}
            onPress={() => onPlanPress(plan)}
          />
        ))}
      </KeyboardAwareScrollView>
    </View>
  );
}

function PlanPurchaseCard({
  plan,
  hasActive,
  pendingPlanName,
  onPress,
}: {
  plan: CatalogPlan;
  hasActive: boolean;
  pendingPlanName: string | null;
  onPress: () => void;
}) {
  const theme = PLAN_THEME[plan.key];
  const hasPending = Boolean(pendingPlanName);
  const disabled = hasActive;
  const buttonLabel = hasActive
    ? 'Already a member'
    : hasPending
      ? 'View Status →'
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
      {hasPending ? (
        <>
          <Text style={styles.pendingNote}>
            Your {pendingPlanName} application is in progress.
          </Text>
          <Text style={styles.noPay}>
            Track visit, review, and payment from application status. Pay Now appears only after
            acceptance.
          </Text>
        </>
      ) : (
        <Text style={styles.noPay}>
          Continue to fill the AgeWell membership application. A home visit and review come next —
          payment is only after your application is accepted.
        </Text>
      )}
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={
          hasPending ? 'View membership application status' : `Continue with ${plan.name}`
        }
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.button },
          pressed && !disabled ? styles.pressed : null,
          disabled ? styles.disabled : null,
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
  pageTitle: {
    ...typography.title,
    color: familyHome.text,
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
