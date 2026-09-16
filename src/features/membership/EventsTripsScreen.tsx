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
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingState, PrimaryButton, SecondaryButton } from '@/components';
import type { IconName } from '@/components/ui';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
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
const LIVE_SUBTITLE = 'Stay Active. Stay Connected.';

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
    icon: 'cart-outline',
    title: 'Companion Assistance',
    body: 'Support with luggage, boarding, seating & hotel check-in/out',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Health & Safety Support',
    body: 'Assistance with medication & emergency support',
  },
];

type CategoryKey = 'local' | 'family' | 'senior';

const CATEGORIES: {
  key: CategoryKey;
  title: string;
  body: string;
  icon: IconName;
  color: string;
  soft: string;
}[] = [
  {
    key: 'local',
    title: 'Local Area Programs',
    body: 'Events and activities happening near you based on your interests.',
    icon: 'calendar-outline',
    color: familyHome.green,
    soft: familyHome.greenSoft,
  },
  {
    key: 'family',
    title: 'Family Tour Packages',
    body: 'Explore curated tour packages for you and your family.',
    icon: 'navigate',
    color: familyHome.blue,
    soft: familyHome.blueSoft,
  },
  {
    key: 'senior',
    title: 'Senior Citizen Tours',
    body: 'Travel together with AgeWell members and our companion support.',
    icon: 'people-outline',
    color: familyHome.red,
    soft: familyHome.redSoft,
  },
];

const THUMB_COLORS = ['#7B9E87', '#5B7C99', '#8B6B8A', '#C4A35A', '#6A8F6B', '#9B6B5A'];

function offeringKind(item: ServiceOffering): 'event' | 'tour' | 'senior' {
  const kind = parseOfferingMeta(item.metaJson).kind?.toLowerCase();
  if (kind === 'senior') return 'senior';
  if (kind === 'tour' || kind === 'family' || kind === 'trip') return 'tour';
  return 'event';
}

function splitTags(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function EventsTripsScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(true);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Local Area Events & Trips" showBack showProfile={false} showBell />

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
      <View style={styles.titleIcon}>
        <Icon name="location" size={22} color={familyHome.greenDark} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.title}>LOCAL EVENTS & TRIPS</Text>
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
      <Pressable
        onPress={() => router.push('/account/help' as Href)}
        style={({ pressed }) => [styles.helpBannerGreen, pressed ? styles.pressed : null]}
        accessibilityRole="button"
      >
        <View style={styles.helpIconGreen}>
          <Icon name="help-circle-outline" size={16} color={familyHome.white} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.helpTitleGreen}>Have Questions?</Text>
          <Text style={styles.helpBodyGreen}>Our team is here to help. Reach out to us anytime.</Text>
        </View>
        <Icon name="chevron-forward" size={16} color={familyHome.greenDark} />
      </Pressable>
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
      <Pressable
        onPress={() => router.push('/account/help' as Href)}
        style={({ pressed }) => [styles.helpBanner, pressed ? styles.pressed : null]}
        accessibilityRole="button"
      >
        <View style={styles.contactIcon}>
          <Icon name="help-circle-outline" size={16} color={familyHome.white} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.helpTitle}>Have Questions?</Text>
          <Text style={styles.helpBody}>Our team is here to help. Reach out to us anytime.</Text>
        </View>
        <Icon name="chevron-forward" size={16} color={familyHome.blue} />
      </Pressable>
    </View>
  );
}

