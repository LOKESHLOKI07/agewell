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
import { spacing, typography } from '@/constants/theme';
import { useServiceRequests, useServices } from '@/features/home/hooks/queries';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { ServiceHelpBanner } from '@/features/membership/ServiceHelpBanner';
import { MarketplaceServiceIcon } from '@/features/services/components/MarketplaceServiceIcon';
import { useTabScreenBottomPad } from '@/utils/safeBottom';
import { toDisplayDate } from '@/utils/date';
import type { ServiceOffering } from './catalogTypes';
import { parseOfferingMeta } from './catalogTypes';
import { telHref } from './careManagerHours';
import { MEMBERSHIP_SERVICE_AREA_LINE } from './membershipServicePageVariant';
import { membershipPurchaseHref } from './planCatalog';
import { SERVICE_HERO_IMAGES } from './serviceHeroes';
import {
  filterRequestsBySlug,
  liveRequestToneMeta,
  toLiveRequestViews,
} from './liveServiceRequests';
import { useHasActiveMembership } from './useHasActiveMembership';
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
const CATEGORY_HINT = 'Choose the issue you are facing so we can guide and support you.';

const GATE_FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'eye-outline', title: 'Awareness on Online Scams', body: 'Learn about latest fraud tactics.' },
  { icon: 'card-outline', title: 'Guidance Before Investing', body: 'Get advice to avoid risky investments.' },
  { icon: 'phone-portrait-outline', title: 'Caution on OTP Sharing', body: 'Understand when and how to stay safe.' },
  { icon: 'document-text-outline', title: 'Support After Fraud', body: 'Help with complaint registration and follow-up.' },
];

const FALLBACK_CATEGORIES: ServiceOffering[] = [
  {
    id: 'fallback-bank',
    serviceSlug: SLUG,
    title: 'Bank Account Related',
    description: 'Suspicious transactions, UPI, card fraud, etc.',
    badge: 'Security',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 0,
    isActive: true,
  },
  {
    id: 'fallback-mobile-app',
    serviceSlug: SLUG,
    title: 'Mobile Application Related',
    description: 'Issues with banking apps, UPI apps, other apps.',
    badge: 'Security',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'fallback-investment',
    serviceSlug: SLUG,
    title: 'Investment Related',
    description: 'Fraudulent schemes, fake investment offers.',
    badge: 'Security',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'fallback-digital-arrest',
    serviceSlug: SLUG,
    title: 'Digital Arrest Related',
    description: 'Guidance on digital arrest scams.',
    badge: 'Security',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'fallback-phone-hacked',
    serviceSlug: SLUG,
    title: 'Mobile Phone Hacked',
    description: 'Lost access, data theft, unauthorised use.',
    badge: 'Security',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 'fallback-other',
    serviceSlug: SLUG,
    title: 'Any Other Assistance',
    description: 'Other cyber security concerns.',
    badge: 'Security',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 5,
    isActive: true,
  },
];

const FALLBACK_AWARENESS: ServiceOffering[] = [
  {
    id: 'fallback-video-arrest',
    serviceSlug: SLUG,
    title: 'Digital Arrest Scam',
    description: 'How scammers impersonate police & cyber cells',
    badge: 'YouTube Video',
    priceLabel: '',
    image: null,
    metaJson: '{"kind":"video","duration":"5:28","url":"https://www.youtube.com/results?search_query=digital+arrest+scam"}',
    sortOrder: 10,
    isActive: true,
  },
  {
    id: 'fallback-video-invest',
    serviceSlug: SLUG,
    title: 'Fake Investment Apps',
    description: 'Spot fraudulent trading and investment apps',
    badge: 'YouTube Video',
    priceLabel: '',
    image: null,
    metaJson: '{"kind":"video","duration":"4:45","url":"https://www.youtube.com/results?search_query=fake+investment+app+scam"}',
    sortOrder: 11,
    isActive: true,
  },
  {
    id: 'fallback-video-otp',
    serviceSlug: SLUG,
    title: 'OTP Sharing Fraud',
    description: 'Never share OTP — stay safe from phishing',
    badge: 'YouTube Video',
    priceLabel: '',
    image: null,
    metaJson: '{"kind":"video","duration":"3:52","url":"https://www.youtube.com/results?search_query=otp+sharing+fraud+scam"}',
    sortOrder: 12,
    isActive: true,
  },
];

