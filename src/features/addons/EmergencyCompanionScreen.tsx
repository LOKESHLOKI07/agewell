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
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { useServiceRequests, useServices } from '@/features/home/hooks/queries';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { ServiceHelpBanner } from '@/features/membership/ServiceHelpBanner';
import {
  filterOfferingsByKind,
  parseOfferingMeta,
  type ServiceOffering,
} from '@/features/membership/catalogTypes';
import {
  filterRequestsBySlug,
  toLiveRequestViews,
} from '@/features/membership/liveServiceRequests';
import { MEMBERSHIP_SERVICE_AREA_LINE } from '@/features/membership/membershipServicePageVariant';
import { membershipPurchaseHref } from '@/features/membership/planCatalog';
import { SERVICE_BANNER_HEIGHT, SERVICE_HERO_IMAGES } from '@/features/membership/serviceHeroes';
import { useMembershipServicePageVariant } from '@/features/membership/useMembershipServicePageVariant';
import { useMembershipSubmit } from '@/features/membership/useMembershipSubmit';
import { useServiceOfferings } from '@/features/membership/useCatalog';
import { useTabScreenBottomPad } from '@/utils/safeBottom';

const SLUG = 'emergency-companion';
const heroImage = SERVICE_HERO_IMAGES.companion;
const VIDEO_URL =
  'https://www.youtube.com/results?search_query=How+Emergency+Companion+Helps+AgeWell';

const DEFAULT_LEAD =
  'Hospital companion provided during your hospitalization. Handles all hospital procedures. Stays at hospital for 8-10 hours. Updates family about health condition & Discharge. (Extra Cost based on availability)';

const SERVICE_DETAILS =
  'Emergency companion during your hospitalisation can be availed for 8 hours or 16 hours. Our companion will assist you at the hospital, handle procedures, stay with you, and keep your family updated about your health condition and discharge.';

const FALLBACK_OPTIONS: { title: string; line: string }[] = [
  { title: '8 Hours', line: 'Hospital companionship' },
  { title: '16 Hours', line: 'Extended support' },
];

const FEATURE_ICONS: { match: RegExp; icon: IconName }[] = [
  { match: /procedure|admission|paperwork/i, icon: 'clipboard-outline' },
  { match: /dedicated|companion|stay/i, icon: 'people-outline' },
  { match: /update|family|inform/i, icon: 'call-outline' },
  { match: /peace|mind|trusted/i, icon: 'shield-checkmark-outline' },
];

function iconForFeature(title: string, description: string): IconName {
  const hay = `${title} ${description}`;
  for (const row of FEATURE_ICONS) {
    if (row.match.test(hay)) return row.icon;
  }
  return 'heart-outline';
}

export function EmergencyCompanionScreen() {
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
          {variant === 'loading' ? <LoadingState message="Loading Emergency Companion..." /> : null}
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
  const options = useMemo(
    () => filterOfferingsByKind(catalog.data ?? [], 'option'),
    [catalog.data],
  );
  const lead = service?.description?.trim() || DEFAULT_LEAD;
  return { service, features, options, lead, catalog };
}

function TitleBlock({ lead }: { lead?: string }) {
  return (
    <View style={styles.titleRow}>
      <View style={styles.titleIcon}>
        <Icon name="ambulance" size={22} color={familyHome.greenDark} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.title}>EMERGENCY COMPANION</Text>
        {lead ? <Text style={styles.lead}>{lead}</Text> : null}
      </View>
    </View>
  );
}

function WatchVideoCard() {
  return (
    <Pressable
      onPress={() => void Linking.openURL(VIDEO_URL)}
      accessibilityRole="button"
      accessibilityLabel="Watch: How Emergency Companion Helps"
      style={({ pressed }) => [styles.videoCard, pressed ? styles.pressed : null]}
    >
      <View style={styles.videoThumb}>
        <Image source={heroImage} style={styles.videoThumbImage} resizeMode="cover" />
        <View style={styles.videoPlay}>
          <Icon name="play" size={18} color={familyHome.white} />
        </View>
        <Text style={styles.videoDuration}>2:28</Text>
      </View>
      <View style={styles.videoCopy}>
        <View style={styles.watchRow}>
          <Icon name="play" size={12} color={familyHome.red} />
          <Text style={styles.watchLabel}>Watch</Text>
        </View>
        <Text style={styles.videoTitle}>How Emergency Companion Helps</Text>
        <Text style={styles.videoSub}>A short video about support during hospitalisation.</Text>
      </View>
      <Icon name="chevron-forward" size={16} color={familyHome.muted} />
    </Pressable>
  );
}

