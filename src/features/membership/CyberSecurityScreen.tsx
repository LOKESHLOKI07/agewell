import { useMemo } from 'react';
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
import { useServices } from '@/features/home/hooks/queries';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { useTabScreenBottomPad } from '@/utils/safeBottom';
import type { ServiceOffering } from './catalogTypes';
import { parseOfferingMeta } from './catalogTypes';
import { telHref } from './careManagerHours';
import { MEMBERSHIP_SERVICE_AREA_LINE } from './membershipServicePageVariant';
import { membershipPurchaseHref } from './planCatalog';
import { SERVICE_HERO_IMAGES } from './serviceHeroes';
import { useMembershipServicePageVariant } from './useMembershipServicePageVariant';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useServiceOfferings } from './useCatalog';

const heroImage = SERVICE_HERO_IMAGES['cyber-security'];

const SLUG = 'cyber-security';
const DEFAULT_HOURS = '10:00 AM – 6:00 PM';
const LEAD =
  "Guidance on online scams & awareness by trained companion. Companion's guidance about fraud before investing and OTP sharing. Full cooperation after fraud to reduce losses and complaints registering/ follow up. Helps to keep your hard-earned money safe.";
const DEFAULT_ABOUT =
  'We help you stay safe in the digital world. Our team provides guidance and support for common cyber security issues such as digital arrest scams, banking fraud, fake calls and messages, and more. You can call our support team or raise a request, and we will assist you with the next steps.';
const LIVE_SUBTITLE = 'Stay aware. Stay safe. We are with you.';
const CATEGORY_HINT = 'Choose the issue you are facing so we can guide and support you.';

const GATE_FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'eye-outline', title: 'Awareness on Online Scams', body: 'Learn about latest fraud tactics.' },
  { icon: 'card-outline', title: 'Guidance Before Investing', body: 'Get advice to avoid risky investments.' },
  { icon: 'phone-portrait-outline', title: 'Caution on OTP Sharing', body: 'Understand when and how to stay safe.' },
  { icon: 'document-text-outline', title: 'Support After Fraud', body: 'Help with complaint registration and follow-up.' },
];

const CATEGORY_LOOKS: { match: RegExp; icon: IconName; color: string; soft: string }[] = [
  { match: /digital\s*arrest/i, icon: 'warning-outline', color: familyHome.red, soft: familyHome.redSoft },
  { match: /bank|payment|upi/i, icon: 'card-outline', color: familyHome.blue, soft: familyHome.blueSoft },
  { match: /whatsapp|social/i, icon: 'chatbubble-outline', color: familyHome.green, soft: familyHome.greenSoft },
  { match: /fake\s*call|message|link|phish/i, icon: 'call-outline', color: familyHome.orange, soft: familyHome.orangeSoft },
  { match: /identity|hack|account/i, icon: 'person-outline', color: familyHome.purple, soft: familyHome.purpleSoft },
];

function lookForCategory(title: string) {
  for (const row of CATEGORY_LOOKS) {
    if (row.match.test(title)) return row;
  }
  return {
    icon: 'shield-checkmark-outline' as IconName,
    color: familyHome.purple,
    soft: familyHome.purpleSoft,
  };
}

function isAwarenessOffering(item: ServiceOffering) {
  const kind = parseOfferingMeta(item.metaJson).kind?.toLowerCase();
  return kind === 'video' || kind === 'pdf';
}

function isRequestCategory(item: ServiceOffering) {
  return !isAwarenessOffering(item);
}

export function CyberSecurityGuidanceScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(true);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader
        title={variant === 'serviceable_with_membership' ? 'Cyber Security Assistance' : 'Cyber Security Guidance'}
        showBack
        showProfile={false}
        showBell
      />

      {variant === 'serviceable_with_membership' ? (
        <MemberLiveBody />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.gateContent, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {variant === 'loading' ? <LoadingState message="Loading Cyber Security..." /> : null}
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
        <Icon name="shield-checkmark-outline" size={22} color={familyHome.white} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.title}>CYBER SECURITY GUIDANCE</Text>
        <Text style={styles.lead}>{LEAD}</Text>
      </View>
    </View>
  );
}

