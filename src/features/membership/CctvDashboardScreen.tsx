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
import { router, type Href } from 'expo-router';
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
import { MEMBERSHIP_SERVICE_AREA_LINE } from './membershipServicePageVariant';
import { membershipPurchaseHref } from './planCatalog';
import { SERVICE_HERO_IMAGES } from './serviceHeroes';
import { useMembershipServicePageVariant } from './useMembershipServicePageVariant';
import { filterOfferingsByKind, parseOfferingMeta } from './catalogTypes';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useServiceOfferings } from './useCatalog';

const heroImage = SERVICE_HERO_IMAGES.cctv;

const SLUG = 'cctv';
const LEAD = 'Entrance CCTV camera coverage available on-app activity.';
const LIVE_SUBTITLE = "See who's at your door, anytime.";

const GATE_FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'eye-outline',
    title: 'Live View',
    body: 'Check your entrance anytime on the app',
  },
  {
    icon: 'notifications-outline',
    title: 'Instant Alerts',
    body: 'Get notified of activity',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Enhanced Security',
    body: 'A safer home for you and your loved ones',
  },
  {
    icon: 'phone-portrait-outline',
    title: 'Easy Access',
    body: 'View on your mobile, anytime, anywhere',
  },
];

type Panel = 'home' | 'live' | 'recordings';

const HOME_ACTIONS: { icon: IconName; title: string; action: 'live' | 'recordings' | 'settings' | 'help' }[] = [
  { icon: 'eye-outline', title: 'Live View', action: 'live' },
  { icon: 'time-outline', title: 'Past Recordings', action: 'recordings' },
  { icon: 'settings-outline', title: 'Camera Settings', action: 'settings' },
  { icon: 'help-circle-outline', title: 'Help & Support', action: 'help' },
];

const LIVE_CONTROLS: { icon: IconName; label: string; tip: string; togglesSound?: boolean }[] = [
  { icon: 'music', label: 'Sound On', tip: 'Sound is available when the live stream is connected.', togglesSound: true },
  { icon: 'chatbubble-outline', label: 'Talk', tip: 'Use Talk to speak to the person at your door.' },
  { icon: 'camera-outline', label: 'Snapshot', tip: 'Snapshot captures a still from the live view.' },
  { icon: 'play', label: 'Record', tip: 'Recording starts when your camera hardware is linked.' },
  { icon: 'ellipsis-horizontal', label: 'More', tip: 'More camera options will appear here soon.' },
];

const DATE_FILTERS = ['Today', 'Yesterday', 'This Week'] as const;

function isCameraOffering(item: { metaJson: string | null }) {
  const kind = parseOfferingMeta(item.metaJson).kind?.toLowerCase();
  return kind === 'camera' || !kind;
}

function matchesDateFilter(when: string, filter: (typeof DATE_FILTERS)[number] | 'all'): boolean {
  if (filter === 'all') return true;
  const lower = when.toLowerCase();
  if (filter === 'Today') return lower.startsWith('today');
  if (filter === 'Yesterday') return lower.startsWith('yesterday');
  return !lower.startsWith('today') && !lower.startsWith('yesterday');
}

export function CctvDashboardScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(true);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {variant === 'serviceable_with_membership' ? (
        <MemberLiveBody />
      ) : (
        <>
          <ServicePageHeader />
          <ScrollView
            contentContainerStyle={[styles.gateContent, { paddingBottom: bottomPad }]}
            showsVerticalScrollIndicator={false}
          >
            {variant === 'loading' ? <LoadingState message="Loading CCTV Dashboard..." /> : null}
            {variant === 'non_serviceable' ? <OutsideAreaBody /> : null}
            {variant === 'serviceable_no_membership' ? <NoMembershipBody /> : null}
          </ScrollView>
        </>
      )}
    </View>
  );
}

