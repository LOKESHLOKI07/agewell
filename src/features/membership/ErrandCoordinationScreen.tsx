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
import { router, useNavigation, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingState, PrimaryButton, SecondaryButton } from '@/components';
import type { IconName } from '@/components/ui';
import { Icon } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import { useServiceRequests, useServices, useUnreadNotifications } from '@/features/home/hooks/queries';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { safeGoBack } from '@/utils/navigation';
import { useTabScreenBottomPad } from '@/utils/safeBottom';
import type { ServiceOffering } from './catalogTypes';
import { useAssignedCompanion } from './careManagerHooks';
import { telHref } from './careManagerHours';
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

const logo = require('../../../assets/logo_splash.png');
const heroImage = SERVICE_HERO_IMAGES['errand-coordination'];

const SLUG = 'errand-coordination';
const DEFAULT_HOURS = '10:00 AM – 6:00 PM';
const LEAD =
  'Our companion will coordinate errands such as ironing, haircut & other personal services as needed.';
const DEFAULT_ABOUT =
  'Our companion helps coordinate home services like ironing, haircuts, cleaning and minor repairs with trusted professionals. Service provider costs are charged separately based on the actual bill.';
const LIVE_SUBTITLE = 'Everyday support, for a more comfortable life.';

const GATE_FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'sparkles', title: 'Ironing', body: 'We coordinate with trusted service providers' },
  { icon: 'create-outline', title: 'Haircut', body: 'Help you get grooming services' },
  { icon: 'home-outline', title: 'Other Personal Services', body: 'Coordinate as per your needs' },
  { icon: 'people-outline', title: 'Reliable Support', body: 'Our companion handles the coordination' },
];

const SERVICE_LOOKS: { match: RegExp; icon: IconName; color: string; soft: string }[] = [
  { match: /iron/i, icon: 'sparkles', color: '#2F80ED', soft: '#E8F1FF' },
  { match: /hair|groom|salon/i, icon: 'create-outline', color: familyHome.green, soft: familyHome.greenSoft },
  { match: /clean/i, icon: 'home-outline', color: familyHome.red, soft: familyHome.redSoft },
  { match: /repair|maint/i, icon: 'settings-outline', color: familyHome.orange, soft: familyHome.orangeSoft },
  { match: /other/i, icon: 'ellipsis-horizontal', color: familyHome.purple, soft: familyHome.purpleSoft },
];

function lookForService(title: string) {
  for (const row of SERVICE_LOOKS) {
    if (row.match.test(title)) return row;
  }
  return {
    icon: 'clipboard-outline' as IconName,
    color: familyHome.purple,
    soft: familyHome.purpleSoft,
  };
}

export function ErrandCoordinationScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(true);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {variant === 'serviceable_with_membership' ? (
        <MemberLiveHeader />
      ) : (
        <AgeWellHeader title="Coordination for Other Errands" showBack showProfile={false} showBell={false} />
      )}

      {variant === 'serviceable_with_membership' ? (
        <MemberLiveBody />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.gateContent, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {variant === 'loading' ? <LoadingState message="Loading Other Errands..." /> : null}
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
        <Icon name="create-outline" size={22} color={familyHome.green} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.title}>Coordination for Other Errands</Text>
        <Text style={styles.lead}>{LEAD}</Text>
      </View>
    </View>
  );
}

function HeroBanner({
  tone,
  headline,
  accent,
  body,
}: {
  tone: 'outside' | 'membership';
  headline: string;
  accent: string;
  body: string;
}) {
  const parts = headline.split(accent);
  return (
    <View style={[styles.heroCard, tone === 'outside' ? styles.heroOutside : styles.heroMembership]}>
      <View style={styles.heroCopy}>
        {tone === 'membership' ? <View style={styles.heroAccentBar} /> : null}
        <Text style={styles.heroHeadline}>
          {parts[0]}
          <Text style={styles.heroAccent}>{accent}</Text>
          {parts[1] ?? ''}
        </Text>
        <Text style={styles.heroBody}>{body}</Text>
      </View>
      <View style={styles.heroMedia}>
        <Image
          source={heroImage}
          style={styles.heroImage}
          resizeMode="cover"
          accessibilityLabel="AgeWell companion coordinating errands"
        />
        {tone === 'outside' ? (
          <View style={styles.heroCallout}>
            <Text style={styles.heroCalloutText}>Small Helps Big Differences</Text>
            <Text style={styles.heroHeart}>♡</Text>
          </View>
        ) : null}
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
      'Notify me when Coordination for Other Errands is available in my area.',
      'We will notify you',
    );
  };

  return (
    <View style={styles.stack}>
      <TitleBlock />
      <HeroBanner
        tone="outside"
        headline="More Time for What Matters"
        accent="Matters"
        body="We coordinate the services you need, so you can focus on a happier, healthier you."
      />
      <FeaturesGrid />
      <View style={styles.soonBanner}>
        <View style={styles.soonIcon}>
          <Icon name="location" size={18} color={familyHome.red} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.soonTitle}>Service coming soon to your area</Text>
          <Text style={styles.soonBody}>
            {MEMBERSHIP_SERVICE_AREA_LINE} Coordination for Other Errands will become available in your area as
            we expand our services.
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
      <HeroBanner
        tone="membership"
        headline="Your Everyday Support Partner"
        accent="Support Partner"
        body="We coordinate the services you need, so you can focus on what matters most."
      />
      <FeaturesGrid />
      <View style={styles.membershipCard}>
        <View style={styles.membershipHead}>
          <View style={styles.lockWell}>
            <Icon name="lock-closed-outline" size={16} color="#B45309" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.membershipTitle}>Membership Required</Text>
            <Text style={styles.membershipBody}>
              Coordination for Other Errands is available to AgeWell members.
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
              Get access to coordination for other errands and many more supportive services for a safer,
              healthier and happier life.
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

