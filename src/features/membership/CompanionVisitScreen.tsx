import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView, LoadingState, PrimaryButton, SecondaryButton } from '@/components';
import { Avatar, Icon, type IconName } from '@/components/ui';
import { queryClient } from '@/api/queryClient';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';
import { useMyVisits, useServiceRequests } from '@/features/home/hooks/queries';
import { telHref, whatsappHref } from './careManagerHours';
import { useAssignedCompanion, useCareActivities } from './careManagerHooks';
import { membershipQueryKeys } from './queryKeys';
import {
  buildCompanionActivities,
  toCompanionProfileView,
  type CompanionActivityView,
  type CompanionProfileView,
} from './companionVisitModel';
import { MEMBERSHIP_SERVICE_AREA_LINE } from './membershipServicePageVariant';
import { membershipPurchaseHref } from './planCatalog';
import { SERVICE_HERO_IMAGES } from './serviceHeroes';
import { useMembershipServicePageVariant } from './useMembershipServicePageVariant';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useTabScreenBottomPad } from '@/utils/safeBottom';

const GATE_BENEFITS: { icon: IconName; title: string; line: string }[] = [
  {
    icon: 'chatbubble-outline',
    title: 'Friendly Support',
    line: 'Assistance with daily activities or a simple meetup.',
  },
  {
    icon: 'people',
    title: 'Regular Visits',
    line: 'Monthly 20 visits (max. 30 mins each).',
  },
  {
    icon: 'heart-outline',
    title: 'Emotional Well-being',
    line: 'Companionship for a happier, more active life.',
  },
  {
    icon: 'siren',
    title: 'Always Available',
    line: 'Ready to help during emergencies.',
  },
];

const MEMBER_FEATURES: { icon: IconName; title: string; line: string; color: string; soft: string }[] = [
  {
    icon: 'people',
    title: 'Daily Support',
    line: 'Assistance with everyday activities',
    color: familyHome.green,
    soft: familyHome.greenSoft,
  },
  {
    icon: 'calendar-outline',
    title: 'Appointments',
    line: 'Accompany to doctor visits',
    color: familyHome.blue,
    soft: familyHome.blueSoft,
  },
  {
    icon: 'cart-outline',
    title: 'Shopping Help',
    line: 'Grocery and essentials',
    color: familyHome.orange,
    soft: familyHome.orangeSoft,
  },
  {
    icon: 'heart-outline',
    title: 'Companionship',
    line: 'Friendly presence for a better day',
    color: familyHome.red,
    soft: familyHome.redSoft,
  },
];

const ACTIVITY_TONE: Record<CompanionActivityView['tone'], { color: string; soft: string }> = {
  green: { color: familyHome.green, soft: familyHome.greenSoft },
  blue: { color: familyHome.blue, soft: familyHome.blueSoft },
  pink: { color: familyHome.red, soft: familyHome.redSoft },
};

/**
 * Companion Visit — three gate states; member hub uses assigned companion + real visits/requests.
 */
