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

const heroImage = SERVICE_HERO_IMAGES.ca;

const SLUG = 'ca';
const VIDEO_URL =
  'https://www.youtube.com/results?search_query=How+to+File+Income+Tax+Easily+for+Seniors';
const LEAD =
  'Exclusive access to our CA for financial assistance consultations like ITR filing and others (Costs Extra).';
const CALLBACK_NOTE =
  'On-call guidance is free of cost. If you wish to avail any specific CA service work, it will be charged separately.';

const GATE_FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'document-text-outline', title: 'ITR Filing Support', body: 'Guidance for hassle-free ITR filing' },
  { icon: 'calculator', title: 'Financial Guidance', body: 'Advice on investments, savings and tax planning' },
  { icon: 'people-outline', title: 'Support for Other CA Services', body: 'Assistance for various financial matters' },
  { icon: 'shield-checkmark-outline', title: 'Trusted & Reliable', body: 'Get guidance from qualified and experienced CA' },
];

const FALLBACK_OFFERINGS: ServiceOffering[] = [
  {
    id: 'fallback-consultation',
    serviceSlug: SLUG,
    title: 'CA Consultation',
    description: 'Need guidance on tax planning.',
    badge: 'Finance',
    priceLabel: 'Support call',
    image: null,
    metaJson: null,
    sortOrder: 0,
    isActive: true,
  },
  {
    id: 'fallback-itr',
    serviceSlug: SLUG,
    title: 'ITR Filing Support',
    description: 'Help with ITR filing for FY 2025-26.',
    badge: 'Finance',
    priceLabel: 'Support call',
    image: null,
    metaJson: null,
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'fallback-financial',
    serviceSlug: SLUG,
    title: 'Financial Guidance',
    description: 'Advice on investments, savings and planning.',
    badge: 'Finance',
    priceLabel: 'Support call',
    image: null,
    metaJson: null,
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'fallback-income-tax',
    serviceSlug: SLUG,
    title: 'Income Tax Queries',
    description: 'General income tax questions and clarifications.',
    badge: 'Finance',
    priceLabel: 'Support call',
    image: null,
    metaJson: null,
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'fallback-tax-planning',
    serviceSlug: SLUG,
    title: 'Tax Planning',
    description: 'Plan taxes efficiently for the year ahead.',
    badge: 'Finance',
    priceLabel: 'Support call',
    image: null,
    metaJson: null,
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 'fallback-gst',
    serviceSlug: SLUG,
    title: 'GST / Other Tax Help',
    description: 'Clarification on GST filing.',
    badge: 'Finance',
    priceLabel: 'Support call',
    image: null,
    metaJson: null,
    sortOrder: 5,
    isActive: true,
  },
  {
    id: 'fallback-investment',
    serviceSlug: SLUG,
    title: 'Investment Tax Guidance',
    description: 'Tax implications of investments and returns.',
    badge: 'Finance',
    priceLabel: 'Support call',
    image: null,
    metaJson: null,
    sortOrder: 6,
    isActive: true,
  },
  {
    id: 'fallback-other',
    serviceSlug: SLUG,
    title: 'Other CA Assistance',
    description: 'Any other CA related assistance.',
    badge: 'Finance',
    priceLabel: 'Support call',
    image: null,
    metaJson: null,
    sortOrder: 7,
    isActive: true,
  },
];

const SERVICE_LOOKS: { match: RegExp; icon: IconName; color: string; soft: string }[] = [
  { match: /consultation/i, icon: 'card-outline', color: familyHome.green, soft: familyHome.greenSoft },
  { match: /itr|filing/i, icon: 'document-text-outline', color: familyHome.blue, soft: familyHome.blueSoft },
  { match: /financial\s*guidance/i, icon: 'chart-column', color: familyHome.orange, soft: familyHome.orangeSoft },
  { match: /income\s*tax/i, icon: 'document-outline', color: familyHome.red, soft: familyHome.redSoft },
  { match: /tax\s*planning/i, icon: 'time-outline', color: familyHome.purple, soft: familyHome.purpleSoft },
  { match: /gst/i, icon: 'settings-outline', color: familyHome.green, soft: familyHome.greenSoft },
  { match: /investment/i, icon: 'chart-line', color: familyHome.blue, soft: familyHome.blueSoft },
  { match: /other/i, icon: 'ellipsis-horizontal', color: familyHome.orange, soft: familyHome.orangeSoft },
];

function lookForService(title: string) {
  for (const row of SERVICE_LOOKS) {
    if (row.match.test(title)) return row;
  }
  return {
    icon: 'card-outline' as IconName,
    color: familyHome.green,
    soft: familyHome.greenSoft,
  };
}

export function CaAssistanceScreen() {
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
          {variant === 'loading' ? <LoadingState message="Loading CA Assistance..." /> : null}
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
        fallbackIcon="card-outline"
        fallbackColor={familyHome.orange}
        size={48}
      />
      <View style={styles.flex}>
        <Text style={styles.title}>CA Assistance</Text>
        <Text style={styles.lead}>{LEAD}</Text>
      </View>
    </View>
  );
}

