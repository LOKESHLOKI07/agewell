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
import { useServiceRequests, useServices } from '@/features/home/hooks/queries';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { ServiceHelpBanner } from '@/features/membership/ServiceHelpBanner';
import { MarketplaceServiceIcon } from '@/features/services/components/MarketplaceServiceIcon';
import { useTabScreenBottomPad } from '@/utils/safeBottom';
import { toDisplayDate } from '@/utils/date';
import type { ServiceOffering } from './catalogTypes';
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

const heroImage = SERVICE_HERO_IMAGES['banking-companion'];

const SLUG = 'banking-companion';
const VIDEO_URL =
  'https://www.youtube.com/results?search_query=Banking+Made+Easy+for+Seniors+AgeWell';
const LEAD =
  'Book a companion for bank visits like pension withdrawal, cheque deposit, passbook update & other banking work. Paid on a per-visit basis. Prior appointments required.';
const DEFAULT_ABOUT =
  'Our Banking Companion helps you with day-to-day banking needs such as pension withdrawal, KYC updates, passbook updates, cheque book requests and other branch visits with trusted companion support.';
const HERO_BODY = 'A trusted companion to make your banking errands easier and hassle-free.';

const GATE_FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'card-outline', title: 'Pension Withdrawal', body: 'Assistance for pension collection' },
  { icon: 'document-text-outline', title: 'Cheque Deposit', body: 'Help with deposit and clearance' },
  { icon: 'clipboard-outline', title: 'Passbook Update', body: 'Assistance for passbook printing and update' },
  { icon: 'landmark', title: 'Other Banking Work', body: 'Support for various banking errands' },
];

const FALLBACK_OFFERINGS: ServiceOffering[] = [
  {
    id: 'fallback-pension',
    serviceSlug: SLUG,
    title: 'Pension Withdrawal',
    description: 'Assistance with pension withdrawal process.',
    badge: 'Banking',
    priceLabel: 'Per visit',
    image: null,
    metaJson: null,
    sortOrder: 0,
    isActive: true,
  },
  {
    id: 'fallback-account',
    serviceSlug: SLUG,
    title: 'Account Related Help',
    description: 'Support for account services and issues.',
    badge: 'Banking',
    priceLabel: 'Per visit',
    image: null,
    metaJson: null,
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'fallback-kyc',
    serviceSlug: SLUG,
    title: 'KYC Update',
    description: 'Help with KYC document update and verification.',
    badge: 'Banking',
    priceLabel: 'Per visit',
    image: null,
    metaJson: null,
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'fallback-passbook',
    serviceSlug: SLUG,
    title: 'Passbook Update',
    description: 'Assistance with passbook printing and updates.',
    badge: 'Banking',
    priceLabel: 'Per visit',
    image: null,
    metaJson: null,
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'fallback-cheque',
    serviceSlug: SLUG,
    title: 'Cheque Book Request',
    description: 'Request a new cheque book or related support.',
    badge: 'Banking',
    priceLabel: 'Per visit',
    image: null,
    metaJson: null,
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 'fallback-neft',
    serviceSlug: SLUG,
    title: 'NEFT / RTGS Assistance',
    description: 'Help with fund transfer and transaction issues.',
    badge: 'Banking',
    priceLabel: 'Per visit',
    image: null,
    metaJson: null,
    sortOrder: 5,
    isActive: true,
  },
  {
    id: 'fallback-fd',
    serviceSlug: SLUG,
    title: 'Fixed Deposit (FD) Support',
    description: 'Assistance with FD opening, renewal, etc.',
    badge: 'Banking',
    priceLabel: 'Per visit',
    image: null,
    metaJson: null,
    sortOrder: 6,
    isActive: true,
  },
  {
    id: 'fallback-other',
    serviceSlug: SLUG,
    title: 'Other Banking Service',
    description: 'Any other banking related assistance.',
    badge: 'Banking',
    priceLabel: 'Per visit',
    image: null,
    metaJson: null,
    sortOrder: 7,
    isActive: true,
  },
];

const SERVICE_LOOKS: { match: RegExp; icon: IconName; color: string; soft: string }[] = [
  { match: /pension/i, icon: 'person-outline', color: familyHome.green, soft: familyHome.greenSoft },
  { match: /account/i, icon: 'card-outline', color: familyHome.blue, soft: familyHome.blueSoft },
  { match: /kyc/i, icon: 'document-text-outline', color: familyHome.red, soft: familyHome.redSoft },
  { match: /passbook/i, icon: 'clipboard-outline', color: familyHome.orange, soft: familyHome.orangeSoft },
  { match: /cheque/i, icon: 'document-outline', color: familyHome.purple, soft: familyHome.purpleSoft },
  { match: /neft|rtgs|transfer/i, icon: 'arrow-forward', color: familyHome.green, soft: familyHome.greenSoft },
  { match: /fixed\s*deposit|\bfd\b/i, icon: 'ribbon-outline', color: familyHome.blue, soft: familyHome.blueSoft },
  { match: /other/i, icon: 'ellipsis-horizontal', color: familyHome.purple, soft: familyHome.purpleSoft },
];

