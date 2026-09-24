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
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView, LoadingState, PrimaryButton, SecondaryButton } from '@/components';
import { Avatar, Icon, type IconName } from '@/components/ui';
import { queryClient } from '@/api/queryClient';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { MarketplaceServiceIcon } from '@/features/services/components/MarketplaceServiceIcon';
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
import { useHasActiveMembership } from './useHasActiveMembership';
import { useSystemBottomInset } from '@/utils/safeBottom';
import { toDisplayDate } from '@/utils/date';

const VIDEO_URL = 'https://www.youtube.com/results?search_query=How+Companion+Support+Makes+a+Difference+AgeWell';
const SERVICE_AREA_SHORT = 'Kandivali & Borivali, Mumbai';
const HOURS_LABEL = '10 AM - 6 PM';

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
    icon: 'hand-heart',
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
    icon: 'people-outline',
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

function membershipValidLabel(endDate: string | null | undefined): string | null {
  if (!endDate) {
    return null;
  }
  const parsed = new Date(endDate);
  if (Number.isNaN(parsed.getTime())) {
    const display = toDisplayDate(endDate);
    return display ? `Membership valid upto ${display}` : null;
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `Membership valid upto ${parsed.getDate()} ${months[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

/**
 * Companion Visit — three gate states; member hub uses assigned companion + real visits/requests.
 */
export function CompanionVisitScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useSystemBottomInset(12) + spacing.xxl;
  const variant = useMembershipServicePageVariant(true);
  const membership = useHasActiveMembership();
  const { submitting, submit } = useMembershipSubmit('companion');
  const assignedQuery = useAssignedCompanion();
  const activitiesQuery = useCareActivities(variant === 'serviceable_with_membership');
  const visitsQuery = useMyVisits();
  const requestsQuery = useServiceRequests();
  const [showAll, setShowAll] = useState(false);
  const validTill = membershipValidLabel(membership.query.data?.endDate);

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
      <ServicePageHeader />
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
            validTill={validTill}
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
      <View style={styles.titleLine}>
        <MarketplaceServiceIcon
          serviceId="companion"
          fallbackIcon="people"
          fallbackColor={familyHome.green}
          size={48}
        />
        <View style={styles.titleTextWrap}>
          <Text style={styles.title} numberOfLines={2}>
            Companion Visit
          </Text>
        </View>
      </View>
      <Text style={styles.lead}>
        Monthly 20 companion visits for assistance or general meetup. Max. 30 mins depending on need. (Always
        available for emergency)
      </Text>
    </View>
  );
}

function MarketingBanner({
  headline,
  subline,
}: {
  headline: string[];
  subline: string;
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
  validTill,
  onViewAll,
  onCall,
  onMessage,
  onBookVisit,
}: {
  companion: CompanionProfileView | null;
  activities: CompanionActivityView[];
  hasMore: boolean;
  submitting: boolean;
  validTill: string | null;
  onViewAll: () => void;
  onCall: () => void;
  onMessage: () => void;
  onBookVisit: () => void;
}) {
  const location = companion?.serviceAreas?.trim() || SERVICE_AREA_SHORT;

  return (
    <View style={styles.memberStack}>
      <View style={styles.titleBlock}>
        <View style={styles.memberTitleLine}>
          <MarketplaceServiceIcon
            serviceId="companion"
            fallbackIcon="people"
            fallbackColor={familyHome.red}
            size={36}
          />
          <Text style={styles.title}>Companion Support</Text>
        </View>
        {validTill ? (
          <View style={styles.memberBadge}>
            <Icon name="checkmark-circle-outline" size={14} color={familyHome.green} />
            <Text style={styles.memberBadgeTitle}>{validTill}</Text>
          </View>
        ) : null}
      </View>

      {companion ? (
        <View style={styles.profileCard}>
          <Avatar name={companion.name} imageUri={companion.photoUri} size={72} />
          <View style={styles.flex}>
            <Text style={styles.profileName}>{companion.name}</Text>
            <Text style={styles.profileRole}>Companion</Text>
            <View style={styles.profileMetaRow}>
              <Icon name="location" size={12} color={familyHome.blue} />
              <Text style={styles.profileMeta}>{location}</Text>
            </View>
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
              AgeWell will assign a companion for your visits. You can still schedule a visit below.
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
          <Text style={styles.callHours}>{HOURS_LABEL}</Text>
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
          <Text style={styles.messageHours}>{HOURS_LABEL}</Text>
        </Pressable>
        <Pressable
          onPress={onBookVisit}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Schedule a Visit"
          style={({ pressed }) => [styles.bookBtn, pressed ? styles.pressed : null]}
        >
          <Icon name="calendar-outline" size={16} color={familyHome.blue} />
          <Text style={styles.bookLabel} numberOfLines={2}>
            {submitting ? 'Sending…' : 'Schedule a Visit'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.activityHead}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {hasMore ? (
          <Pressable onPress={onViewAll} accessibilityRole="button" accessibilityLabel="View all companion activity">
            <Text style={styles.viewAll}>View All ›</Text>
          </Pressable>
        ) : null}
      </View>

      {activities.length === 0 ? (
        <Text style={styles.emptyActivity}>No companion visits yet. Schedule a visit to get started.</Text>
      ) : (
        <View style={styles.activityList}>
          {activities.map((item, index) => {
            const tone = ACTIVITY_TONE[item.tone];
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}. ${item.when}`}
                style={({ pressed }) => [
                  styles.activityRow,
                  index < activities.length - 1 ? styles.activityRowBorder : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <View style={[styles.activityIcon, { backgroundColor: tone.soft }]}>
                  <Icon name={item.icon} size={14} color={tone.color} />
                </View>
                <View style={styles.flexMin}>
                  <Text style={styles.activityWhen}>{item.when}</Text>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                </View>
                <Icon name="chevron-forward" size={16} color={familyHome.muted} />
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={styles.sectionTitle}>How your Companion supports you</Text>
      <View style={styles.supportGrid}>
        {MEMBER_FEATURES.map((item) => (
          <View key={item.title} style={[styles.supportCard, { backgroundColor: item.soft }]}>
            <Icon name={item.icon} size={18} color={item.color} />
            <Text style={styles.supportTitle}>{item.title}</Text>
            <Text style={styles.supportLine}>{item.line}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => void Linking.openURL(VIDEO_URL)}
        accessibilityRole="button"
        accessibilityLabel="Watch on YouTube: How Companion Support Makes a Difference"
        style={({ pressed }) => [styles.videoCardCompact, pressed ? styles.pressed : null]}
      >
        <View style={styles.videoThumb}>
          <Image source={SERVICE_HERO_IMAGES.companion} style={styles.videoThumbImage} resizeMode="cover" />
          <View style={styles.videoThumbPlay}>
            <Icon name="play" size={14} color={familyHome.white} />
          </View>
          <Text style={styles.videoThumbDuration}>2:48</Text>
        </View>
        <View style={styles.videoCompactCopy}>
          <View style={styles.watchRow}>
            <Icon name="play" size={12} color={familyHome.red} />
            <Text style={styles.watchLabel}>Watch on YouTube</Text>
          </View>
          <Text style={styles.videoCompactTitle}>How Companion Support Makes a Difference</Text>
          <Text style={styles.videoCompactBody}>
            See how AgeWell companions help with daily life, appointments and friendly company.
          </Text>
        </View>
        <Icon name="chevron-forward" size={16} color={familyHome.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  stack: { gap: spacing.lg },
  flex: { flex: 1 },
  flexMin: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.88 },

  titleBlock: { gap: 6 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  titleTextWrap: { flex: 1, minWidth: 0 },
  titleWell: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: { ...typography.title, color: '#123B7A', flexShrink: 1 },
  lead: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },

  bannerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: familyHome.greenSoft,
    minHeight: 188,
  },
  bannerImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  bannerScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(18, 40, 28, 0.42)',
  },
  bannerCopy: {
    padding: spacing.lg,
    paddingRight: '38%',
    paddingBottom: spacing.xl,
    gap: spacing.xs,
    minHeight: 188,
    justifyContent: 'flex-end',
    maxWidth: '100%',
  },
  bannerHeadline: {
    ...typography.subtitle,
    color: familyHome.white,
    lineHeight: 24,
    flexShrink: 1,
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

  benefitGrid: { flexDirection: 'row', gap: spacing.sm },
  benefitCard: {
    flex: 1,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: 4,
    minHeight: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: {
    ...typography.captionStrong,
    color: familyHome.text,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 13,
  },

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

  memberStack: { gap: spacing.sm },
  memberBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  memberBadgeTitle: { ...typography.captionStrong, color: familyHome.greenDark },
  memberTitleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberTitleWell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: familyHome.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileCard: {
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: familyHome.white,
    alignItems: 'center',
  },
  pendingCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: familyHome.blueSoft,
  },
  pendingTitle: { ...typography.bodyStrong, color: familyHome.blueDark },
  pendingBody: { ...typography.caption, color: familyHome.text, marginTop: 4, lineHeight: 18 },
  actionDisabled: { opacity: 0.45 },
  emptyActivity: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  profileName: { ...typography.subtitle, color: '#123B7A' },
  profileRole: { ...typography.caption, color: familyHome.muted, marginBottom: 4 },
  profileMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  profileMeta: { ...typography.caption, color: familyHome.blue, flex: 1, lineHeight: 18 },
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
    minHeight: 64,
    borderRadius: 12,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
  },
  callLabel: { ...typography.captionStrong, color: familyHome.white },
  callHours: { ...typography.caption, color: familyHome.white, fontSize: 10, opacity: 0.9 },
  messageBtn: {
    flex: 1,
    minHeight: 64,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: familyHome.green,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
  },
  messageLabel: { ...typography.captionStrong, color: familyHome.green },
  messageHours: { ...typography.caption, color: familyHome.green, fontSize: 10 },
  bookBtn: {
    flex: 1,
    minHeight: 64,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: familyHome.blue,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
  },
  bookLabel: { ...typography.captionStrong, color: familyHome.blue, textAlign: 'center', fontSize: 11 },

  activityHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { ...typography.bodyStrong, color: '#123B7A', fontSize: 15 },
  viewAll: { ...typography.captionStrong, color: familyHome.green, flexShrink: 0 },
  activityList: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    backgroundColor: familyHome.white,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 52,
  },
  activityRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: familyHome.border,
  },
  activityIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityWhen: { ...typography.caption, color: familyHome.muted, fontSize: 11 },
  activityTitle: { ...typography.captionStrong, color: familyHome.text, fontSize: 13 },

  supportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  supportCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 14,
    padding: spacing.md,
    gap: 4,
    minHeight: 108,
  },
  supportTitle: { ...typography.bodyStrong, color: familyHome.text, fontSize: 13, marginTop: 4 },
  supportLine: { ...typography.caption, color: familyHome.muted, lineHeight: 15, fontSize: 11 },

  videoCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: familyHome.border,
    backgroundColor: '#F7F8FA',
    padding: spacing.sm,
  },
  videoThumb: {
    width: 78,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#123B7A',
  },
  videoThumbImage: { width: '100%', height: '100%' },
  videoThumbPlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  videoThumbDuration: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    ...typography.caption,
    color: familyHome.white,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
    fontSize: 9,
  },
  videoCompactCopy: { flex: 1, gap: 1 },
  watchRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  watchLabel: { ...typography.captionStrong, color: familyHome.muted, fontSize: 10 },
  videoCompactTitle: { ...typography.captionStrong, color: familyHome.text, fontSize: 12 },
  videoCompactBody: { ...typography.caption, color: familyHome.muted, lineHeight: 14, fontSize: 10 },
});

