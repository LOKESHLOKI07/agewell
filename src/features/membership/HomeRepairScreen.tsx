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

const heroImage = SERVICE_HERO_IMAGES['home-repair'];

const SLUG = 'home-repair';
const VIDEO_URL =
  'https://www.youtube.com/results?search_query=Easy+Home+Maintenance+Tips+for+Seniors';
const SERVICE_CARD_GAP = 8;
const SERVICE_CARD_WIDTH = Math.floor(
  (Dimensions.get('window').width - spacing.xl * 2 - SERVICE_CARD_GAP * 2) / 3,
);
const LEAD =
  'Get assistance with plumbing, electrical, carpentry, AC service & more. Verified professionals handle the work, while our care manager or companion coordinates and supervises the service. Charges apply as per the work required.';

const INFO_BULLETS = [
  'All work will be coordinated by your care manager.',
  'Service charges apply, usually lower than market rates.',
  'Verified and trusted professionals will be assigned.',
];

const GATE_FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'water', title: 'Plumbing', body: 'Repairs & installations' },
  { icon: 'zap', title: 'Electrical', body: 'Fixes & installations' },
  { icon: 'hammer', title: 'Carpentry', body: 'Repairs & custom work' },
  { icon: 'snowflake', title: 'AC Service', body: 'Maintenance & repairs' },
  { icon: 'paint-roller', title: 'Painting', body: 'Interior & touch-ups' },
  { icon: 'ellipsis-horizontal', title: 'And More', body: 'Various home maintenance services' },
];

const FALLBACK_OFFERINGS: ServiceOffering[] = [
  {
    id: 'fallback-plumbing',
    serviceSlug: SLUG,
    title: 'Plumbing',
    description: 'e.g. leakage, taps, bathroom & kitchen plumbing',
    badge: 'Repair',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 0,
    isActive: true,
  },
  {
    id: 'fallback-electrical',
    serviceSlug: SLUG,
    title: 'Electrical',
    description: 'e.g. lights, fans, switches & wiring',
    badge: 'Repair',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'fallback-carpentry',
    serviceSlug: SLUG,
    title: 'Carpentry',
    description: 'e.g. furniture, doors, cabinets & fittings',
    badge: 'Repair',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'fallback-ac',
    serviceSlug: SLUG,
    title: 'AC Service',
    description: 'e.g. cleaning, servicing & cooling repairs',
    badge: 'Repair',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'fallback-painting',
    serviceSlug: SLUG,
    title: 'Painting',
    description: 'e.g. wall painting, touch-ups & finishing',
    badge: 'Repair',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 'fallback-other',
    serviceSlug: SLUG,
    title: 'Other Maintenance',
    description: 'e.g. civil work & other home maintenance',
    badge: 'Repair',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 5,
    isActive: true,
  },
];

const SERVICE_LOOKS: { match: RegExp; icon: IconName; color: string; soft: string }[] = [
  { match: /plumbing/i, icon: 'water', color: familyHome.blue, soft: familyHome.blueSoft },
  { match: /electrical/i, icon: 'zap', color: familyHome.orange, soft: familyHome.orangeSoft },
  { match: /carpentry/i, icon: 'hammer', color: '#B5651D', soft: '#F8EDE3' },
  { match: /\bac\b|air.?cond/i, icon: 'snowflake', color: familyHome.green, soft: familyHome.greenSoft },
  { match: /paint/i, icon: 'paint-roller', color: familyHome.purple, soft: familyHome.purpleSoft },
  { match: /other/i, icon: 'ellipsis-horizontal', color: familyHome.muted, soft: '#F3F4F6' },
];

function lookForService(title: string) {
  for (const row of SERVICE_LOOKS) {
    if (row.match.test(title)) return row;
  }
  return {
    icon: 'home-outline' as IconName,
    color: familyHome.blue,
    soft: familyHome.blueSoft,
  };
}

export function HomeRepairScreen() {
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
          {variant === 'loading' ? <LoadingState message="Loading House Maintenance..." /> : null}
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
        fallbackIcon="home-outline"
        fallbackColor={familyHome.blue}
        size={48}
      />
      <View style={styles.flex}>
        <Text style={styles.title}>House Maintenance</Text>
        <Text style={styles.lead}>{LEAD}</Text>
      </View>
    </View>
  );
}

