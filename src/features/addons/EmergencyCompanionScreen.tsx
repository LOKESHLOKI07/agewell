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
import { servicePageType } from '@/features/membership/servicePageType';
import { MarketplaceServiceIcon } from '@/features/services/components/MarketplaceServiceIcon';
import {
  filterOfferingsByKind,
  parseOfferingMeta,
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
import { SERVICE_BANNER_HEIGHT, SERVICE_HERO_IMAGES } from '@/features/membership/serviceHeroes';
import { useHasActiveMembership } from '@/features/membership/useHasActiveMembership';
import { useMembershipServicePageVariant } from '@/features/membership/useMembershipServicePageVariant';
import { useMembershipSubmit } from '@/features/membership/useMembershipSubmit';
import { useServiceOfferings } from '@/features/membership/useCatalog';
import { toDisplayDate } from '@/utils/date';
import { useTabScreenBottomPad } from '@/utils/safeBottom';

const SLUG = 'emergency-companion';
const heroImage = SERVICE_HERO_IMAGES.companion;
const VIDEO_URL =
  'https://www.youtube.com/results?search_query=How+Emergency+Companion+Helps+AgeWell';

const DEFAULT_LEAD =
  'Hospital companion provided during your hospitalization. Handles all hospital procedures. Stays at hospital for 8-10 hours. Updates family about health condition & Discharge. (Extra Cost based on availability)';

const SERVICE_DETAILS =
  'Emergency companion during your hospitalisation can be availed for 8 hours or 16 hours. Our companion will assist you at the hospital, handle procedures, stay with you, and keep your family updated about your health condition and discharge.';

const PLEASE_NOTE = [
  'This is a chargeable add-on service.',
  'Once you raise a request, our Customer Care team will contact you for more details.',
  'Charges will be informed based on your requirement, location and availability.',
] as const;

type DurationLook = {
  icon: IconName;
  iconColor: string;
  titleColor: string;
  soft: string;
  selectedBorder: string;
};

function durationLook(title: string, index: number): DurationLook {
  const lower = title.toLowerCase();
  const isDay =
    /8\s*hour|day|morning|daytime/.test(lower) || (index === 0 && !/16|overnight|night|stay/.test(lower));
  if (isDay) {
    return {
      icon: 'sun',
      iconColor: '#D4A017',
      titleColor: familyHome.greenDark,
      soft: familyHome.yellowSoft,
      selectedBorder: familyHome.green,
    };
  }
  return {
    icon: 'moon',
    iconColor: familyHome.blue,
    titleColor: familyHome.blueDark,
    soft: familyHome.blueSoft,
    selectedBorder: familyHome.blue,
  };
}

function displayDurationTitle(title: string): string {
  const trimmed = title.trim();
  if (/companion/i.test(trimmed)) return trimmed;
  if (/\d+\s*hours?/i.test(trimmed)) return `${trimmed} Companion`;
  return trimmed;
}

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

function durationFromNotes(notes: string | null | undefined): string {
  const text = notes?.trim() || '';
  const match = text.match(/(\d+\s*Hours?(?:\s*Companion)?)/i);
  if (match?.[1]) return match[1].replace(/\s+/g, ' ');
  const beforeDot = text.split(/[·.]/)[0]?.trim();
  return beforeDot && beforeDot.length <= 32 ? beforeDot : 'Companion request';
}

function statusToneForLog(tone: LiveRequestTone): { color: string; soft: string } {
  // Screenshot: Confirmed = green, Completed = blue
  if (tone === 'completed') {
    return { color: familyHome.blueDark, soft: familyHome.blueSoft };
  }
  if (tone === 'scheduled' || tone === 'progress' || tone === 'placed') {
    return { color: familyHome.greenDark, soft: familyHome.greenSoft };
  }
  return liveRequestToneMeta(tone);
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
      <MarketplaceServiceIcon
        serviceId={SLUG}
        fallbackIcon="ambulance"
        fallbackColor={familyHome.greenDark}
        size={48}
      />
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
      accessibilityLabel="Watch on YouTube: How Emergency Companion Helps"
      style={({ pressed }) => [styles.videoCard, pressed ? styles.pressed : null]}
    >
      <View style={styles.videoThumb}>
        <Image source={heroImage} style={styles.videoThumbImage} resizeMode="cover" />
        <View style={styles.videoPlay}>
          <Icon name="play" size={14} color={familyHome.white} />
        </View>
        <Text style={styles.videoDuration}>2:28</Text>
      </View>
      <View style={styles.videoCopy}>
        <View style={styles.watchRow}>
          <Icon name="play" size={12} color={familyHome.red} />
          <Text style={styles.watchLabel}>Watch on YouTube</Text>
        </View>
        <Text style={styles.videoTitle}>How Emergency Companion Helps</Text>
        <Text style={styles.videoSub}>Watch this short video to know more.</Text>
      </View>
      <Icon name="chevron-forward" size={16} color={familyHome.muted} />
    </Pressable>
  );
}