export function CompanionVisitScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(true);
  const { submitting, submit } = useMembershipSubmit('companion');
  const assignedQuery = useAssignedCompanion();
  const activitiesQuery = useCareActivities(variant === 'serviceable_with_membership');
  const visitsQuery = useMyVisits();
  const requestsQuery = useServiceRequests();
  const [showAll, setShowAll] = useState(false);

  const companion =
    assignedQuery.data?.assigned && assignedQuery.data.careManager
      ? toCompanionProfileView(assignedQuery.data.careManager)
      : null;

  const allActivities = useMemo(
    () =>
      buildCompanionActivities({
        companionId: companion?.id ?? null,
        careActivities: activitiesQuery.data?.items ?? [],
        visits: visitsQuery.data?.items ?? [],
        requests: requestsQuery.data?.items ?? [],
      }),
    [
      companion?.id,
      activitiesQuery.data?.items,
      visitsQuery.data?.items,
      requestsQuery.data?.items,
    ],
  );
  const activities = showAll ? allActivities : allActivities.slice(0, 3);
  const memberDataLoading =
    variant === 'serviceable_with_membership' &&
    (assignedQuery.isPending ||
      activitiesQuery.isPending ||
      visitsQuery.isPending ||
      requestsQuery.isPending);

  const refreshMember = () =>
    void Promise.all([
      assignedQuery.refetch(),
      activitiesQuery.refetch(),
      visitsQuery.refetch(),
      requestsQuery.refetch(),
    ]);

  const onCall = () => {
    if (!companion?.phone) {
      Alert.alert('Unable to call', 'No Companion phone number is on file yet.');
      return;
    }
    void Linking.openURL(telHref(companion.phone)).catch(() => {
      Alert.alert('Unable to call', `Please dial ${companion.phone} manually.`);
    });
  };

  const onMessage = () => {
    if (!companion?.phone) {
      Alert.alert('WhatsApp unavailable', 'No Companion WhatsApp number is on file yet.');
      return;
    }
    const href = whatsappHref(
      companion.phone,
      `Hello ${companion.name}, I would like to connect about a Companion Visit.`,
    );
    void Linking.openURL(href).catch(() => {
      Alert.alert('Unable to open WhatsApp', 'Please message your Companion from your contacts.');
    });
  };

  const onBookVisit = () => {
    void (async () => {
      const ok = await submit(
        'Companion visit booking request · up to 30 minutes · assistance or meetup',
        'Companion visit requested',
      );
      if (ok) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: homeQueryKeys.serviceRequests }),
          queryClient.invalidateQueries({ queryKey: membershipQueryKeys.careActivities }),
          refreshMember(),
        ]);
      }
    })();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="AgeWell" showBack showProfile={false} showBell showTagline />
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {variant === 'loading' || memberDataLoading ? (
          <LoadingState message="Loading Companion Visit..." />
        ) : null}

        {variant === 'non_serviceable' ? (
          <>
            <ServiceTitleBlock />
            <MarketingBanner
              headline={['Trusted ', 'Companionship', ' for ', 'Happier Days']}
              subline="A friend by your side, always."
              callout="Good Conversations, Brighter Tomorrows"
            />
            <BenefitRow items={GATE_BENEFITS} />
            <ComingSoonFooter />
          </>
        ) : null}

        {variant === 'serviceable_no_membership' ? (
          <>
            <ServiceTitleBlock />
            <MarketingBanner
              headline={['Friendly Companionship for ', 'Brighter Days']}
              subline="A friend by your side, always."
              callout="Good Conversations Brighter Tomorrows"
            />
            <BenefitRow items={GATE_BENEFITS} />
            <MembershipRequiredFooter />
          </>
        ) : null}

        {variant === 'serviceable_with_membership' && !memberDataLoading ? (
          <MemberBody
            companion={companion}
            activities={activities}
            hasMore={allActivities.length > 3 && !showAll}
            submitting={submitting}
            onViewAll={() => setShowAll(true)}
            onCall={onCall}
            onMessage={onMessage}
            onBookVisit={onBookVisit}
          />
        ) : null}
      </KeyboardAwareScrollView>
    </View>
  );
}

function ServiceTitleBlock() {
  return (
    <View style={styles.titleBlock}>
      <View style={styles.titleWell}>
        <Icon name="people" size={22} color={familyHome.green} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.title}>Companion Visit</Text>
        <Text style={styles.lead}>
          Monthly 20 companion visits for assistance or general meetup. Max. 30 mins depending on need. (Always
          available for emergency)
        </Text>
      </View>
    </View>
  );
}

