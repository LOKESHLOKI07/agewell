import { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
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
import { spacing, typography } from '@/constants/theme';
import { useServiceRequests, useServices } from '@/features/home/hooks/queries';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { ServiceHelpBanner } from '@/features/membership/ServiceHelpBanner';
import { MarketplaceServiceIcon } from '@/features/services/components/MarketplaceServiceIcon';
import { useTabScreenBottomPad } from '@/utils/safeBottom';
import { toDisplayDate } from '@/utils/date';
import type { ServiceOffering } from './catalogTypes';
import { useAssignedCompanion } from './careManagerHooks';
import { telHref } from './careManagerHours';
import { MEMBERSHIP_SERVICE_AREA_LINE } from './membershipServicePageVariant';
import { membershipPurchaseHref } from './planCatalog';
import { SERVICE_HERO_IMAGES } from './serviceHeroes';
import {
  filterRequestsBySlug,
  liveRequestToneMeta,
  toLiveRequestViews,
} from './liveServiceRequests';
import { useHasActiveMembership } from './useHasActiveMembership';
import { useMembershipServicePageVariant } from './useMembershipServicePageVariant';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useServiceOfferings } from './useCatalog';

const heroImage = SERVICE_HERO_IMAGES['small-errands'];

const SLUG = 'small-errands';
const DEFAULT_HOURS = '10:00 AM – 6:00 PM';
const VIDEO_URL =
  'https://www.youtube.com/results?search_query=How+Our+Companion+Helps+with+Your+Everyday+Errands+AgeWell';
/** Exactly 3 common-service cards visible without clipping. */
const SERVICE_CARD_GAP = 8;
const SERVICE_CARD_WIDTH = Math.floor(
  (Dimensions.get('window').width - spacing.xl * 2 - SERVICE_CARD_GAP * 2) / 3,
);
const LEAD =
  'Our companion will call before the visit and assist with small errands that can be managed by the companion.';
const DEFAULT_ABOUT =
  'Our companion can assist you with small day-to-day errands such as buying medicines, picking up groceries, submitting documents, post office visits, small household purchases and other routine tasks nearby. Just give us a call and your companion will help you.';

const GATE_FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'shopping-bag', title: 'Pick-ups & Drop-offs', body: 'Collect or drop items from nearby shops' },
  { icon: 'call-outline', title: 'Call Before Visit', body: 'Our companion will call before coming' },
  { icon: 'cart-outline', title: 'Everyday Support', body: 'Assistance with small errands' },
  { icon: 'people-outline', title: 'Reliable Companions', body: 'Trained and verified staff' },
];

const FALLBACK_OFFERINGS: ServiceOffering[] = [
  {
    id: 'fallback-medicines',
    serviceSlug: SLUG,
    title: 'Buy Medicines',
    description: 'Pharmacy pickup during companion visit',
    badge: 'Errand',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 0,
    isActive: true,
  },
  {
    id: 'fallback-groceries',
    serviceSlug: SLUG,
    title: 'Pick up Groceries',
    description: 'Small grocery purchases nearby',
    badge: 'Errand',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'fallback-documents',
    serviceSlug: SLUG,
    title: 'Submit Documents',
    description: 'Submit or collect papers nearby',
    badge: 'Errand',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'fallback-post',
    serviceSlug: SLUG,
    title: 'Post Office Visits',
    description: 'Courier, stamps or parcel drop nearby',
    badge: 'Errand',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'fallback-dry-clean',
    serviceSlug: SLUG,
    title: 'Dry Cleaning',
    description: 'Drop and pick up dry cleaning nearby',
    badge: 'Errand',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 'fallback-household',
    serviceSlug: SLUG,
    title: 'Small Household Purchases',
    description: 'Small household buys nearby',
    badge: 'Errand',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 5,
    isActive: true,
  },
  {
    id: 'fallback-utility',
    serviceSlug: SLUG,
    title: 'Utility Payments',
    description: 'Help with nearby bill payments',
    badge: 'Errand',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 6,
    isActive: true,
  },
  {
    id: 'fallback-other',
    serviceSlug: SLUG,
    title: 'Other Errands',
    description: 'Any other short nearby task',
    badge: 'Errand',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 7,
    isActive: true,
  },
];

