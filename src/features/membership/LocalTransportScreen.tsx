import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
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

const heroImage = SERVICE_HERO_IMAGES['local-transport'];

const SLUG = 'local-transport';
const LEAD = 'Companion supported coordination between cabs and rikshaws.';
const LIVE_SUBTITLE = 'Companion supported coordination between cabs and rikshaws.';
const DEFAULT_ABOUT =
  'Our companion supports pick-up and drop coordination for local cab and rikshaw travel. Ride charges apply as per the actual trip.';
const NOTE_TEXT =
  'Please Note:\n• Companion supports pick-up and drop\n• Charges apply as per the ride';

const GATE_FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'car-outline', title: 'Cab Booking Support', body: 'Assistance in booking cabs' },
  { icon: 'bike', title: 'Rikshaw Coordination', body: 'Help in arranging autos/rikshaws' },
  { icon: 'person-outline', title: 'Companion Assistance', body: 'Support during pick-up and drop' },
  { icon: 'location', title: 'Reliable Travel', body: 'For your safe and comfortable local travel' },
];

const SERVICE_LOOKS: { match: RegExp; icon: IconName; color: string; soft: string }[] = [
  { match: /cab|taxi|car/i, icon: 'car-outline', color: familyHome.green, soft: familyHome.greenSoft },
  { match: /rickshaw|rikshaw|auto/i, icon: 'bike', color: familyHome.blue, soft: familyHome.blueSoft },
];

function lookForService(title: string) {
  for (const row of SERVICE_LOOKS) {
    if (row.match.test(title)) return row;
  }
  return {
    icon: 'car-outline' as IconName,
    color: familyHome.green,
    soft: familyHome.greenSoft,
  };
}

export function LocalTransportScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(true);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Local Area Transportation" showBack showProfile={false} showBell />

      {variant === 'serviceable_with_membership' ? (
        <MemberLiveBody />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.gateContent, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {variant === 'loading' ? <LoadingState message="Loading Local Area Transportation..." /> : null}
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
        <Text style={styles.title}>LOCAL AREA TRANSPORTATION</Text>
        <Text style={styles.lead}>{LEAD}</Text>
      </View>
    </View>
  );
}