const CATEGORY_LOOKS: { match: RegExp; icon: IconName; color: string; soft: string }[] = [
  { match: /bank\s*account|banking|payment|upi|card\s*fraud/i, icon: 'landmark', color: familyHome.red, soft: familyHome.redSoft },
  { match: /mobile\s*application|app\s*related|banking\s*apps/i, icon: 'phone-portrait-outline', color: familyHome.blue, soft: familyHome.blueSoft },
  { match: /investment/i, icon: 'banknote', color: familyHome.green, soft: familyHome.greenSoft },
  { match: /digital\s*arrest/i, icon: 'warning-outline', color: familyHome.orange, soft: familyHome.orangeSoft },
  { match: /phone\s*hacked|hack|identity/i, icon: 'call-outline', color: familyHome.purple, soft: familyHome.purpleSoft },
  { match: /other|any\s*other/i, icon: 'chatbubble-outline', color: '#E91E8C', soft: '#FDF0F7' },
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

function membershipValidLabel(endDate: string | null | undefined): string | null {
  if (!endDate) {
    return null;
  }
  const parsed = new Date(endDate);
  if (Number.isNaN(parsed.getTime())) {
    const display = toDisplayDate(endDate);
    return display ? `Membership valid upto ${display}` : null;
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `Membership valid upto ${parsed.getDate()} ${months[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

export function CyberSecurityGuidanceScreen() {
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
      <MarketplaceServiceIcon
        serviceId={SLUG}
        fallbackIcon="shield-checkmark-outline"
        fallbackColor={familyHome.purple}
        size={48}
      />
      <View style={styles.flex}>
        <Text style={styles.title}>Cyber Security Assistance</Text>
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
    <ServiceHelpBanner tone="green" />
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
  const requestsQuery = useServiceRequests();
  const membership = useHasActiveMembership();
  const { submitting, submit } = useMembershipSubmit(SLUG);
  const validTill = membershipValidLabel(membership.query.data?.endDate);
  const [selectedId, setSelectedId] = useState('');

  const categories = useMemo(() => {
    const fromApi = (catalog.data ?? []).filter(isRequestCategory);
    const byTitle = new Map<string, ServiceOffering>();
    for (const item of fromApi) {
      const key = item.title.trim().toLowerCase();
      if (!byTitle.has(key)) byTitle.set(key, item);
    }
    const looksLikeDesign = fromApi.some((item) =>
      /bank account|mobile application|digital arrest related|investment related/i.test(item.title),
    );
    if (looksLikeDesign) {
      return FALLBACK_CATEGORIES.map((fallback) => byTitle.get(fallback.title.toLowerCase()) ?? fallback);
    }
    return FALLBACK_CATEGORIES;
  }, [catalog.data]);

  const awareness = useMemo(() => {
    const fromApi = (catalog.data ?? []).filter(isAwarenessOffering);
    if (fromApi.length > 0) {
      return fromApi.slice().sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return FALLBACK_AWARENESS;
  }, [catalog.data]);

  const selected = categories.find((item) => item.id === selectedId) ?? null;

  const service = useMemo(
    () => (services.data ?? []).find((item) => item.slug === SLUG) ?? null,
    [services.data],
  );

  const hours = service?.callHoursText?.trim() || DEFAULT_HOURS;
  const about = service?.description?.trim() || DEFAULT_ABOUT;
  const phone = service?.supportPhone?.trim() || null;

  const recent = useMemo(() => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    return toLiveRequestViews(mine, { fallbackTitle: 'Cyber security', limit: 3 });
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
    void submit('Call Support requested for Cyber Security Assistance.', 'Support call requested');
  };

  const onSelectCategory = (item: ServiceOffering) => {
    setSelectedId(item.id);
  };

  const onRaiseRequest = () => {
    if (!selected) {
      Alert.alert('Select a category', 'Please choose a category before raising a request.');
      return;
    }
    void submit(
      `${selected.title}. Cyber security guidance requested. ${selected.description || ''}`.trim(),
      `${selected.title} request sent`,
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

  const onViewAllRequests = () => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    const lines = toLiveRequestViews(mine, { fallbackTitle: 'Cyber security', limit: 20 })
      .map((item) => `• ${item.title} — ${item.statusLabel} (${item.dateLabel})`)
      .join('\n');
    Alert.alert('Recent Activity', lines || 'No activity yet.');
  };

  const onViewAllAwareness = () => {
    const lines = awareness
      .map((item) => {
        const meta = parseOfferingMeta(item.metaJson);
        const kind = meta.kind?.toLowerCase() === 'pdf' ? 'PDF' : 'Video';
        return `• ${item.title} (${kind}${meta.duration ? ` · ${meta.duration}` : ''})`;
      })
      .join('\n');
    Alert.alert('Cyber Fraud Stories & Awareness', lines || 'No awareness items yet.');
  };

  return (
    <ScrollView contentContainerStyle={styles.liveContent} showsVerticalScrollIndicator={false}>
      <View style={styles.liveTitleBlock}>
        <View style={styles.liveTitleRow}>
          <MarketplaceServiceIcon
            serviceId={SLUG}
            fallbackIcon="shield-checkmark-outline"
            fallbackColor={familyHome.purple}
            size={48}
          />
          <Text style={styles.liveTitle}>Cyber Security Assistance</Text>
        </View>
        {validTill ? (
          <View style={styles.memberBadge}>
            <Icon name="checkmark-circle-outline" size={14} color={familyHome.green} />
            <Text style={styles.memberBadgeTitle}>{validTill}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.callCard}>
        <View style={styles.callRings}>
          <View style={styles.ringOuter}>
            <View style={styles.ringMid}>
              <View style={styles.callIconWell}>
                <Icon name="call-outline" size={16} color={familyHome.white} />
              </View>
            </View>
          </View>
        </View>
        <View style={styles.callCopy}>
          <Text style={styles.callEyebrow} numberOfLines={1}>
            Need immediate help?
          </Text>
          <Text style={styles.callTitle} numberOfLines={1}>
            Call Our Support
          </Text>
          <Text style={styles.callBody} numberOfLines={2}>
            Talk to our team for guidance on any cyber security concern.
          </Text>
        </View>
        <View style={styles.callActions}>
          <Pressable
            style={[styles.callCta, submitting ? styles.disabled : null]}
            onPress={onCall}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Call Support"
          >
            <Icon name="call-outline" size={13} color={familyHome.white} />
            <Text style={styles.callCtaText}>{submitting ? '…' : 'Call Support'}</Text>
          </Pressable>
          <Text style={styles.callHours}>
            Call timing:{'\n'}
            {hours}
          </Text>
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Select a Category to Raise a Request</Text>
        <Text style={styles.sectionHint}>{CATEGORY_HINT}</Text>
      </View>

      {catalog.isPending && !catalog.data?.length ? (
        <Text style={styles.empty}>Loading categories…</Text>
      ) : null}
      {catalog.isError && !catalog.data?.length ? (
        <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
          <Text style={styles.viewAll}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}

      <View style={styles.categoryGrid}>
        {categories.map((item) => {
          const look = lookForCategory(item.title);
          const selectedCard = item.id === selectedId;
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelectCategory(item)}
              disabled={submitting}
              style={[
                styles.categoryCard,
                { backgroundColor: look.soft },
                selectedCard ? styles.categoryCardSelected : null,
                selectedCard ? { borderColor: look.color } : null,
                submitting ? styles.disabled : null,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedCard }}
              accessibilityLabel={item.title}
            >
              <View style={styles.categoryIcon}>
                <Icon name={look.icon} size={14} color={look.color} />
              </View>
              <View style={styles.categoryCopy}>
                <Text style={[styles.categoryTitle, { color: look.color }]} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.description ? (
                  <Text style={styles.categoryBody} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <Icon name="chevron-forward" size={12} color={familyHome.muted} />
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={onRaiseRequest}
        disabled={submitting}
        style={({ pressed }) => [
          styles.raiseCta,
          submitting ? styles.disabled : null,
          pressed ? styles.pressed : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Raise a Support Request"
      >
        <View style={styles.raisePlus}>
          <Icon name="plus-circle" size={20} color={familyHome.green} />
        </View>
        <Text style={styles.raiseCtaText}>
          {submitting ? 'Sending…' : 'Raise a Support Request'}
        </Text>
        <Icon name="chevron-forward" size={18} color={familyHome.white} />
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {allCount > 0 ? (
          <Pressable onPress={onViewAllRequests} accessibilityRole="button">
            <Text style={styles.viewAll}>View All &gt;</Text>
          </Pressable>
        ) : null}
      </View>

      {requestsQuery.isPending ? <Text style={styles.empty}>Loading activity…</Text> : null}
      {!requestsQuery.isPending && recent.length === 0 ? (
        <Text style={styles.empty}>No activity yet. Call support or select a category above.</Text>
      ) : null}

      {recent.length > 0 ? (
        <View style={styles.activityCard}>
          {recent.map((item, index) => {
            const look = lookForCategory(item.title);
            const tone = liveRequestToneMeta(item.tone);
            return (
              <View
                key={item.id}
                style={[styles.requestRow, index < recent.length - 1 ? styles.requestDivider : null]}
              >
                <View style={[styles.requestIcon, { backgroundColor: look.soft }]}>
                  <Icon name={look.icon} size={14} color={look.color} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.requestDate}>{item.dateLabel}</Text>
                  <Text style={styles.requestTitle}>{item.title}</Text>
                  <Text style={styles.requestDetail}>{item.detail}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: tone.soft }]}>
                  <Text style={[styles.statusPillText, { color: tone.color }]}>{item.statusLabel}</Text>
                </View>
                <Icon name="chevron-forward" size={14} color={familyHome.muted} />
              </View>
            );
          })}
        </View>
      ) : null}

      <View style={styles.awarenessSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cyber Fraud Stories & Awareness</Text>
          {awareness.length > 0 ? (
            <Pressable onPress={onViewAllAwareness} accessibilityRole="button">
              <Text style={styles.viewAll}>View All &gt;</Text>
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.awarenessRow}
        >
          {awareness.map((item) => {
            const meta = parseOfferingMeta(item.metaJson);
            const kind = meta.kind?.toLowerCase();
            const isPdf = kind === 'pdf';
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
                      <Image source={heroImage} style={styles.videoThumbImage} resizeMode="cover" />
                    )}
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
                <View style={styles.awarenessCopy}>
                  <Text style={styles.awarenessTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.description ? (
                    <Text style={styles.awarenessBody} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.aboutCard}>
        <View style={styles.aboutHead}>
          <View style={styles.aboutIcon}>
            <Icon name="help-circle-outline" size={14} color={familyHome.blue} />
          </View>
          <Text style={styles.aboutTitle}>About This Service</Text>
        </View>
        <Text style={styles.aboutText}>{about}</Text>
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
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  liveTitleBlock: { gap: spacing.sm },
  liveTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  liveTitle: { ...typography.title, color: familyHome.text, flex: 1, fontSize: 22 },
  memberBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  memberBadgeTitle: { ...typography.captionStrong, color: familyHome.greenDark },
  callCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 14,
    backgroundColor: familyHome.greenSoft,
    borderWidth: 1,
    borderColor: '#D7ECD8',
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 72,
  },
  callRings: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  ringOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(61,139,64,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringMid: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(61,139,64,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callIconWell: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callCopy: { flex: 1, minWidth: 0, gap: 1, justifyContent: 'center' },
  callEyebrow: {
    ...typography.captionStrong,
    color: familyHome.greenDark,
    fontSize: 11,
    lineHeight: 14,
  },
  callTitle: {
    ...typography.bodyStrong,
    color: familyHome.text,
    fontSize: 15,
    lineHeight: 18,
  },
  callBody: {
    ...typography.caption,
    color: familyHome.muted,
    lineHeight: 14,
    fontSize: 11,
  },
  callActions: { alignItems: 'center', gap: 3, flexShrink: 0, width: 88 },
  callCta: {
    minHeight: 36,
    borderRadius: 10,
    backgroundColor: familyHome.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignSelf: 'stretch',
  },
  callCtaText: {
    ...typography.captionStrong,
    color: familyHome.white,
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
  },
  callHours: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 8,
    textAlign: 'center',
    lineHeight: 10,
  },
  sectionBlock: { gap: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitle: { ...typography.subtitle, color: familyHome.text, fontSize: 16, flexShrink: 1 },
  sectionHint: { ...typography.caption, color: familyHome.muted, lineHeight: 16 },
  viewAll: { ...typography.captionStrong, color: familyHome.blue },
  empty: { ...typography.caption, color: familyHome.muted },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: 56,
  },
  categoryCardSelected: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  categoryIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCopy: { flex: 1, minWidth: 0, gap: 1 },
  categoryTitle: { ...typography.captionStrong, fontSize: 11, lineHeight: 14 },
  categoryBody: { ...typography.caption, color: familyHome.muted, fontSize: 9, lineHeight: 12 },
  raiseCta: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  raisePlus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  raiseCtaText: { ...typography.bodyStrong, color: familyHome.white, flex: 1, fontSize: 15 },
  activityCard: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    backgroundColor: familyHome.white,
    overflow: 'hidden',
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  requestDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: familyHome.border,
  },
  requestIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestDate: { ...typography.caption, color: familyHome.muted, fontSize: 11, lineHeight: 14 },
  requestTitle: {
    ...typography.bodyStrong,
    color: familyHome.text,
    fontSize: 13,
    lineHeight: 16,
    marginTop: 1,
  },
  requestDetail: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 1,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusPillText: { ...typography.captionStrong, fontSize: 10 },
  awarenessSection: { gap: spacing.sm },
  awarenessRow: { gap: spacing.sm, paddingVertical: 2 },
  awarenessCard: {
    width: 168,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: familyHome.border,
    backgroundColor: familyHome.white,
    overflow: 'hidden',
  },
  videoThumb: {
    width: '100%',
    height: 96,
    backgroundColor: '#1B2A4A',
  },
  videoThumbImage: { width: '100%', height: '100%' },
  playBtn: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  durationBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  durationBadgeText: { ...typography.caption, color: familyHome.white, fontSize: 10 },
  pdfThumb: {
    width: '100%',
    height: 96,
    backgroundColor: familyHome.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfBadge: {
    backgroundColor: familyHome.blue,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pdfBadgeText: { ...typography.captionStrong, color: familyHome.white, fontSize: 11 },
  awarenessCopy: { paddingHorizontal: 10, paddingVertical: 8, gap: 2 },
  awarenessTitle: { ...typography.bodyStrong, color: familyHome.text, fontSize: 13, lineHeight: 16 },
  awarenessBody: { ...typography.caption, color: familyHome.muted, fontSize: 11, lineHeight: 14 },
  aboutCard: {
    borderRadius: 12,
    backgroundColor: familyHome.blueSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  aboutHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aboutIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutTitle: { ...typography.bodyStrong, color: familyHome.text, fontSize: 14 },
  aboutText: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 12,
    lineHeight: 17,
  },
});