function ServiceDetailsCard({
  options,
  loading,
}: {
  options: ServiceOffering[];
  loading?: boolean;
}) {
  const cards =
    options.length >= 2
      ? options.slice(0, 2).map((item) => ({
          title: item.title,
          line: item.description || 'Hospital companionship',
        }))
      : FALLBACK_OPTIONS;

  return (
    <View style={styles.detailsCard}>
      <View style={styles.detailsHead}>
        <Icon name="document-text-outline" size={18} color={familyHome.blue} />
        <Text style={styles.detailsTitle}>Service Details</Text>
      </View>
      <Text style={styles.detailsBody}>{SERVICE_DETAILS}</Text>
      {loading ? <Text style={styles.empty}>Loading options…</Text> : null}
      <View style={styles.optionGrid}>
        {cards.map((item) => (
          <View key={item.title} style={styles.optionCard}>
            <Icon name="time-outline" size={18} color={familyHome.blue} />
            <Text style={styles.optionTitle}>{item.title}</Text>
            <Text style={styles.optionLine}>{item.line}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function AddonNoteBanner() {
  return (
    <View style={styles.addonBanner} accessibilityRole="summary">
      <Icon name="card-outline" size={20} color={familyHome.orange} />
      <View style={styles.flex}>
        <Text style={styles.addonTitle}>Add-on Service</Text>
        <Text style={styles.addonBody}>
          This is an add-on service and pricing will be decided as per your need and availability.
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

function GateHero({
  headline,
  accent,
  body,
  tag,
}: {
  headline: string;
  accent?: string;
  body: string;
  tag: string;
}) {
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroCopy}>
        <Text style={styles.heroHeadline}>
          {headline}
          {accent ? (
            <>
              {'\n'}
              <Text style={styles.heroAccent}>{accent}</Text>
            </>
          ) : null}
        </Text>
        <Text style={styles.heroBody}>{body}</Text>
      </View>
      <View style={styles.heroMedia}>
        <Image source={heroImage} style={styles.heroImage} resizeMode="cover" />
        <View style={styles.heroTag}>
          <Text style={styles.heroTagText}>{tag}</Text>
        </View>
      </View>
    </View>
  );
}

function FeaturesGrid({ items, loading }: { items: ServiceOffering[]; loading?: boolean }) {
  return (
    <View style={styles.featuresCard}>
      {loading ? <Text style={styles.empty}>Loading features…</Text> : null}
      {items.map((item) => (
        <View key={item.id} style={styles.featureCol}>
          <View style={styles.featureIcon}>
            <Icon name={iconForFeature(item.title, item.description)} size={18} color={familyHome.green} />
          </View>
          <Text style={styles.featureTitle}>{item.title}</Text>
          <Text style={styles.featureBody}>{item.description}</Text>
        </View>
      ))}
      {!loading && items.length === 0 ? (
        <Text style={styles.empty}>Features will appear here once configured in the catalog.</Text>
      ) : null}
    </View>
  );
}

function OutsideAreaBody() {
  const { lead, features, catalog } = useAddonServiceCopy();
  const { submitting, submit } = useMembershipSubmit(SLUG);

  return (
    <View style={styles.stack}>
      <TitleBlock lead={lead} />
      <GateHero
        headline="Support When You"
        accent="Need It Most"
        body="Our emergency companions are there to support you during hospitalization, so you and your family can focus on what really matters."
        tag="Caring Beyond Hospital Walls"
      />
      <FeaturesGrid items={features} loading={catalog.isPending} />
      <View style={styles.soonBanner}>
        <View style={styles.soonIcon}>
          <Icon name="location" size={18} color={familyHome.red} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.soonTitle}>Service coming soon to your area</Text>
          <Text style={styles.soonBody}>
            {MEMBERSHIP_SERVICE_AREA_LINE} Emergency Companion will become available in your area as we
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
          onPress={() =>
            void submit(
              'Notify me when Emergency Companion is available in my area.',
              'We will notify you',
            )
          }
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

/** In serviceable area, membership not purchased — matches add-on gate mockup. */
function NoMembershipBody() {
  const { options, catalog } = useAddonServiceCopy();

  return (
    <View style={styles.stack}>
      <TitleBlock />
      <WatchVideoCard />
      <ServiceDetailsCard options={options} loading={catalog.isPending} />
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
  const { lead, options, catalog } = useAddonServiceCopy();
  const requestsQuery = useServiceRequests();
  const { submitting, submit } = useMembershipSubmit(SLUG);
  const [optionId, setOptionId] = useState('');

  const selected = options.find((item) => item.id === optionId) ?? options[0];

  const recent = useMemo(() => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    return toLiveRequestViews(mine, { fallbackTitle: 'Emergency companion', limit: 5 });
  }, [requestsQuery.data?.items]);

  const onBook = () => {
    if (!selected) {
      Alert.alert('No options', 'Booking options will appear once configured in the catalog.');
      return;
    }
    const price = selected.priceLabel || parseOfferingMeta(selected.metaJson).price || 'Based on availability';
    void submit(
      `${selected.title} · ${price}. ${selected.description || lead}`.trim(),
      'Booking request submitted',
    );
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.liveContent, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.liveTitleRow}>
        <View style={styles.liveTitleIcon}>
          <Icon name="ambulance" size={22} color={familyHome.white} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.liveTitle}>Emergency Companion</Text>
          <Text style={styles.subtitle}>Support when you need it most.</Text>
        </View>
      </View>

      <Text style={styles.lead}>{lead}</Text>

      <Text style={styles.sectionTitle}>Choose duration</Text>
      {catalog.isPending ? <Text style={styles.empty}>Loading options…</Text> : null}
      {catalog.isError ? (
        <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
          <Text style={styles.link}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}

      <View style={styles.optionList}>
        {options.map((item) => {
          const active = (optionId || options[0]?.id) === item.id;
          const price = item.priceLabel || 'Based on availability';
          return (
            <Pressable
              key={item.id}
              onPress={() => setOptionId(item.id)}
              style={[styles.optionRow, active ? styles.optionRowActive : null]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <View style={styles.flex}>
                <Text style={styles.optionLiveTitle}>{item.title}</Text>
                <Text style={styles.optionMeta}>{price}</Text>
              </View>
              {active ? (
                <Icon name="checkmark-circle-outline" size={20} color={familyHome.green} />
              ) : (
                <View style={styles.radio} />
              )}
            </Pressable>
          );
        })}
        {!catalog.isPending && options.length === 0 ? (
          <Text style={styles.empty}>No booking options configured yet.</Text>
        ) : null}
      </View>

      <Pressable
        onPress={onBook}
        disabled={submitting || !selected}
        style={[styles.bookBtn, submitting || !selected ? styles.disabled : null]}
        accessibilityRole="button"
        accessibilityLabel="Book Emergency Companion"
      >
        <Text style={styles.bookBtnText}>{submitting ? 'Sending…' : 'Book Now'}</Text>
      </Pressable>

      {recent.length > 0 ? (
        <View style={styles.requestBlock}>
          <Text style={styles.sectionTitle}>Recent requests</Text>
          {recent.map((item) => (
            <View key={item.id} style={styles.requestRow}>
              <Text style={styles.requestTitle}>{item.title}</Text>
              <Text style={styles.requestMeta}>
                {item.statusLabel} · {item.dateLabel}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
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
  titleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    lineHeight: 24,
    color: familyHome.blueDark,
    fontWeight: '700',
  },
  lead: { ...typography.caption, color: familyHome.blue, lineHeight: 18, marginTop: 4 },

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
    width: 112,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: familyHome.border,
  },
  videoThumbImage: { width: '100%', height: '100%' },
  videoPlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  videoDuration: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    ...typography.caption,
    fontSize: 10,
    lineHeight: 12,
    color: familyHome.white,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  videoCopy: { flex: 1, gap: 2, minWidth: 0 },
  watchRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  watchLabel: { ...typography.caption, color: familyHome.muted },
  videoTitle: { ...typography.bodyStrong, color: familyHome.text },
  videoSub: { ...typography.caption, color: familyHome.muted, lineHeight: 16 },

  detailsCard: {
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
  },
  detailsHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailsTitle: { ...typography.bodyStrong, color: familyHome.blueDark },
  detailsBody: { ...typography.body, color: familyHome.muted, lineHeight: 22 },
  optionGrid: { flexDirection: 'row', gap: spacing.sm },
  optionCard: {
    flex: 1,
    backgroundColor: familyHome.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: familyHome.border,
    padding: spacing.md,
    gap: 4,
    minHeight: 92,
  },
  optionTitle: { ...typography.bodyStrong, color: familyHome.text },
  optionLine: { ...typography.caption, color: familyHome.muted },

  addonBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: familyHome.orangeSoft,
    borderRadius: 14,
    padding: spacing.lg,
  },
  addonTitle: { ...typography.bodyStrong, color: familyHome.orange },
  addonBody: { ...typography.caption, color: familyHome.muted, lineHeight: 18, marginTop: 2 },

  inAreaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  inAreaText: { ...typography.bodyStrong, color: familyHome.greenDark },

  membershipRequired: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: familyHome.orangeSoft,
    borderRadius: 14,
    padding: spacing.lg,
  },
  membershipRequiredTitle: { ...typography.bodyStrong, color: '#B45309' },
  membershipRequiredBody: {
    ...typography.caption,
    color: familyHome.muted,
    lineHeight: 18,
    marginTop: 2,
  },

  heroCard: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: familyHome.greenSoft,
    minHeight: SERVICE_BANNER_HEIGHT,
  },
  heroCopy: { flex: 1, padding: spacing.lg, justifyContent: 'center', gap: spacing.sm },
  heroHeadline: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    lineHeight: 26,
    color: familyHome.blueDark,
    fontWeight: '700',
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
  featureCol: { width: '47%', gap: 4, padding: spacing.sm },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: { ...typography.captionStrong, color: familyHome.blueDark },
  featureBody: { ...typography.caption, color: familyHome.blue, lineHeight: 16 },
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
  soonTitle: { ...typography.bodyStrong, color: familyHome.red },
  soonBody: { ...typography.caption, color: familyHome.text, lineHeight: 18, marginTop: 2 },
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
  helpTitle: { ...typography.bodyStrong, color: familyHome.blueDark },
  helpBody: { ...typography.caption, color: familyHome.blue, lineHeight: 18, marginTop: 2 },
  liveTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  liveTitleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveTitle: { ...typography.subtitle, color: familyHome.text },
  subtitle: { ...typography.caption, color: familyHome.muted },
  sectionTitle: { ...typography.subtitle, color: familyHome.text, marginTop: spacing.sm },
  optionList: { gap: spacing.sm },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  optionRowActive: { borderColor: familyHome.green, backgroundColor: familyHome.greenSoft },
  optionLiveTitle: { ...typography.bodyStrong, color: familyHome.text },
  optionMeta: { ...typography.caption, color: familyHome.muted, marginTop: 2 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: familyHome.border,
  },
  bookBtn: {
    backgroundColor: familyHome.green,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  bookBtnText: { ...typography.bodyStrong, color: familyHome.white },
  requestBlock: { gap: spacing.sm, marginTop: spacing.sm },
  requestRow: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 12,
    padding: spacing.md,
    gap: 2,
  },
  requestTitle: { ...typography.bodyStrong, color: familyHome.text },
  requestMeta: { ...typography.caption, color: familyHome.muted },
  empty: { ...typography.caption, color: familyHome.muted },
  link: { ...typography.captionStrong, color: familyHome.blue },
  pressed: { opacity: 0.92 },
  disabled: { opacity: 0.6 },
});