function GateHero({ tone }: { tone: 'outside' | 'membership' }) {
  const headline = tone === 'outside' ? 'Your Home,' : 'A Safe Home for a';
  const accent = tone === 'outside' ? 'Our Support' : 'Happier You';
  const body =
    tone === 'outside'
      ? 'Reliable home maintenance services for a safer and more comfortable living environment.'
      : 'Reliable home maintenance support so you can live comfortably, always.';

  return (
    <View style={styles.heroFull} accessibilityLabel="House maintenance">
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
      'Notify me when House Maintenance is available in my area.',
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
            {MEMBERSHIP_SERVICE_AREA_LINE} House Maintenance will become available in your area as we expand
            our services.
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
              House Maintenance is available only for AgeWell members.
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
              Get access to House Maintenance and many other services for a safer, healthier and happier
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
    const looksLikeDesign = fromApi.some((item) => /painting|other maintenance/i.test(item.title));
    if (looksLikeDesign) {
      return FALLBACK_OFFERINGS.map((fallback) => byTitle.get(fallback.title.toLowerCase()) ?? fallback);
    }
    // Prefer fallback so Painting + Other Maintenance always show as designed
    return FALLBACK_OFFERINGS;
  }, [catalog.data]);

  const selected = offerings.find((item) => item.id === selectedId) ?? null;

  const recent = useMemo(() => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    return toLiveRequestViews(mine, { fallbackTitle: 'Maintenance request', limit: 3 });
  }, [requestsQuery.data?.items]);

  const allCount = useMemo(
    () => filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG).length,
    [requestsQuery.data?.items],
  );

  const onViewAllRequests = () => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    const lines = toLiveRequestViews(mine, { fallbackTitle: 'Maintenance request', limit: 20 })
      .map((item) => `• ${item.title} — ${item.statusLabel} (${item.dateLabel})`)
      .join('\n');
    Alert.alert('Activity Log', lines || 'No activity yet.');
  };

  const onSelectCategory = (item: ServiceOffering) => {
    setSelectedId(item.id);
  };

  const onRaiseRequest = () => {
    if (!selected) {
      Alert.alert('Select a category', 'Please choose a service category before raising a request.');
      return;
    }
    void submit(
      `Repair: ${selected.title}. ${selected.description || ''}`.trim(),
      `${selected.title} request sent`,
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.liveContent} showsVerticalScrollIndicator={false}>
      <View style={styles.liveTitleRow}>
        <MarketplaceServiceIcon
          serviceId={SLUG}
          fallbackIcon="home-outline"
          fallbackColor={familyHome.blue}
          size={40}
        />
        <Text style={styles.liveTitle}>House Maintenance</Text>
      </View>

      <Text style={styles.sectionTitle}>Select a Service Category</Text>

      {catalog.isPending && !catalog.data?.length ? (
        <Text style={styles.empty}>Loading categories…</Text>
      ) : null}
      {catalog.isError && !catalog.data?.length ? (
        <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
          <Text style={styles.viewAll}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}

      <View style={styles.categoryGrid}>
        {offerings.map((item) => {
          const look = lookForService(item.title);
          const selectedCard = item.id === selectedId;
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelectCategory(item)}
              disabled={submitting}
              style={[
                styles.categoryCard,
                { backgroundColor: look.soft, width: SERVICE_CARD_WIDTH },
                selectedCard ? styles.categoryCardSelected : null,
                selectedCard ? { borderColor: look.color } : null,
                submitting ? styles.disabled : null,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedCard }}
              accessibilityLabel={item.title}
            >
              <View style={styles.categoryIcon}>
                <Icon name={look.icon} size={20} color={look.color} />
              </View>
              <Text style={[styles.categoryTitle, { color: look.color }]} numberOfLines={2}>
                {item.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

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
        <Icon name="call-outline" size={16} color={familyHome.white} />
        <Text style={styles.raiseCtaText}>{submitting ? 'Sending…' : 'Raise a Request'}</Text>
        <Icon name="chevron-forward" size={16} color={familyHome.white} />
      </Pressable>

      <View style={styles.infoBox}>
        <View style={styles.infoIcon}>
          <Icon name="help-circle-outline" size={14} color={familyHome.blue} />
        </View>
        <View style={styles.flex}>
          {INFO_BULLETS.map((line) => (
            <Text key={line} style={styles.infoBullet}>
              • {line}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Activity Log</Text>
        {allCount > 0 ? (
          <Pressable onPress={onViewAllRequests} accessibilityRole="button">
            <Text style={styles.viewAll}>View All &gt;</Text>
          </Pressable>
        ) : null}
      </View>

      {requestsQuery.isPending ? <Text style={styles.empty}>Loading activity…</Text> : null}
      {!requestsQuery.isPending && recent.length === 0 ? (
        <Text style={styles.empty}>No activity yet. Select a category and raise a request.</Text>
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

      <Text style={styles.sectionTitle}>Learn with Video</Text>
      <Pressable
        onPress={() => void Linking.openURL(VIDEO_URL)}
        accessibilityRole="button"
        accessibilityLabel="Watch on YouTube: Easy Home Maintenance Tips"
        style={({ pressed }) => [styles.videoCard, pressed ? styles.pressed : null]}
      >
        <View style={styles.videoThumb}>
          <Image source={heroImage} style={styles.videoThumbImage} resizeMode="cover" />
          <View style={styles.videoThumbPlay}>
            <Icon name="play" size={14} color={familyHome.white} />
          </View>
          <Text style={styles.videoThumbDuration}>5:28</Text>
        </View>
        <View style={styles.videoCopy}>
          <Text style={styles.videoTitle}>
            Easy Home Maintenance Tips for a Safer & Comfortable Home
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SERVICE_CARD_GAP,
  },
  categoryCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 6,
    gap: 6,
    minHeight: 88,
  },
  categoryCardSelected: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    ...typography.captionStrong,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C9D9F5',
    backgroundColor: familyHome.blueSoft,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  infoIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  infoBullet: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 2,
  },
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

