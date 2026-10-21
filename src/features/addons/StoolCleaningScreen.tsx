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

const SLUG = 'stool-cleaning';
const heroImage = SERVICE_HERO_IMAGES['stool-cleaning'];
const VIDEO_URL =
  'https://www.youtube.com/results?search_query=Perineal+Care+Stool+Cleaning+AgeWell';

const DEFAULT_LEAD = 'Monthly (Morning + evening) stool cleaning & servicing.';
const SERVICE_DETAILS =
  'For bed ridden people, we provide morning stool/toilet cleaning (perineal care) & sponging, and evening stool/toilet cleaning.';
const VISIT_DESC = 'Stool cleaning, perineal care & sponging';

const PLEASE_NOTE = [
  'This is a chargeable add-on service.',
  'Displayed costs are approximate and may vary based on requirement and availability.',
  'Once you raise a request, our Customer Care team will contact you for more details.',
] as const;

type VisitTone = 'morning' | 'evening' | 'both';

type VisitLook = {
  tone: VisitTone;
  icons: IconName[];
  iconColor: string;
  titleColor: string;
  soft: string;
  selectedBorder: string;
  priceSoft: string;
};


function visitTone(title: string, index: number): VisitTone {
  const lower = title.toLowerCase();
  if (/morning\s*\+|both|combo|full/.test(lower)) return 'both';
  if (/evening|night/.test(lower) && !/morning/.test(lower)) return 'evening';
  if (/morning|day/.test(lower) && !/evening/.test(lower)) return 'morning';
  if (index === 1) return 'evening';
  if (index >= 2) return 'both';
  return 'morning';
}