function GateHero({ tone }: { tone: 'outside' | 'membership' }) {
  const headline =
    tone === 'outside' ? (
      <>
        Getting You Where You{'\n'}
        <Text style={styles.heroFullAccent}>Need to Be</Text>
      </>
    ) : (
      <>
        Get Around Your Area{'\n'}
        <Text style={styles.heroFullAccent}>with Ease</Text>
      </>
    );
  const body =
    tone === 'outside'
      ? 'Companion-supported cab and rikshaw coordination for your local trips.'
      : 'Safe, reliable local travel with companion-supported cab and rikshaw help.';

  return (
    <View style={styles.heroFull} accessibilityLabel="Local area transportation">
      <Image source={heroImage} style={styles.heroFullImage} resizeMode="cover" />
      <View style={styles.heroScrim} />
      <View style={styles.heroFullContent}>
        <View style={styles.heroFullCopy}>
          <Text style={styles.heroFullHeadline}>{headline}</Text>
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
      'Notify me when Local Area Transportation is available in my area.',
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
            {MEMBERSHIP_SERVICE_AREA_LINE} Local Area Transportation will become available in your area as we
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
              Local Area Transportation is available only for AgeWell members.
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
              Get access to Local Area Transportation and many other services for a safer, healthier and
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
  const [when, setWhen] = useState('');

  const offerings = catalog.data ?? [];
  const selected = offerings.find((item) => item.id === selectedId) ?? offerings[0] ?? null;

  useEffect(() => {
    if (!selectedId && offerings[0]) setSelectedId(offerings[0].id);
  }, [offerings, selectedId]);

  const recent = useMemo(() => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    return toLiveRequestViews(mine, { fallbackTitle: 'Local ride', limit: 3 });
  }, [requestsQuery.data?.items]);

  const allCount = useMemo(
    () => filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG).length,
    [requestsQuery.data?.items],
  );

  const onViewAllRequests = () => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    const lines = toLiveRequestViews(mine, { fallbackTitle: 'Local ride', limit: 20 })
      .map((item) => `• ${item.title} — ${item.statusLabel} (${item.dateLabel})`)
      .join('\n');
    Alert.alert('My Requests', lines || 'No requests yet.');
  };

  const onSelectOption = (item: ServiceOffering) => {
    setSelectedId(item.id);
  };

  const onRequest = () => {
    if (!from.trim() || !to.trim()) {
      Alert.alert('Missing details', 'Please enter both From and To locations.');
      return;
    }
    if (!selected) {
      Alert.alert('Select an option', 'Choose a transport option first.');
      return;
    }
    void submit(
      [
        `Local ${selected.title}: ${from.trim()} → ${to.trim()}.`,
        when.trim() ? `Preferred: ${when.trim()}.` : null,
      ]
        .filter(Boolean)
        .join(' '),
      'Local transport requested',
    ).then((ok) => {
      if (ok) {
        setFrom('');
        setTo('');
        setWhen('');
      }
    });
  };

  const ctaLabel = /rickshaw|rikshaw|auto/i.test(selected?.title ?? '')
    ? 'Request Coordination'
    : 'Request Ride';

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.liveContent} showsVerticalScrollIndicator={false}>
      <View style={styles.liveTitleRow}>
        <View style={styles.liveTitleIcon}>
          <Icon name="car-outline" size={22} color={familyHome.white} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.liveTitle}>Local Area Transportation</Text>
          <Text style={styles.subtitle}>{LIVE_SUBTITLE}</Text>
        </View>
        <Pressable
          onPress={onViewAllRequests}
          style={styles.viewRequestsBtn}
          accessibilityRole="button"
          accessibilityLabel="View My Requests"
        >
          <Icon name="document-text-outline" size={14} color={familyHome.green} />
          <Text style={styles.viewRequestsText}>View My{'\n'}Requests</Text>
          <Icon name="chevron-forward" size={14} color={familyHome.green} />
        </Pressable>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Select Transport Option</Text>
        <Text style={styles.sectionHint}>Choose cab or rikshaw assistance for your trip.</Text>
      </View>

      {catalog.isPending ? <Text style={styles.empty}>Loading options…</Text> : null}
      {catalog.isError ? (
        <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
          <Text style={styles.viewAll}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicesRow}>
        {offerings.map((item) => {
          const look = lookForService(item.title);
          const active = item.id === (selectedId || offerings[0]?.id);
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelectOption(item)}
              style={[
                styles.serviceChip,
                { backgroundColor: look.soft, borderColor: active ? look.color : 'transparent' },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.title}
            >
              <Icon name={look.icon} size={22} color={look.color} />
              <Text style={[styles.serviceChipLabel, { color: look.color }]} numberOfLines={2}>
                {item.title}
              </Text>
              {item.description ? (
                <Text style={styles.serviceChipSub} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.formCard}>
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>From</Text>
          <View style={styles.inputWrap}>
            <Icon name="location" size={16} color={familyHome.green} />
            <TextInput
              value={from}
              onChangeText={setFrom}
              placeholder="Enter pickup location"
              placeholderTextColor={familyHome.muted}
              style={styles.input}
              accessibilityLabel="From"
            />
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>To</Text>
          <View style={styles.inputWrap}>
            <Icon name="location" size={16} color={familyHome.blue} />
            <TextInput
              value={to}
              onChangeText={setTo}
              placeholder="Enter destination"
              placeholderTextColor={familyHome.muted}
              style={styles.input}
              accessibilityLabel="To"
            />
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Preferred Date & Time (optional)</Text>
          <View style={styles.inputWrap}>
            <Icon name="calendar-outline" size={16} color={familyHome.blue} />
            <TextInput
              value={when}
              onChangeText={setWhen}
              placeholder="Select date & time"
              placeholderTextColor={familyHome.muted}
              style={styles.input}
              accessibilityLabel="Preferred date and time"
            />
            <Icon name="chevron-forward" size={14} color={familyHome.muted} />
          </View>
        </View>

        <Pressable
          style={[styles.callCta, submitting ? styles.disabled : null]}
          onPress={onRequest}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
        >
          <Icon name="car-outline" size={18} color={familyHome.white} />
          <Text style={styles.callCtaText}>{submitting ? 'Sending…' : ctaLabel}</Text>
        </Pressable>
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
        <Text style={styles.empty}>No requests yet. Request a ride above.</Text>
      ) : null}

      <View>
        {recent.map((item, index) => {
          const look = lookForService(item.title);
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

      <View style={styles.aboutCard}>
        <View style={styles.aboutRow}>
          <View style={styles.aboutIcon}>
            <Icon name="help-circle-outline" size={18} color={familyHome.blue} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.aboutTitle}>About This Service</Text>
            <Text style={styles.aboutText}>{DEFAULT_ABOUT}</Text>
          </View>
        </View>
      </View>

      <View style={styles.noteBox}>
        <Icon name="help-circle-outline" size={16} color={familyHome.blue} />
        <Text style={styles.noteText}>{NOTE_TEXT}</Text>
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
    backgroundColor: familyHome.green,
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
    maxWidth: 108,
  },
  viewRequestsText: {
    ...typography.captionStrong,
    color: familyHome.green,
    fontSize: 10,
    lineHeight: 13,
  },
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
  servicesRow: { gap: spacing.sm, paddingVertical: 2 },
  serviceChip: {
    width: 140,
    minHeight: 118,
    borderRadius: 16,
    borderWidth: 2,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  serviceChipLabel: {
    ...typography.captionStrong,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 14,
  },
  serviceChipSub: {
    ...typography.caption,
    color: familyHome.muted,
    textAlign: 'center',
    fontSize: 9,
    lineHeight: 12,
  },
  formCard: {
    borderRadius: 18,
    backgroundColor: familyHome.greenSoft,
    borderWidth: 1,
    borderColor: '#D7ECD8',
    padding: spacing.lg,
    gap: spacing.md,
  },
  fieldBlock: { gap: 4 },
  fieldLabel: { ...typography.captionStrong, color: familyHome.muted, marginBottom: 4 },
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
  aboutCard: {
    borderRadius: 16,
    backgroundColor: familyHome.blueSoft,
    padding: spacing.lg,
  },
  aboutRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  aboutIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutTitle: { ...typography.subtitle, color: familyHome.text, marginBottom: 4 },
  aboutText: { ...typography.body, color: familyHome.muted, lineHeight: 22 },
});
