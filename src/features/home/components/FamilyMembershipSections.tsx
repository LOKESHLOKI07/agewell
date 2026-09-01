import { Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import type { CurrentMembership, MembershipUsage } from '@/features/home/types/home';
import { getMembershipKind } from '@/features/auth/membershipPlanPreference';
import { getOnboardingServiceFor } from '@/features/auth/onboardingProfile';
import { MEMBERSHIP_PLAN_CATALOG } from '@/features/membership/planCatalog';
import { openMembershipPurchase } from '@/features/membership/openMembershipPurchase';
import { FamilyHomeSectionHeader } from './FamilyHomePrimitives';
import { familyHome } from './familyHomeTheme';

function daysRemaining(endDate: string | null): number | null {
  if (!endDate) {
    return null;
  }
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) {
    return null;
  }
  const ms = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'Not set';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function FamilyActiveMembershipCard({
  membership,
  usage,
}: {
  membership: CurrentMembership;
  usage: MembershipUsage[];
}) {
  const remaining = daysRemaining(membership.endDate);
  const companion =
    usage.find((item) => /companion/i.test(item.benefitName)) ?? usage[0] ?? null;
  const used = companion?.used ?? 0;
  const quota = companion?.quota ?? 0;
  const progress = quota > 0 ? Math.min(1, used / quota) : 0;

  return (
    <View style={styles.section}>
      <FamilyHomeSectionHeader
        title="Your Membership"
        actionLabel="View Benefits"
        onAction={() => router.push('/account/membership' as Href)}
      />
      <View style={styles.activeCard}>
        <View style={styles.activeTop}>
          <View style={styles.planBadge}>
            <Text style={styles.planEyebrow}>CARE PLAN</Text>
            <Text style={styles.planName}>{membership.planName}</Text>
            <View style={styles.activePill}>
              <Icon name="checkmark-circle-outline" size={14} color={familyHome.white} />
              <Text style={styles.activePillText}>{membership.status || 'Active'}</Text>
            </View>
          </View>
          <View style={styles.validWrap}>
            <Text style={styles.validLabel}>Valid Till</Text>
            <Text style={styles.validValue}>{formatDate(membership.endDate)}</Text>
            {remaining != null ? (
              <Text style={styles.daysLeft}>{remaining} Days Remaining</Text>
            ) : null}
          </View>
        </View>

        {companion ? (
          <View style={styles.usageBlock}>
            <View style={styles.usageRow}>
              <Text style={styles.usageLabel}>{companion.benefitName}</Text>
              <Text style={styles.usageValue}>
                {used} / {quota || '—'}
                {quota ? ' hrs' : ''}
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
            <Text style={styles.usageMeta}>This Month</Text>
          </View>
        ) : (
          <Text style={styles.usageMeta}>Membership benefits will appear here.</Text>
        )}
      </View>
    </View>
  );
}

const PLAN_THEME = {
  basic: { color: familyHome.green, soft: familyHome.greenSoft, button: familyHome.greenDark },
  couple: { color: familyHome.blue, soft: familyHome.blueSoft, button: familyHome.blueDark },
} as const;

export function FamilyMembershipPlansCarousel() {
  const { width: windowWidth } = useWindowDimensions();
  const membershipKind = getMembershipKind() ?? getOnboardingServiceFor();
  const visiblePlans = MEMBERSHIP_PLAN_CATALOG.filter((plan) => {
    if (membershipKind === 'single') {
      return plan.key === 'basic';
    }
    if (membershipKind === 'couple') {
      return plan.key === 'couple';
    }
    return true;
  });
  // Nearly full-width card; with one plan use full content width, with two keep a peek.
  const cardWidth =
    visiblePlans.length === 1
      ? Math.max(280, windowWidth - spacing.xl * 2)
      : Math.min(320, Math.max(260, windowWidth - spacing.xl * 2 - 28));

  return (
    <View style={styles.section}>
      <FamilyHomeSectionHeader
        title="Membership Plans"
        actionLabel="View All Plans"
        onAction={() => openMembershipPurchase(visiblePlans[0]?.key)}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardWidth + spacing.md}
        contentContainerStyle={styles.plansRow}
      >
        {visiblePlans.map((plan) => (
          <View
            key={plan.key}
            style={[styles.planCard, { width: cardWidth, backgroundColor: PLAN_THEME[plan.key].soft }]}
          >
            <Text style={[styles.planCardName, { color: PLAN_THEME[plan.key].color }]}>{plan.name}</Text>
            <Text style={styles.planBlurb}>{plan.blurb}</Text>
            <View style={styles.featureList}>
              {plan.features.map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <Icon name="checkmark" size={14} color={PLAN_THEME[plan.key].color} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.planPrice, { color: PLAN_THEME[plan.key].color }]}>
              {plan.price} <Text style={styles.planPeriod}>/ month</Text>
            </Text>
            <Text style={styles.planPriceNote}>{plan.priceNote}</Text>
            <Pressable
              onPress={() => openMembershipPurchase(plan.key)}
              accessibilityRole="button"
              accessibilityLabel={`View ${plan.name} details`}
              style={({ pressed }) => [
                styles.planButton,
                { backgroundColor: PLAN_THEME[plan.key].button },
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.planButtonLabel}>View Details</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function FamilySupportBanner() {
  const phone = '02269001122';
  return (
    <View style={styles.section}>
      <View style={styles.support}>
      <View style={styles.supportIcon}>
        <Icon name="call-outline" size={22} color={familyHome.white} />
      </View>
      <View style={styles.supportCopy}>
        <Text style={styles.supportTitle}>Need help? We're always here for you.</Text>
        <Text style={styles.supportMeta}>24x7 Emergency Customer Care</Text>
        <Text style={styles.supportPhone}>022-69 00 11 22</Text>
      </View>
      <Pressable
        onPress={() => void Linking.openURL(`tel:${phone}`)}
        accessibilityRole="button"
        accessibilityLabel="Call now"
        style={({ pressed }) => [styles.callNow, pressed ? styles.pressed : null]}
      >
        <Text style={styles.callNowLabel}>Call Now</Text>
      </Pressable>
      </View>
    </View>
  );
}

export function FamilyTalkToExpertBanner() {
  const phone = '02269001122';
  return (
    <View style={styles.section}>
      <View style={styles.expert}>
      <View style={styles.expertIcon}>
        <Icon name="help-circle-outline" size={28} color={familyHome.orange} />
      </View>
      <View style={styles.expertCopy}>
        <Text style={styles.expertTitle}>
          Not sure which plan is right for you? Talk to our care expert and choose the best plan for your needs.
        </Text>
        <Text style={styles.expertHours}>10:00 AM - 06:00 PM (Monday to Saturday)</Text>
      </View>
      <Pressable
        onPress={() => void Linking.openURL(`tel:${phone}`)}
        accessibilityRole="button"
        accessibilityLabel="Talk to expert"
        style={({ pressed }) => [styles.expertButton, pressed ? styles.pressed : null]}
      >
        <Icon name="call-outline" size={16} color={familyHome.white} />
        <Text style={styles.expertButtonLabel}>Talk to Expert</Text>
      </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.xl,
  },
  activeCard: {
    borderRadius: 20,
    backgroundColor: familyHome.greenSoft,
    borderWidth: 1,
    borderColor: '#D7ECD8',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  activeTop: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  planBadge: {
    flex: 1,
    backgroundColor: familyHome.greenDark,
    borderRadius: 16,
    padding: spacing.md,
    gap: 4,
  },
  planEyebrow: {
    ...typography.captionStrong,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.4,
  },
  planName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: familyHome.white,
  },
  activePill: {
    marginTop: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activePillText: {
    ...typography.captionStrong,
    color: familyHome.white,
  },
  validWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  validLabel: {
    ...typography.caption,
    color: familyHome.muted,
  },
  validValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: familyHome.text,
  },
  daysLeft: {
    ...typography.captionStrong,
    color: familyHome.green,
  },
  usageBlock: {
    gap: 6,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  usageLabel: {
    ...typography.bodyStrong,
    color: familyHome.text,
    flex: 1,
  },
  usageValue: {
    ...typography.bodyStrong,
    color: familyHome.greenDark,
  },
  barTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#CDE8CF',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: familyHome.green,
  },
  usageMeta: {
    ...typography.caption,
    color: familyHome.muted,
  },
  plansRow: {
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  planCard: {
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  planCardName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  planBlurb: {
    ...typography.caption,
    color: familyHome.muted,
  },
  featureList: {
    gap: 6,
    marginVertical: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    ...typography.captionStrong,
    color: familyHome.text,
    flex: 1,
  },
  planPrice: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    marginTop: 4,
  },
  planPeriod: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    fontWeight: '500',
  },
  planPriceNote: {
    ...typography.caption,
    color: familyHome.muted,
    lineHeight: 18,
  },
  planButton: {
    marginTop: 8,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planButtonLabel: {
    ...typography.bodyStrong,
    color: familyHome.white,
  },
  support: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: familyHome.support,
    borderRadius: 18,
    padding: spacing.lg,
  },
  supportIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportCopy: {
    flex: 1,
    gap: 2,
  },
  supportTitle: {
    ...typography.captionStrong,
    color: familyHome.white,
  },
  supportMeta: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
  },
  supportPhone: {
    ...typography.bodyStrong,
    color: familyHome.white,
  },
  callNow: {
    backgroundColor: familyHome.green,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 40,
    justifyContent: 'center',
  },
  callNowLabel: {
    ...typography.captionStrong,
    color: familyHome.white,
  },
  expert: {
    backgroundColor: familyHome.cream,
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.md,
  },
  expertIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertCopy: {
    gap: 6,
  },
  expertTitle: {
    ...typography.bodyStrong,
    color: familyHome.text,
  },
  expertHours: {
    ...typography.caption,
    color: familyHome.muted,
  },
  expertButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: familyHome.orange,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 44,
  },
  expertButtonLabel: {
    ...typography.bodyStrong,
    color: familyHome.white,
  },
  pressed: {
    opacity: 0.9,
  },
});
