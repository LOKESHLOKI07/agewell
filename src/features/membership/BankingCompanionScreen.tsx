import { useMemo } from 'react';
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
import { useServiceRequests, useServices } from '@/features/home/hooks/queries';
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

const heroImage = SERVICE_HERO_IMAGES['banking-companion'];

const SLUG = 'banking-companion';
const LEAD =
  'Book a companion for bank visits like pension withdrawal, cheque deposit, passbook update & other banking work. Paid on a per-visit basis. Prior appointments required.';
const DEFAULT_ABOUT =
  'Our companions assist with banking coordination, scheduling visits, documentation, and acting as a liaison with the bank.';
const LIVE_SUBTITLE = 'Your banking work, our support.';
const HERO_BODY = 'A trusted companion to make your banking errands easier and hassle-free.';

const GATE_FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'person-outline', title: 'Pension Withdrawal', body: 'Assistance for pension collection' },
  { icon: 'document-text-outline', title: 'Cheque Deposit', body: 'Help with deposit and clearance' },
  { icon: 'clipboard-outline', title: 'Passbook Update', body: 'Assistance for passbook printing and update' },
  { icon: 'business-outline', title: 'Other Banking Work', body: 'Support for various banking errands' },
];

const SERVICE_LOOKS: { match: RegExp; icon: IconName; color: string; soft: string }[] = [
  { match: /pension/i, icon: 'person-outline', color: familyHome.green, soft: familyHome.greenSoft },
  { match: /account/i, icon: 'card-outline', color: familyHome.blue, soft: familyHome.blueSoft },
  { match: /kyc/i, icon: 'document-text-outline', color: familyHome.red, soft: familyHome.redSoft },
  { match: /passbook/i, icon: 'clipboard-outline', color: familyHome.orange, soft: familyHome.orangeSoft },
  { match: /cheque/i, icon: 'document-outline', color: familyHome.purple, soft: familyHome.purpleSoft },
  { match: /neft|rtgs/i, icon: 'arrow-forward', color: familyHome.green, soft: familyHome.greenSoft },
  { match: /fixed\s*deposit|\bfd\b/i, icon: 'ribbon-outline', color: familyHome.blue, soft: familyHome.blueSoft },
  { match: /other/i, icon: 'ellipsis-horizontal', color: familyHome.purple, soft: familyHome.purpleSoft },
];

function lookForService(title: string) {
  for (const row of SERVICE_LOOKS) {
    if (row.match.test(title)) return row;
  }
  return {
    icon: 'business-outline' as IconName,
    color: familyHome.purple,
    soft: familyHome.purpleSoft,
  };
}

export function BankingCompanionScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(true);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Banking Companion" showBack showProfile={false} showBell />

      {variant === 'serviceable_with_membership' ? (
        <MemberLiveBody />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.gateContent, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {variant === 'loading' ? <LoadingState message="Loading Banking Companion..." /> : null}
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
        <Icon name="business-outline" size={22} color={familyHome.greenDark} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.title}>BANKING COMPANION</Text>
        <Text style={styles.lead}>{LEAD}</Text>
      </View>
    </View>
  );
}