function MemberLiveBody() {
  const catalog = useServiceOfferings(SLUG);
  const { submitting, submit } = useMembershipSubmit(SLUG);
  const [interests, setInterests] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null);

  const offerings = catalog.data ?? [];
  const interestOptions = useMemo(
    () => filterOfferingsByKind(offerings, 'interest').map((item) => item.title),
    [offerings],
  );

  useEffect(() => {
    if (interests.length === 0 && interestOptions[0]) {
      setInterests([interestOptions[0]]);
    }
  }, [interestOptions, interests.length]);

  const events = useMemo(
    () => offerings.filter((item) => offeringKind(item) === 'event'),
    [offerings],
  );
  const tours = useMemo(
    () => offerings.filter((item) => offeringKind(item) === 'tour'),
    [offerings],
  );
  const seniors = useMemo(
    () => offerings.filter((item) => offeringKind(item) === 'senior'),
    [offerings],
  );

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
      `Book interest: ${item.title}${when}${place}. ${item.description || ''}`.trim(),
      'Booking interest noted',
    );
  };

  const onViewAll = (title: string, items: ServiceOffering[]) => {
    const lines = items.map((item) => `• ${item.title}`).join('\n');
    Alert.alert(title, lines || 'No items yet.');
  };

  return (
    <ScrollView contentContainerStyle={styles.liveContent} showsVerticalScrollIndicator={false}>
      <View style={styles.liveTitleRow}>
        <View style={styles.liveTitleIcon}>
          <Icon name="location" size={22} color={familyHome.white} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.liveTitle}>Local Area Events & Trips</Text>
          <Text style={styles.subtitle}>{LIVE_SUBTITLE}</Text>
        </View>
      </View>

      <View style={styles.discoveryBox}>
        <View style={styles.discoveryIcon}>
          <Icon name="people-outline" size={18} color={familyHome.blue} />
        </View>
        <Text style={styles.discoveryText}>
          Discover curated programs matched to your interests — local events, family tours and senior citizen
          trips with AgeWell companion support.
        </Text>
      </View>

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
              <Icon name="create-outline" size={14} color={familyHome.blue} />
              <Text style={styles.editBtnText}>Edit</Text>
            </>
          )}
        </Pressable>
      </View>
      <Text style={styles.sectionHint}>Select your interests to get personalized recommendations.</Text>

      {interestOptions.length > 0 ? (
      <View style={styles.chipWrap}>
        {interestOptions.map((name) => {
          const selected = interests.includes(name);
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
              <Text style={[styles.interestChipText, selected ? styles.interestChipTextOn : null]}>
                {name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      ) : (
        <Text style={styles.sectionHint}>Interest options will appear here once configured in the catalog.</Text>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {CATEGORIES.map((item) => {
          const selected = activeCategory === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setActiveCategory((prev) => (prev === item.key ? null : item.key))}
              style={[
                styles.categoryCard,
                { backgroundColor: item.soft, borderColor: selected ? item.color : 'transparent' },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={item.title}
            >
              <View style={[styles.categoryIcon, { backgroundColor: familyHome.white }]}>
                <Icon name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={[styles.categoryTitle, { color: item.color }]}>{item.title}</Text>
              <Text style={styles.categoryBody}>{item.body}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {catalog.isPending ? <Text style={styles.empty}>Loading events…</Text> : null}
      {catalog.isError ? (
        <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
          <Text style={styles.viewAll}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}

      {events.length > 0 ? (
        <OfferingSection
          title="Recommended for You"
          items={events}
          kind="event"
          submitting={submitting}
          onBook={onBook}
          onViewAll={() => onViewAll('Recommended for You', events)}
          highlight={activeCategory === 'local'}
        />
      ) : null}

      {tours.length > 0 ? (
        <OfferingSection
          title="Popular Tour Packages"
          items={tours}
          kind="tour"
          submitting={submitting}
          onBook={onBook}
          onViewAll={() => onViewAll('Popular Tour Packages', tours)}
          highlight={activeCategory === 'family'}
        />
      ) : null}

      {seniors.length > 0 ? (
        <OfferingSection
          title="Upcoming Senior Citizen Tours"
          items={seniors}
          kind="senior"
          submitting={submitting}
          onBook={onBook}
          onViewAll={() => onViewAll('Upcoming Senior Citizen Tours', seniors)}
          highlight={activeCategory === 'senior'}
        />
      ) : null}

      {!catalog.isPending && events.length === 0 && tours.length === 0 && seniors.length === 0 ? (
        <Text style={styles.empty}>Events and tours will appear here soon.</Text>
      ) : null}

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Important Note</Text>
        <Text style={styles.noteBullet}>
          • Local area programs are part of your AgeWell membership (as per plan).
        </Text>
        <Text style={styles.noteBullet}>
          • Family tour packages and Senior Citizen Tours are charged separately.
        </Text>
        <Text style={styles.noteBullet}>
          • Contact for personalized locations or custom tour inquiries.
        </Text>
      </View>
    </ScrollView>
  );
}

function OfferingSection({
  title,
  items,
  kind,
  submitting,
  onBook,
  onViewAll,
  highlight,
}: {
  title: string;
  items: ServiceOffering[];
  kind: 'event' | 'tour' | 'senior';
  submitting: boolean;
  onBook: (item: ServiceOffering) => void;
  onViewAll: () => void;
  highlight: boolean;
}) {
  return (
    <View style={[styles.sectionBlock, highlight ? styles.sectionHighlight : null]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Pressable onPress={onViewAll} accessibilityRole="button">
          <Text style={styles.viewAll}>View All &gt;</Text>
        </Pressable>
      </View>
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
  kind: 'event' | 'tour' | 'senior';
  colorIndex: number;
  submitting: boolean;
  onPress: () => void;
}) {
  const meta = parseOfferingMeta(item.metaJson);
  const tags = splitTags(meta.tags);
  const thumbColor = THUMB_COLORS[colorIndex % THUMB_COLORS.length];
  const place = meta.place?.trim();
  const when = meta.when?.trim();
  const duration = meta.duration?.trim();

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
          <Icon name="location" size={28} color="rgba(255,255,255,0.45)" />
        )}
        {kind === 'event' && place ? (
          <View style={styles.placeBadge}>
            <Icon name="location" size={10} color={familyHome.white} />
            <Text style={styles.placeBadgeText}>{place}</Text>
          </View>
        ) : null}
        {(kind === 'tour' || kind === 'senior') && duration ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationBadgeText}>{duration}</Text>
          </View>
        ) : null}
      </View>

      {kind === 'event' && when ? <Text style={styles.cardMeta}>{when}</Text> : null}
      {kind === 'senior' && when ? <Text style={styles.cardMeta}>{when}</Text> : null}

      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>

      {kind === 'event' && item.description ? (
        <Text style={styles.cardBody} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      {kind === 'event' ? (
        <View style={styles.localBadge}>
          <Text style={styles.localBadgeText}>{item.badge || 'Local Event'}</Text>
        </View>
      ) : null}

      {(kind === 'tour' || kind === 'senior') && tags.length > 0 ? (
        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagChipText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {(kind === 'tour' || kind === 'senior') && tags.length === 0 && item.badge ? (
        <View style={styles.tagChip}>
          <Text style={styles.tagChipText}>{item.badge}</Text>
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
    borderRadius: 18,
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
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  liveTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  liveTitleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: familyHome.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoveryBox: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'flex-start',
  },
  discoveryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoveryText: { ...typography.caption, color: familyHome.text, lineHeight: 18, flex: 1 },
  interestsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  editBtnText: { ...typography.captionStrong, color: familyHome.blue },
  sectionBlock: { gap: spacing.sm },
  sectionHighlight: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: familyHome.blue,
    padding: spacing.md,
    marginHorizontal: -spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { ...typography.subtitle, color: familyHome.text },
  sectionHint: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  viewAll: { ...typography.captionStrong, color: familyHome.blue },
  empty: { ...typography.caption, color: familyHome.muted },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  interestChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: familyHome.border,
    backgroundColor: familyHome.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  interestChipOn: {
    backgroundColor: familyHome.greenSoft,
    borderColor: familyHome.green,
  },
  interestChipEditing: {
    borderStyle: 'dashed',
  },
  interestChipText: { ...typography.captionStrong, color: familyHome.muted },
  interestChipTextOn: { color: familyHome.greenDark },
  categoryRow: { gap: spacing.md, paddingVertical: 2 },
  categoryCard: {
    width: 168,
    borderRadius: 16,
    borderWidth: 2,
    padding: spacing.md,
    gap: 8,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: { ...typography.captionStrong, fontSize: 13 },
  categoryBody: { ...typography.caption, color: familyHome.muted, lineHeight: 16, fontSize: 11 },
  offerRow: { gap: spacing.md, paddingVertical: 2 },
  offerCard: {
    width: 196,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: familyHome.border,
    backgroundColor: familyHome.white,
    padding: spacing.sm,
    gap: 6,
  },
  thumb: {
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  thumbImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  placeBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  placeBadgeText: { ...typography.captionStrong, color: familyHome.white, fontSize: 10 },
  durationBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  durationBadgeText: { ...typography.captionStrong, color: familyHome.white, fontSize: 10 },
  cardMeta: { ...typography.caption, color: familyHome.muted, fontSize: 11 },
  cardTitle: { ...typography.bodyStrong, color: familyHome.text, lineHeight: 20, fontSize: 14 },
  cardBody: { ...typography.caption, color: familyHome.muted, lineHeight: 16 },
  localBadge: {
    alignSelf: 'flex-start',
    backgroundColor: familyHome.greenSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  localBadgeText: { ...typography.captionStrong, color: familyHome.greenDark, fontSize: 11 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagChip: {
    backgroundColor: familyHome.blueSoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagChipText: { ...typography.captionStrong, color: familyHome.blue, fontSize: 10 },
  noteCard: {
    borderRadius: 16,
    backgroundColor: familyHome.blueSoft,
    padding: spacing.lg,
    gap: 6,
  },
  noteTitle: { ...typography.subtitle, color: familyHome.text, marginBottom: 4 },
  noteBullet: { ...typography.caption, color: familyHome.text, lineHeight: 18 },
});
