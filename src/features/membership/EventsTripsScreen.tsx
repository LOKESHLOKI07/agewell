import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
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
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { ServiceHelpBanner } from '@/features/membership/ServiceHelpBanner';
import { MarketplaceServiceIcon } from '@/features/services/components/MarketplaceServiceIcon';
import { useTabScreenBottomPad } from '@/utils/safeBottom';
import type { ServiceOffering } from './catalogTypes';
import { filterOfferingsByKind, parseOfferingMeta } from './catalogTypes';
import { MEMBERSHIP_SERVICE_AREA_LINE } from './membershipServicePageVariant';
import { membershipPurchaseHref } from './planCatalog';
import { SERVICE_HERO_IMAGES } from './serviceHeroes';
import { useMembershipServicePageVariant } from './useMembershipServicePageVariant';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useServiceOfferings } from './useCatalog';

const heroImage = SERVICE_HERO_IMAGES['events-trips'];

const SLUG = 'events-trips';
const LEAD =
  'Discover nearby events and activities on the AgeWell app. Get priority access to AgeWell tours across Maharashtra & India. Companion assistance with luggage, boarding, seating & hotel check-in/out plus medication & emergency support. (Tours cost extra).';

const ABOUT_BULLETS = [
  'Local area programs are shown based on your preferences and interests.',
  'Our companion will assist you for coordination and participation.',
  'Outstation trip catalogues are specially curated for senior citizens, with companion support throughout the trip.',
  'Get exclusive and discounted packages for your family members with us.',
];

const GATE_FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'calendar-outline',
    title: 'Local Events & Activities',
    body: 'Discover nearby events on the app',
  },
  {
    icon: 'people-outline',
    title: 'AgeWell Tours',
    body: 'Get priority access to AgeWell tours',
  },
  {
    icon: 'hand-helping',
    title: 'Companion Assistance',
    body: 'Support with luggage, boarding, seating & hotel check-in/out',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Health & Safety Support',
    body: 'Assistance with medication & emergency support',
  },
];

const FALLBACK_INTERESTS = [
  'Spiritual',
  'Music',
  'Nature',
  'History',
  'Food',
  'Wellness',
  'Art & Culture',
  'Shopping',
  'Social Meetups',
  'Short Trips',
  'Long Tours',
];

const INTEREST_ICONS: { match: RegExp; icon: IconName }[] = [
  { match: /spiritual/i, icon: 'flower' },
  { match: /music/i, icon: 'music' },
  { match: /nature/i, icon: 'leaf' },
  { match: /history/i, icon: 'landmark' },
  { match: /food/i, icon: 'restaurant' },
  { match: /wellness/i, icon: 'heart-outline' },
  { match: /art|culture/i, icon: 'sparkles' },
  { match: /shopping/i, icon: 'cart-outline' },
  { match: /social|meetup/i, icon: 'people-outline' },
  { match: /short/i, icon: 'car' },
  { match: /long|tour/i, icon: 'bus' },
];

const TAG_TONES: { match: RegExp; color: string; soft: string }[] = [
  { match: /spiritual|nature|wellness|yoga|walk/i, color: familyHome.green, soft: familyHome.greenSoft },
  { match: /art|culture|history|relax/i, color: familyHome.blue, soft: familyHome.blueSoft },
  { match: /food|beach|leisure/i, color: familyHome.orange, soft: familyHome.orangeSoft },
  { match: /music|social|group/i, color: familyHome.purple, soft: familyHome.purpleSoft },
  { match: /scenic|peaceful/i, color: familyHome.blue, soft: familyHome.blueSoft },
];

const THUMB_COLORS = ['#7B9E87', '#5B7C99', '#8B6B8A', '#C4A35A', '#6A8F6B', '#9B6B5A'];