function GateHero() {
  return (
    <View style={styles.heroFull} accessibilityLabel="Banking companion">
      <Image source={heroImage} style={styles.heroFullImage} resizeMode="cover" />
      <View style={styles.heroScrim} />
      <View style={styles.heroFullContent}>
        <View style={styles.heroFullCopy}>
          <Text style={styles.heroFullHeadline}>
            Your Banking Needs,{'\n'}
            <Text style={styles.heroFullAccent}>Our Support</Text>
          </Text>
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
      'Notify me when Banking Companion is available in my area.',
      'We will notify you',
    );
  };

  return (
    <View style={styles.stack}>
      <TitleBlock />
      <GateHero />
      <FeaturesGrid />
      <View style={styles.soonBanner}>
        <View style={styles.soonIcon}>
          <Icon name="location" size={18} color={familyHome.red} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.soonTitle}>Service coming soon to your area</Text>
          <Text style={styles.soonBody}>
            {MEMBERSHIP_SERVICE_AREA_LINE} Banking Companion will become available in your area as we expand
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
      <GateHero />
      <FeaturesGrid />
      <View style={styles.membershipCard}>
        <View style={styles.membershipHead}>
          <View style={styles.lockWell}>
            <Icon name="lock-closed-outline" size={16} color="#B45309" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.membershipTitle}>Membership Required</Text>
            <Text style={styles.membershipBody}>
              Banking Companion is available only for AgeWell members.
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
              Get access to Banking Companion and many other services for a safer, healthier and happier life.
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
  const services = useServices();
  const catalog = useServiceOfferings(SLUG);
  const requestsQuery = useServiceRequests();
  const { submitting, submit } = useMembershipSubmit(SLUG);

  const offerings = catalog.data ?? [];

  const service = useMemo(
    () => (services.data ?? []).find((item) => item.slug === SLUG) ?? null,
    [services.data],
  );

  const about = service?.description?.trim() || DEFAULT_ABOUT;

  const recent = useMemo(() => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    return toLiveRequestViews(mine, { fallbackTitle: 'Banking companion', limit: 3 });
  }, [requestsQuery.data?.items]);

  const allCount = useMemo(
    () => filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG).length,
    [requestsQuery.data?.items],
  );

  const onSelectOffering = (item: ServiceOffering) => {
    void submit(
      `${item.title}. Banking companion assistance requested. ${item.description || ''}`.trim(),
      `${item.title} request sent`,
    );
  };

  const onCustomRequest = () => {
    void submit('Custom banking related assistance requested.', 'Custom request sent');
  };

  const onViewAllRequests = () => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    const lines = toLiveRequestViews(mine, { fallbackTitle: 'Banking companion', limit: 20 })
      .map((item) => `• ${item.title} — ${item.statusLabel} (${item.dateLabel})`)
      .join('\n');
    Alert.alert('My Requests', lines || 'No requests yet.');
  };

  return (
    <ScrollView contentContainerStyle={styles.liveContent} showsVerticalScrollIndicator={false}>
      <View style={styles.liveTitleRow}>
        <View style={styles.liveTitleIcon}>
          <Icon name="business-outline" size={22} color={familyHome.white} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.liveTitle}>Banking Companion</Text>
          <Text style={styles.subtitle}>{LIVE_SUBTITLE}</Text>
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Raise a Request</Text>
        <Text style={styles.sectionHint}>Select the banking service you need assistance with</Text>
      </View>

      {catalog.isPending ? <Text style={styles.empty}>Loading services…</Text> : null}
      {catalog.isError ? (
        <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
          <Text style={styles.viewAll}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}

      <View style={styles.offerGrid}>
        {offerings.map((item) => {
          const look = lookForService(item.title);
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelectOffering(item)}
              disabled={submitting}
              style={[
                styles.offerCard,
                { backgroundColor: look.soft, borderColor: look.color },
                submitting ? styles.disabled : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <View style={[styles.offerIcon, { backgroundColor: familyHome.white }]}>
                <Icon name={look.icon} size={20} color={look.color} />
              </View>
              <Text style={[styles.offerTitle, { color: look.color }]} numberOfLines={2}>
                {item.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={onCustomRequest}
        disabled={submitting}
        style={({ pressed }) => [
          styles.customBanner,
          pressed || submitting ? styles.pressed : null,
          submitting ? styles.disabled : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Custom banking request"
      >
        <View style={styles.customIcon}>
          <Icon name="create-outline" size={16} color={familyHome.white} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.customTitle}>Need something else?</Text>
          <Text style={styles.customBody}>
            You can also raise a custom request for any other banking related assistance.
          </Text>
        </View>
        <Icon name="chevron-forward" size={16} color={familyHome.greenDark} />
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Requests</Text>
        {allCount > 0 ? (
          <Pressable onPress={onViewAllRequests} accessibilityRole="button">
            <Text style={styles.viewAll}>View All &gt;</Text>
          </Pressable>
        ) : null}
      </View>

      {requestsQuery.isPending ? <Text style={styles.empty}>Loading requests…</Text> : null}
      {!requestsQuery.isPending && recent.length === 0 ? (
        <Text style={styles.empty}>No requests yet. Select a banking service above.</Text>
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
  offerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  offerCard: {
    width: '47.5%',
    minHeight: 100,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: spacing.md,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  offerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerTitle: {
    ...typography.captionStrong,
    fontSize: 12,
    lineHeight: 16,
  },
  customBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  customIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customTitle: { ...typography.bodyStrong, color: familyHome.greenDark },
  customBody: { ...typography.caption, color: familyHome.greenDark, marginTop: 2, lineHeight: 18 },
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