function HeroBanner({
  tone,
  body,
}: {
  tone: 'outside' | 'membership';
  body: string;
}) {
  return (
    <View style={[styles.heroCard, tone === 'outside' ? styles.heroOutside : styles.heroMembership]}>
      <View style={styles.heroCopy}>
        <View style={styles.heroAccentBar} />
        <Text style={styles.heroHeadline}>
          Expert Financial Guidance{'\n'}
          <Text style={styles.heroAccent}>for a Secure Tomorrow</Text>
        </Text>
        <Text style={styles.heroBody}>{body}</Text>
      </View>
      <View style={styles.heroMedia}>
        <Image
          source={heroImage}
          style={styles.heroImage}
          resizeMode="cover"
          accessibilityLabel="CA assistance"
        />
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
    void submit('Notify me when CA Assistance is available in my area.', 'We will notify you');
  };

  return (
    <View style={styles.stack}>
      <TitleBlock />
      <HeroBanner
        tone="outside"
        body="Get professional guidance from our CA for your tax and financial needs."
      />
      <FeaturesGrid />
      <View style={styles.soonBanner}>
        <View style={styles.soonIcon}>
          <Icon name="location" size={18} color={familyHome.red} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.soonTitle}>Service coming soon to your area</Text>
          <Text style={styles.soonBody}>
            {MEMBERSHIP_SERVICE_AREA_LINE} CA Assistance will become available in your area as we expand our
            services.
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
        body="Get professional guidance from our CA for your tax and financial needs."
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
              CA Assistance is available only for AgeWell members.
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
              Get access to CA Assistance and many other services for a safer, healthier and happier life.
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

  const selected = offerings.find((item) => item.id === selectedId) ?? null;

  const recent = useMemo(() => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    return toLiveRequestViews(mine, { fallbackTitle: 'CA assistance', limit: 3 });
  }, [requestsQuery.data?.items]);

  const allCount = useMemo(
    () => filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG).length,
    [requestsQuery.data?.items],
  );

  const onViewAllRequests = () => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    const lines = toLiveRequestViews(mine, { fallbackTitle: 'CA assistance', limit: 20 })
      .map((item) => `• ${item.title} — ${item.statusLabel} (${item.dateLabel})`)
      .join('\n');
    Alert.alert('Recent Requests', lines || 'No requests yet.');
  };

  const onSelectCategory = (item: ServiceOffering) => {
    setSelectedId(item.id);
  };

  const onRequestCallback = () => {
    if (!selected) {
      Alert.alert('Select a service', 'Please choose a service category before requesting a call back.');
      return;
    }
    void submit(
      `Call back: ${selected.title}. ${selected.description || ''}`.trim(),
      'Call back requested',
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.liveContent} showsVerticalScrollIndicator={false}>
      <View style={styles.liveTitleRow}>
        <MarketplaceServiceIcon
          serviceId={SLUG}
          fallbackIcon="card-outline"
          fallbackColor={familyHome.orange}
          size={48}
        />
        <Text style={styles.liveTitle}>CA Assistance</Text>
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
                { backgroundColor: look.soft },
                selectedCard ? styles.categoryCardSelected : null,
                selectedCard ? { borderColor: look.color } : null,
                submitting ? styles.disabled : null,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedCard }}
              accessibilityLabel={item.title}
            >
              <View style={styles.categoryIcon}>
                <Icon name={look.icon} size={14} color={look.color} />
              </View>
              <Text style={[styles.categoryTitle, { color: look.color }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Icon name="chevron-forward" size={12} color={familyHome.muted} />
            </Pressable>
          );
        })}
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
        <Icon name="call-outline" size={18} color={familyHome.white} />
        <Text style={styles.raiseCtaText}>
          {submitting ? 'Sending…' : 'Request a Call Back'}
        </Text>
        <Icon name="chevron-forward" size={18} color={familyHome.white} />
      </Pressable>

      <View style={styles.noteBox}>
        <View style={styles.noteIcon}>
          <Icon name="help-circle-outline" size={14} color={familyHome.blue} />
        </View>
        <Text style={styles.noteText}>{CALLBACK_NOTE}</Text>
      </View>

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
        <Text style={styles.empty}>No requests yet. Select a category and request a call back.</Text>
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
        accessibilityLabel="Watch on YouTube: How to File Income Tax Easily for Seniors"
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
            How to File Income Tax Easily for Seniors | Step by Step Guide
          </Text>
          <View style={styles.watchRow}>
            <Icon name="play" size={12} color={familyHome.red} />
            <Text style={styles.watchLabel}>YouTube Video</Text>
          </View>
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
  heroCard: {
    borderRadius: 16,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroOutside: { backgroundColor: '#EAF3FB' },
  heroMembership: { backgroundColor: '#EAF3FB' },
  heroCopy: { flex: 1.1, gap: spacing.sm },
  heroAccentBar: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: familyHome.green,
  },
  heroHeadline: { ...typography.subtitle, color: familyHome.text, lineHeight: 26 },
  heroAccent: { color: familyHome.greenDark },
  heroBody: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  heroMedia: { flex: 1, position: 'relative' },
  heroImage: {
    width: '100%',
    height: 188,
    borderRadius: 14,
    backgroundColor: familyHome.border,
  },
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
    backgroundColor: familyHome.greenSoft,
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
  liveTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  liveTitle: { ...typography.title, color: familyHome.text, flex: 1, fontSize: 22 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { ...typography.subtitle, color: familyHome.text, fontSize: 17 },
  viewAll: { ...typography.captionStrong, color: familyHome.blue },
  empty: { ...typography.caption, color: familyHome.muted },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    minHeight: 48,
  },
  categoryCardSelected: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  categoryIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    ...typography.captionStrong,
    flex: 1,
    fontSize: 11,
    lineHeight: 14,
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
  raiseCtaText: { ...typography.bodyStrong, color: familyHome.white, flex: 1, fontSize: 15 },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C9D9F5',
    backgroundColor: familyHome.blueSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noteIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  noteText: {
    ...typography.caption,
    color: familyHome.blue,
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
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
    borderRadius: 10,
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
  videoCard: {
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
  videoCopy: { flex: 1, gap: 4 },
  videoTitle: { ...typography.bodyStrong, color: familyHome.text, fontSize: 13, lineHeight: 17 },
  watchRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  watchLabel: { ...typography.caption, color: familyHome.muted, fontSize: 11 },
});

