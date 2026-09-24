import { useMemo, useState } from 'react';
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
import { spacing, typography } from '@/constants/theme';
import { useServiceRequests } from '@/features/home/hooks/queries';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { ServiceHelpBanner } from '@/features/membership/ServiceHelpBanner';
import { MarketplaceServiceIcon } from '@/features/services/components/MarketplaceServiceIcon';
import { useTabScreenBottomPad } from '@/utils/safeBottom';
import type { ServiceOffering } from './catalogTypes';
import { MEMBERSHIP_SERVICE_AREA_LINE } from './membershipServicePageVariant';
import { membershipPurchaseHref } from './planCatalog';
import { SERVICE_HERO_IMAGES } from './serviceHeroes';
import {
  filterRequestsBySlug,
  liveRequestToneMeta,
  toLiveRequestViews,
} from './liveServiceRequests';
import { useMembershipServicePageVariant } from './useMembershipServicePageVariant';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useServiceOfferings } from './useCatalog';

const heroImage = SERVICE_HERO_IMAGES.pooja;

const SLUG = 'pooja';
const VIDEO_URL =
  'https://www.youtube.com/results?search_query=Simple+Steps+to+Plan+a+Home+Pooja+for+Peace';
const LEAD =
  'Choose from various pooja options on the app, with 1–2 helpers provided to assist you at home. (Extra charges apply)';

const WHAT_INCLUDED = [
  'Complete pooja arrangement',
  'All pooja material',
  'Guruji dakshina',
  'Food for Guruji',
  '1–2 companions',
];

const PLEASE_NOTE = [
  'Prices may vary by location and package',
  'Companion will call to confirm details',
  'Special / custom requests supported',
];

const GATE_FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'lamp',
    title: 'Various Pooja Options',
    body: 'Choose from different pooja services on the app',
  },
  {
    icon: 'people-outline',
    title: '1–2 Helpers at Home',
    body: 'Trained helpers to assist you',
  },
  {
    icon: 'clipboard-outline',
    title: 'Hassle-Free Arrangements',
    body: 'We coordinate the details',
  },
  {
    icon: 'flame',
    title: 'A More Peaceful Experience',
    body: 'Perform rituals comfortably at home',
  },
];

const FALLBACK_OFFERINGS: ServiceOffering[] = [
  {
    id: 'fallback-ganesh',
    serviceSlug: SLUG,
    title: 'Ganesh Pooja',
    description: 'For new beginnings and success.',
    badge: '1–2 helpers',
    priceLabel: '₹5,500',
    image: null,
    metaJson: null,
    sortOrder: 0,
    isActive: true,
  },
  {
    id: 'fallback-lakshmi',
    serviceSlug: SLUG,
    title: 'Lakshmi Pooja',
    description: 'Invite prosperity and abundance into your home.',
    badge: '1–2 helpers',
    priceLabel: '₹4,500',
    image: null,
    metaJson: null,
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'fallback-navratri',
    serviceSlug: SLUG,
    title: 'Navratri Pooja',
    description: 'Festival worship with complete arrangements.',
    badge: '1–2 helpers',
    priceLabel: '₹6,500',
    image: null,
    metaJson: null,
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'fallback-diwali',
    serviceSlug: SLUG,
    title: 'Diwali Lakshmi Pooja',
    description: 'Auspicious Diwali Lakshmi pooja at home.',
    badge: '1–2 helpers',
    priceLabel: '₹7,500',
    image: null,
    metaJson: null,
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'fallback-satya',
    serviceSlug: SLUG,
    title: 'Satyanarayan Pooja',
    description: 'For peace and prosperity.',
    badge: '2 helpers',
    priceLabel: '₹3,500',
    image: null,
    metaJson: null,
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 'fallback-griha',
    serviceSlug: SLUG,
    title: 'Griha Shanti',
    description: 'Peace and wellbeing pooja for the household.',
    badge: '2 helpers',
    priceLabel: '₹2,999',
    image: null,
    metaJson: null,
    sortOrder: 5,
    isActive: true,
  },
  {
    id: 'fallback-vastu',
    serviceSlug: SLUG,
    title: 'Vastu Shanti',
    description: 'Harmonize your home with Vastu rituals.',
    badge: '1–2 helpers',
    priceLabel: '₹4,999',
    image: null,
    metaJson: null,
    sortOrder: 6,
    isActive: true,
  },
  {
    id: 'fallback-other',
    serviceSlug: SLUG,
    title: 'Other Pooja (Custom)',
    description: 'Tell us the pooja you need — we will arrange it.',
    badge: 'Custom',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 7,
    isActive: true,
  },
];