const SERVICE_LOOKS: { match: RegExp; icon: IconName; color: string; soft: string }[] = [
  { match: /medicine|pharm|pill/i, icon: 'pill', color: '#E5484D', soft: '#FEF6F6' },
  { match: /groc|shop|cart|store|pick up/i, icon: 'cart-outline', color: familyHome.green, soft: '#EEF8EE' },
  { match: /document|submit|paper/i, icon: 'document-text-outline', color: '#2F80ED', soft: '#EEF5FF' },
  { match: /post|courier|parcel|mail/i, icon: 'mail-outline', color: '#E67E22', soft: '#FFF6E8' },
  { match: /dry|clean|laundry/i, icon: 'water', color: '#D4A017', soft: '#FFF9E8' },
  { match: /household|purchase/i, icon: 'house', color: familyHome.purple, soft: '#F3EEF8' },
  { match: /utility|bill|payment/i, icon: 'wrench', color: familyHome.green, soft: familyHome.greenSoft },
  { match: /other/i, icon: 'ellipsis-horizontal', color: '#E5484D', soft: '#FDEEEE' },
];

function lookForService(title: string) {
  for (const row of SERVICE_LOOKS) {
    if (row.match.test(title)) return row;
  }
  return {
    icon: 'ellipsis-horizontal' as IconName,
    color: familyHome.purple,
    soft: familyHome.purpleSoft,
  };
}

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

export function SmallErrandsScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(true);

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
          {variant === 'loading' ? <LoadingState message="Loading Small Errands..." /> : null}
          {variant === 'non_serviceable' ? <OutsideAreaBody /> : null}
          {variant === 'serviceable_no_membership' ? <NoMembershipBody /> : null}
        </ScrollView>
      )}
    </View>
  );
}

function TitleBlock() {
  return (
    <View style={styles.titleRow}>
      <MarketplaceServiceIcon
        serviceId={SLUG}
        fallbackIcon="create-outline"
        fallbackColor={familyHome.green}
        size={48}
      />
      <View style={styles.flex}>
        <Text style={styles.title}>Small Errands Assistance</Text>
        <Text style={styles.lead}>{LEAD}</Text>
      </View>
    </View>
  );
}

function HeroBanner({
  tone,
  headline,
  accent,
  body,
}: {
  tone: 'outside' | 'membership';
  headline: string;
  accent: string;
  body: string;
}) {
  const parts = headline.split(accent);
  return (
    <View style={[styles.heroCard, tone === 'outside' ? styles.heroOutside : styles.heroMembership]}>
      <View style={styles.heroCopy}>
        {tone === 'membership' ? <View style={styles.heroAccentBar} /> : null}
        <Text style={styles.heroHeadline}>
          {parts[0]}
          <Text style={styles.heroAccent}>{accent}</Text>
          {parts[1] ?? ''}
        </Text>
        <Text style={styles.heroBody}>{body}</Text>
      </View>
      <View style={styles.heroMedia}>
        <Image
          source={heroImage}
          style={styles.heroImage}
          resizeMode="cover"
          accessibilityLabel="AgeWell companion assisting with small errands"
        />
        {tone === 'outside' ? (
          <View style={styles.heroCallout}>
            <Text style={styles.heroCalloutText}>Small Helps Big Differences</Text>
            <Text style={styles.heroHeart}>♡</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function FeaturesGrid() {
  return (
    <View style={styles.featuresCard}>
      {GATE_FEATURES.map((item) => (
        <View key={item.title} style={styles.featureCol}>
          <View style={styles.featureIcon}>
            <Icon name={item.icon} size={18} color={familyHome.green} />
          </View>
          <Text style={styles.featureTitle}>{item.title}</Text>
          <Text style={styles.featureBody}>{item.body}</Text>
        </View>
      ))}
    </View>
  );
}

function OutsideAreaBody() {
  const { submitting, submit } = useMembershipSubmit(SLUG);

  const onNotify = () => {
    void submit(
      'Notify me when Small Errands Assistance is available in my area.',
      'We will notify you',
    );
  };

  return (
    <View style={styles.stack}>
      <TitleBlock />
      <HeroBanner
        tone="outside"
        headline="A Helping Hand For Your Everyday Needs"
        accent="Everyday Needs"
        body="From picking up essentials to small personal tasks, our companions are here to support you."
      />
      <FeaturesGrid />
      <View style={styles.soonBanner}>
        <View style={styles.soonIcon}>
          <Icon name="location" size={18} color={familyHome.red} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.soonTitle}>Service coming soon to your area</Text>
          <Text style={styles.soonBody}>
            {MEMBERSHIP_SERVICE_AREA_LINE} Small Errands Assistance will become available in your area as
            we expand our services.
          </Text>
        </View>
      </View>
      <View style={styles.notifyCard}>
        <View style={styles.notifyLeft}>
          <View style={styles.notifyIcon}>
            <Icon name="notifications-outline" size={16} color={familyHome.white} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.helpTitle}>Get Notified</Text>
            <Text style={styles.helpBody}>
              We’ll notify you as soon as this service is available in your area.
            </Text>
          </View>
        </View>
        <Pressable
          onPress={onNotify}
          disabled={submitting}
          style={[styles.notifyBtn, submitting ? styles.disabled : null]}
          accessibilityRole="button"
          accessibilityLabel="Notify Me"
        >
          <Text style={styles.notifyBtnText}>{submitting ? 'Saving…' : 'Notify Me'}</Text>
        </Pressable>
      </View>
      <ServiceHelpBanner tone="green" />
    </View>
  );
}

function NoMembershipBody() {
  return (
    <View style={styles.stack}>
      <TitleBlock />
      <HeroBanner
        tone="membership"
        headline="Support With Your Daily Needs"
        accent="Daily Needs"
        body="Our companion is here to help with your small errands."
      />
      <FeaturesGrid />
      <View style={styles.membershipCard}>
        <View style={styles.membershipHead}>
          <View style={styles.lockWell}>
            <Icon name="lock-closed-outline" size={16} color="#B45309" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.membershipTitle}>Membership Required</Text>
            <Text style={styles.membershipBody}>
              Small Errands Assistance is available to AgeWell members.
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push(membershipPurchaseHref())}
          style={({ pressed }) => [styles.joinPromo, pressed ? styles.pressed : null]}
          accessibilityRole="button"
        >
          <View style={styles.flex}>
            <Text style={styles.joinPromoTitle}>Join AgeWell Membership</Text>
            <Text style={styles.joinPromoBody}>
              Get access to small errands assistance and many other services for a safer, healthier and happier
              life.
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
      <ServiceHelpBanner />
    </View>
  );
}