const FALLBACK_EVENTS: ServiceOffering[] = [
  {
    id: 'fallback-temple',
    serviceSlug: SLUG,
    title: 'Temple Visit & Morning Walk',
    description: 'Gentle morning walk and temple visit with fellow members nearby.',
    badge: 'Local Event',
    priceLabel: 'Included',
    image: null,
    metaJson: '{"kind":"event","when":"20 Sep","place":"Kandivali","tags":"Spiritual|Walk"}',
    sortOrder: 0,
    isActive: true,
  },
  {
    id: 'fallback-art',
    serviceSlug: SLUG,
    title: 'Art Exhibition Visit',
    description: 'Guided visit to a local art exhibition with light refreshments.',
    badge: 'Local Event',
    priceLabel: 'Included',
    image: null,
    metaJson: '{"kind":"event","when":"24 Sep","place":"Borivali","tags":"Art|Culture"}',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'fallback-yoga',
    serviceSlug: SLUG,
    title: 'Yoga in the Park',
    description: 'Outdoor yoga session focused on mobility, balance and calm.',
    badge: 'Local Event',
    priceLabel: 'Included',
    image: null,
    metaJson: '{"kind":"event","when":"28 Sep","place":"Kandivali","tags":"Wellness|Yoga"}',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'fallback-picnic',
    serviceSlug: SLUG,
    title: 'Garden Picnic Morning',
    description: 'Relaxed picnic morning in a nearby garden with members.',
    badge: 'Local Event',
    priceLabel: 'Included',
    image: null,
    metaJson: '{"kind":"event","when":"2 Oct","place":"Malad","tags":"Nature|Social"}',
    sortOrder: 3,
    isActive: true,
  },
];

const FALLBACK_TRIPS: ServiceOffering[] = [
  {
    id: 'fallback-lonavala',
    serviceSlug: SLUG,
    title: 'Lonavala Getaway',
    description: 'Scenic hills escape with companion support.',
    badge: 'Outstation',
    priceLabel: 'Charges apply',
    image: null,
    metaJson: '{"kind":"tour","duration":"3D / 2N","tags":"Nature|Relaxation"}',
    sortOrder: 10,
    isActive: true,
  },
  {
    id: 'fallback-kerala',
    serviceSlug: SLUG,
    title: 'Kerala Backwaters',
    description: 'Houseboat stay and peaceful backwater views.',
    badge: 'Outstation',
    priceLabel: 'Charges apply',
    image: null,
    metaJson: '{"kind":"tour","duration":"4D / 3N","tags":"Scenic|Peaceful"}',
    sortOrder: 11,
    isActive: true,
  },
  {
    id: 'fallback-alibaug',
    serviceSlug: SLUG,
    title: 'Alibaug Beach Escape',
    description: 'Beach and fort day outing with pickup and drop.',
    badge: 'Outstation',
    priceLabel: 'Charges apply',
    image: null,
    metaJson: '{"kind":"tour","duration":"2D / 1N","tags":"Beach|Leisure"}',
    sortOrder: 12,
    isActive: true,
  },
  {
    id: 'fallback-statue',
    serviceSlug: SLUG,
    title: 'Statue of Unity',
    description: 'Iconic monument visit with lodging and companion support.',
    badge: 'Outstation',
    priceLabel: 'Charges apply',
    image: null,
    metaJson: '{"kind":"senior","duration":"2D / 1N","tags":"History|Scenic"}',
    sortOrder: 13,
    isActive: true,
  },
];

function offeringKind(item: ServiceOffering): 'event' | 'tour' | 'interest' {
  const kind = parseOfferingMeta(item.metaJson).kind?.toLowerCase();
  if (kind === 'interest') return 'interest';
  if (kind === 'tour' || kind === 'family' || kind === 'trip' || kind === 'senior') return 'tour';
  return 'event';
}

function splitTags(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
}

function interestIcon(name: string): IconName {
  for (const row of INTEREST_ICONS) {
    if (row.match.test(name)) return row.icon;
  }
  return 'sparkles';
}