const SERVICE_LOOKS: { match: RegExp; icon: IconName; color: string; soft: string }[] = [
  { match: /ganesh/i, icon: 'sparkles', color: familyHome.purple, soft: familyHome.purpleSoft },
  { match: /diwali/i, icon: 'lamp', color: familyHome.green, soft: familyHome.greenSoft },
  { match: /lakshmi/i, icon: 'flower', color: familyHome.orange, soft: familyHome.orangeSoft },
  { match: /navratri/i, icon: 'flame', color: familyHome.blue, soft: familyHome.blueSoft },
  { match: /satyanarayan/i, icon: 'flame', color: familyHome.red, soft: familyHome.redSoft },
  { match: /griha/i, icon: 'home-outline', color: familyHome.purple, soft: familyHome.purpleSoft },
  { match: /vastu/i, icon: 'landmark', color: familyHome.orange, soft: familyHome.orangeSoft },
  { match: /other|custom/i, icon: 'ellipsis-horizontal', color: familyHome.muted, soft: '#F3F4F6' },
];

function lookForService(title: string) {
  for (const row of SERVICE_LOOKS) {
    if (row.match.test(title)) return row;
  }
  return {
    icon: 'sparkles' as IconName,
    color: familyHome.purple,
    soft: familyHome.purpleSoft,
  };
}

export function PoojaHelperScreen() {
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
          {variant === 'loading' ? <LoadingState message="Loading House Pooja Assistance..." /> : null}
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
        fallbackIcon="sparkles"
        fallbackColor={familyHome.orange}
        size={48}
      />
      <View style={styles.flex}>
        <Text style={styles.title}>Home Pooja Assistance</Text>
        <Text style={styles.lead}>{LEAD}</Text>
      </View>
    </View>
  );
}

