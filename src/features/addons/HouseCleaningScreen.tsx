import { useMemo } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingState, PrimaryButton, SecondaryButton } from '@/components';
import type { IconName } from '@/components/ui';
import { Icon } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { useServiceRequests, useServices } from '@/features/home/hooks/queries';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { servicePageType } from '@/features/membership/servicePageType';
import { MarketplaceServiceIcon } from '@/features/services/components/MarketplaceServiceIcon';
import {
  filterOfferingsByKind,
  type ServiceOffering,
} from '@/features/membership/catalogTypes';
import {
  filterRequestsBySlug,
  liveRequestToneMeta,
  toLiveRequestViews,
  type LiveRequestTone,
  type LiveRequestView,
} from '@/features/membership/liveServiceRequests';
import { MEMBERSHIP_SERVICE_AREA_LINE } from '@/features/membership/membershipServicePageVariant';
import { membershipPurchaseHref } from '@/features/membership/planCatalog';
import { SERVICE_HERO_IMAGES } from '@/features/membership/serviceHeroes';
import { useHasActiveMembership } from '@/features/membership/useHasActiveMembership';
import { useMembershipServicePageVariant } from '@/features/membership/useMembershipServicePageVariant';
import { useMembershipSubmit } from '@/features/membership/useMembershipSubmit';
import { useServiceOfferings } from '@/features/membership/useCatalog';
import { toDisplayDate } from '@/utils/date';
import { useTabScreenBottomPad } from '@/utils/safeBottom';

/** Backend slug remains `maid-assistance`; product copy is House Maid. */
const SLUG = 'maid-assistance';
const heroImage = SERVICE_HERO_IMAGES['maid-assistance'] ?? SERVICE_HERO_IMAGES['home-repair'];
const VIDEO_URL =
  'https://www.youtube.com/results?search_query=House+Maid+Service+AgeWell';

const DEFAULT_LEAD = 'Trained maid for house & utensil cleaning, stock drying.';
const SERVICE_DETAILS =
  'Monthly maid service for household cleaning including utensils cleaning, cloth drying, brooming and floor cleaning. Trained and verified maids for a clean and hygienic home.';

const PLEASE_NOTE = [
  'This is a chargeable add-on service.',
  'Cost may vary based on your specific requirements and location.',
  'Once you raise a request, our Customer Care team will contact you for more details.',
  'All maids are trained and verified by AgeWell.',
] as const;

const TASK_CARDS: { title: string; icon: IconName; color: string; soft: string }[] = [
  { title: 'Utensils Cleaning', icon: 'restaurant-outline', color: familyHome.blue, soft: familyHome.blueSoft },
  { title: 'Cloth Drying', icon: 'water', color: familyHome.green, soft: familyHome.greenSoft },
  { title: 'Brooming', icon: 'broom', color: familyHome.orange, soft: familyHome.orangeSoft },
  { title: 'Floor Cleaning', icon: 'broom-sparkles', color: familyHome.purple, soft: familyHome.purpleSoft },
];