function MemberLiveBody() {
  const services = useServices();
  const catalog = useServiceOfferings(SLUG);
  const requestsQuery = useServiceRequests();
  const companionQuery = useAssignedCompanion();
  const membership = useHasActiveMembership();
  const { submitting, submit } = useMembershipSubmit(SLUG);
  const validTill = membershipValidLabel(membership.query.data?.endDate);
  const [selectedId, setSelectedId] = useState('');

  const offerings = useMemo(() => {
    const fromApi = catalog.data ?? [];
    const looksLikeDesign = fromApi.some((item) => /dry clean|utility|household/i.test(item.title));
    const source = looksLikeDesign && fromApi.length > 0 ? fromApi : FALLBACK_OFFERINGS;
    return source.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  }, [catalog.data]);

  const selected = offerings.find((item) => item.id === selectedId) ?? null;

  const service = useMemo(
    () => (services.data ?? []).find((item) => item.slug === SLUG) ?? null,
    [services.data],
  );

  const companion = companionQuery.data?.careManager ?? null;
  const hours = service?.callHoursText?.trim() || DEFAULT_HOURS;
  const about = service?.description?.trim() || DEFAULT_ABOUT;
  const phone = companion?.phone?.trim() || service?.supportPhone?.trim() || null;

  const recent = useMemo(() => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    return toLiveRequestViews(mine, { fallbackTitle: 'Small errand', limit: 3 });
  }, [requestsQuery.data?.items]);

  const allCount = useMemo(
    () => filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG).length,
    [requestsQuery.data?.items],
  );

  const onCall = () => {
    if (phone) {
      void Linking.openURL(telHref(phone)).catch(() => {
        Alert.alert('Unable to call', `Please dial ${phone} manually.`);
      });
      return;
    }
    void submit(
      'Call Companion requested for Small Errands Assistance.',
      'Companion call requested',
    );
  };

  const onSelectService = (item: ServiceOffering) => {
    setSelectedId(item.id);
  };

  const onRaiseRequest = () => {
    if (!selected) {
      Alert.alert('Select a service', 'Please choose a common service before raising a request.');
      return;
    }
    void submit(
      `${selected.title}. Small errand assistance requested. ${selected.description || ''}`.trim(),
      `${selected.title} request sent`,
    );
  };

  const onViewAllRequests = () => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    const lines = toLiveRequestViews(mine, { fallbackTitle: 'Small errand', limit: 20 })
      .map((item) => `• ${item.title} — ${item.statusLabel} (${item.dateLabel})`)
      .join('\n');
    Alert.alert('Recent Activity', lines || 'No activity yet.');
  };

  return (
    <ScrollView contentContainerStyle={styles.liveContent} showsVerticalScrollIndicator={false}>
      <View style={styles.liveTitleBlock}>
        <View style={styles.liveTitleRow}>
          <MarketplaceServiceIcon
            serviceId={SLUG}
            fallbackIcon="shopping-bag"
            fallbackColor={familyHome.purple}
            size={48}
          />
          <Text style={styles.liveTitle}>Small Errands Assistance</Text>
        </View>
        {validTill ? (
          <View style={styles.memberBadge}>
            <Icon name="checkmark-circle-outline" size={14} color={familyHome.green} />
            <Text style={styles.memberBadgeTitle}>{validTill}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.callCard}>
        <View style={styles.callRings}>
          <View style={styles.ringOuter}>
            <View style={styles.ringMid}>
              <View style={styles.callIconWell}>
                <Icon name="call-outline" size={16} color={familyHome.white} />
              </View>
            </View>
          </View>
        </View>
        <View style={styles.callCopy}>
          <Text
            style={styles.callEyebrow}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            Need help with a small errand?
          </Text>
          <Text
            style={styles.callTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            Call Your Companion
          </Text>
          <Text
            style={styles.callBody}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            Talk directly to your assigned companion for quick assistance.
          </Text>
        </View>
        <View style={styles.callActions}>
          <Pressable
            style={[styles.callCta, submitting ? styles.disabled : null]}
            onPress={onCall}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Call Companion"
          >
            <Icon name="call-outline" size={13} color={familyHome.white} />
            <Text style={styles.callCtaText}>{submitting ? '…' : 'Call\nCompanion'}</Text>
          </Pressable>
          <Text style={styles.callHours}>
            Call timing:{'\n'}
            {hours}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Common Services</Text>

      {catalog.isPending && !catalog.data?.length ? (
        <Text style={styles.empty}>Loading services…</Text>
      ) : null}
      {catalog.isError && !catalog.data?.length ? (
        <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
          <Text style={styles.viewAll}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicesRow}>
        {offerings.map((item) => {
          const look = lookForService(item.title);
          const selectedCard = item.id === selectedId;
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelectService(item)}
              disabled={submitting}
              style={[
                styles.serviceCard,
                { backgroundColor: look.soft, borderColor: selectedCard ? look.color : 'transparent' },
                selectedCard ? styles.serviceCardSelected : null,
                submitting ? styles.disabled : null,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedCard }}
              accessibilityLabel={item.title}
            >
              <View style={styles.serviceCardIcon}>
                <Icon name={look.icon} size={18} color={look.color} />
              </View>
              <Text style={styles.serviceCardTitle}>{item.title}</Text>
              {item.description ? (
                <Text style={styles.serviceCardBody}>{item.description}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        onPress={onRaiseRequest}
        disabled={submitting}
        style={({ pressed }) => [
          styles.raiseCta,
          submitting ? styles.disabled : null,
          pressed ? styles.pressed : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Raise a Request"
      >
        <View style={styles.raisePlus}>
          <Icon name="plus-circle" size={20} color={familyHome.green} />
        </View>
        <Text style={styles.raiseCtaText}>{submitting ? 'Sending…' : 'Raise a Request'}</Text>
        <Icon name="chevron-forward" size={18} color={familyHome.white} />
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {allCount > 0 ? (
          <Pressable onPress={onViewAllRequests} accessibilityRole="button">
            <Text style={styles.viewAll}>View All &gt;</Text>
          </Pressable>
        ) : null}
      </View>

      {requestsQuery.isPending ? <Text style={styles.empty}>Loading activity…</Text> : null}
      {!requestsQuery.isPending && recent.length === 0 ? (
        <Text style={styles.empty}>No activity yet. Call your companion or pick a common service.</Text>
      ) : null}

      {recent.length > 0 ? (
        <View style={styles.activityCard}>
          {recent.map((item, index) => {
            const look = lookForService(item.title);
            const tone = liveRequestToneMeta(item.tone);
            return (
              <View
                key={item.id}
                style={[styles.requestRow, index < recent.length - 1 ? styles.requestDivider : null]}
              >
                <View style={[styles.requestIcon, { backgroundColor: look.soft }]}>
                  <Icon name={look.icon} size={14} color={look.color} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.requestDate}>{item.dateLabel}</Text>
                  <Text style={styles.requestTitle}>{item.title}</Text>
                  <Text style={styles.requestDetail}>{item.detail}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: tone.soft }]}>
                  <Text style={[styles.statusPillText, { color: tone.color }]}>{item.statusLabel}</Text>
                </View>
                <Icon name="chevron-forward" size={14} color={familyHome.muted} />
              </View>
            );
          })}
        </View>
      ) : null}

      <View style={styles.aboutCard}>
        <View style={styles.aboutHead}>
          <View style={styles.aboutIcon}>
            <Icon name="help-circle-outline" size={14} color={familyHome.blue} />
          </View>
          <Text style={styles.aboutTitle}>About This Service</Text>
        </View>
        <Text style={styles.aboutText}>{about}</Text>
      </View>

      <Pressable
        onPress={() => void Linking.openURL(VIDEO_URL)}
        accessibilityRole="button"
        accessibilityLabel="Watch on YouTube: How Our Companion Helps with Your Everyday Errands"
        style={({ pressed }) => [styles.videoCardCompact, pressed ? styles.pressed : null]}
      >
        <View style={styles.videoThumb}>
          <Image source={heroImage} style={styles.videoThumbImage} resizeMode="cover" />
          <View style={styles.videoThumbPlay}>
            <Icon name="play" size={14} color={familyHome.white} />
          </View>
          <Text style={styles.videoThumbDuration}>3:45</Text>
        </View>
        <View style={styles.videoCompactCopy}>
          <View style={styles.watchRow}>
            <Icon name="play" size={12} color={familyHome.red} />
            <Text style={styles.watchLabel}>Watch on YouTube</Text>
          </View>
          <Text style={styles.videoCompactTitle}>How Our Companion Helps with Your Everyday Errands</Text>
          <Text style={styles.videoCompactBody}>
            See how our companion helps with medicines, groceries and everyday nearby tasks.
          </Text>
        </View>
        <Icon name="chevron-forward" size={16} color={familyHome.muted} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  flex: { flex: 1 },
  stack: { gap: spacing.md },
  gateContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  title: { ...typography.title, color: familyHome.text },
  lead: { ...typography.body, color: familyHome.muted, lineHeight: 22, marginTop: 4 },
  heroCard: {
    borderRadius: 16,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroOutside: { backgroundColor: '#EAF3FB' },
  heroMembership: { backgroundColor: familyHome.greenSoft },
  heroCopy: { flex: 1.1, gap: spacing.sm },
  heroAccentBar: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: familyHome.green,
  },
  heroHeadline: { ...typography.subtitle, color: familyHome.text, lineHeight: 26 },
  heroAccent: { color: familyHome.green },
  heroBody: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  heroMedia: { flex: 1, position: 'relative' },
  heroImage: {
    width: '100%',
    height: 188,
    borderRadius: 14,
    backgroundColor: familyHome.border,
  },
  heroCallout: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  heroCalloutText: { ...typography.captionStrong, color: familyHome.blue, fontSize: 10 },
  heroHeart: { color: familyHome.blue, fontSize: 12 },
  featuresCard: {
    flexDirection: 'row',
    backgroundColor: '#EAF6F4',
    borderRadius: 18,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  featureCol: { flex: 1, alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: { ...typography.captionStrong, color: familyHome.text, textAlign: 'center', fontSize: 11 },
  featureBody: {
    ...typography.caption,
    color: familyHome.muted,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 14,
  },
  soonBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.redSoft,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#F5C2C4',
    alignItems: 'flex-start',
  },
  soonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soonTitle: { ...typography.bodyStrong, color: familyHome.red },
  soonBody: { ...typography.caption, color: familyHome.text, marginTop: 4, lineHeight: 18 },
  notifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  notifyLeft: { flex: 1, flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  notifyIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: familyHome.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyBtn: {
    borderWidth: 1,
    borderColor: familyHome.blue,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: familyHome.white,
  },
  notifyBtnText: { ...typography.captionStrong, color: familyHome.blue },
  helpTitle: { ...typography.bodyStrong, color: familyHome.text },
  helpBody: { ...typography.caption, color: familyHome.muted, marginTop: 2, lineHeight: 18 },
  helpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  helpBannerGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  helpIconGreen: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpTitleGreen: { ...typography.bodyStrong, color: familyHome.greenDark },
  helpBodyGreen: { ...typography.caption, color: familyHome.greenDark, marginTop: 2, lineHeight: 18 },
  contactIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: familyHome.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  membershipCard: {
    backgroundColor: familyHome.yellowSoft,
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.md,
  },
  membershipHead: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  lockWell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  membershipTitle: { ...typography.bodyStrong, color: familyHome.text },
  membershipBody: { ...typography.caption, color: familyHome.muted, marginTop: 2, lineHeight: 18 },
  joinPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: spacing.lg,
  },
  joinPromoTitle: { ...typography.bodyStrong, color: familyHome.text },
  joinPromoBody: { ...typography.caption, color: familyHome.muted, marginTop: 4, lineHeight: 18 },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.6 },
  liveContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  liveTitleBlock: { gap: spacing.sm },
  liveTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  liveTitle: { ...typography.title, color: familyHome.text, flex: 1, fontSize: 22 },
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
  callCard: {
    borderRadius: 16,
    backgroundColor: familyHome.greenSoft,
    borderWidth: 1,
    borderColor: '#D7ECD8',
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 88,
  },
  callRings: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ringOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(61,139,64,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringMid: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(61,139,64,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callIconWell: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
    justifyContent: 'center',
  },
  callEyebrow: {
    ...typography.captionStrong,
    color: familyHome.greenDark,
    fontSize: 11,
    lineHeight: 14,
  },
  callTitle: {
    ...typography.bodyStrong,
    color: familyHome.text,
    fontSize: 15,
    lineHeight: 18,
  },
  callBody: {
    ...typography.caption,
    color: familyHome.muted,
    lineHeight: 14,
    fontSize: 11,
    height: 28,
  },
  callActions: {
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
    width: 82,
  },
  callCta: {
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: familyHome.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 5,
    alignSelf: 'stretch',
  },
  callCtaText: {
    ...typography.captionStrong,
    color: familyHome.white,
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
  },
  callHours: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 8,
    textAlign: 'center',
    lineHeight: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { ...typography.subtitle, color: familyHome.text, fontSize: 17 },
  viewAll: { ...typography.captionStrong, color: familyHome.blue },
  empty: { ...typography.caption, color: familyHome.muted },
  servicesRow: { gap: SERVICE_CARD_GAP, paddingVertical: 2 },
  serviceCard: {
    width: SERVICE_CARD_WIDTH,
    height: 148,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingTop: 12,
    paddingHorizontal: 8,
    paddingBottom: 10,
    gap: 6,
    alignItems: 'center',
  },
  serviceCardSelected: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  serviceCardIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceCardTitle: {
    ...typography.captionStrong,
    color: familyHome.text,
    fontSize: 12,
    lineHeight: 15,
    textAlign: 'center',
    width: '100%',
  },
  serviceCardBody: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    width: '100%',
  },
  raiseCta: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  raisePlus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  raiseCtaText: { ...typography.bodyStrong, color: familyHome.white, flex: 1, fontSize: 15 },
  activityCard: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    backgroundColor: familyHome.white,
    overflow: 'hidden',
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  requestDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: familyHome.border,
  },
  requestIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestDate: { ...typography.caption, color: familyHome.muted, fontSize: 11, lineHeight: 14 },
  requestTitle: {
    ...typography.bodyStrong,
    color: familyHome.text,
    fontSize: 13,
    lineHeight: 16,
    marginTop: 1,
  },
  requestDetail: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 1,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusPillText: { ...typography.captionStrong, fontSize: 10 },
  aboutCard: {
    borderRadius: 12,
    backgroundColor: familyHome.blueSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  aboutHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aboutIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutTitle: { ...typography.bodyStrong, color: familyHome.text, fontSize: 14 },
  aboutText: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 12,
    lineHeight: 17,
  },
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
    fontSize: 10,
  },
  videoCompactCopy: { flex: 1, gap: 2 },
  watchRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  watchLabel: { ...typography.caption, color: familyHome.muted, fontSize: 11 },
  videoCompactTitle: { ...typography.bodyStrong, color: familyHome.text, fontSize: 13 },
  videoCompactBody: { ...typography.caption, color: familyHome.muted, lineHeight: 15, fontSize: 11 },
});