function GateHero({ tone }: { tone: 'outside' | 'membership' }) {
  const headline = tone === 'outside' ? 'Spiritual' : 'Divine Moments';
  const accent = tone === 'outside' ? 'Support at Home' : 'at Home';
  const body =
    tone === 'outside'
      ? 'We help you perform poojas and religious rituals at home with ease and devotion.'
      : 'Experience peace of mind with guided spiritual support at home.';

  return (
    <View style={styles.heroFull} accessibilityLabel="House pooja assistance">
      <Image source={heroImage} style={styles.heroFullImage} resizeMode="cover" />
      <View style={styles.heroScrim} />
      <View style={styles.heroFullContent}>
        <View style={styles.heroFullCopy}>
          <Text style={styles.heroFullHeadline}>
            {headline}
            {'\n'}
            <Text style={styles.heroFullAccent}>{accent}</Text>
          </Text>
          <Text style={styles.heroFullBody}>{body}</Text>
        </View>
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
            <Icon name={item.icon} size={16} color={familyHome.green} />
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
      'Notify me when House Pooja Assistance is available in my area.',
      'We will notify you',
    );
  };

  return (
    <View style={styles.stack}>
      <TitleBlock />
      <GateHero tone="outside" />
      <FeaturesGrid />
      <View style={styles.soonBanner}>
        <View style={styles.soonIcon}>
          <Icon name="location" size={18} color={familyHome.red} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.soonTitle}>Service coming soon to your area</Text>
          <Text style={styles.soonBody}>
            {MEMBERSHIP_SERVICE_AREA_LINE} House Pooja Assistance will become available in your area as we
            expand our services.
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
      <GateHero tone="membership" />
      <FeaturesGrid />
      <View style={styles.membershipCard}>
        <View style={styles.membershipHead}>
          <View style={styles.lockWell}>
            <Icon name="lock-closed-outline" size={16} color="#B45309" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.membershipTitle}>Membership Required</Text>
            <Text style={styles.membershipBody}>
              House Pooja Assistance is available only for AgeWell members.
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
              Get access to House Pooja Assistance and many other services for a safer, healthier and happier
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
  const catalog = useServiceOfferings(SLUG);
  const requestsQuery = useServiceRequests();
  const { submitting, submit } = useMembershipSubmit(SLUG);
  const [selectedId, setSelectedId] = useState('');

  const offerings = useMemo(() => {
    const fromApi = catalog.data ?? [];
    const byTitle = new Map<string, ServiceOffering>();
    for (const item of fromApi) {
      const key = item.title.trim().toLowerCase();
      if (!byTitle.has(key)) byTitle.set(key, item);
    }
    return FALLBACK_OFFERINGS.map((fallback) => byTitle.get(fallback.title.toLowerCase()) ?? fallback);
  }, [catalog.data]);

  const selected =
    offerings.find((item) => item.id === selectedId) ?? offerings[0] ?? null;
  const selectedLook = lookForService(selected?.title ?? 'Ganesh');

  const recent = useMemo(() => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    return toLiveRequestViews(mine, { fallbackTitle: 'Pooja booking', limit: 3 });
  }, [requestsQuery.data?.items]);

  const allCount = useMemo(
    () => filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG).length,
    [requestsQuery.data?.items],
  );

  const onSelect = (item: ServiceOffering) => {
    setSelectedId(item.id);
  };

  const onRequestCallback = () => {
    if (!selected) {
      Alert.alert('Select a pooja', 'Please choose a pooja service before requesting a call back.');
      return;
    }
    void submit(
      `Call back: ${selected.title}. ${selected.description || ''}`.trim(),
      'Call back requested',
    );
  };

  const onViewAllRequests = () => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    const lines = toLiveRequestViews(mine, { fallbackTitle: 'Pooja booking', limit: 20 })
      .map((item) => `• ${item.title} — ${item.statusLabel} (${item.dateLabel})`)
      .join('\n');
    Alert.alert('Recent Requests', lines || 'No requests yet.');
  };

  return (
    <ScrollView contentContainerStyle={styles.liveContent} showsVerticalScrollIndicator={false}>
      <View style={styles.liveTitleRow}>
        <MarketplaceServiceIcon
          serviceId={SLUG}
          fallbackIcon="sparkles"
          fallbackColor={familyHome.orange}
          size={40}
        />
        <Text style={styles.liveTitle}>Home Pooja Assistance</Text>
      </View>

      <Text style={styles.sectionTitle}>Select a Pooja Service</Text>

      {catalog.isPending && !catalog.data?.length ? (
        <Text style={styles.empty}>Loading pooja services…</Text>
      ) : null}
      {catalog.isError && !catalog.data?.length ? (
        <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
          <Text style={styles.viewAll}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}

      <View style={styles.offerGrid}>
        {offerings.map((item) => {
          const look = lookForService(item.title);
          const active = item.id === (selectedId || selected?.id);
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelect(item)}
              disabled={submitting}
              style={[
                styles.offerCard,
                active ? { borderColor: look.color, backgroundColor: look.soft } : null,
                submitting ? styles.disabled : null,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.title}
            >
              <Icon name={look.icon} size={18} color={look.color} />
              <Text style={styles.offerTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Icon name="chevron-forward" size={12} color={familyHome.muted} />
            </Pressable>
          );
        })}
      </View>

      {selected ? (
        <View style={styles.selectedPanel}>
          <Text style={styles.selectedLabel}>Selected Pooja Service</Text>
          <View style={styles.selectedCard}>
            <View style={[styles.selectedIcon, { backgroundColor: selectedLook.soft }]}>
              <Icon name={selectedLook.icon} size={16} color={selectedLook.color} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.selectedTitle}>{selected.title}</Text>
              {selected.description ? (
                <Text style={styles.selectedBody} numberOfLines={2}>
                  {selected.description}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => Alert.alert('Change service', 'Tap another pooja above to change your selection.')}
              accessibilityRole="button"
              accessibilityLabel="Change selected pooja"
            >
              <Text style={styles.changeLink}>Change &gt;</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={onRequestCallback}
            disabled={submitting}
            style={({ pressed }) => [
              styles.raiseCta,
              submitting ? styles.disabled : null,
              pressed ? styles.pressed : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Request a Call Back"
          >
            <Icon name="call-outline" size={16} color={familyHome.white} />
            <Text style={styles.raiseCtaText}>
              {submitting ? 'Sending…' : 'Request a Call Back'}
            </Text>
            <Icon name="chevron-forward" size={16} color={familyHome.white} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Requests</Text>
        {allCount > 0 ? (
          <Pressable onPress={onViewAllRequests} accessibilityRole="button">
            <Text style={styles.viewAll}>View All &gt;</Text>
          </Pressable>
        ) : null}
      </View>

      {requestsQuery.isPending ? <Text style={styles.empty}>Loading requests…</Text> : null}
      {!requestsQuery.isPending && recent.length === 0 ? (
        <Text style={styles.empty}>No requests yet. Select a pooja and request a call back.</Text>
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

      <View style={styles.infoRowPair}>
        <View style={[styles.infoCard, styles.infoCardPurple]}>
          <Text style={styles.infoTitle}>What's Included</Text>
          {WHAT_INCLUDED.map((line) => (
            <View key={line} style={styles.infoLine}>
              <Icon name="checkmark-circle-outline" size={12} color={familyHome.green} />
              <Text style={styles.infoText}>{line}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.infoCard, styles.infoCardBlue]}>
          <Text style={styles.infoTitle}>Please Note</Text>
          {PLEASE_NOTE.map((line) => (
            <View key={line} style={styles.infoLine}>
              <Icon name="help-circle-outline" size={12} color={familyHome.blue} />
              <Text style={styles.infoText}>{line}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Learn with Video</Text>
      <Pressable
        onPress={() => void Linking.openURL(VIDEO_URL)}
        accessibilityRole="button"
        accessibilityLabel="Watch on YouTube: Simple Steps to Plan a Home Pooja"
        style={({ pressed }) => [styles.videoCard, pressed ? styles.pressed : null]}
      >
        <View style={styles.videoThumb}>
          <Image source={heroImage} style={styles.videoThumbImage} resizeMode="cover" />
          <View style={styles.videoThumbPlay}>
            <Icon name="play" size={14} color={familyHome.white} />
          </View>
          <Text style={styles.videoThumbDuration}>6:25</Text>
        </View>
        <View style={styles.videoCopy}>
          <Text style={styles.videoTitle}>
            Simple Steps to Plan a Home Pooja for Peace & Positivity
          </Text>
          <View style={styles.watchRow}>
            <Icon name="play" size={11} color={familyHome.red} />
            <Text style={styles.watchLabel}>YouTube Video</Text>
          </View>
        </View>
        <Icon name="chevron-forward" size={14} color={familyHome.muted} />
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
  titleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.title, color: familyHome.text },
  liveTitle: { ...typography.title, color: familyHome.text, fontSize: 22 },
  lead: { ...typography.body, color: familyHome.muted, lineHeight: 22, marginTop: 4 },
  subtitle: { ...typography.body, color: familyHome.muted },
  heroFull: {
    height: 188,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: familyHome.border,
    position: 'relative',
  },
  heroFullImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  heroFullContent: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: spacing.lg,
    gap: spacing.md,
  },
  heroFullCopy: { flex: 1, gap: 6, paddingBottom: 2 },
  heroFullHeadline: {
    ...typography.subtitle,
    color: familyHome.text,
    lineHeight: 28,
    fontSize: 22,
  },
  heroFullAccent: { color: familyHome.greenDark },
  heroFullBody: {
    ...typography.caption,
    color: familyHome.text,
    lineHeight: 18,
    maxWidth: 260,
  },
  featuresCard: {
    flexDirection: 'row',
    backgroundColor: '#EAF6F4',
    borderRadius: 18,
    paddingVertical: spacing.md,
    paddingHorizontal: 2,
  },
  featureCol: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: 2 },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    ...typography.captionStrong,
    color: familyHome.text,
    textAlign: 'center',
    fontSize: 9,
    lineHeight: 12,
  },
  featureBody: {
    ...typography.caption,
    color: familyHome.muted,
    textAlign: 'center',
    fontSize: 8,
    lineHeight: 11,
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
    gap: 10,
    paddingTop: 4,
  },
  liveTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveTitle: { ...typography.title, color: familyHome.text, flex: 1, fontSize: 18, lineHeight: 22 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { ...typography.subtitle, color: familyHome.text, fontSize: 14, lineHeight: 18 },
  viewAll: { ...typography.captionStrong, color: familyHome.blue, fontSize: 11 },
  empty: { ...typography.caption, color: familyHome.muted, fontSize: 11 },
  offerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  offerCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 10,
    backgroundColor: familyHome.white,
    paddingVertical: 10,
    paddingHorizontal: 8,
    minHeight: 48,
  },
  offerTitle: {
    ...typography.captionStrong,
    color: familyHome.text,
    flex: 1,
    fontSize: 11,
    lineHeight: 14,
  },
  selectedPanel: {
    borderRadius: 12,
    backgroundColor: familyHome.greenSoft,
    padding: 10,
    gap: 8,
  },
  selectedLabel: {
    ...typography.captionStrong,
    color: familyHome.muted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    backgroundColor: familyHome.white,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  selectedIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTitle: { ...typography.bodyStrong, color: familyHome.text, fontSize: 13, lineHeight: 16 },
  selectedBody: { ...typography.caption, color: familyHome.muted, fontSize: 11, lineHeight: 14, marginTop: 1 },
  changeLink: { ...typography.captionStrong, color: familyHome.blue, fontSize: 12 },
  raiseCta: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: familyHome.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
  },
  raiseCtaText: { ...typography.bodyStrong, color: familyHome.white, flex: 1, fontSize: 14 },
  activityCard: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 12,
    backgroundColor: familyHome.white,
    overflow: 'hidden',
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  requestDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: familyHome.border,
  },
  requestIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestDate: { ...typography.caption, color: familyHome.muted, fontSize: 10, lineHeight: 12 },
  requestTitle: {
    ...typography.bodyStrong,
    color: familyHome.text,
    fontSize: 12,
    lineHeight: 15,
    marginTop: 1,
  },
  requestDetail: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 10,
    lineHeight: 13,
    marginTop: 1,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusPillText: { ...typography.captionStrong, fontSize: 9 },
  infoRowPair: { flexDirection: 'row', gap: 8 },
  infoCard: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 5,
  },
  infoCardPurple: { backgroundColor: familyHome.purpleSoft },
  infoCardBlue: { backgroundColor: familyHome.blueSoft },
  infoTitle: { ...typography.bodyStrong, color: familyHome.text, fontSize: 12, marginBottom: 2 },
  infoLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
  infoText: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 10,
    lineHeight: 13,
    flex: 1,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: familyHome.border,
    backgroundColor: '#F7F8FA',
    padding: 8,
  },
  videoThumb: {
    width: 72,
    height: 56,
    borderRadius: 8,
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
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    fontSize: 9,
  },
  videoCopy: { flex: 1, gap: 3 },
  videoTitle: { ...typography.bodyStrong, color: familyHome.text, fontSize: 12, lineHeight: 15 },
  watchRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  watchLabel: { ...typography.caption, color: familyHome.muted, fontSize: 10 },
});