function membershipValidDate(endDate: string | null | undefined): string | null {
  if (!endDate) {
    return null;
  }
  const parsed = new Date(endDate);
  if (Number.isNaN(parsed.getTime())) {
    return toDisplayDate(endDate) || null;
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parsed.getDate()} ${months[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

function formatRequestDateTime(iso: string | null | undefined): string {
  if (!iso) return 'Recently';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Recently';
  const datePart = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart} • ${timePart}`;
}

function statusToneForLog(tone: LiveRequestTone): { color: string; soft: string } {
  if (tone === 'completed') {
    return { color: familyHome.blueDark, soft: familyHome.blueSoft };
  }
  if (tone === 'scheduled' || tone === 'progress' || tone === 'placed') {
    return { color: familyHome.greenDark, soft: familyHome.greenSoft };
  }
  return liveRequestToneMeta(tone);
}

export function HouseCleaningScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(true, 'maid-assistance');

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ServicePageHeader />

      {variant === 'serviceable_with_membership' ? (
        <MemberLiveBody />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.gateContent, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {variant === 'loading' ? <LoadingState message="Loading House Maid..." /> : null}
          {variant === 'non_serviceable' ? <OutsideAreaBody /> : null}
          {variant === 'serviceable_no_membership' ? <NoMembershipBody /> : null}
        </ScrollView>
      )}
    </View>
  );
}

function useAddonServiceCopy() {
  const services = useServices();
  const catalog = useServiceOfferings(SLUG);
  const service = useMemo(
    () => (services.data ?? []).find((item) => item.slug === SLUG) ?? null,
    [services.data],
  );
  const features = useMemo(
    () => filterOfferingsByKind(catalog.data ?? [], 'feature'),
    [catalog.data],
  );
  const included = useMemo(
    () => filterOfferingsByKind(catalog.data ?? [], 'included'),
    [catalog.data],
  );
  const plans = useMemo(
    () => filterOfferingsByKind(catalog.data ?? [], 'plan'),
    [catalog.data],
  );
  const lead = service?.description?.trim() || DEFAULT_LEAD;
  const priceLabel = plans[0]?.priceLabel?.trim() || '';
  const priceLine = plans[0]?.priceLabel
    ? `Cost: ${plans[0].priceLabel}.`
    : plans[0]?.description || undefined;
  return { service, features, included, plans, lead, priceLine, priceLabel, catalog };
}

function TitleBlock({ lead, priceLine }: { lead?: string; priceLine?: string }) {
  return (
    <View style={styles.titleRow}>
      <MarketplaceServiceIcon
        serviceId={SLUG}
        fallbackIcon="broom"
        fallbackColor={familyHome.greenDark}
        size={48}
      />
      <View style={styles.flex}>
        <Text style={styles.title}>HOUSE MAID</Text>
        {lead ? <Text style={styles.lead}>{lead}</Text> : null}
        {priceLine ? <Text style={styles.priceLine}>{priceLine}</Text> : null}
      </View>
    </View>
  );
}

function WatchVideoCard() {
  return (
    <Pressable
      onPress={() => void Linking.openURL(VIDEO_URL)}
      accessibilityRole="button"
      accessibilityLabel="Watch on YouTube: House Maid Service and Daily Tasks"
      style={({ pressed }) => [styles.videoCard, pressed ? styles.pressed : null]}
    >
      <View style={styles.videoThumb}>
        <Image source={heroImage} style={styles.videoThumbImage} resizeMode="cover" />
        <View style={styles.videoPlay}>
          <Icon name="play" size={14} color={familyHome.white} />
        </View>
        <Text style={styles.videoDuration}>2:08</Text>
      </View>
      <View style={styles.videoCopy}>
        <View style={styles.watchRow}>
          <Icon name="play" size={12} color={familyHome.red} />
          <Text style={styles.watchLabel}>Watch on YouTube</Text>
        </View>
        <Text style={styles.videoTitle}>House Maid Service and Daily Tasks</Text>
        <Text style={styles.videoSub}>Watch this short video to know more.</Text>
      </View>
      <Icon name="chevron-forward" size={16} color={familyHome.muted} />
    </Pressable>
  );
}

function ServiceDetailsCard() {
  return (
    <View style={styles.detailsCard}>
      <View style={styles.detailsHead}>
        <Icon name="document-text-outline" size={18} color={familyHome.blue} />
        <Text style={styles.detailsTitle}>Service Details</Text>
      </View>
      <Text style={styles.detailsBody}>{SERVICE_DETAILS}</Text>
      <View style={styles.taskGrid}>
        {TASK_CARDS.map((item) => (
          <View key={item.title} style={styles.taskCard}>
            <View style={[styles.taskIconWrap, { backgroundColor: item.soft }]}>
              <Icon name={item.icon} size={18} color={item.color} />
            </View>
            <Text style={styles.taskTitle}>{item.title}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function CostBanner({ priceLabel }: { priceLabel: string }) {
  const label = priceLabel.trim() || 'Price will appear once configured';
  return (
    <View style={styles.costBanner} accessibilityRole="summary">
      <Icon name="ribbon-outline" size={18} color={familyHome.greenDark} />
      <Text style={styles.costText}>
        General Cost <Text style={styles.costAmount}>{label}</Text>
      </Text>
    </View>
  );
}

function includedLook(title: string, index: number): {
  icon: IconName;
  color: string;
  soft: string;
} {
  const lower = title.toLowerCase();
  for (const card of TASK_CARDS) {
    if (lower.includes(card.title.toLowerCase().split(' ')[0] ?? '')) {
      return { icon: card.icon, color: card.color, soft: card.soft };
    }
  }
  if (/utensil|dish|kitchen/i.test(lower)) return TASK_CARDS[0];
  if (/cloth|laundry|drying|stock/i.test(lower)) return TASK_CARDS[1];
  if (/broom/i.test(lower) && !/floor/i.test(lower)) return TASK_CARDS[2];
  if (/floor|mop|sparkle/i.test(lower)) return TASK_CARDS[3];
  return TASK_CARDS[index % TASK_CARDS.length];
}

function AddonNoteBanner() {
  return (
    <View style={styles.addonBanner} accessibilityRole="summary">
      <Icon name="card-outline" size={20} color={familyHome.orange} />
      <View style={styles.flex}>
        <Text style={styles.addonTitle}>Add-on Service</Text>
        <Text style={styles.addonBody}>
          This is an add-on service. Pricing may vary based on your specific requirements. For actual
          costing & to avail this service, please connect with us.
        </Text>
      </View>
    </View>
  );
}

function InAreaBanner() {
  return (
    <View style={styles.inAreaBanner} accessibilityRole="summary">
      <Icon name="location" size={16} color={familyHome.greenDark} />
      <Text style={styles.inAreaText}>You are in serviceable area</Text>
    </View>
  );
}

function MembershipRequiredBanner() {
  return (
    <View style={styles.membershipRequired} accessibilityRole="summary">
      <Icon name="lock-closed-outline" size={18} color="#B45309" />
      <View style={styles.flex}>
        <Text style={styles.membershipRequiredTitle}>Membership Required</Text>
        <Text style={styles.membershipRequiredBody}>
          This service is available to active members only.
        </Text>
      </View>
    </View>
  );
}

function OutsideAreaBody() {
  const { priceLabel } = useAddonServiceCopy();

  return (
    <View style={styles.stack}>
      <TitleBlock />
      <WatchVideoCard />
      <ServiceDetailsCard />
      <CostBanner priceLabel={priceLabel} />
      <AddonNoteBanner />
      <View style={styles.soonBanner}>
        <View style={styles.soonIcon}>
          <Icon name="location" size={18} color={familyHome.red} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.soonTitle}>Service coming soon to your area</Text>
          <Text style={styles.soonBody}>
            {MEMBERSHIP_SERVICE_AREA_LINE} House Maid will become available in your area as we expand our
            services.
          </Text>
        </View>
      </View>
      <MembershipRequiredBanner />
      <PrimaryButton label="Get Membership  →" onPress={() => router.push(membershipPurchaseHref())} />
      <SecondaryButton label="View Membership Plans" onPress={() => router.push(membershipPurchaseHref())} />
    </View>
  );
}

/** In serviceable area, membership not purchased — matches House Maid gate mockup. */
function NoMembershipBody() {
  const { priceLabel } = useAddonServiceCopy();

  return (
    <View style={styles.stack}>
      <TitleBlock />
      <WatchVideoCard />
      <ServiceDetailsCard />
      <CostBanner priceLabel={priceLabel} />
      <AddonNoteBanner />
      <InAreaBanner />
      <MembershipRequiredBanner />
      <PrimaryButton label="Get Membership  →" onPress={() => router.push(membershipPurchaseHref())} />
      <SecondaryButton label="View Membership Plans" onPress={() => router.push(membershipPurchaseHref())} />
    </View>
  );
}

function MemberLiveBody() {
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const { lead, features, included, plans, catalog } = useAddonServiceCopy();
  const requestsQuery = useServiceRequests();
  const membership = useHasActiveMembership();
  const { submitting, submit } = useMembershipSubmit(SLUG);
  const plan = plans[0];
  const validTill = membershipValidDate(membership.query.data?.endDate);
  const displayPrice = plan?.priceLabel?.trim() || '';
  const includedItems = included.length > 0 ? included : features;

  const recentRaw = useMemo(() => {
    return filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
  }, [requestsQuery.data?.items]);

  const recent = useMemo(() => {
    return toLiveRequestViews(recentRaw, { fallbackTitle: 'House Maid Service', limit: 3 }).map(
      (view, index) => {
        const source = recentRaw[index];
        return {
          ...view,
          title: 'House Maid Service',
          detail: 'Monthly',
          dateLabel: formatRequestDateTime(source?.createdAt ?? null),
        } satisfies LiveRequestView;
      },
    );
  }, [recentRaw]);

  const allCount = recentRaw.length;

  const onBook = () => {
    if (!plan) {
      Alert.alert('No plan', 'Booking will be available once a plan is configured in the catalog.');
      return;
    }
    const title = plan.title || 'Monthly Plan';
    const desc = plan.description || lead;
    const price = displayPrice || 'Based on availability';
    void submit(`${title} · ${price}. ${desc}`.trim(), 'Booking request submitted');
  };

  const onViewAllRequests = () => {
    const lines = toLiveRequestViews(recentRaw, { fallbackTitle: 'House Maid Service', limit: 20 })
      .map((item, index) => {
        const source = recentRaw[index];
        const when = formatRequestDateTime(source?.createdAt ?? null);
        return `• House Maid Service — ${item.statusLabel} (${when})`;
      })
      .join('\n');
    Alert.alert('Request Logs', lines || 'No requests yet.');
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.liveContent, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.liveTitleRow}>
        <MarketplaceServiceIcon
          serviceId={SLUG}
          fallbackIcon="broom"
          fallbackColor={familyHome.greenDark}
          size={48}
        />
        <Text style={styles.liveTitle}>HOUSE MAID</Text>
      </View>

      {validTill ? (
        <View style={styles.memberBadge} accessibilityRole="summary">
          <Icon name="crown" size={16} color={familyHome.green} />
          <Text style={styles.memberBadgeText}>
            Your membership is valid upto <Text style={styles.memberBadgeDate}>{validTill}</Text>.
          </Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Service Cost</Text>
      {catalog.isPending && !plan ? <Text style={styles.empty}>Loading plan…</Text> : null}
      {catalog.isError && !plan ? (
        <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
          <Text style={styles.link}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}
      {!catalog.isPending && !catalog.isError && !displayPrice ? (
        <Text style={styles.empty}>Price will appear once configured</Text>
      ) : null}
      {displayPrice ? (
        <View style={styles.costCard} accessibilityRole="summary">
          <View style={styles.costIcon}>
            <Icon name="banknote" size={20} color={familyHome.greenDark} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.costPrice}>{displayPrice}</Text>
            <Text style={styles.costSub}>Monthly house maid service.</Text>
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Services Included</Text>
      <Text style={styles.sectionHint}>Our trained and verified maids will help with:</Text>
      {catalog.isPending && includedItems.length === 0 ? (
        <Text style={styles.empty}>Loading services…</Text>
      ) : null}
      {!catalog.isPending && includedItems.length === 0 ? (
        <Text style={styles.empty}>No options configured yet.</Text>
      ) : null}
      {includedItems.length > 0 ? (
        <View style={styles.includedGrid}>
          {includedItems.map((item, index) => {
            const look = includedLook(item.title, index);
            return (
              <View key={item.id} style={styles.includedCard}>
                <View style={[styles.includedIcon, { backgroundColor: look.soft }]}>
                  <Icon name={look.icon} size={18} color={look.color} />
                </View>
                <Text style={styles.includedTitle}>{item.title}</Text>
              </View>
            );
          })}
        </View>
      ) : null}

      <View style={styles.pleaseNote} accessibilityRole="summary">
        <View style={styles.pleaseNoteHead}>
          <Icon name="help-circle-outline" size={18} color={familyHome.blueDark} />
          <Text style={styles.pleaseNoteTitle}>Please Note</Text>
        </View>
        {PLEASE_NOTE.map((line) => (
          <View key={line} style={styles.pleaseNoteLine}>
            <Text style={styles.pleaseNoteBullet}>•</Text>
            <Text style={styles.pleaseNoteText}>{line}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={onBook}
        disabled={submitting || !plan}
        style={({ pressed }) => [
          styles.raiseCta,
          submitting || !plan ? styles.disabled : null,
          pressed ? styles.pressed : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Raise a Request"
      >
        <Icon name="calendar-outline" size={18} color={familyHome.white} />
        <Text style={styles.raiseCtaText}>{submitting ? 'Sending…' : 'Raise a Request'}</Text>
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitleFlush}>Request Logs</Text>
        {allCount > 0 ? (
          <Pressable onPress={onViewAllRequests} accessibilityRole="button">
            <Text style={styles.viewAll}>View All &gt;</Text>
          </Pressable>
        ) : null}
      </View>

      {requestsQuery.isPending ? <Text style={styles.empty}>Loading requests…</Text> : null}
      {!requestsQuery.isPending && recent.length === 0 ? (
        <Text style={styles.empty}>No requests yet. Raise a request to get started.</Text>
      ) : null}

      {recent.length > 0 ? (
        <View style={styles.requestList}>
          {recent.map((item) => {
            const tone = statusToneForLog(item.tone);
            const isDone = item.tone === 'completed';
            return (
              <Pressable
                key={item.id}
                onPress={onViewAllRequests}
                style={({ pressed }) => [styles.requestRow, pressed ? styles.pressed : null]}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${item.statusLabel}`}
              >
                <View
                  style={[
                    styles.requestIcon,
                    { backgroundColor: isDone ? familyHome.blueSoft : familyHome.greenSoft },
                  ]}
                >
                  <Icon
                    name="broom"
                    size={16}
                    color={isDone ? familyHome.blueDark : familyHome.greenDark}
                  />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.requestTitle}>{item.title}</Text>
                  <Text style={styles.requestDetail}>{item.detail}</Text>
                  <Text style={styles.requestDate}>{item.dateLabel}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: tone.soft }]}>
                  <Text style={[styles.statusPillText, { color: tone.color }]}>
                    {item.tone === 'completed'
                      ? 'Completed'
                      : item.tone === 'cancelled'
                        ? item.statusLabel
                        : 'Active'}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={14} color={familyHome.muted} />
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Know More About This Service</Text>
      <WatchVideoCard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  flex: { flex: 1, minWidth: 0 },
  stack: { gap: spacing.md },
  gateContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.md },
  liveContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: {
    ...servicePageType.pageTitle,
  },
  lead: { ...typography.caption, color: familyHome.blue, lineHeight: 18, marginTop: 4 },
  priceLine: { ...typography.caption, color: familyHome.blue, lineHeight: 18, marginTop: 2 },

  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: familyHome.border,
    backgroundColor: familyHome.white,
    padding: spacing.sm,
    minHeight: minTouchSize,
  },
  videoThumb: {
    width: 78,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: familyHome.border,
  },
  videoThumbImage: { width: '100%', height: '100%' },
  videoPlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  videoDuration: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    ...typography.caption,
    fontSize: 9,
    lineHeight: 12,
    color: familyHome.white,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  videoCopy: { flex: 1, gap: 1, minWidth: 0 },
  watchRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  watchLabel: { ...typography.captionStrong, color: familyHome.muted, fontSize: 10 },
  videoTitle: { ...typography.captionStrong, color: familyHome.text, fontSize: 13 },
  videoSub: { ...typography.caption, color: familyHome.muted, lineHeight: 14, fontSize: 10 },

  detailsCard: {
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
  },
  detailsHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailsTitle: { ...servicePageType.sectionTitle, color: familyHome.blueDark },
  detailsBody: { ...servicePageType.bodyMuted },
  taskGrid: { flexDirection: 'row', gap: spacing.sm },
  taskCard: {
    flex: 1,
    backgroundColor: familyHome.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: familyHome.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: 6,
    minHeight: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: {
    ...typography.captionStrong,
    color: familyHome.text,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 13,
  },

  costBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  costText: { ...typography.captionStrong, color: familyHome.greenDark, fontSize: 12, lineHeight: 15 },
  costAmount: { color: familyHome.greenDark },

  addonBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: familyHome.orangeSoft,
    borderRadius: 14,
    padding: spacing.lg,
  },
  addonTitle: { ...servicePageType.bannerTitle, color: familyHome.orange },
  addonBody: { ...servicePageType.bannerBody, color: familyHome.muted, marginTop: 2 },

  inAreaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  inAreaText: { ...servicePageType.inArea },

  membershipRequired: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: familyHome.orangeSoft,
    borderRadius: 14,
    padding: spacing.lg,
  },
  membershipRequiredTitle: { ...servicePageType.bannerTitle, color: '#B45309' },
  membershipRequiredBody: {
    ...servicePageType.bannerBody,
    color: familyHome.muted,
    marginTop: 2,
  },

  heroCard: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: familyHome.greenSoft,
    minHeight: 188,
  },
  heroCopy: { flex: 1, padding: spacing.lg, justifyContent: 'center', gap: spacing.sm },
  heroHeadline: {
    ...servicePageType.heroHeadline,
  },
  heroAccent: { color: familyHome.green },
  heroBody: { ...typography.caption, color: familyHome.blue, lineHeight: 18 },
  heroMedia: { width: 140, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroTag: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  heroTagText: { ...typography.captionStrong, color: familyHome.blueDark, fontSize: 10, lineHeight: 13 },
  featuresCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: familyHome.greenSoft,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
  },
  featureCol: { width: '47%', gap: 4, padding: spacing.sm, alignItems: 'center' },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: { ...servicePageType.featureTitle, color: familyHome.blueDark },
  featureBody: { ...servicePageType.featureBody, color: familyHome.blue },
  soonBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.redSoft,
    borderRadius: 14,
    padding: spacing.lg,
  },
  soonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soonTitle: { ...servicePageType.bannerTitle, color: familyHome.red },
  soonBody: { ...servicePageType.bannerBody, color: familyHome.text, marginTop: 2 },
  notifyCard: {
    backgroundColor: familyHome.blueSoft,
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.md,
  },
  notifyLeft: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  notifyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: familyHome.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: familyHome.blue,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: familyHome.white,
  },
  notifyBtnText: { ...typography.captionStrong, color: familyHome.blue },
  helpTitle: { ...servicePageType.bannerTitle, color: familyHome.blueDark },
  helpBody: { ...servicePageType.bannerBody, color: familyHome.blue, marginTop: 2 },
  liveTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  liveTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    lineHeight: 24,
    color: familyHome.greenDark,
    fontWeight: '700',
    flex: 1,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  memberBadgeText: { ...typography.caption, color: familyHome.text, flex: 1, lineHeight: 18 },
  memberBadgeDate: { ...typography.captionStrong, color: familyHome.greenDark },
  sectionTitle: {
    ...typography.subtitle,
    color: familyHome.blueDark,
    marginTop: spacing.sm,
  },
  sectionTitleFlush: { ...typography.subtitle, color: familyHome.blueDark },
  sectionHint: { ...typography.caption, color: familyHome.muted, marginTop: -4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  viewAll: { ...typography.captionStrong, color: familyHome.blue },
  costCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 14,
    padding: spacing.lg,
  },
  costIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  costPrice: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    lineHeight: 24,
    color: familyHome.greenDark,
    fontWeight: '700',
  },
  costSub: { ...typography.caption, color: familyHome.muted, marginTop: 2 },
  includedGrid: { flexDirection: 'row', gap: spacing.sm },
  includedCard: {
    flex: 1,
    backgroundColor: familyHome.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: familyHome.blueSoft,
    paddingVertical: spacing.md,
    paddingHorizontal: 4,
    gap: 6,
    alignItems: 'center',
    minHeight: 88,
  },
  includedIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  includedTitle: {
    ...typography.captionStrong,
    color: familyHome.text,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 13,
  },
  pleaseNote: {
    backgroundColor: familyHome.blueSoft,
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  pleaseNoteHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pleaseNoteTitle: { ...typography.bodyStrong, color: familyHome.blueDark, fontSize: 14, lineHeight: 18 },
  pleaseNoteLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  pleaseNoteBullet: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  pleaseNoteText: { ...typography.caption, color: familyHome.muted, lineHeight: 18, flex: 1 },
  raiseCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: familyHome.green,
    borderRadius: 14,
    paddingVertical: spacing.md + 2,
    minHeight: minTouchSize,
  },
  raiseCtaText: { ...typography.bodyStrong, color: familyHome.white, fontSize: 16 },
  requestList: { gap: spacing.sm },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.md,
    backgroundColor: familyHome.white,
  },
  requestIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestTitle: { ...typography.bodyStrong, color: familyHome.text, fontSize: 14 },
  requestDetail: { ...typography.caption, color: familyHome.muted, marginTop: 1 },
  requestDate: { ...typography.caption, color: familyHome.muted, marginTop: 2, fontSize: 11 },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: { ...typography.captionStrong, fontSize: 10 },
  empty: { ...typography.caption, color: familyHome.muted },
  link: { ...typography.captionStrong, color: familyHome.blue },
  pressed: { opacity: 0.92 },
  disabled: { opacity: 0.6 },
});