function tagTone(tag: string) {
  for (const row of TAG_TONES) {
    if (row.match.test(tag)) return row;
  }
  return { color: familyHome.blue, soft: familyHome.blueSoft };
}

function splitWhen(when: string | undefined): { day: string; month: string } | null {
  if (!when?.trim()) return null;
  const parts = when.trim().split(/\s+/);
  if (parts.length < 2) return null;
  return { day: parts[0]!, month: parts[1]! };
}

function defaultTagsFor(item: ServiceOffering, kind: 'event' | 'tour'): string[] {
  const fromMeta = splitTags(parseOfferingMeta(item.metaJson).tags);
  if (fromMeta.length > 0) return fromMeta;
  const title = item.title.toLowerCase();
  if (kind === 'event') {
    if (/temple|spiritual|walk/i.test(title)) return ['Spiritual', 'Walk'];
    if (/art|exhibition/i.test(title)) return ['Art', 'Culture'];
    if (/yoga|wellness/i.test(title)) return ['Wellness', 'Yoga'];
    if (/picnic|garden|nature/i.test(title)) return ['Nature', 'Social'];
    return ['Local'];
  }
  if (/lonavala|nature|hill/i.test(title)) return ['Nature', 'Relaxation'];
  if (/kerala|backwater/i.test(title)) return ['Scenic', 'Peaceful'];
  if (/alibaug|beach/i.test(title)) return ['Beach', 'Leisure'];
  if (/statue|unity|history/i.test(title)) return ['History', 'Scenic'];
  return ['Outstation'];
}

export function EventsTripsScreen() {
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
          {variant === 'loading' ? <LoadingState message="Loading Local Events & Trips..." /> : null}
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
        fallbackIcon="location"
        fallbackColor={familyHome.purple}
        size={48}
      />
      <View style={styles.flex}>
        <Text style={styles.title}>Local Area Events & Trips</Text>
        <Text style={styles.lead}>{LEAD}</Text>
      </View>
    </View>
  );
}