function MarketingBanner({
  headline,
  subline,
  callout,
}: {
  headline: string[];
  subline: string;
  callout: string;
}) {
  return (
    <View style={styles.bannerCard} accessibilityRole="summary">
      <Image
        source={SERVICE_HERO_IMAGES.companion}
        style={styles.bannerImage}
        resizeMode="cover"
        accessibilityLabel="Companion Visit illustration"
      />
      <View style={styles.bannerScrim} pointerEvents="none" />
      <View style={styles.bannerCopy} pointerEvents="none">
        <Text style={styles.bannerHeadline}>
          {headline.map((part, index) => {
            const accent = part === 'Companionship' || part === 'Brighter Days' || part === 'Happier Days';
            return (
              <Text key={`${part}-${index}`} style={accent ? styles.bannerAccent : null}>
                {part}
              </Text>
            );
          })}
        </Text>
        <View style={styles.bannerUnderline} />
        <Text style={styles.bannerSubline}>{subline}</Text>
      </View>
      <View style={styles.bannerCallout} pointerEvents="none">
        <Text style={styles.bannerCalloutText}>{callout}</Text>
      </View>
    </View>
  );
}

function BenefitRow({ items }: { items: { icon: IconName; title: string; line: string }[] }) {
  return (
    <View style={styles.benefitGrid}>
      {items.map((item) => (
        <View key={item.title} style={styles.benefitCard}>
          <View style={styles.benefitIcon}>
            <Icon name={item.icon} size={16} color={familyHome.green} />
          </View>
          <Text style={styles.benefitTitle}>{item.title}</Text>
          <Text style={styles.benefitLine}>{item.line}</Text>
        </View>
      ))}
    </View>
  );
}

function ComingSoonFooter() {
  return (
    <View style={styles.stack}>
      <View style={styles.soonBanner}>
        <Icon name="location" size={18} color={familyHome.red} />
        <View style={styles.flex}>
          <Text style={styles.soonTitle}>Service coming soon to your area</Text>
          <Text style={styles.soonBody}>
            {MEMBERSHIP_SERVICE_AREA_LINE} Companion Visit will become available in your area as we expand our
            services.
          </Text>
        </View>
      </View>
      <View style={styles.infoBanner}>
        <Icon name="help-circle-outline" size={18} color={familyHome.blue} />
        <View style={styles.flex}>
          <Text style={styles.infoTitle}>Stay Connected</Text>
          <Text style={styles.infoBody}>Follow us for updates as we bring AgeWell to more locations soon.</Text>
        </View>
      </View>
      <Pressable
        disabled
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        accessibilityLabel="Request a Companion Visit. Unavailable outside the service area"
        style={styles.disabledCta}
      >
        <Text style={styles.disabledCtaLabel}>Request a Companion Visit</Text>
        <Icon name="chevron-forward" size={16} color="#9CA3AF" />
      </Pressable>
    </View>
  );
}

function MembershipRequiredFooter() {
  return (
    <View style={styles.membershipCard}>
      <View style={styles.membershipHead}>
        <View style={styles.lockWell}>
          <Icon name="lock-closed-outline" size={16} color="#B45309" />
        </View>
        <View style={styles.flex}>
          <Text style={styles.membershipTitle}>Membership Required</Text>
          <Text style={styles.membershipBody}>Companion Visit is available to AgeWell members.</Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push(membershipPurchaseHref())}
        accessibilityRole="button"
        accessibilityLabel="Join AgeWell Membership"
        style={({ pressed }) => [styles.joinPromo, pressed ? styles.pressed : null]}
      >
        <View style={styles.flex}>
          <Text style={styles.joinPromoTitle}>Join AgeWell Membership</Text>
          <Text style={styles.joinPromoBody}>
            Get access to Companion Visit and many other services for a safer, healthier and happier life.
          </Text>
        </View>
        <Icon name="chevron-forward" size={16} color="#B45309" />
      </Pressable>

      <PrimaryButton label="Join Membership  →" onPress={() => router.push(membershipPurchaseHref())} />
      <SecondaryButton
        label="View Membership Plans"
        onPress={() => router.push(membershipPurchaseHref())}
      />
    </View>
  );
}

