import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '@/components/KeyboardAwareScrollView';
import { LoadingState, PrimaryButton, SecondaryButton } from '@/components';
import type { IconName } from '@/components/ui';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { useServiceRequests } from '@/features/home/hooks/queries';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
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

const heroImage = SERVICE_HERO_IMAGES.transport;

const SLUG = 'transport';
const LEAD = 'Well-trained driver assistance for outstation trips. Cost as per trip need.';
const LIVE_SUBTITLE = 'Safe & Comfortable Outstation Travel.';
const HERO_BODY =
  'Safe, comfortable outstation travel with well-trained drivers and care coordination.';
const PROMO_TITLE = 'Plan your outstation travel with ease';
const PROMO_BODY =
  'Reliable vehicles and verified drivers for a worry-free journey beyond the city.';
const NOTE_TEXT =
  'Please Note:\n• Charges apply as per trip need\n• Verified drivers only\n• Care manager monitors safety throughout the journey';

const GATE_FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'car-outline',
    title: 'Well-trained Drivers',
    body: 'Experienced and verified drivers',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Safe & Comfortable Travel',
    body: 'For a worry-free journey',
  },
  {
    icon: 'navigate',
    title: 'Flexible Destinations',
    body: 'Assistance for your outstation travel needs',
  },
  {
    icon: 'people-outline',
    title: 'Companion Coordination',
    body: 'Support with planning and arrangements',
  },
];

const VEHICLE_LOOKS: { match: RegExp; icon: IconName; color: string; soft: string }[] = [
  { match: /hatchback/i, icon: 'car-outline', color: familyHome.green, soft: familyHome.greenSoft },
  { match: /sedan/i, icon: 'car-outline', color: familyHome.blue, soft: familyHome.blueSoft },
  { match: /suv/i, icon: 'car-outline', color: familyHome.orange, soft: familyHome.orangeSoft },
  { match: /innova|crysta/i, icon: 'car-outline', color: familyHome.purple, soft: familyHome.purpleSoft },
  { match: /tempo|traveller/i, icon: 'car-outline', color: familyHome.greenDark, soft: familyHome.greenSoft },
];

function lookForVehicle(title: string) {
  for (const row of VEHICLE_LOOKS) {
    if (row.match.test(title)) return row;
  }
  return {
    icon: 'car-outline' as IconName,
    color: familyHome.purple,
    soft: familyHome.purpleSoft,
  };
}

function vehicleCapacityLabel(item: ServiceOffering) {
  return item.description || item.badge || item.priceLabel || '';
}

export function OutstationTransportScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(true);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Outstation Transport" showBack showProfile={false} showBell />

      {variant === 'serviceable_with_membership' ? (
        <MemberLiveBody />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.gateContent, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {variant === 'loading' ? <LoadingState message="Loading Outstation Transport..." /> : null}
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
        <Icon name="car-outline" size={22} color={familyHome.greenDark} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.title}>OUTSTATION TRANSPORT</Text>
        <Text style={styles.lead}>{LEAD}</Text>
      </View>
    </View>
  );
}

