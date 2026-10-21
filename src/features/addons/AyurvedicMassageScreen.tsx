import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
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

const SLUG = 'ayurvedic-massage';
const heroImage = SERVICE_HERO_IMAGES['ayurvedic-massage'] ?? SERVICE_HERO_IMAGES.companion;
const VIDEO_URL =
  'https://www.youtube.com/results?search_query=Benefits+of+Ayurvedic+Massage+at+Home+AgeWell';

const DEFAULT_LEAD = 'Ayurvedic massage at home by certified therapist.';
const SERVICE_DETAILS =
  'Professional and relaxing Ayurvedic massage by certified therapist at home. Helps relieve body pain, improves blood circulation, reduces stress and promotes overall well-being.';

const PLEASE_NOTE = [
  'This is a chargeable add-on service.',
  'All therapists are trained and verified by AgeWell.',
  'Once you raise a request, our Customer Care team will contact you to confirm timing and details.',
] as const;

const BENEFIT_CARDS: { title: string; icon: IconName; color: string; soft: string }[] = [
  { title: 'Relieves Body Pain', icon: 'leaf', color: familyHome.green, soft: familyHome.greenSoft },
  { title: 'Reduces Stress', icon: 'flower', color: familyHome.purple, soft: familyHome.purpleSoft },
  { title: 'Improves Sleep', icon: 'moon', color: '#D4A017', soft: familyHome.yellowSoft },
  { title: 'Overall Well-being', icon: 'heart-outline', color: familyHome.red, soft: familyHome.redSoft },
];

type DateChip = {
  key: string;
  date: Date;
  label: string;
};

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

function formatDateChip(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildDateChips(count = 7): DateChip[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const chips: DateChip[] = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    chips.push({ key: dateKey(d), date: d, label: formatDateChip(d) });
  }
  return chips;
}

function displayDurationTitle(title: string): string {
  const trimmed = title.trim();
  if (/minutes?/i.test(trimmed)) {
    return trimmed.replace(/\bmins?\b/i, 'Minutes').replace(/\bminute\b/i, 'Minutes');
  }
  return trimmed;
}

function displayPrice(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return 'Charges apply';
  if (/session/i.test(trimmed)) return trimmed;
  return `${trimmed} / session`;
}