function ServiceDetailsCard({
  options,
  loading,
  error,
  onRetry,
}: {
  options: ServiceOffering[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.detailsCard}>
      <View style={styles.detailsHead}>
        <Icon name="document-text-outline" size={18} color={familyHome.blue} />
        <Text style={styles.detailsTitle}>Service Details</Text>
      </View>
      <Text style={styles.detailsBody}>{SERVICE_DETAILS}</Text>
      {loading ? <Text style={styles.empty}>Loading options…</Text> : null}
      {!loading && error && options.length === 0 ? (
        <Pressable onPress={onRetry} accessibilityRole="button">
          <Text style={styles.link}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}
      {!loading && !error && options.length === 0 ? (
        <Text style={styles.empty}>No options configured yet.</Text>
      ) : null}
      {options.length > 0 ? (
        <View style={styles.optionGrid}>
          {options.map((item) => (
            <View key={item.id} style={styles.optionCard}>
              <Icon name="time-outline" size={18} color={familyHome.blue} />
              <Text style={styles.optionTitle}>{displayDurationTitle(item.title)}</Text>
              <Text style={styles.optionLine}>{item.description || 'Hospital companionship'}</Text>
            </View>
          ))}
        </View>
      ) : null}
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

function OutsideAreaBody() {
  const { options, catalog } = useAddonServiceCopy();

  return (
    <View style={styles.stack}>
      <TitleBlock />
      <WatchVideoCard />
      <ServiceDetailsCard
        options={options}
        loading={catalog.isPending}
        error={catalog.isError}
        onRetry={() => void catalog.refetch()}
      />
      <AddonNoteBanner />
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
      <MembershipRequiredBanner />
      <PrimaryButton label="Get Membership  →" onPress={() => router.push(membershipPurchaseHref())} />
      <SecondaryButton label="View Membership Plans" onPress={() => router.push(membershipPurchaseHref())} />
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
      <ServiceDetailsCard
        options={options}
        loading={catalog.isPending}
        error={catalog.isError}
        onRetry={() => void catalog.refetch()}
      />
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
  const membership = useHasActiveMembership();
  const { submitting, submit } = useMembershipSubmit(SLUG);
  const [optionId, setOptionId] = useState('');
  const validTill = membershipValidDate(membership.query.data?.endDate);

  const durationOptions = options;

  const selected =
    durationOptions.find((item) => item.id === optionId) ?? durationOptions[0] ?? null;

  const recentRaw = useMemo(() => {
    return filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
  }, [requestsQuery.data?.items]);

  const recent = useMemo(() => {
    return toLiveRequestViews(recentRaw, { fallbackTitle: 'Emergency Companion', limit: 3 }).map(
      (view, index) => {
        const source = recentRaw[index];
        return {
          ...view,
          title: 'Emergency Companion',
          detail: durationFromNotes(source?.notes ?? view.detail),
          dateLabel: formatRequestDateTime(source?.createdAt ?? null),
        } satisfies LiveRequestView;
      },
    );
  }, [recentRaw]);

  const allCount = recentRaw.length;

  const onBook = () => {
    if (!selected) {
      Alert.alert('No options', 'Booking options will appear once configured in the catalog.');
      return;
    }
    const price =
      selected.priceLabel || parseOfferingMeta(selected.metaJson).price || 'Based on availability';
    void submit(
      `${displayDurationTitle(selected.title)} · ${price}. ${selected.description || lead}`.trim(),
      'Booking request submitted',
    );
  };

  const onViewAllRequests = () => {
    const lines = toLiveRequestViews(recentRaw, { fallbackTitle: 'Emergency Companion', limit: 20 })
      .map((item, index) => {
        const source = recentRaw[index];
        const when = formatRequestDateTime(source?.createdAt ?? null);
        const duration = durationFromNotes(source?.notes ?? item.detail);
        return `• ${duration} — ${item.statusLabel} (${when})`;
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
          fallbackIcon="heart-handshake"
          fallbackColor={familyHome.greenDark}
          size={48}
        />
        <Text style={styles.liveTitle}>EMERGENCY COMPANION</Text>
      </View>

      {validTill ? (
        <View style={styles.memberBadge} accessibilityRole="summary">
          <Icon name="crown" size={16} color={familyHome.green} />
          <Text style={styles.memberBadgeText}>
            Your membership is valid upto <Text style={styles.memberBadgeDate}>{validTill}</Text>.
          </Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Choose Companion Duration</Text>
      {catalog.isPending && durationOptions.length === 0 ? (
        <Text style={styles.empty}>Loading options…</Text>
      ) : null}
      {catalog.isError && durationOptions.length === 0 ? (
        <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
          <Text style={styles.link}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}
      {!catalog.isPending && !catalog.isError && durationOptions.length === 0 ? (
        <Text style={styles.empty}>No options configured yet.</Text>
      ) : null}

      {durationOptions.length > 0 ? (
        <View style={styles.durationGrid}>
          {durationOptions.map((item, index) => {
            const active = selected?.id === item.id;
            const look = durationLook(item.title, index);
            return (
              <Pressable
                key={item.id}
                onPress={() => setOptionId(item.id)}
                disabled={submitting}
                style={[
                  styles.durationCard,
                  { backgroundColor: look.soft },
                  active
                    ? [styles.durationCardActive, { borderColor: look.selectedBorder }]
                    : styles.durationCardIdle,
                  submitting ? styles.disabled : null,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={displayDurationTitle(item.title)}
              >
                {active ? (
                  <View style={styles.durationCheck}>
                    <Icon name="checkmark-circle-outline" size={18} color={familyHome.green} />
                  </View>
                ) : null}
                <Icon name={look.icon} size={22} color={look.iconColor} />
                <Text style={[styles.durationTitle, { color: look.titleColor }]} numberOfLines={2}>
                  {displayDurationTitle(item.title)}
                </Text>
                <Text style={styles.durationBody} numberOfLines={3}>
                  {item.description || 'Hospital companionship'}
                </Text>
              </Pressable>
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
        disabled={submitting || !selected}
        style={({ pressed }) => [
          styles.raiseCta,
          submitting || !selected ? styles.disabled : null,
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
        <Text style={styles.empty}>No requests yet. Choose a duration and raise a request.</Text>
      ) : null}

      {recent.length > 0 ? (
        <View style={styles.requestList}>
          {recent.map((item) => {
            const look = durationLook(item.detail, /16|overnight|night|stay/i.test(item.detail) ? 1 : 0);
            const tone = statusToneForLog(item.tone);
            return (
              <Pressable
                key={item.id}
                onPress={onViewAllRequests}
                style={({ pressed }) => [styles.requestRow, pressed ? styles.pressed : null]}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${item.detail}, ${item.statusLabel}`}
              >
                <View
                  style={[
                    styles.requestIcon,
                    {
                      backgroundColor:
                        look.icon === 'sun' ? familyHome.yellowSoft : familyHome.blueSoft,
                    },
                  ]}
                >
                  <Icon name={look.icon} size={16} color={look.iconColor} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.requestTitle}>{item.title}</Text>
                  <Text style={styles.requestDetail}>{item.detail}</Text>
                  <Text style={styles.requestDate}>{item.dateLabel}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: tone.soft }]}>
                  <Text style={[styles.statusPillText, { color: tone.color }]}>{item.statusLabel}</Text>
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
  optionTitle: { ...servicePageType.optionTitle },
  optionLine: { ...servicePageType.optionBody },

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
    minHeight: SERVICE_BANNER_HEIGHT,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  viewAll: { ...typography.captionStrong, color: familyHome.blue },
  durationGrid: { flexDirection: 'row', gap: spacing.sm },
  durationCard: {
    flex: 1,
    borderRadius: 14,
    padding: spacing.md,
    gap: 6,
    minHeight: 128,
    position: 'relative',
  },
  durationCardIdle: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  durationCardActive: {
    borderWidth: 1.5,
    backgroundColor: familyHome.white,
  },
  durationCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  durationTitle: { ...typography.bodyStrong, fontSize: 14, lineHeight: 18 },
  durationBody: { ...typography.caption, color: familyHome.muted, lineHeight: 16 },
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