function TitleBlock() {
  return (
    <View style={styles.titleRow}>
      <MarketplaceServiceIcon
        serviceId={SLUG}
        fallbackIcon="camera-outline"
        fallbackColor={familyHome.greenDark}
        size={48}
      />
      <View style={styles.flex}>
        <Text style={styles.title}>CCTV DASHBOARD</Text>
        <Text style={styles.lead}>{LEAD}</Text>
      </View>
    </View>
  );
}

function GateHero({ tone }: { tone: 'outside' | 'membership' }) {
  const headline =
    tone === 'outside' ? (
      <>
        Your Safety{'\n'}
        <Text style={styles.heroFullAccent}>Our Priority</Text>
      </>
    ) : (
      <>
        Stay Connected{'\n'}
        <Text style={styles.heroFullAccent}>Stay Secure</Text>
      </>
    );
  const body =
    tone === 'outside'
      ? 'Live entrance CCTV coverage so you can see who is at your door, anytime on the app.'
      : 'Stay connected to your home with live entrance CCTV and activity alerts on the app.';

  return (
    <View style={styles.heroFull} accessibilityLabel="CCTV dashboard">
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
    void submit('Notify me when CCTV Dashboard is available in my area.', 'We will notify you');
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
            {MEMBERSHIP_SERVICE_AREA_LINE} CCTV Dashboard will become available in your area as we expand our
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
              CCTV Dashboard is available only for AgeWell members.
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
              Get access to CCTV Dashboard and many other services for a safer, healthier and happier life.
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
  const [panel, setPanel] = useState<Panel>('home');
  const bottomPad = useTabScreenBottomPad(spacing.xxl);

  if (panel === 'live') {
    return <LiveViewPanel onBack={() => setPanel('home')} bottomPad={bottomPad} />;
  }
  if (panel === 'recordings') {
    return <RecordingsPanel onBack={() => setPanel('home')} bottomPad={bottomPad} />;
  }
  return <HomePanel onNavigate={setPanel} bottomPad={bottomPad} />;
}

function HomePanel({
  onNavigate,
  bottomPad,
}: {
  onNavigate: (panel: Panel) => void;
  bottomPad: number;
}) {
  const catalog = useServiceOfferings(SLUG);
  const primary = catalog.data?.find(isCameraOffering) ?? catalog.data?.[0];
  const cameraTitle = primary?.title || 'Main Door / Entrance';
  const cameraOnline = (primary?.badge || 'Online').toLowerCase().includes('online');

  const onAction = (action: (typeof HOME_ACTIONS)[number]['action']) => {
    if (action === 'live') onNavigate('live');
    else if (action === 'recordings') onNavigate('recordings');
    else if (action === 'settings') {
      Alert.alert('Camera Settings', 'Camera preferences will be available when hardware is linked.');
    } else {
      router.push('/account/help' as Href);
    }
  };

  return (
    <>
      <ServicePageHeader />
      <ScrollView
        contentContainerStyle={[styles.liveContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.liveTitleRow}>
          <MarketplaceServiceIcon
            serviceId={SLUG}
            fallbackIcon="camera-outline"
            fallbackColor={familyHome.white}
            size={40}
          />
          <View style={styles.flex}>
            <Text style={styles.liveTitle}>Entrance CCTV</Text>
            <Text style={styles.subtitle}>{LIVE_SUBTITLE}</Text>
          </View>
        </View>

        <View style={styles.statusBanner}>
          <Text style={styles.statusBannerTitle}>Your home. Our priority.</Text>
          <Text style={styles.statusBannerBody}>
            Watch live footage or review past recordings from your main door camera, right on the app.
          </Text>
        </View>

        <Pressable
          onPress={() => onNavigate('live')}
          style={({ pressed }) => [styles.cameraCard, pressed ? styles.pressed : null]}
          accessibilityRole="button"
          accessibilityLabel={`${cameraTitle} live view`}
        >
          {primary?.image ? (
            <Image source={{ uri: primary.image }} style={styles.cameraThumb} resizeMode="cover" />
          ) : (
            <View style={styles.cameraThumbPlaceholder}>
              <Icon name="camera-outline" size={24} color={familyHome.muted} />
            </View>
          )}
          <View style={styles.flex}>
            <Text style={styles.cameraTitle}>{cameraTitle}</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, !cameraOnline ? styles.offlineDot : null]} />
              <Text style={styles.onlineText}>{cameraOnline ? 'Online' : primary?.badge || 'Offline'}</Text>
            </View>
            <Text style={styles.cameraMeta}>CCTV is working properly.</Text>
          </View>
          <Icon name="chevron-forward" size={18} color={familyHome.muted} />
        </Pressable>

        <View style={styles.actionGrid}>
          {HOME_ACTIONS.map((item) => (
            <Pressable
              key={item.title}
              onPress={() => onAction(item.action)}
              style={({ pressed }) => [styles.actionCard, pressed ? styles.pressed : null]}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <View style={styles.actionIcon}>
                <Icon name={item.icon} size={20} color={familyHome.blue} />
              </View>
              <Text style={styles.actionTitle}>{item.title}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.noteBox}>
          <Icon name="help-circle-outline" size={16} color={familyHome.blue} />
          <Text style={styles.noteText}>
            Please Note:{'\n'}• CCTV is installed only at the main door / entrance{'\n'}• Recordings are stored
            for a limited period{'\n'}• Access is restricted to authorised users only
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

function LiveViewPanel({ onBack, bottomPad }: { onBack: () => void; bottomPad: number }) {
  const catalog = useServiceOfferings(SLUG);
  const primary = catalog.data?.find(isCameraOffering) ?? catalog.data?.[0];
  const streamUrl = parseOfferingMeta(primary?.metaJson).streamUrl;
  const [soundOn, setSoundOn] = useState(true);
  const stamp = useMemo(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const onControl = (item: (typeof LIVE_CONTROLS)[number]) => {
    if (item.togglesSound) {
      setSoundOn((prev) => {
        const next = !prev;
        Alert.alert(next ? 'Sound On' : 'Sound Off', next ? 'Audio is enabled.' : 'Audio is muted.');
        return next;
      });
      return;
    }
    Alert.alert(item.label, item.tip);
  };

  return (
    <>
      <ServicePageHeader />
      <ScrollView
        contentContainerStyle={[styles.liveContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.panelBackRow, pressed ? styles.pressed : null]}
          accessibilityRole="button"
          accessibilityLabel="Back to overview"
        >
          <Icon name="chevron-back" size={20} color={familyHome.text} />
          <Text style={styles.panelBackTitle}>Main Door - Live View</Text>
          <View style={styles.liveGreenBadge}>
            <View style={styles.liveGreenDot} />
            <Text style={styles.liveGreenText}>Live</Text>
          </View>
        </Pressable>

        <Text style={styles.subtitle}>{"See who's at your door, in real time."}</Text>

        <View style={styles.viewport}>
          {streamUrl ? (
            <>
              <Image source={{ uri: streamUrl }} style={styles.viewportImage} resizeMode="cover" />
              <View style={styles.viewportScrim} />
              <View style={styles.liveRedBadge}>
                <View style={styles.liveRedDot} />
                <Text style={styles.liveRedText}>LIVE</Text>
              </View>
              <Text style={styles.timestamp}>{stamp}</Text>
            </>
          ) : (
            <View style={styles.streamUnavailable}>
              <Icon name="camera-outline" size={36} color={familyHome.muted} />
              <Text style={styles.streamUnavailableTitle}>Live stream unavailable</Text>
              <Text style={styles.streamUnavailableBody}>
                Your camera feed will appear here once hardware is linked by AgeWell operations.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.controlRow}>
          {LIVE_CONTROLS.map((item) => {
            const label = item.togglesSound ? (soundOn ? 'Sound On' : 'Sound Off') : item.label;
            return (
              <Pressable
                key={item.label}
                onPress={() => onControl(item)}
                style={({ pressed }) => [styles.controlBtn, pressed ? styles.pressed : null]}
                accessibilityRole="button"
                accessibilityLabel={label}
              >
                <Icon
                  name={item.togglesSound && !soundOn ? 'eye-off-outline' : item.icon}
                  size={18}
                  color={familyHome.greenDark}
                />
                <Text style={styles.controlLabel}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.tipBanner}>
          <Icon name="chatbubble-outline" size={16} color={familyHome.greenDark} />
          <Text style={styles.tipText}>Use Talk to speak to the person at your door</Text>
        </View>
      </ScrollView>
    </>
  );
}

function RecordingsPanel({ onBack, bottomPad }: { onBack: () => void; bottomPad: number }) {
  const catalog = useServiceOfferings(SLUG);
  const recordings = useMemo(
    () => filterOfferingsByKind(catalog.data ?? [], 'recording'),
    [catalog.data],
  );
  const [dateFilter, setDateFilter] = useState<(typeof DATE_FILTERS)[number] | 'all'>('Today');
  const filtered = useMemo(
    () =>
      recordings.filter((item) => {
        const when = parseOfferingMeta(item.metaJson).when || item.description;
        return matchesDateFilter(when, dateFilter);
      }),
    [recordings, dateFilter],
  );

  const onPlay = (title: string, url?: string, duration?: string) => {
    if (url) {
      void Linking.openURL(url).catch(() => {
        Alert.alert('Unable to open recording', 'Please try again or contact support.');
      });
      return;
    }
    Alert.alert(
      'Recording unavailable',
      duration
        ? `${title} (${duration}) is not linked yet. Contact support if you need access.`
        : `${title} is not linked yet.`,
    );
  };

  return (
    <>
      <ServicePageHeader />
      <ScrollView
        contentContainerStyle={[styles.liveContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.panelBackRow, pressed ? styles.pressed : null]}
          accessibilityRole="button"
          accessibilityLabel="Back to overview"
        >
          <Icon name="chevron-back" size={20} color={familyHome.text} />
          <Text style={styles.panelBackTitle}>Past Recordings</Text>
        </Pressable>

        <Text style={styles.subtitle}>Review recent activity at your main door.</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {DATE_FILTERS.map((label) => {
            const active = dateFilter === label;
            return (
              <Pressable
                key={label}
                onPress={() => setDateFilter(label)}
                style={[styles.chip, active ? styles.chipActive : null]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => setDateFilter('all')}
            style={[styles.chip, dateFilter === 'all' ? styles.chipActive : null]}
            accessibilityRole="button"
            accessibilityState={{ selected: dateFilter === 'all' }}
          >
            <Text style={[styles.chipText, dateFilter === 'all' ? styles.chipTextActive : null]}>
              All Recordings
            </Text>
          </Pressable>
        </ScrollView>

        {catalog.isPending ? <Text style={styles.footerNote}>Loading recordings…</Text> : null}
        {catalog.isError ? (
          <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
            <Text style={styles.footerNote}>Unable to load recordings · Tap to retry</Text>
          </Pressable>
        ) : null}

        <View style={styles.recordingList}>
          {filtered.map((item, index) => {
            const meta = parseOfferingMeta(item.metaJson);
            const when = meta.when || item.description;
            const duration = meta.duration || '—';
            return (
              <Pressable
                key={item.id}
                onPress={() => onPlay(item.title, meta.url, duration)}
                style={({ pressed }) => [
                  styles.recordingRow,
                  index < filtered.length - 1 ? styles.recordingDivider : null,
                  pressed ? styles.pressed : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Play ${item.title}`}
              >
                <View style={styles.recordingIcon}>
                  <Icon name="play" size={18} color={familyHome.blue} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.recordingTitle}>{item.title}</Text>
                  <Text style={styles.recordingMeta}>
                    {when} · {duration}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={18} color={familyHome.muted} />
              </Pressable>
            );
          })}
          {!catalog.isPending && filtered.length === 0 ? (
            <Text style={styles.footerNote}>No recordings for this period yet.</Text>
          ) : null}
        </View>

        <Text style={styles.footerNote}>
          Recordings stored for 30 days. Access is restricted to authorised users only.
        </Text>
      </ScrollView>
    </>
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
    gap: spacing.lg,
    paddingTop: spacing.sm,
  },
  liveTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  liveTitleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: familyHome.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBanner: {
    backgroundColor: familyHome.greenSoft,
    borderRadius: 16,
    padding: spacing.lg,
    gap: 6,
  },
  statusBannerTitle: { ...typography.bodyStrong, color: familyHome.greenDark },
  statusBannerBody: { ...typography.caption, color: familyHome.greenDark, lineHeight: 18 },
  cameraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: familyHome.white,
  },
  cameraThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
  },
  cameraTitle: { ...typography.bodyStrong, color: familyHome.text },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: familyHome.green,
  },
  offlineDot: { backgroundColor: familyHome.muted },
  onlineText: { ...typography.captionStrong, color: familyHome.greenDark },
  cameraMeta: { ...typography.caption, color: familyHome.muted, marginTop: 2 },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionCard: {
    width: '47.5%',
    minHeight: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: familyHome.border,
    backgroundColor: familyHome.blueSoft,
    padding: spacing.md,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { ...typography.captionStrong, color: familyHome.text, fontSize: 13 },
  noteBox: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  noteText: { ...typography.caption, color: familyHome.text, lineHeight: 18, flex: 1 },
  panelBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  panelBackTitle: { ...typography.subtitle, color: familyHome.text, flex: 1 },
  liveGreenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: familyHome.green,
  },
  liveGreenText: { ...typography.captionStrong, color: familyHome.greenDark },
  viewport: {
    height: 240,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamUnavailable: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  streamUnavailableTitle: {
    ...typography.bodyStrong,
    color: familyHome.white,
    textAlign: 'center',
  },
  streamUnavailableBody: {
    ...typography.caption,
    color: familyHome.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  cameraThumbPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: familyHome.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewportImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.45,
  },
  viewportScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  liveRedBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  liveRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: familyHome.red,
  },
  liveRedText: { ...typography.captionStrong, color: familyHome.white },
  timestamp: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 2,
    ...typography.captionStrong,
    color: familyHome.white,
  },
  viewportDecor: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hdPill: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  hdText: { ...typography.captionStrong, color: familyHome.white, fontSize: 11 },
  decorIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  controlBtn: {
    width: '18%',
    minWidth: 60,
    flexGrow: 1,
    minHeight: 64,
    borderRadius: 12,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  controlLabel: {
    ...typography.captionStrong,
    color: familyHome.greenDark,
    fontSize: 10,
    textAlign: 'center',
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  tipText: { ...typography.caption, color: familyHome.greenDark, flex: 1, lineHeight: 18 },
  chipRow: { gap: spacing.sm, paddingRight: spacing.md },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: familyHome.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: familyHome.white,
  },
  chipActive: {
    borderColor: familyHome.blue,
    backgroundColor: familyHome.blueSoft,
  },
  chipText: { ...typography.captionStrong, color: familyHome.muted },
  chipTextActive: { color: familyHome.blue },
  recordingList: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: familyHome.white,
  },
  recordingDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: familyHome.border,
  },
  recordingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: familyHome.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingTitle: { ...typography.bodyStrong, color: familyHome.text },
  recordingMeta: { ...typography.caption, color: familyHome.muted, marginTop: 2 },
  footerNote: { ...typography.caption, color: familyHome.muted, lineHeight: 18, textAlign: 'center' },
});