function visitLook(title: string, index: number): VisitLook {
  const tone = visitTone(title, index);
  if (tone === 'evening') {
    return {
      tone,
      icons: ['moon'],
      iconColor: familyHome.blue,
      titleColor: familyHome.blueDark,
      soft: familyHome.blueSoft,
      selectedBorder: familyHome.blue,
      priceSoft: '#E8F1FE',
    };
  }
  if (tone === 'both') {
    return {
      tone,
      icons: ['sun', 'moon'],
      iconColor: familyHome.purple,
      titleColor: familyHome.purpleDark,
      soft: familyHome.purpleSoft,
      selectedBorder: familyHome.purple,
      priceSoft: '#F0EAF8',
    };
  }
  return {
    tone,
    icons: ['sun'],
    iconColor: '#D4A017',
    titleColor: familyHome.greenDark,
    soft: familyHome.yellowSoft,
    selectedBorder: familyHome.green,
    priceSoft: familyHome.greenSoft,
  };
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

function visitLabelFromNotes(notes: string | null | undefined): string {
  const text = notes?.trim() || '';
  if (/morning\s*\+|both/i.test(text)) return 'Stool Cleaning - Morning + Evening';
  if (/evening/i.test(text)) return 'Stool Cleaning - Evening Visit';
  if (/morning/i.test(text)) return 'Stool Cleaning - Morning Visit';
  const beforeDot = text.split(/[·.]/)[0]?.trim();
  if (beforeDot && beforeDot.length <= 40) return beforeDot;
  return 'Stool Cleaning';
}

function statusToneForLog(tone: LiveRequestTone): { color: string; soft: string } {
  if (tone === 'completed') {
    return { color: familyHome.greenDark, soft: familyHome.greenSoft };
  }
  if (tone === 'placed' || tone === 'scheduled' || tone === 'progress') {
    return { color: familyHome.blueDark, soft: familyHome.blueSoft };
  }
  return liveRequestToneMeta(tone);
}

export function StoolCleaningScreen() {
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
          {variant === 'loading' ? <LoadingState message="Loading Stool Cleaning..." /> : null}
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
  const plans = useMemo(
    () => filterOfferingsByKind(catalog.data ?? [], 'plan'),
    [catalog.data],
  );
  const options = useMemo(
    () => filterOfferingsByKind(catalog.data ?? [], 'option'),
    [catalog.data],
  );
  const lead = service?.description?.trim() || DEFAULT_LEAD;
  // Banner prefers a plan row; otherwise the combined Morning+Evening option (or first priced option).
  const bannerOffering =
    plans[0] ??
    options.find((item) => /morning\s*\+\s*evening/i.test(item.title)) ??
    options.find((item) => Boolean(item.priceLabel?.trim())) ??
    null;
  const priceLabel = bannerOffering?.priceLabel?.trim() || '';
  const priceLine = priceLabel
    ? `General cost: ${priceLabel}. (Exact cost based on availability)`
    : bannerOffering?.description || '';
  return { service, features, plans, options, lead, priceLine, priceLabel, catalog };
}

function TitleBlock({ lead, priceLine }: { lead?: string; priceLine?: string }) {
  return (
    <View style={styles.titleRow}>
      <MarketplaceServiceIcon
        serviceId={SLUG}
        fallbackIcon="water"
        fallbackColor={familyHome.greenDark}
        size={48}
      />
      <View style={styles.flex}>
        <Text style={styles.title}>STOOL CLEANING</Text>
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
      accessibilityLabel="Watch on YouTube: Stool Cleaning and Perineal Care"
      style={({ pressed }) => [styles.videoCard, pressed ? styles.pressed : null]}
    >
      <View style={styles.videoThumb}>
        <Image source={heroImage} style={styles.videoThumbImage} resizeMode="cover" />
        <View style={styles.videoPlay}>
          <Icon name="play" size={14} color={familyHome.white} />
        </View>
        <Text style={styles.videoDuration}>2:36</Text>
      </View>
      <View style={styles.videoCopy}>
        <View style={styles.watchRow}>
          <Icon name="play" size={12} color={familyHome.red} />
          <Text style={styles.watchLabel}>Watch on YouTube</Text>
        </View>
        <Text style={styles.videoTitle}>Stool Cleaning and Perineal Care</Text>
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
      <View style={styles.visitGrid}>
        <View style={styles.visitCard}>
          <Icon name="sun" size={20} color="#E6A817" />
          <Text style={styles.visitTitle}>Morning Visit</Text>
          <Text style={styles.visitBody}>{VISIT_DESC}</Text>
        </View>
        <View style={styles.visitCard}>
          <Icon name="moon" size={20} color={familyHome.blue} />
          <Text style={styles.visitTitle}>Evening Visit</Text>
          <Text style={styles.visitBody}>Again stool cleaning, perineal care & sponging</Text>
        </View>
      </View>
    </View>
  );
}

function CostBanner({ priceLabel }: { priceLabel: string }) {
  return (
    <View style={styles.costBanner} accessibilityRole="summary">
      <Icon name="ribbon-outline" size={18} color={familyHome.greenDark} />
      <View style={styles.flex}>
        <Text style={styles.costLabel}>General Cost</Text>
        <Text style={styles.costAmount}>{priceLabel}</Text>
        <Text style={styles.costNote}>(Exact cost based on availability)</Text>
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
          This is an add-on service and pricing will be decided as per your need. For actual costing
          & to avail this service, please connect with us.
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
            {MEMBERSHIP_SERVICE_AREA_LINE} Stool Cleaning will become available in your area as we
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

/** In serviceable area, membership not purchased — matches Stool Cleaning gate mockup. */
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
  const { lead, options, plans, catalog } = useAddonServiceCopy();
  const requestsQuery = useServiceRequests();
  const membership = useHasActiveMembership();
  const { submitting, submit } = useMembershipSubmit(SLUG);
  const [optionId, setOptionId] = useState('');
  const validTill = membershipValidDate(membership.query.data?.endDate);

  const visitOptions = useMemo((): ServiceOffering[] => {
    return options.length > 0 ? options : plans;
  }, [options, plans]);

  const selected =
    visitOptions.find((item) => item.id === optionId) ?? visitOptions[0] ?? null;

  const recentRaw = useMemo(() => {
    return filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
  }, [requestsQuery.data?.items]);

  const recent = useMemo(() => {
    return toLiveRequestViews(recentRaw, { fallbackTitle: 'Stool Cleaning', limit: 3 }).map(
      (view, index) => {
        const source = recentRaw[index];
        return {
          ...view,
          title: visitLabelFromNotes(source?.notes ?? view.detail),
          detail: formatRequestDateTime(source?.createdAt ?? null),
          dateLabel: formatRequestDateTime(source?.createdAt ?? null),
        } satisfies LiveRequestView;
      },
    );
  }, [recentRaw]);

  const allCount = recentRaw.length;

  const onBook = () => {
    if (!selected) {
      Alert.alert('Select an option', 'Please choose a cleaning option before raising a request.');
      return;
    }
    void submit(
      `${selected.title} · ${selected.priceLabel || 'Based on availability'}. ${selected.description || lead}`.trim(),
      'Booking request submitted',
    );
  };

  const onViewAllRequests = () => {
    const lines = toLiveRequestViews(recentRaw, { fallbackTitle: 'Stool Cleaning', limit: 20 })
      .map((item, index) => {
        const source = recentRaw[index];
        const when = formatRequestDateTime(source?.createdAt ?? null);
        const label = visitLabelFromNotes(source?.notes ?? item.detail);
        return `• ${label} — ${item.statusLabel} (${when})`;
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
          fallbackIcon="water"
          fallbackColor={familyHome.greenDark}
          size={48}
        />
        <Text style={styles.liveTitle}>STOOL CLEANING</Text>
      </View>

      {validTill ? (
        <View style={styles.memberBadge} accessibilityRole="summary">
          <Icon name="crown" size={16} color={familyHome.green} />
          <Text style={styles.memberBadgeText}>
            Your membership is valid upto <Text style={styles.memberBadgeDate}>{validTill}</Text>.
          </Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Choose Cleaning Option</Text>
      {catalog.isPending && visitOptions.length === 0 ? (
        <Text style={styles.empty}>Loading options…</Text>
      ) : null}
      {catalog.isError && visitOptions.length === 0 ? (
        <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
          <Text style={styles.link}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}
      {!catalog.isPending && !catalog.isError && visitOptions.length === 0 ? (
        <Text style={styles.empty}>No options configured yet.</Text>
      ) : null}

      {visitOptions.length > 0 ? (
        <View style={styles.optionGrid}>
          {visitOptions.map((item, index) => {
            const active = selected?.id === item.id;
            const look = visitLook(item.title, index);
            return (
              <Pressable
                key={item.id}
                onPress={() => setOptionId(item.id)}
                disabled={submitting}
                style={[
                  styles.optionCard,
                  { backgroundColor: look.soft },
                  active
                    ? [styles.optionCardActive, { borderColor: look.selectedBorder }]
                    : styles.optionCardIdle,
                  submitting ? styles.disabled : null,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={item.title}
              >
                {active ? (
                  <View style={styles.optionCheck}>
                    <Icon name="checkmark-circle-outline" size={16} color={look.selectedBorder} />
                  </View>
                ) : null}
                <View style={styles.optionIcons}>
                  {look.icons.map((name) => (
                    <Icon key={name} name={name} size={18} color={look.iconColor} />
                  ))}
                </View>
                <Text style={[styles.optionTitle, { color: look.titleColor }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.optionBody} numberOfLines={3}>
                  {item.description || VISIT_DESC}
                </Text>
                <View style={[styles.optionPrice, { backgroundColor: look.priceSoft }]}>
                  <Text style={[styles.optionPriceText, { color: look.titleColor }]}>
                    {item.priceLabel || 'Based on availability'}
                  </Text>
                </View>
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
        <Text style={styles.empty}>No requests yet. Choose an option and raise a request.</Text>
      ) : null}

      {recent.length > 0 ? (
        <View style={styles.requestList}>
          {recent.map((item) => {
            const look = visitLook(item.title, /evening/i.test(item.title) && !/morning/i.test(item.title) ? 1 : /morning\s*\+/i.test(item.title) ? 2 : 0);
            const tone = statusToneForLog(item.tone);
            return (
              <Pressable
                key={item.id}
                onPress={onViewAllRequests}
                style={({ pressed }) => [styles.requestRow, pressed ? styles.pressed : null]}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${item.statusLabel}`}
              >
                <View style={[styles.requestIcon, { backgroundColor: look.soft }]}>
                  <Icon name={look.icons[0]} size={16} color={look.iconColor} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.requestTitle}>{item.title}</Text>
                  <Text style={styles.requestDate}>{item.dateLabel}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: tone.soft }]}>
                  <Text style={[styles.statusPillText, { color: tone.color }]}>
                    {item.tone === 'completed'
                      ? 'Completed'
                      : item.tone === 'cancelled'
                        ? item.statusLabel
                        : item.tone === 'placed'
                          ? 'Requested'
                          : item.statusLabel}
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
  visitGrid: { flexDirection: 'row', gap: spacing.sm },
  visitCard: {
    flex: 1,
    backgroundColor: familyHome.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: familyHome.border,
    padding: spacing.md,
    gap: 4,
    minHeight: 100,
  },
  visitTitle: { ...typography.captionStrong, color: familyHome.text, fontSize: 12, lineHeight: 15 },
  visitBody: { ...typography.caption, color: familyHome.muted, lineHeight: 16 },

  costBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 14,
    padding: spacing.lg,
  },
  costLabel: { ...typography.captionStrong, color: familyHome.greenDark, fontSize: 12, lineHeight: 15 },
  costAmount: { ...typography.subtitle, color: familyHome.blueDark, marginTop: 2 },
  costNote: { ...typography.caption, color: familyHome.muted, marginTop: 2 },

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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  viewAll: { ...typography.captionStrong, color: familyHome.blue },
  optionGrid: { flexDirection: 'row', gap: 8 },
  optionCard: {
    flex: 1,
    borderRadius: 14,
    padding: spacing.sm,
    gap: 6,
    minHeight: 168,
    position: 'relative',
  },
  optionCardIdle: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionCardActive: {
    borderWidth: 1.5,
    backgroundColor: familyHome.white,
  },
  optionCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  optionIcons: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  optionTitle: { ...typography.captionStrong, fontSize: 12, lineHeight: 15 },
  optionBody: { ...typography.caption, color: familyHome.muted, fontSize: 10, lineHeight: 13, flex: 1 },
  optionPrice: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  optionPriceText: { ...typography.captionStrong, fontSize: 10, textAlign: 'center' },
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
  requestTitle: { ...typography.bodyStrong, color: familyHome.text, fontSize: 13 },
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