function lookForService(title: string) {
  for (const row of SERVICE_LOOKS) {
    if (row.match.test(title)) return row;
  }
  return {
    icon: 'landmark' as IconName,
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

export function BankingCompanionScreen() {
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
          {variant === 'loading' ? <LoadingState message="Loading Banking Companion..." /> : null}
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
        fallbackIcon="landmark"
        fallbackColor={familyHome.blue}
        size={48}
      />
      <View style={styles.flex}>
        <Text style={styles.title}>Banking Companion</Text>
        <Text style={styles.lead}>{LEAD}</Text>
      </View>
    </View>
  );
}

function GateHero() {
  return (
    <View style={styles.heroFull} accessibilityLabel="Banking companion">
      <Image source={heroImage} style={styles.heroFullImage} resizeMode="cover" />
      <View style={styles.heroScrim} />
      <View style={styles.heroFullContent}>
        <View style={styles.heroFullCopy}>
          <Text style={styles.heroFullHeadline}>
            Your Banking Needs,{'\n'}
            <Text style={styles.heroFullAccent}>Our Support</Text>
          </Text>
          <Text style={styles.heroFullBody}>{HERO_BODY}</Text>
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
      'Notify me when Banking Companion is available in my area.',
      'We will notify you',
    );
  };

  return (
    <View style={styles.stack}>
      <TitleBlock />
      <GateHero />
      <FeaturesGrid />
      <View style={styles.soonBanner}>
        <View style={styles.soonIcon}>
          <Icon name="location" size={18} color={familyHome.red} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.soonTitle}>Service coming soon to your area</Text>
          <Text style={styles.soonBody}>
            {MEMBERSHIP_SERVICE_AREA_LINE} Banking Companion will become available in your area as we expand
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
      <GateHero />
      <FeaturesGrid />
      <View style={styles.membershipCard}>
        <View style={styles.membershipHead}>
          <View style={styles.lockWell}>
            <Icon name="lock-closed-outline" size={16} color="#B45309" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.membershipTitle}>Membership Required</Text>
            <Text style={styles.membershipBody}>
              Banking Companion is available only for AgeWell members.
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
              Get access to Banking Companion and many other services for a safer, healthier and happier life.
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
  const membership = useHasActiveMembership();
  const { submitting, submit } = useMembershipSubmit(SLUG);
  const validTill = membershipValidLabel(membership.query.data?.endDate);
  const [selectedId, setSelectedId] = useState('');

  const offerings = useMemo(() => {
    const fromApi = catalog.data ?? [];
    const byTitle = new Map<string, ServiceOffering>();
    for (const item of fromApi) {
      const key = item.title.trim().toLowerCase();
      if (!byTitle.has(key)) {
        byTitle.set(key, item);
      }
    }
    const resolved = FALLBACK_OFFERINGS.map((fallback) => {
      const apiItem = byTitle.get(fallback.title.toLowerCase());
      return apiItem ?? fallback;
    });
    return resolved;
  }, [catalog.data]);

  const selected = offerings.find((item) => item.id === selectedId) ?? null;

  const service = useMemo(
    () => (services.data ?? []).find((item) => item.slug === SLUG) ?? null,
    [services.data],
  );

  const about = service?.description?.trim() || DEFAULT_ABOUT;

  const recent = useMemo(() => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    return toLiveRequestViews(mine, { fallbackTitle: 'Banking companion', limit: 3 });
  }, [requestsQuery.data?.items]);

  const allCount = useMemo(
    () => filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG).length,
    [requestsQuery.data?.items],
  );

  const onSelectService = (item: ServiceOffering) => {
    setSelectedId(item.id);
  };

  const onRaiseRequest = () => {
    if (!selected) {
      Alert.alert('Select a service', 'Please choose a banking service before raising a request.');
      return;
    }
    void submit(
      `${selected.title}. Banking companion assistance requested. ${selected.description || ''}`.trim(),
      `${selected.title} request sent`,
    );
  };

  const onViewAllRequests = () => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    const lines = toLiveRequestViews(mine, { fallbackTitle: 'Banking companion', limit: 20 })
      .map((item) => `• ${item.title} — ${item.statusLabel} (${item.dateLabel})`)
      .join('\n');
    Alert.alert('My Requests', lines || 'No requests yet.');
  };

  return (
    <ScrollView contentContainerStyle={styles.liveContent} showsVerticalScrollIndicator={false}>
      <View style={styles.liveTitleBlock}>
        <View style={styles.liveTitleRow}>
          <MarketplaceServiceIcon
            serviceId={SLUG}
            fallbackIcon="landmark"
            fallbackColor={familyHome.blue}
            size={48}
          />
          <Text style={styles.liveTitle}>Banking Companion</Text>
        </View>
        {validTill ? (
          <View style={styles.memberBadge}>
            <Icon name="checkmark-circle-outline" size={14} color={familyHome.green} />
            <Text style={styles.memberBadgeTitle}>{validTill}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.sectionHint}>Select the banking service you need assistance with</Text>

      {catalog.isPending && !catalog.data?.length ? (
        <Text style={styles.empty}>Loading services…</Text>
      ) : null}
      {catalog.isError && !catalog.data?.length ? (
        <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
          <Text style={styles.viewAll}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}

      <View style={styles.offerGrid}>
        {offerings.map((item) => {
          const look = lookForService(item.title);
          const selectedCard = item.id === selectedId;
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelectService(item)}
              disabled={submitting}
              style={[
                styles.offerCard,
                { backgroundColor: look.soft },
                selectedCard ? styles.offerCardSelected : null,
                selectedCard ? { borderColor: look.color } : null,
                submitting ? styles.disabled : null,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedCard }}
              accessibilityLabel={item.title}
            >
              <View style={styles.offerIcon}>
                <Icon name={look.icon} size={14} color={look.color} />
              </View>
              <View style={styles.offerCopy}>
                <Text style={[styles.offerTitle, { color: look.color }]} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.description ? (
                  <Text style={styles.offerBody} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <Icon name="chevron-forward" size={12} color={familyHome.muted} />
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
        accessibilityLabel="Raise a Support Request"
      >
        <View style={styles.raisePlus}>
          <Icon name="plus-circle" size={20} color={familyHome.green} />
        </View>
        <Text style={styles.raiseCtaText}>
          {submitting ? 'Sending…' : 'Raise a Support Request'}
        </Text>
        <Icon name="chevron-forward" size={18} color={familyHome.white} />
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Requests</Text>
        {allCount > 0 ? (
          <Pressable onPress={onViewAllRequests} accessibilityRole="button">
            <Text style={styles.viewAll}>View All &gt;</Text>
          </Pressable>
        ) : null}
      </View>

      {requestsQuery.isPending ? <Text style={styles.empty}>Loading requests…</Text> : null}
      {!requestsQuery.isPending && recent.length === 0 ? (
        <Text style={styles.empty}>No requests yet. Select a banking service above.</Text>
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

      <View style={styles.videoSection}>
        <Text style={styles.sectionTitle}>Learn with Video</Text>
        <Text style={styles.videoSectionHint}>
          Watch this helpful video to learn more about banking with AgeWell.
        </Text>
        <Pressable
          onPress={() => void Linking.openURL(VIDEO_URL)}
          accessibilityRole="button"
          accessibilityLabel="Watch on YouTube: Banking Made Easy for Seniors"
          style={({ pressed }) => [styles.videoCardCompact, pressed ? styles.pressed : null]}
        >
          <View style={styles.videoThumb}>
            <Image source={heroImage} style={styles.videoThumbImage} resizeMode="cover" />
            <View style={styles.videoThumbPlay}>
              <Icon name="play" size={14} color={familyHome.white} />
            </View>
            <Text style={styles.videoThumbDuration}>5:28</Text>
          </View>
          <View style={styles.videoCompactCopy}>
            <View style={styles.watchRow}>
              <Icon name="play" size={12} color={familyHome.red} />
              <Text style={styles.watchLabel}>Watch on YouTube</Text>
            </View>
            <Text style={styles.videoCompactTitle}>
              Banking Made Easy for Seniors | Essential Tips & Support
            </Text>
          </View>
          <Icon name="chevron-forward" size={16} color={familyHome.muted} />
        </Pressable>
      </View>
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
    maxWidth: 240,
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
  sectionHint: { ...typography.body, color: familyHome.text, fontSize: 14, lineHeight: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { ...typography.subtitle, color: familyHome.text, fontSize: 17 },
  viewAll: { ...typography.captionStrong, color: familyHome.blue },
  empty: { ...typography.caption, color: familyHome.muted },
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
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: 56,
  },
  offerCardSelected: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  offerIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerCopy: { flex: 1, minWidth: 0, gap: 1 },
  offerTitle: { ...typography.captionStrong, fontSize: 11, lineHeight: 14 },
  offerBody: { ...typography.caption, color: familyHome.muted, fontSize: 9, lineHeight: 12 },
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
  videoSection: { gap: 6 },
  videoSectionHint: { ...typography.caption, color: familyHome.muted, lineHeight: 16 },
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
  videoCompactTitle: { ...typography.bodyStrong, color: familyHome.text, fontSize: 13, lineHeight: 17 },
});