function MemberLiveHeader() {
  const navigation = useNavigation();
  const role = useAuthStore((state) => state.user?.role);
  const unread = useUnreadNotifications();

  return (
    <View style={styles.liveHeader}>
      <Pressable
        onPress={() => safeGoBack(navigation.canGoBack(), role)}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Back to Services"
      >
        <Icon name="chevron-back" size={22} color={familyHome.text} />
        <Text style={styles.backLabel}>Services</Text>
      </Pressable>
      <Image source={logo} style={styles.logo} resizeMode="contain" accessibilityLabel="AgeWell" />
      <View style={styles.headerRight}>
        <NotificationBell unreadCount={unread.data?.total ?? 0} />
      </View>
    </View>
  );
}

function MemberLiveBody() {
  const services = useServices();
  const catalog = useServiceOfferings(SLUG);
  const requestsQuery = useServiceRequests();
  const companionQuery = useAssignedCompanion();
  const { submitting, submit } = useMembershipSubmit(SLUG);
  const [selectedId, setSelectedId] = useState('');

  const offerings = catalog.data ?? [];
  const selected = offerings.find((item) => item.id === selectedId) ?? offerings[0];

  const service = useMemo(
    () => (services.data ?? []).find((item) => item.slug === SLUG) ?? null,
    [services.data],
  );

  const companion = companionQuery.data ?? null;
  const hours = service?.callHoursText?.trim() || DEFAULT_HOURS;
  const about = service?.description?.trim() || DEFAULT_ABOUT;
  const phone = companion?.phone?.trim() || service?.supportPhone?.trim() || null;

  const recent = useMemo(() => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    return toLiveRequestViews(mine, { fallbackTitle: 'Errand coordination', limit: 3 });
  }, [requestsQuery.data?.items]);

  const allCount = useMemo(
    () => filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG).length,
    [requestsQuery.data?.items],
  );

  const onCall = () => {
    if (phone) {
      void Linking.openURL(telHref(phone)).catch(() => {
        Alert.alert('Unable to call', `Please dial ${phone} manually.`);
      });
      return;
    }
    void submit(
      `Call Companion requested for Coordination for Other Errands.${selected ? ` Topic: ${selected.title}.` : ''}`,
      'Companion call requested',
    );
  };

  const onSelectService = (item: ServiceOffering) => {
    setSelectedId(item.id);
    void submit(
      `${item.title}. Companion coordination requested. ${item.description || ''}`.trim(),
      `${item.title} request sent`,
    );
  };

  const onViewAllServices = () => {
    const lines = offerings.map((item) => `• ${item.title}`).join('\n');
    Alert.alert('Common Services', lines || 'No services listed yet. Ask admin to add offerings.');
  };

  const onViewAllRequests = () => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    const lines = toLiveRequestViews(mine, { fallbackTitle: 'Errand coordination', limit: 20 })
      .map((item) => `• ${item.title} — ${item.statusLabel} (${item.dateLabel})`)
      .join('\n');
    Alert.alert('Recent Requests', lines || 'No requests yet.');
  };

  return (
    <ScrollView contentContainerStyle={styles.liveContent} showsVerticalScrollIndicator={false}>
      <View style={styles.liveTitleRow}>
        <View style={styles.liveTitleIcon}>
          <Icon name="home-outline" size={22} color={familyHome.white} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title}>Other Errands Assistance</Text>
          <Text style={styles.subtitle}>{LIVE_SUBTITLE}</Text>
        </View>
      </View>

      <View style={styles.callCard}>
        <View style={styles.callTop}>
          <View style={styles.callRings}>
            <View style={styles.ringOuter}>
              <View style={styles.ringMid}>
                <View style={styles.callIconWell}>
                  <Icon name="call-outline" size={26} color={familyHome.white} />
                </View>
              </View>
            </View>
          </View>
          <View style={styles.flex}>
            <Text style={styles.callEyebrow}>Need help with an errand?</Text>
            <Text style={styles.callTitle}>Call Your Companion</Text>
            <Text style={styles.callBody}>
              Talk directly to your assigned companion to request and coordinate the service.
            </Text>
          </View>
        </View>
        <Pressable
          style={[styles.callCta, submitting ? styles.disabled : null]}
          onPress={onCall}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Call Companion"
        >
          <Icon name="call-outline" size={18} color={familyHome.white} />
          <Text style={styles.callCtaText}>{submitting ? 'Connecting…' : 'Call Companion'}</Text>
        </Pressable>
        <Text style={styles.callHours}>Call timing: {hours}</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Common Services</Text>
        {offerings.length > 0 ? (
          <Pressable onPress={onViewAllServices} accessibilityRole="button">
            <Text style={styles.viewAll}>View All &gt;</Text>
          </Pressable>
        ) : null}
      </View>

      {catalog.isPending ? <Text style={styles.empty}>Loading services…</Text> : null}
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
              onPress={() => onSelectService(item)}
              style={[
                styles.serviceChip,
                { backgroundColor: look.soft, borderColor: active ? look.color : 'transparent' },
              ]}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <Icon name={look.icon} size={22} color={look.color} />
              <Text style={[styles.serviceChipLabel, { color: look.color }]} numberOfLines={2}>
                {item.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

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
        <Text style={styles.empty}>No requests yet. Call your companion or pick a common service.</Text>
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
            <Text style={styles.aboutText}>{about}</Text>
          </View>
        </View>
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
  lead: { ...typography.body, color: familyHome.muted, lineHeight: 22, marginTop: 4 },
  subtitle: { ...typography.body, color: familyHome.muted },
  heroCard: {
    borderRadius: 18,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroOutside: { backgroundColor: '#EAF3FB' },
  heroMembership: { backgroundColor: familyHome.greenSoft },
  heroCopy: { flex: 1.1, gap: spacing.sm },
  heroAccentBar: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: familyHome.green,
  },
  heroHeadline: { ...typography.subtitle, color: familyHome.text, lineHeight: 26 },
  heroAccent: { color: familyHome.green },
  heroBody: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  heroMedia: { flex: 1, position: 'relative' },
  heroImage: {
    width: '100%',
    height: 132,
    borderRadius: 14,
    backgroundColor: familyHome.border,
  },
  heroCallout: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  heroCalloutText: { ...typography.captionStrong, color: familyHome.blue, fontSize: 10 },
  heroHeart: { color: familyHome.blue, fontSize: 12 },
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
    backgroundColor: familyHome.white,
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
  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  backBtn: {
    minWidth: 88,
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backLabel: { ...typography.body, color: familyHome.text },
  logo: { width: 120, height: 44 },
  headerRight: { minWidth: 88, alignItems: 'flex-end' },
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
    backgroundColor: '#E5484D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callCard: {
    borderRadius: 18,
    backgroundColor: familyHome.greenSoft,
    borderWidth: 1,
    borderColor: '#D7ECD8',
    padding: spacing.xl,
    gap: spacing.md,
  },
  callTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  callRings: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center' },
  ringOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(61,139,64,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringMid: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(61,139,64,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callIconWell: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callEyebrow: { ...typography.captionStrong, color: familyHome.greenDark },
  callTitle: { ...typography.subtitle, color: familyHome.text, marginTop: 2 },
  callBody: { ...typography.caption, color: familyHome.muted, lineHeight: 18, marginTop: 4 },
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
  callHours: { ...typography.caption, color: familyHome.muted, textAlign: 'center' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { ...typography.subtitle, color: familyHome.text },
  viewAll: { ...typography.captionStrong, color: familyHome.blue },
  empty: { ...typography.caption, color: familyHome.muted },
  servicesRow: { gap: spacing.sm, paddingVertical: 2 },
  serviceChip: {
    width: 92,
    minHeight: 92,
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
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestTitle: { ...typography.bodyStrong, color: familyHome.text },
  requestDate: { ...typography.caption, color: familyHome.muted, marginTop: 2 },
  requestDetail: { ...typography.caption, color: familyHome.muted, lineHeight: 18, marginTop: 2 },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusPillText: { ...typography.captionStrong },
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