function GateHero() {
  return (
    <View style={styles.heroFull} accessibilityLabel="Cyber security guidance">
      <Image source={heroImage} style={styles.heroFullImage} resizeMode="cover" />
      <View style={styles.heroScrim} />
      <View style={styles.heroFullContent}>
        <View style={styles.heroFullCopy}>
          <Text style={styles.heroFullHeadline}>
            Stay Alert,{'\n'}
            <Text style={styles.heroFullAccent}>Stay Safe</Text>
          </Text>
          <Text style={styles.heroFullBody}>
            Guidance and support to help you stay protected in the digital world.
          </Text>
        </View>
        <View style={styles.heroBadge}>
          <View style={styles.heroBadgeIcon}>
            <Icon name="shield-checkmark-outline" size={16} color={familyHome.white} />
          </View>
          <Text style={styles.heroBadgeText}>Be Aware{'\n'}Be Safe Online</Text>
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

function QuestionsRow() {
  return (
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
  );
}

function OutsideAreaBody() {
  const { submitting, submit } = useMembershipSubmit(SLUG);

  const onNotify = () => {
    void submit(
      'Notify me when Cyber Security Guidance is available in my area.',
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
            {MEMBERSHIP_SERVICE_AREA_LINE} Cyber Security Guidance will become available in your area as we
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
      <QuestionsRow />
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
              Cyber Security Guidance is available only for AgeWell members.
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
              Get access to cyber security guidance and many more supportive services for a safer, healthier
              and happier life.
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
      <QuestionsRow />
    </View>
  );
}

function MemberLiveBody() {
  const services = useServices();
  const catalog = useServiceOfferings(SLUG);
  const { submitting, submit } = useMembershipSubmit(SLUG);

  const offerings = catalog.data ?? [];
  const categories = useMemo(() => offerings.filter(isRequestCategory), [offerings]);
  const awareness = useMemo(() => offerings.filter(isAwarenessOffering), [offerings]);

  const service = useMemo(
    () => (services.data ?? []).find((item) => item.slug === SLUG) ?? null,
    [services.data],
  );

  const hours = service?.callHoursText?.trim() || DEFAULT_HOURS;
  const about = service?.description?.trim() || DEFAULT_ABOUT;
  const phone = service?.supportPhone?.trim() || null;

  const onCall = () => {
    if (phone) {
      void Linking.openURL(telHref(phone)).catch(() => {
        Alert.alert('Unable to call', `Please dial ${phone} manually.`);
      });
      return;
    }
    void submit('Call Support requested for Cyber Security Assistance.', 'Support call requested');
  };

  const onSelectCategory = (item: ServiceOffering) => {
    void submit(
      `${item.title}. Cyber security guidance requested. ${item.description || ''}`.trim(),
      `${item.title} request sent`,
    );
  };

  const onOpenUrl = (url: string | undefined, fallbackTitle: string) => {
    if (!url?.trim()) {
      Alert.alert(fallbackTitle, 'No link available yet.');
      return;
    }
    void Linking.openURL(url.trim()).catch(() => {
      Alert.alert('Unable to open', 'Please try again later.');
    });
  };

  const onViewAllAwareness = () => {
    const lines = awareness
      .map((item) => {
        const meta = parseOfferingMeta(item.metaJson);
        const kind = meta.kind?.toLowerCase() === 'pdf' ? 'PDF' : 'Video';
        return `• ${item.title} (${kind}${meta.duration ? ` · ${meta.duration}` : ''})`;
      })
      .join('\n');
    Alert.alert('Latest Cyber Crime Awareness', lines || 'No awareness items yet.');
  };

  return (
    <ScrollView contentContainerStyle={styles.liveContent} showsVerticalScrollIndicator={false}>
      <View style={styles.liveTitleRow}>
        <View style={styles.liveTitleIcon}>
          <Icon name="shield-checkmark-outline" size={22} color={familyHome.white} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title}>Cyber Security Assistance</Text>
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
            <Text style={styles.callEyebrow}>Need immediate help?</Text>
            <Text style={styles.callTitle}>Call Our Support</Text>
            <Text style={styles.callBody}>
              Talk to our team for guidance on any cyber security concern.
            </Text>
          </View>
        </View>
        <Pressable
          style={[styles.callCta, submitting ? styles.disabled : null]}
          onPress={onCall}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Call Support"
        >
          <Icon name="call-outline" size={18} color={familyHome.white} />
          <Text style={styles.callCtaText}>{submitting ? 'Connecting…' : 'Call Support'}</Text>
        </Pressable>
        <Text style={styles.callHours}>Call timing: {hours}</Text>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Select a Category to Raise a Request</Text>
        <Text style={styles.sectionHint}>{CATEGORY_HINT}</Text>
      </View>

      {catalog.isPending ? <Text style={styles.empty}>Loading categories…</Text> : null}
      {catalog.isError ? (
        <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
          <Text style={styles.viewAll}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicesRow}>
        {categories.map((item) => {
          const look = lookForCategory(item.title);
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelectCategory(item)}
              disabled={submitting}
              style={[
                styles.serviceChip,
                { backgroundColor: look.soft, borderColor: look.color },
                submitting ? styles.disabled : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <Icon name={look.icon} size={22} color={look.color} />
              <Text style={[styles.serviceChipLabel, { color: look.color }]} numberOfLines={3}>
                {item.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.awarenessSection}>
        <View style={styles.awarenessSectionHead}>
          <View style={styles.flex}>
            <Text style={styles.sectionTitle}>Latest Cyber Crime Awareness</Text>
            <Text style={styles.sectionHint}>
              Watch videos and read useful material to stay informed and protected.
            </Text>
          </View>
          {awareness.length > 0 ? (
            <Pressable onPress={onViewAllAwareness} accessibilityRole="button">
              <Text style={styles.viewAll}>View All &gt;</Text>
            </Pressable>
          ) : null}
        </View>

        {catalog.isPending ? <Text style={styles.empty}>Loading awareness…</Text> : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.awarenessRow}>
          {awareness.map((item) => {
            const meta = parseOfferingMeta(item.metaJson);
            const kind = meta.kind?.toLowerCase();
            const isPdf = kind === 'pdf';
            const overlay = item.description?.trim() || '';
            const showOverlay = Boolean(overlay) && !isPdf && overlay === overlay.toUpperCase();

            return (
              <Pressable
                key={item.id}
                onPress={() => onOpenUrl(meta.url, item.title)}
                style={styles.awarenessCard}
                accessibilityRole="button"
                accessibilityLabel={item.title}
              >
                {isPdf ? (
                  <View style={styles.pdfThumb}>
                    <View style={styles.pdfBadge}>
                      <Text style={styles.pdfBadgeText}>PDF</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.videoThumb}>
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.videoThumbImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.videoThumbFallback}>
                        <Icon name="shield-checkmark-outline" size={28} color="rgba(255,255,255,0.35)" />
                      </View>
                    )}
                    {showOverlay ? (
                      <Text style={styles.videoOverlayLabel} numberOfLines={2}>
                        {overlay}
                      </Text>
                    ) : null}
                    <View style={styles.playBtn}>
                      <Icon name="play" size={16} color={familyHome.white} />
                    </View>
                    {meta.duration ? (
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationBadgeText}>{meta.duration}</Text>
                      </View>
                    ) : null}
                  </View>
                )}

                <Text style={styles.awarenessTitle} numberOfLines={3}>
                  {item.title}
                </Text>

                {isPdf ? (
                  <View style={styles.pdfCta}>
                    <Icon name="document-outline" size={14} color={familyHome.blue} />
                    <Text style={styles.pdfCtaText}>Download PDF</Text>
                  </View>
                ) : (
                  <View style={styles.youtubeRow}>
                    <View style={styles.youtubeMark}>
                      <Icon name="play" size={10} color={familyHome.white} />
                    </View>
                    <Text style={styles.youtubeLabel}>{item.badge || 'YouTube Video'}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {!catalog.isPending && awareness.length === 0 ? (
          <Text style={styles.empty}>Awareness videos and PDFs will appear here.</Text>
        ) : null}
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
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.title, color: familyHome.text },
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
  heroFullCopy: { flex: 1.2, gap: 6, paddingBottom: 2 },
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
    maxWidth: 200,
  },
  heroBadge: {
    width: 88,
    alignItems: 'center',
    gap: 6,
    paddingBottom: 4,
  },
  heroBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: familyHome.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeText: {
    ...typography.captionStrong,
    color: familyHome.blue,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 13,
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
    backgroundColor: familyHome.purple,
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
  sectionBlock: { gap: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { ...typography.subtitle, color: familyHome.text },
  sectionHint: { ...typography.caption, color: familyHome.muted, lineHeight: 18, marginTop: 4 },
  viewAll: { ...typography.captionStrong, color: familyHome.blue },
  empty: { ...typography.caption, color: familyHome.muted },
  servicesRow: { gap: spacing.sm, paddingVertical: 2 },
  serviceChip: {
    width: 108,
    minHeight: 104,
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
  awarenessRow: { gap: spacing.md, paddingVertical: 2 },
  awarenessSection: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: familyHome.border,
    backgroundColor: familyHome.white,
    padding: spacing.lg,
    gap: spacing.md,
  },
  awarenessSectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  awarenessCard: {
    width: 176,
    borderRadius: 14,
    backgroundColor: familyHome.white,
    gap: spacing.sm,
  },
  videoThumb: {
    height: 108,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A2332',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoThumbImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  videoThumbFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1A2332',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoOverlayLabel: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 12,
    ...typography.captionStrong,
    color: familyHome.white,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 2,
    borderColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  durationBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationBadgeText: { ...typography.captionStrong, color: familyHome.white, fontSize: 10 },
  pdfThumb: {
    height: 108,
    borderRadius: 12,
    backgroundColor: '#E8EEF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfBadge: {
    width: 52,
    height: 64,
    borderRadius: 6,
    backgroundColor: familyHome.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfBadgeText: { ...typography.captionStrong, color: familyHome.white, fontSize: 12 },
  awarenessTitle: { ...typography.bodyStrong, color: familyHome.blue, lineHeight: 20, fontSize: 13 },
  youtubeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  youtubeMark: {
    width: 18,
    height: 14,
    borderRadius: 3,
    backgroundColor: familyHome.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  youtubeLabel: { ...typography.caption, color: familyHome.muted, fontSize: 11 },
  pdfCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  pdfCtaText: { ...typography.captionStrong, color: familyHome.blue },
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