function GateHero({ tone }: { tone: 'outside' | 'membership' }) {
  const headline =
    tone === 'outside' ? (
      <>
        Explore More Places{'\n'}
        <Text style={styles.heroFullAccent}>with Confidence</Text>
      </>
    ) : (
      <>
        Travel Further{'\n'}
        <Text style={styles.heroFullAccent}>with Peace of Mind</Text>
      </>
    );

  return (
    <View style={styles.heroFull} accessibilityLabel="Outstation transport">
      <Image source={heroImage} style={styles.heroFullImage} resizeMode="cover" />
      <View style={styles.heroScrim} />
      <View style={styles.heroFullContent}>
        <View style={styles.heroFullCopy}>
          <Text style={styles.heroFullHeadline}>{headline}</Text>
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
      'Notify me when Outstation Transport is available in my area.',
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
            {MEMBERSHIP_SERVICE_AREA_LINE} Outstation Transport will become available in your area as we
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
              Outstation Transport is available only for AgeWell members.
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
              Get access to Outstation Transport and many other services for a safer, healthier and
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
  const requestsQuery = useServiceRequests();
  const { submitting, submit } = useMembershipSubmit(SLUG);
  const [selectedId, setSelectedId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [passengers, setPassengers] = useState('');
  const [roundTrip, setRoundTrip] = useState(false);
  const [driverStay, setDriverStay] = useState(false);

  const offerings = catalog.data ?? [];
  const selected = offerings.find((item) => item.id === selectedId) ?? offerings[0] ?? null;

  useEffect(() => {
    if (!selectedId && offerings[0]) setSelectedId(offerings[0].id);
  }, [offerings, selectedId]);

  const recent = useMemo(() => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    return toLiveRequestViews(mine, { fallbackTitle: 'Outstation trip', limit: 3 });
  }, [requestsQuery.data?.items]);

  const allCount = useMemo(
    () => filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG).length,
    [requestsQuery.data?.items],
  );

  const onViewAllTrips = () => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    const lines = toLiveRequestViews(mine, { fallbackTitle: 'Outstation trip', limit: 20 })
      .map((item) => `• ${item.title} — ${item.statusLabel} (${item.dateLabel})`)
      .join('\n');
    Alert.alert('My Trips', lines || 'No trips yet.');
  };

  const onSelectVehicle = (item: ServiceOffering) => {
    setSelectedId(item.id);
  };

  const onRequest = () => {
    if (!from.trim() || !to.trim()) {
      Alert.alert('Missing details', 'Please enter both Pickup and Drop locations.');
      return;
    }
    if (!selected) {
      Alert.alert('Select a vehicle', 'Choose a vehicle option first.');
      return;
    }
    void submit(
      [
        `Outstation ${selected.title}: ${from.trim()} → ${to.trim()}.`,
        `from: ${from.trim()}`,
        `to: ${to.trim()}`,
        date.trim() ? `date: ${date.trim()}` : null,
        time.trim() ? `time: ${time.trim()}` : null,
        passengers.trim() ? `passengers: ${passengers.trim()}` : null,
        `vehicle: ${selected.title}`,
        `roundTrip: ${roundTrip ? 'yes' : 'no'}`,
        `driverStay: ${driverStay ? 'yes' : 'no'}`,
      ]
        .filter(Boolean)
        .join(' · '),
      'Outstation ride requested',
    ).then((ok) => {
      if (ok) {
        setFrom('');
        setTo('');
        setDate('');
        setTime('');
        setPassengers('');
        setRoundTrip(false);
        setDriverStay(false);
      }
    });
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.liveContent} showsVerticalScrollIndicator={false}>
      <View style={styles.liveTitleRow}>
        <View style={styles.liveTitleIcon}>
          <Icon name="car-outline" size={22} color={familyHome.white} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.liveTitle}>Outstation Transport</Text>
          <Text style={styles.subtitle}>{LIVE_SUBTITLE}</Text>
        </View>
        <Pressable
          onPress={onViewAllTrips}
          style={styles.viewRequestsBtn}
          accessibilityRole="button"
          accessibilityLabel="My Trips"
        >
          <Icon name="document-text-outline" size={14} color={familyHome.green} />
          <Text style={styles.viewRequestsText}>My Trips</Text>
          <Icon name="chevron-forward" size={14} color={familyHome.green} />
        </Pressable>
      </View>

      <View style={styles.promoBanner}>
        <View style={styles.promoIcon}>
          <Icon name="navigate" size={18} color={familyHome.blue} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.promoTitle}>{PROMO_TITLE}</Text>
          <Text style={styles.promoBody}>{PROMO_BODY}</Text>
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Pickup Location</Text>
        <View style={styles.inputWrap}>
          <Icon name="location" size={16} color={familyHome.green} />
          <TextInput
            value={from}
            onChangeText={setFrom}
            placeholder="Enter pickup location"
            placeholderTextColor={familyHome.muted}
            style={styles.input}
            accessibilityLabel="Pickup Location"
          />
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Drop Location</Text>
        <View style={styles.inputWrap}>
          <Icon name="location" size={16} color={familyHome.red} />
          <TextInput
            value={to}
            onChangeText={setTo}
            placeholder="Enter destination"
            placeholderTextColor={familyHome.muted}
            style={styles.input}
            accessibilityLabel="Drop Location"
          />
        </View>
      </View>

      <View style={styles.fieldsRow}>
        <View style={styles.fieldThird}>
          <Text style={styles.fieldLabel}>Pickup Date</Text>
          <View style={styles.inputWrap}>
            <Icon name="calendar-outline" size={14} color={familyHome.blue} />
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="Date"
              placeholderTextColor={familyHome.muted}
              style={styles.inputCompact}
              accessibilityLabel="Pickup Date"
            />
          </View>
        </View>
        <View style={styles.fieldThird}>
          <Text style={styles.fieldLabel}>Pickup Time</Text>
          <View style={styles.inputWrap}>
            <Icon name="time-outline" size={14} color={familyHome.blue} />
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder="Time"
              placeholderTextColor={familyHome.muted}
              style={styles.inputCompact}
              accessibilityLabel="Pickup Time"
            />
          </View>
        </View>
        <View style={styles.fieldThird}>
          <Text style={styles.fieldLabel}>No. of Passengers</Text>
          <View style={styles.inputWrap}>
            <Icon name="person-outline" size={14} color={familyHome.blue} />
            <TextInput
              value={passengers}
              onChangeText={setPassengers}
              placeholder="Pax"
              placeholderTextColor={familyHome.muted}
              style={styles.inputCompact}
              keyboardType="number-pad"
              accessibilityLabel="Number of passengers"
            />
          </View>
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Select Vehicle Option</Text>
        <Text style={styles.sectionHint}>Choose a vehicle that fits your trip and group size.</Text>
      </View>

      {catalog.isPending ? <Text style={styles.empty}>Loading vehicles…</Text> : null}
      {catalog.isError ? (
        <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
          <Text style={styles.viewAll}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicesRow}>
        {offerings.map((item) => {
          const look = lookForVehicle(item.title);
          const active = item.id === (selectedId || offerings[0]?.id);
          const capacity = vehicleCapacityLabel(item);
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelectVehicle(item)}
              style={[styles.vehicleCard, active ? styles.vehicleCardActive : null]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.title}
            >
              {active ? (
                <View style={styles.checkBadge}>
                  <Icon name="checkmark" size={12} color={familyHome.white} />
                </View>
              ) : null}
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.vehicleImage} resizeMode="cover" />
              ) : (
                <View style={[styles.vehiclePlaceholder, { backgroundColor: look.soft }]}>
                  <Icon name={look.icon} size={28} color={look.color} />
                </View>
              )}
              <Text style={styles.vehicleTitle} numberOfLines={2}>
                {item.title}
              </Text>
              {capacity ? (
                <Text style={styles.vehicleDesc} numberOfLines={2}>
                  {capacity}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.toggleRow}>
        <View style={styles.toggleCard}>
          <View style={styles.flex}>
            <Text style={styles.toggleTitle}>Round Trip</Text>
            <Text style={styles.toggleBody}>Return to pickup</Text>
          </View>
          <Switch
            value={roundTrip}
            onValueChange={setRoundTrip}
            trackColor={{ false: familyHome.border, true: familyHome.green }}
            thumbColor={familyHome.white}
            accessibilityLabel="Round Trip"
          />
        </View>
        <View style={styles.toggleCard}>
          <View style={styles.flex}>
            <Text style={styles.toggleTitle}>Driver Stay</Text>
            <Text style={styles.toggleBody}>Overnight stay</Text>
          </View>
          <Switch
            value={driverStay}
            onValueChange={setDriverStay}
            trackColor={{ false: familyHome.border, true: familyHome.green }}
            thumbColor={familyHome.white}
            accessibilityLabel="Driver Stay"
          />
        </View>
      </View>

      <Pressable
        style={[styles.callCta, submitting ? styles.disabled : null]}
        onPress={onRequest}
        disabled={submitting}
        accessibilityRole="button"
        accessibilityLabel="Request Ride"
      >
        <Icon name="car-outline" size={18} color={familyHome.white} />
        <Text style={styles.callCtaText}>{submitting ? 'Sending…' : 'Request Ride'}</Text>
      </Pressable>

      <View style={styles.noteBox}>
        <Icon name="help-circle-outline" size={16} color={familyHome.blue} />
        <Text style={styles.noteText}>{NOTE_TEXT}</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Trips</Text>
        {allCount > 0 ? (
          <Pressable onPress={onViewAllTrips} accessibilityRole="button">
            <Text style={styles.viewAll}>View All &gt;</Text>
          </Pressable>
        ) : null}
      </View>

      {requestsQuery.isPending ? <Text style={styles.empty}>Loading trips…</Text> : null}
      {!requestsQuery.isPending && recent.length === 0 ? (
        <Text style={styles.empty}>No trips yet. Request a ride above.</Text>
      ) : null}

      <View>
        {recent.map((item, index) => {
          const look = lookForVehicle(item.title);
          const tone = liveRequestToneMeta(item.tone);
          return (
            <View
              key={item.id}
              style={[styles.requestRow, index < recent.length - 1 ? styles.requestDivider : null]}
            >
              <View style={[styles.requestIcon, { backgroundColor: look.soft }]}>
                <Icon name={look.icon} size={18} color={look.color} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.requestTitle}>{item.title}</Text>
                <Text style={styles.requestDate}>{item.dateLabel}</Text>
                <Text style={styles.requestDetail} numberOfLines={2}>
                  {item.detail}
                </Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: tone.soft }]}>
                <Text style={[styles.statusPillText, { color: tone.color }]}>{item.statusLabel}</Text>
              </View>
              <Icon name="chevron-forward" size={18} color={familyHome.muted} />
            </View>
          );
        })}
      </View>
    </KeyboardAwareScrollView>
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
    maxWidth: 260,
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
    gap: spacing.lg,
    paddingTop: spacing.sm,
  },
  liveTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  liveTitleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: familyHome.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewRequestsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: familyHome.green,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  viewRequestsText: {
    ...typography.captionStrong,
    color: familyHome.green,
    fontSize: 11,
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  promoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoTitle: { ...typography.bodyStrong, color: familyHome.blueDark },
  promoBody: { ...typography.caption, color: familyHome.text, marginTop: 4, lineHeight: 18 },
  sectionBlock: { gap: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { ...typography.subtitle, color: familyHome.text },
  sectionHint: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  viewAll: { ...typography.captionStrong, color: familyHome.blue },
  empty: { ...typography.caption, color: familyHome.muted },
  fieldBlock: { gap: 4 },
  fieldLabel: { ...typography.captionStrong, color: familyHome.muted, marginBottom: 4 },
  fieldsRow: { flexDirection: 'row', gap: spacing.sm },
  fieldThird: { flex: 1 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: familyHome.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: familyHome.border,
    paddingHorizontal: spacing.sm,
    minHeight: 46,
  },
  input: {
    flex: 1,
    ...typography.caption,
    color: familyHome.text,
    paddingVertical: 8,
  },
  inputCompact: {
    flex: 1,
    ...typography.caption,
    color: familyHome.text,
    paddingVertical: 8,
    fontSize: 12,
  },
  servicesRow: { gap: spacing.sm, paddingVertical: 2 },
  vehicleCard: {
    width: 132,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: familyHome.border,
    backgroundColor: familyHome.white,
    padding: spacing.sm,
    gap: 6,
    position: 'relative',
  },
  vehicleCardActive: {
    borderColor: familyHome.green,
    backgroundColor: familyHome.greenSoft,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleImage: {
    width: '100%',
    height: 72,
    borderRadius: 12,
    backgroundColor: familyHome.border,
  },
  vehiclePlaceholder: {
    width: '100%',
    height: 72,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleTitle: {
    ...typography.captionStrong,
    color: familyHome.text,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 15,
  },
  vehicleDesc: {
    ...typography.caption,
    color: familyHome.muted,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 13,
  },
  toggleRow: { flexDirection: 'row', gap: spacing.sm },
  toggleCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D7ECD8',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  toggleTitle: { ...typography.captionStrong, color: familyHome.text },
  toggleBody: { ...typography.caption, color: familyHome.muted, fontSize: 10, marginTop: 2 },
  callCta: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  callCtaText: { ...typography.bodyStrong, color: familyHome.white },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 12,
    padding: spacing.md,
  },
  noteText: { ...typography.caption, color: familyHome.text, flex: 1, lineHeight: 18 },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  requestDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: familyHome.border,
  },
  requestIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestTitle: { ...typography.bodyStrong, color: familyHome.text },
  requestDate: { ...typography.caption, color: familyHome.muted, marginTop: 2 },
  requestDetail: { ...typography.caption, color: familyHome.muted, marginTop: 2 },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: { ...typography.captionStrong, fontSize: 11 },
});