function GateHero({ tone }: { tone: 'outside' | 'membership' }) {
  const headline = tone === 'outside' ? 'Explore Together' : 'New Experiences';
  const accent = tone === 'outside' ? 'Live Brighter' : 'Brighter Days';
  const body =
    tone === 'outside'
      ? 'Events, activities and tours designed for new experiences and lasting memories.'
      : 'Join AgeWell events and tours to explore, connect and create happy memories together.';

  return (
    <View style={styles.heroFull} accessibilityLabel="Local events and trips">
      <Image source={heroImage} style={styles.heroFullImage} resizeMode="cover" />
      <View style={styles.heroScrim} />
      <View style={styles.heroFullContent}>
        <View style={styles.heroFullCopy}>
          <Text style={styles.heroFullHeadline}>
            {headline},{'\n'}
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
      'Notify me when Local Events & Trips is available in my area.',
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
            {MEMBERSHIP_SERVICE_AREA_LINE} Local Events & Trips will become available in your area as we expand
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
              Local Events & Trips is available only for AgeWell members.
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
              Get access to Local Events & Trips and many more supportive services for a safer, healthier and
              happier life.
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
  const { submitting, submit } = useMembershipSubmit(SLUG);
  const [interests, setInterests] = useState<string[]>(['Spiritual']);
  const [editMode, setEditMode] = useState(false);

  const offerings = catalog.data ?? [];

  const interestOptions = useMemo(() => {
    const fromApi = filterOfferingsByKind(offerings, 'interest').map((item) => item.title);
    return fromApi.length > 0 ? fromApi : FALLBACK_INTERESTS;
  }, [offerings]);

  useEffect(() => {
    if (interests.length === 0 && interestOptions[0]) {
      setInterests([interestOptions[0]]);
    }
  }, [interestOptions, interests.length]);

  const events = useMemo(() => {
    const fromApi = offerings.filter((item) => offeringKind(item) === 'event');
    return fromApi.length > 0 ? fromApi : FALLBACK_EVENTS;
  }, [offerings]);

  const trips = useMemo(() => {
    const fromApi = offerings.filter((item) => offeringKind(item) === 'tour');
    return fromApi.length > 0 ? fromApi : FALLBACK_TRIPS;
  }, [offerings]);

  const toggleInterest = (name: string) => {
    setInterests((prev) => {
      if (prev.includes(name)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== name);
      }
      return [...prev, name];
    });
  };

  const onBook = (item: ServiceOffering) => {
    const meta = parseOfferingMeta(item.metaJson);
    const when = meta.when ? ` · ${meta.when}` : '';
    const place = meta.place ? ` · ${meta.place}` : '';
    void submit(
      `Interest: ${item.title}${when}${place}. ${item.description || ''}`.trim(),
      'Interest noted',
    );
  };

  const onViewAll = (title: string, items: ServiceOffering[]) => {
    const lines = items.map((item) => `• ${item.title}`).join('\n');
    Alert.alert(title, lines || 'No items yet.');
  };

  const onFamilyPackages = () => {
    void submit(
      'Family trip packages enquiry. Please share exclusive packages for my family.',
      'Family packages enquiry sent',
    );
  };

  const onRequestCallback = () => {
    void submit(
      `Call back requested for Local Area Events & Trips. Interests: ${interests.join(', ') || 'none'}.`,
      'Call back requested',
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.liveContent} showsVerticalScrollIndicator={false}>
      <View style={styles.liveTitleRow}>
        <MarketplaceServiceIcon
          serviceId={SLUG}
          fallbackIcon="location"
          fallbackColor={familyHome.purple}
          size={40}
        />
        <Text style={styles.liveTitle}>Local Area Events & Trips</Text>
      </View>

      <View style={styles.block}>
        <View style={styles.interestsHead}>
          <Text style={styles.sectionTitle}>Your Interests</Text>
          <Pressable
            onPress={() => setEditMode((value) => !value)}
            style={styles.editBtn}
            accessibilityRole="button"
            accessibilityLabel={editMode ? 'Done editing interests' : 'Edit interests'}
          >
            {editMode ? (
              <Text style={styles.editBtnText}>Done</Text>
            ) : (
              <>
                <Text style={styles.editBtnText}>Edit</Text>
                <Icon name="create-outline" size={12} color={familyHome.blue} />
              </>
            )}
          </Pressable>
        </View>
        <Text style={styles.sectionHint}>Select your interests to get personalized recommendations.</Text>

        <View style={styles.chipWrap}>
          {interestOptions.map((name) => {
            const selected = interests.includes(name);
            const icon = interestIcon(name);
            return (
              <Pressable
                key={name}
                onPress={() => toggleInterest(name)}
                style={[
                  styles.interestChip,
                  selected ? styles.interestChipOn : null,
                  editMode ? styles.interestChipEditing : null,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={name}
              >
                <Icon
                  name={icon}
                  size={11}
                  color={selected ? familyHome.green : familyHome.muted}
                />
                <Text style={[styles.interestChipText, selected ? styles.interestChipTextOn : null]}>
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {catalog.isPending && !catalog.data?.length ? (
        <Text style={styles.empty}>Loading events…</Text>
      ) : null}
      {catalog.isError && !catalog.data?.length ? (
        <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
          <Text style={styles.viewAll}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}

      <OfferingSection
        title="Local Area Programs"
        subtitle="Events and activities near you based on your interests."
        items={events}
        kind="event"
        submitting={submitting}
        onBook={onBook}
        onViewAll={() => onViewAll('Local Area Programs', events)}
      />

      <OfferingSection
        title="Outstation Trips (For AgeWell Members)"
        subtitle="Explore curated senior-friendly tour packages with companion support."
        items={trips}
        kind="tour"
        submitting={submitting}
        onBook={onBook}
        onViewAll={() => onViewAll('Outstation Trips', trips)}
      />

      <Pressable
        onPress={onFamilyPackages}
        disabled={submitting}
        style={({ pressed }) => [
          styles.familyPromo,
          submitting ? styles.disabled : null,
          pressed ? styles.pressed : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Get Exclusive Trip Packages for Your Family"
      >
        <View style={styles.familyPromoIcon}>
          <Icon name="people-outline" size={16} color={familyHome.orange} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.familyPromoTitle}>Get Exclusive Trip Packages for Your Family</Text>
          <Text style={styles.familyPromoBody} numberOfLines={2}>
            Special discounted packages for AgeWell members' families.
          </Text>
        </View>
        <Icon name="chevron-forward" size={14} color="#B45309" />
      </Pressable>

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

      <View style={styles.aboutCard}>
        <View style={styles.aboutHead}>
          <View style={styles.aboutIcon}>
            <Icon name="help-circle-outline" size={12} color={familyHome.blue} />
          </View>
          <Text style={styles.aboutTitle}>About This Service</Text>
        </View>
        {ABOUT_BULLETS.map((line) => (
          <Text key={line} style={styles.aboutBullet}>
            • {line}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

function OfferingSection({
  title,
  subtitle,
  items,
  kind,
  submitting,
  onBook,
  onViewAll,
}: {
  title: string;
  subtitle: string;
  items: ServiceOffering[];
  kind: 'event' | 'tour';
  submitting: boolean;
  onBook: (item: ServiceOffering) => void;
  onViewAll: () => void;
}) {
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, styles.sectionTitleFlex]}>{title}</Text>
        <Pressable onPress={onViewAll} accessibilityRole="button">
          <Text style={styles.viewAll}>View All &gt;</Text>
        </Pressable>
      </View>
      <Text style={styles.sectionHint}>{subtitle}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.offerRow}
      >
        {items.map((item, index) => (
          <OfferingCard
            key={item.id}
            item={item}
            kind={kind}
            colorIndex={index}
            submitting={submitting}
            onPress={() => onBook(item)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function OfferingCard({
  item,
  kind,
  colorIndex,
  submitting,
  onPress,
}: {
  item: ServiceOffering;
  kind: 'event' | 'tour';
  colorIndex: number;
  submitting: boolean;
  onPress: () => void;
}) {
  const meta = parseOfferingMeta(item.metaJson);
  const tags = defaultTagsFor(item, kind);
  const thumbColor = THUMB_COLORS[colorIndex % THUMB_COLORS.length];
  const place = meta.place?.trim();
  const whenParts = splitWhen(meta.when);
  const duration = meta.duration?.trim();
  const shortBody =
    kind === 'tour'
      ? tags.length > 0
        ? `${tags[0]}${tags[1] ? `, ${tags[1].toLowerCase()}` : ''}`
        : item.description?.trim() || ''
      : '';

  return (
    <Pressable
      onPress={onPress}
      disabled={submitting}
      style={[styles.offerCard, submitting ? styles.disabled : null]}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View style={[styles.thumb, { backgroundColor: thumbColor }]}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.thumbImage} resizeMode="cover" />
        ) : (
          <Image source={heroImage} style={styles.thumbImage} resizeMode="cover" />
        )}
        {kind === 'event' && whenParts ? (
          <View style={styles.dateBadge}>
            <Text style={styles.dateDay}>{whenParts.day}</Text>
            <Text style={styles.dateMonth}>{whenParts.month}</Text>
          </View>
        ) : null}
        {kind === 'tour' && duration ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationBadgeText}>{duration}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>

      {kind === 'event' && place ? (
        <View style={styles.placeRow}>
          <Icon name="location" size={11} color={familyHome.muted} />
          <Text style={styles.placeText}>{place}</Text>
        </View>
      ) : null}

      {kind === 'tour' && shortBody ? (
        <Text style={styles.cardBody} numberOfLines={1}>
          {shortBody}
        </Text>
      ) : null}

      {tags.length > 0 ? (
        <View style={styles.tagRow}>
          {tags.slice(0, 2).map((tag) => {
            const tone = tagTone(tag);
            return (
              <View key={tag} style={[styles.tagChip, { backgroundColor: tone.soft }]}>
                <Text style={[styles.tagChipText, { color: tone.color }]}>{tag}</Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </Pressable>
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
    maxWidth: 220,
  },
  featuresCard: {
    flexDirection: 'row',
    backgroundColor: familyHome.blueSoft,
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
  featureTitle: {
    ...typography.captionStrong,
    color: familyHome.text,
    textAlign: 'center',
    fontSize: 11,
  },
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
    gap: 10,
    paddingTop: 4,
  },
  liveTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveTitle: { ...typography.title, color: familyHome.text, flex: 1, fontSize: 18, lineHeight: 22 },
  block: { gap: 4 },
  interestsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  editBtnText: { ...typography.captionStrong, color: familyHome.blue, fontSize: 12 },
  sectionBlock: { gap: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitle: { ...typography.subtitle, color: familyHome.text, fontSize: 14, lineHeight: 18 },
  sectionTitleFlex: { flex: 1 },
  sectionHint: { ...typography.caption, color: familyHome.muted, fontSize: 11, lineHeight: 14 },
  viewAll: { ...typography.captionStrong, color: familyHome.blue, fontSize: 11 },
  empty: { ...typography.caption, color: familyHome.muted, fontSize: 11 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: familyHome.white,
  },
  interestChipOn: {
    backgroundColor: familyHome.greenSoft,
    borderColor: familyHome.green,
  },
  interestChipEditing: { opacity: 1 },
  interestChipText: { ...typography.caption, color: familyHome.muted, fontSize: 11, lineHeight: 13 },
  interestChipTextOn: {
    ...typography.captionStrong,
    color: familyHome.greenDark,
    fontSize: 11,
    lineHeight: 13,
  },
  offerRow: { gap: 8, paddingTop: 2 },
  offerCard: {
    width: 142,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: familyHome.border,
    backgroundColor: familyHome.white,
    overflow: 'hidden',
    paddingBottom: 8,
  },
  thumb: {
    width: '100%',
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: { width: '100%', height: '100%' },
  dateBadge: {
    position: 'absolute',
    left: 6,
    top: 6,
    minWidth: 34,
    borderRadius: 7,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  dateDay: { ...typography.bodyStrong, color: familyHome.greenDark, fontSize: 12, lineHeight: 14 },
  dateMonth: { ...typography.caption, color: familyHome.muted, fontSize: 9, lineHeight: 10 },
  durationBadge: {
    position: 'absolute',
    right: 6,
    top: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationBadgeText: { ...typography.captionStrong, color: familyHome.white, fontSize: 9 },
  cardTitle: {
    ...typography.bodyStrong,
    color: familyHome.text,
    fontSize: 12,
    lineHeight: 15,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  placeText: { ...typography.caption, color: familyHome.muted, fontSize: 10, lineHeight: 12 },
  cardBody: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 10,
    lineHeight: 12,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingHorizontal: 8,
    marginTop: 5,
  },
  tagChip: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagChipText: { ...typography.captionStrong, fontSize: 9 },
  familyPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F5D0A9',
    backgroundColor: '#FFF6EB',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  familyPromoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyPromoTitle: { ...typography.bodyStrong, color: '#B45309', fontSize: 12, lineHeight: 15 },
  familyPromoBody: {
    ...typography.caption,
    color: '#9A6B3F',
    fontSize: 10,
    lineHeight: 13,
    marginTop: 1,
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
  aboutCard: {
    borderRadius: 12,
    backgroundColor: familyHome.blueSoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 3,
  },
  aboutHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aboutIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutTitle: { ...typography.bodyStrong, color: familyHome.text, fontSize: 13 },
  aboutBullet: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 11,
    lineHeight: 15,
  },
});