function MemberBody({
  companion,
  activities,
  hasMore,
  submitting,
  onViewAll,
  onCall,
  onMessage,
  onBookVisit,
}: {
  companion: CompanionProfileView | null;
  activities: CompanionActivityView[];
  hasMore: boolean;
  submitting: boolean;
  onViewAll: () => void;
  onCall: () => void;
  onMessage: () => void;
  onBookVisit: () => void;
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.memberTitleLine}>
        <View style={styles.memberTitleWell}>
          <Icon name="people" size={18} color={familyHome.orange} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title}>Companion</Text>
          <Text style={styles.memberSubtitle}>Friendly support for your everyday needs</Text>
        </View>
      </View>

      {companion ? (
        <View style={styles.profileCard}>
          <Avatar name={companion.name} imageUri={companion.photoUri} size={72} />
          <View style={styles.flex}>
            <Text style={styles.profileName}>{companion.name}</Text>
            <Text style={styles.profileRole}>{companion.roleLabel}</Text>
            {companion.experience ? (
              <View style={styles.profileMetaRow}>
                <Icon name="ribbon-outline" size={12} color={familyHome.blue} />
                <Text style={styles.profileMeta}>{companion.experience}</Text>
              </View>
            ) : null}
            {companion.serviceAreas ? (
              <View style={styles.profileMetaRow}>
                <Icon name="location" size={12} color={familyHome.blue} />
                <Text style={styles.profileMeta}>{companion.serviceAreas}</Text>
              </View>
            ) : null}
            {companion.traits ? (
              <View style={styles.profileMetaRow}>
                <Icon name="sparkles" size={12} color={familyHome.blue} />
                <Text style={styles.profileMeta}>{companion.traits}</Text>
              </View>
            ) : null}
            <View style={styles.assignedPill}>
              <View style={styles.assignedDot} />
              <Text style={styles.assignedText}>Assigned to you</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.pendingCard}>
          <Icon name="people" size={20} color={familyHome.blue} />
          <View style={styles.flex}>
            <Text style={styles.pendingTitle}>Companion assignment pending</Text>
            <Text style={styles.pendingBody}>
              AgeWell will assign a companion for your visits. You can still book a visit below.
            </Text>
          </View>
        </View>
      )}

      <View style={styles.actionRow}>
        <Pressable
          onPress={onCall}
          disabled={!companion?.phone}
          accessibilityRole="button"
          accessibilityLabel={companion ? `Call ${companion.name}` : 'Call Companion'}
          style={({ pressed }) => [
            styles.callBtn,
            !companion?.phone ? styles.actionDisabled : null,
            pressed ? styles.pressed : null,
          ]}
        >
          <Icon name="call-outline" size={16} color={familyHome.white} />
          <Text style={styles.callLabel}>Call</Text>
        </Pressable>
        <Pressable
          onPress={onMessage}
          disabled={!companion?.phone}
          accessibilityRole="button"
          accessibilityLabel={
            companion ? `Message ${companion.name} on WhatsApp` : 'Message Companion on WhatsApp'
          }
          style={({ pressed }) => [
            styles.messageBtn,
            !companion?.phone ? styles.actionDisabled : null,
            pressed ? styles.pressed : null,
          ]}
        >
          <Icon name="chatbubble-outline" size={16} color={familyHome.green} />
          <Text style={styles.messageLabel}>Message</Text>
        </Pressable>
        <Pressable
          onPress={onBookVisit}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Book a Visit"
          style={({ pressed }) => [styles.bookBtn, pressed ? styles.pressed : null]}
        >
          <Icon name="calendar-outline" size={16} color={familyHome.blue} />
          <Text style={styles.bookLabel}>{submitting ? 'Sending…' : 'Book a Visit'}</Text>
        </Pressable>
      </View>

      <View style={styles.activityHead}>
        <Text style={styles.sectionTitle}>Recent Visits & Activity</Text>
        {hasMore ? (
          <Pressable onPress={onViewAll} accessibilityRole="button" accessibilityLabel="View all companion activity">
            <Text style={styles.viewAll}>View All &gt;</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.activityList}>
        {activities.length === 0 ? (
          <Text style={styles.emptyActivity}>No companion visits yet. Book a visit to get started.</Text>
        ) : (
          activities.map((item) => {
            const tone = ACTIVITY_TONE[item.tone];
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}. ${item.when}`}
                style={({ pressed }) => [styles.activityRow, pressed ? styles.pressed : null]}
              >
                <View style={[styles.activityIcon, { backgroundColor: tone.soft }]}>
                  <Icon name={item.icon} size={16} color={tone.color} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.activityWhen}>{item.when}</Text>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activityBody}>{item.body}</Text>
                </View>
                <Icon name="chevron-forward" size={16} color={familyHome.muted} />
              </Pressable>
            );
          })
        )}
      </View>

      <View style={styles.promoCard}>
        <View style={styles.flex}>
          <Text style={styles.promoTitle}>Your Companion, Always There</Text>
          <Text style={styles.promoBody}>
            A trusted companion for everyday support, friendly conversation and help when you need it most — including
            emergencies.
          </Text>
        </View>
        <View style={styles.promoImageWrap}>
          <Image source={SERVICE_HERO_IMAGES.companion} style={styles.promoImage} resizeMode="cover" />
          <View style={styles.promoBadge}>
            <Text style={styles.promoBadgeText}>More Smiles Brighter Days.</Text>
          </View>
        </View>
      </View>

      <View style={styles.featureRow}>
        {MEMBER_FEATURES.map((item) => (
          <View key={item.title} style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: item.soft }]}>
              <Icon name={item.icon} size={16} color={item.color} />
            </View>
            <Text style={styles.featureTitle}>{item.title}</Text>
            <Text style={styles.featureLine}>{item.line}</Text>
          </View>
        ))}
      </View>

      <View style={styles.emergencyBanner}>
        <View style={styles.emergencyIcon}>
          <Icon name="call-outline" size={16} color={familyHome.white} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.emergencyTitle}>Need immediate assistance?</Text>
          <Text style={styles.emergencyBody}>Call us or use the Emergency button on the home screen.</Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/sos' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Go to Emergency"
          style={({ pressed }) => [styles.emergencyCta, pressed ? styles.pressed : null]}
        >
          <Text style={styles.emergencyCtaLabel}>Go to Emergency &gt;</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.lg },
  stack: { gap: spacing.lg },
  flex: { flex: 1 },
  pressed: { opacity: 0.88 },

  titleBlock: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  titleWell: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.title, color: '#123B7A' },
  lead: { ...typography.caption, color: familyHome.muted, marginTop: 4, lineHeight: 18 },

  bannerCard: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: familyHome.greenSoft,
    minHeight: 168,
  },
  bannerImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  bannerScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(18, 40, 28, 0.42)',
  },
  bannerCopy: {
    padding: spacing.lg,
    paddingRight: 120,
    gap: spacing.xs,
    minHeight: 168,
    justifyContent: 'flex-end',
  },
  bannerHeadline: {
    ...typography.subtitle,
    color: familyHome.white,
    lineHeight: 24,
  },
  bannerAccent: { color: '#B8F0C0', fontWeight: '700' },
  bannerUnderline: {
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: familyHome.green,
    marginVertical: 4,
  },
  bannerSubline: { ...typography.caption, color: familyHome.white, opacity: 0.95 },
  bannerCallout: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: '#DFF5E2',
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    maxWidth: 120,
  },
  bannerCalloutText: {
    ...typography.caption,
    color: familyHome.greenDark,
    fontWeight: '600',
    fontSize: 11,
    lineHeight: 14,
  },

  benefitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  benefitCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 14,
    padding: spacing.md,
    gap: 4,
    minHeight: 96,
  },
  benefitIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  benefitTitle: { ...typography.captionStrong, color: familyHome.text },
  benefitLine: { ...typography.caption, color: familyHome.muted, lineHeight: 16 },

  soonBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.redSoft,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#F5C2C4',
  },
  soonTitle: { ...typography.bodyStrong, color: familyHome.red },
  soonBody: { ...typography.caption, color: familyHome.text, marginTop: 4, lineHeight: 18 },
  infoBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'flex-start',
  },
  infoTitle: { ...typography.bodyStrong, color: familyHome.blueDark },
  infoBody: { ...typography.caption, color: familyHome.text, marginTop: 4, lineHeight: 18 },
  disabledCta: {
    minHeight: minTouchSize,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  disabledCtaLabel: { ...typography.bodyStrong, color: '#9CA3AF' },

  membershipCard: {
    backgroundColor: familyHome.yellowSoft,
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#F5E6B8',
  },
  membershipHead: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  lockWell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  membershipTitle: { ...typography.bodyStrong, color: '#B45309' },
  membershipBody: { ...typography.caption, color: familyHome.text, marginTop: 2, lineHeight: 18 },
  joinPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FDE9A8',
    borderRadius: 14,
    padding: spacing.md,
  },
  joinPromoTitle: { ...typography.bodyStrong, color: '#92400E' },
  joinPromoBody: { ...typography.caption, color: familyHome.text, marginTop: 2, lineHeight: 17 },

  memberTitleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberTitleWell: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: familyHome.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberSubtitle: { ...typography.body, color: familyHome.muted },

  profileCard: {
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 18,
    padding: spacing.lg,
    backgroundColor: familyHome.white,
  },
  pendingCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 18,
    padding: spacing.lg,
    backgroundColor: familyHome.blueSoft,
  },
  pendingTitle: { ...typography.bodyStrong, color: familyHome.blueDark },
  pendingBody: { ...typography.caption, color: familyHome.text, marginTop: 4, lineHeight: 18 },
  actionDisabled: { opacity: 0.45 },
  emptyActivity: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  profileName: { ...typography.subtitle, color: '#123B7A' },
  profileRole: { ...typography.captionStrong, color: '#123B7A', marginTop: 2 },
  profileMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  profileMeta: { ...typography.caption, color: familyHome.muted, flex: 1 },
  assignedPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  assignedDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: familyHome.green },
  assignedText: { ...typography.captionStrong, color: familyHome.greenDark },

  actionRow: { flexDirection: 'row', gap: spacing.sm },
  callBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: familyHome.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  callLabel: { ...typography.captionStrong, color: familyHome.white },
  messageBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: familyHome.green,
    backgroundColor: familyHome.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  messageLabel: { ...typography.captionStrong, color: familyHome.green },
  bookBtn: {
    flex: 1.2,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: familyHome.blueSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bookLabel: { ...typography.captionStrong, color: familyHome.blue },

  activityHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...typography.subtitle, color: familyHome.text },
  viewAll: { ...typography.captionStrong, color: familyHome.green },
  activityList: { gap: spacing.sm },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 16,
    padding: spacing.lg,
    minHeight: minTouchSize,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityWhen: { ...typography.caption, color: familyHome.muted },
  activityTitle: { ...typography.bodyStrong, color: familyHome.text, marginTop: 2 },
  activityBody: { ...typography.caption, color: familyHome.muted, marginTop: 2, lineHeight: 17 },

  promoCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 18,
    padding: spacing.lg,
    alignItems: 'center',
  },
  promoTitle: { ...typography.subtitle, color: '#123B7A' },
  promoBody: { ...typography.caption, color: familyHome.text, marginTop: 6, lineHeight: 18 },
  promoImageWrap: { width: 110, positionRadius: 14, overflow: 'hidden' },
  promoImage: { width: 110, height: 110 },
  promoBadge: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 6,
    backgroundColor: '#DFF5E2',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  promoBadgeText: {
    ...typography.caption,
    color: familyHome.greenDark,
    fontWeight: '600',
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
  },

  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  featureCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: familyHome.border,
    padding: spacing.md,
    gap: 4,
    minHeight: 96,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  featureTitle: { ...typography.captionStrong, color: familyHome.text },
  featureLine: { ...typography.caption, color: familyHome.muted, lineHeight: 16 },

  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: familyHome.redSoft,
    borderRadius: 16,
    padding: spacing.md,
  },
  emergencyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: familyHome.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTitle: { ...typography.captionStrong, color: familyHome.red },
  emergencyBody: { ...typography.caption, color: familyHome.text, marginTop: 2, lineHeight: 16 },
  emergencyCta: {
    backgroundColor: familyHome.red,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  emergencyCtaLabel: { ...typography.captionStrong, color: familyHome.white, fontSize: 11 },
});