function durationFromNotes(notes: string | null | undefined): string {
  const text = notes?.trim() || '';
  const match = text.match(/(\d+\s*(?:Minutes?|mins?))/i);
  if (match?.[1]) {
    return `Ayurvedic Massage - ${displayDurationTitle(match[1])}`;
  }
  const beforeDot = text.split(/[·.]/)[0]?.trim();
  return beforeDot && beforeDot.length <= 40 ? beforeDot : 'Ayurvedic Massage';
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

export function AyurvedicMassageScreen() {
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
          {variant === 'loading' ? <LoadingState message="Loading Ayurvedic Massage..." /> : null}
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
  const benefits = useMemo(
    () => filterOfferingsByKind(catalog.data ?? [], 'benefit'),
    [catalog.data],
  );
  const options = useMemo(
    () => filterOfferingsByKind(catalog.data ?? [], 'option'),
    [catalog.data],
  );
  const lead = service?.description?.trim() || DEFAULT_LEAD;
  const priceLine =
    options.length >= 2
      ? `Cost: ${options[0].priceLabel} / ${options[0].title} & ${options[1].priceLabel} / ${options[1].title}.`
      : options[0]?.priceLabel
        ? `Cost: ${options[0].priceLabel} / ${options[0].title}.`
        : undefined;
  return { service, features, benefits, options, lead, priceLine, catalog };
}

function TitleBlock({ lead, priceLine }: { lead?: string; priceLine?: string }) {
  return (
    <View style={styles.titleRow}>
      <MarketplaceServiceIcon
        serviceId={SLUG}
        fallbackIcon="leaf"
        fallbackColor={familyHome.greenDark}
        size={48}
      />
      <View style={styles.flex}>
        <Text style={styles.title}>AYURVEDIC MASSAGE</Text>
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
      accessibilityLabel="Watch on YouTube: Benefits of Ayurvedic Massage for a Better Life"
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
        <Text style={styles.videoTitle}>Benefits of Ayurvedic Massage for a Better Life</Text>
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
      <View style={styles.benefitGrid}>
        {BENEFIT_CARDS.map((item) => (
          <View key={item.title} style={styles.benefitCard}>
            <View style={[styles.benefitIcon, { backgroundColor: item.soft }]}>
              <Icon name={item.icon} size={18} color={item.color} />
            </View>
            <Text style={styles.benefitTitle}>{item.title}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function AvailableSlotsCard({
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
    <View style={styles.slotsCard}>
      <Text style={styles.slotsTitle}>Available Slots</Text>
      {loading ? <Text style={styles.empty}>Loading slots…</Text> : null}
      {!loading && error && options.length === 0 ? (
        <Pressable onPress={onRetry} accessibilityRole="button">
          <Text style={styles.link}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}
      {!loading && !error && options.length === 0 ? (
        <Text style={styles.empty}>No options configured yet.</Text>
      ) : null}
      {options.length > 0 ? (
        <View style={styles.slotGrid}>
          {options.map((item) => (
            <View key={item.id} style={styles.slotItem}>
              <Icon name="time-outline" size={18} color={familyHome.blue} />
              <Text style={styles.slotDuration}>{displayDurationTitle(item.title)}</Text>
              <Text style={styles.slotPrice}>{item.priceLabel || 'Charges apply'}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function benefitLook(title: string, index: number): {
  icon: IconName;
  color: string;
  soft: string;
} {
  const lower = title.toLowerCase();
  for (const card of BENEFIT_CARDS) {
    if (lower.includes(card.title.toLowerCase().split(' ')[0] ?? '')) {
      return { icon: card.icon, color: card.color, soft: card.soft };
    }
  }
  if (/pain|body/i.test(lower)) return BENEFIT_CARDS[0];
  if (/stress|relax/i.test(lower)) return BENEFIT_CARDS[1];
  if (/sleep|rest/i.test(lower)) return BENEFIT_CARDS[2];
  if (/well|health|overall/i.test(lower)) return BENEFIT_CARDS[3];
  return BENEFIT_CARDS[index % BENEFIT_CARDS.length];
}

function AddonNoteBanner() {
  return (
    <View style={styles.addonBanner} accessibilityRole="summary">
      <Icon name="card-outline" size={20} color={familyHome.orange} />
      <View style={styles.flex}>
        <Text style={styles.addonTitle}>Add-on Service</Text>
        <Text style={styles.addonBody}>
          This is an add-on service. For actual costing & to avail this service, please connect with us.
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
      <ServiceDetailsCard />
      <AvailableSlotsCard
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
            {MEMBERSHIP_SERVICE_AREA_LINE} Ayurvedic Massage will become available in your area as we
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

/** In serviceable area, membership not purchased — matches Ayurvedic Massage gate mockup. */
function NoMembershipBody() {
  const { options, catalog } = useAddonServiceCopy();

  return (
    <View style={styles.stack}>
      <TitleBlock />
      <WatchVideoCard />
      <ServiceDetailsCard />
      <AvailableSlotsCard
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
  const { lead, options, benefits, catalog } = useAddonServiceCopy();
  const requestsQuery = useServiceRequests();
  const membership = useHasActiveMembership();
  const { submitting, submit } = useMembershipSubmit(SLUG);
  const [optionId, setOptionId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [showIosPicker, setShowIosPicker] = useState(false);
  const validTill = membershipValidDate(membership.query.data?.endDate);

  const durationOptions = useMemo((): ServiceOffering[] => {
    return options.map((item) => ({
      ...item,
      title: displayDurationTitle(item.title),
      priceLabel: displayPrice(item.priceLabel || ''),
    }));
  }, [options]);

  const selected =
    durationOptions.find((item) => item.id === optionId) ?? durationOptions[0] ?? null;

  const dateChips = useMemo(() => {
    const chips = buildDateChips(7);
    const key = dateKey(selectedDate);
    if (chips.some((chip) => chip.key === key)) {
      return chips;
    }
    return [
      ...chips,
      { key, date: selectedDate, label: formatDateChip(selectedDate) },
    ];
  }, [selectedDate]);
  const selectedKey = dateKey(selectedDate);

  const recentRaw = useMemo(() => {
    return filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
  }, [requestsQuery.data?.items]);

  const recent = useMemo(() => {
    return toLiveRequestViews(recentRaw, { fallbackTitle: 'Ayurvedic Massage', limit: 3 }).map(
      (view, index) => {
        const source = recentRaw[index];
        return {
          ...view,
          title: durationFromNotes(source?.notes ?? view.detail),
          detail: formatRequestDateTime(source?.createdAt ?? null),
          dateLabel: formatRequestDateTime(source?.createdAt ?? null),
        } satisfies LiveRequestView;
      },
    );
  }, [recentRaw]);

  const allCount = recentRaw.length;

  const applyPickedDate = (next: Date) => {
    const day = new Date(next);
    day.setHours(0, 0, 0, 0);
    setSelectedDate(day);
  };

  const onOpenCalendar = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: selectedDate,
        mode: 'date',
        minimumDate: new Date(),
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'set' && date) {
            applyPickedDate(date);
          }
        },
      });
      return;
    }
    setShowIosPicker(true);
  };

  const onBook = () => {
    if (!selected) {
      Alert.alert('Select duration', 'Please choose a massage duration before raising a request.');
      return;
    }
    const dateLabel = formatDateChip(selectedDate);
    void submit(
      `${displayDurationTitle(selected.title)} · ${selected.priceLabel || 'Charges apply'} · Preferred date ${dateLabel}. ${selected.description || lead}`.trim(),
      'Booking request submitted',
    );
  };

  const onViewAllRequests = () => {
    const lines = toLiveRequestViews(recentRaw, { fallbackTitle: 'Ayurvedic Massage', limit: 20 })
      .map((item, index) => {
        const source = recentRaw[index];
        const when = formatRequestDateTime(source?.createdAt ?? null);
        const label = durationFromNotes(source?.notes ?? item.detail);
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
          fallbackIcon="hand-heart"
          fallbackColor={familyHome.greenDark}
          size={48}
        />
        <Text style={styles.liveTitle}>AYURVEDIC MASSAGE</Text>
      </View>

      {validTill ? (
        <View style={styles.memberBadge} accessibilityRole="summary">
          <Icon name="crown" size={16} color={familyHome.green} />
          <Text style={styles.memberBadgeText}>
            Your membership is valid upto <Text style={styles.memberBadgeDate}>{validTill}</Text>.
          </Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Select Massage Duration</Text>
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
            const look =
              index === 0
                ? {
                    idleBg: familyHome.greenSoft,
                    idleIcon: familyHome.green,
                    idleTitle: familyHome.greenDark,
                  }
                : {
                    idleBg: familyHome.blueSoft,
                    idleIcon: familyHome.blue,
                    idleTitle: familyHome.blueDark,
                  };
            return (
              <Pressable
                key={item.id}
                onPress={() => setOptionId(item.id)}
                disabled={submitting}
                style={[
                  styles.durationCard,
                  {
                    backgroundColor: active ? familyHome.greenSoft : look.idleBg,
                    borderColor: active ? familyHome.green : 'transparent',
                  },
                  active ? styles.durationCardActive : styles.durationCardIdle,
                  submitting ? styles.disabled : null,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${item.title}, ${item.priceLabel}`}
              >
                <View style={styles.durationRadio}>
                  {active ? (
                    <Icon name="checkmark-circle-outline" size={16} color={familyHome.green} />
                  ) : (
                    <View style={styles.radio} />
                  )}
                </View>
                <Icon
                  name="time-outline"
                  size={16}
                  color={active ? familyHome.green : look.idleIcon}
                />
                <Text
                  style={[
                    styles.durationTitle,
                    { color: active ? familyHome.greenDark : look.idleTitle },
                  ]}
                >
                  {displayDurationTitle(item.title)}
                </Text>
                <Text style={styles.durationPrice}>{item.priceLabel || 'Charges apply'}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitleFlush}>Select Date</Text>
        <Pressable
          onPress={onOpenCalendar}
          style={styles.calendarLink}
          accessibilityRole="button"
          accessibilityLabel="View Calendar"
        >
          <Icon name="calendar-outline" size={13} color={familyHome.blue} />
          <Text style={styles.viewAll}>View Calendar</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateRow}
      >
        {dateChips.map((chip) => {
          const active = chip.key === selectedKey;
          return (
            <Pressable
              key={chip.key}
              onPress={() => applyPickedDate(chip.date)}
              style={[styles.dateChip, active ? styles.dateChipActive : null]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={chip.label}
            >
              <Text style={[styles.dateChipText, active ? styles.dateChipTextActive : null]}>
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {showIosPicker ? (
        <View style={styles.iosPickerWrap}>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="inline"
            minimumDate={new Date()}
            onChange={(_event: DateTimePickerEvent, date?: Date) => {
              if (date) applyPickedDate(date);
              setShowIosPicker(false);
            }}
          />
          <Pressable onPress={() => setShowIosPicker(false)} accessibilityRole="button">
            <Text style={styles.link}>Done</Text>
          </Pressable>
        </View>
      ) : null}

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

      {benefits.length > 0 ? (
        <View style={styles.benefitLiveGrid}>
          {benefits.map((item, index) => {
            const look = benefitLook(item.title, index);
            return (
              <View key={item.id} style={styles.benefitLiveCard}>
                <View style={[styles.benefitIcon, { backgroundColor: look.soft }]}>
                  <Icon name={look.icon} size={16} color={look.color} />
                </View>
                <Text style={styles.benefitLiveTitle}>{item.title}</Text>
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
                    name="time-outline"
                    size={16}
                    color={isDone ? familyHome.blueDark : familyHome.greenDark}
                  />
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
                        : item.statusLabel === 'Requested' || item.tone === 'placed'
                          ? item.statusLabel
                          : 'Confirmed'}
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
  benefitGrid: { flexDirection: 'row', gap: spacing.sm },
  benefitCard: {
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
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
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

  slotsCard: {
    backgroundColor: familyHome.greenSoft,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
  },
  slotsTitle: { ...typography.bodyStrong, color: familyHome.greenDark },
  slotGrid: { flexDirection: 'row', gap: spacing.sm },
  slotItem: {
    flex: 1,
    backgroundColor: familyHome.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: familyHome.border,
    padding: spacing.md,
    gap: 4,
    minHeight: 92,
  },
  slotDuration: { ...typography.bodyStrong, color: familyHome.text },
  slotPrice: { ...typography.subtitle, color: familyHome.greenDark },

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
    backgroundColor: familyHome.blueSoft,
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
    borderWidth: 1,
    borderColor: '#C8E6C9',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  memberBadgeText: { ...typography.caption, color: familyHome.greenDark, flex: 1, lineHeight: 18 },
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
  calendarLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAll: { ...typography.captionStrong, color: familyHome.blue },
  durationGrid: { flexDirection: 'row', gap: spacing.sm },
  durationCard: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: 2,
    minHeight: 78,
    position: 'relative',
  },
  durationCardIdle: {
    borderWidth: 1,
  },
  durationCardActive: {
    borderWidth: 1.5,
  },
  durationRadio: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#C5CDD8',
  },
  durationTitle: { ...typography.bodyStrong, fontSize: 14, lineHeight: 18 },
  durationPrice: { ...typography.caption, color: familyHome.muted, fontSize: 12, lineHeight: 16 },
  dateRow: { gap: 8, paddingVertical: 2 },
  dateChip: {
    borderWidth: 1,
    borderColor: '#E6E8EC',
    backgroundColor: familyHome.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChipActive: {
    borderColor: familyHome.green,
    backgroundColor: familyHome.greenSoft,
  },
  dateChipText: {
    ...typography.captionStrong,
    color: familyHome.muted,
    fontSize: 11,
    lineHeight: 14,
  },
  dateChipTextActive: { color: familyHome.greenDark },
  iosPickerWrap: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: familyHome.white,
  },
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
  benefitLiveGrid: { flexDirection: 'row', gap: spacing.sm },
  benefitLiveCard: {
    flex: 1,
    backgroundColor: familyHome.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: familyHome.border,
    paddingVertical: spacing.md,
    paddingHorizontal: 4,
    gap: 6,
    alignItems: 'center',
    minHeight: 88,
  },
  benefitLiveTitle: {
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
