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

const heroImage = SERVICE_HERO_IMAGES.legal;

const SLUG = 'legal';
const LEAD = 'Exclusive access to our lawyer team for consultations. (Costs extra)';
const LIVE_SUBTITLE = 'Trusted guidance for your legal matters.';
const CALLBACK_NOTE =
  'Please Note: On-call guidance will be given free of cost. If you wish to avail any specific legal service work, it will be charged separately as per the scope of work.';

const GATE_FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'home-outline',
    title: 'Property Matters',
    body: 'Guidance on buying, selling, inheritance and more',
  },
  {
    icon: 'people-outline',
    title: 'Family & Personal Matters',
    body: 'Support for wills, power of attorney and other personal legal needs',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Consumer Rights',
    body: 'Advice on fraud, disputes and consumer protection',
  },
  {
    icon: 'create-outline',
    title: 'Other Legal Support',
    body: 'Consultations for various legal matters',
  },
];

const SERVICE_LOOKS: { match: RegExp; icon: IconName; color: string; soft: string }[] = [
  { match: /property/i, icon: 'home-outline', color: familyHome.green, soft: familyHome.greenSoft },
  {
    match: /family|will|personal/i,
    icon: 'people-outline',
    color: familyHome.red,
    soft: familyHome.redSoft,
  },
  {
    match: /consumer|fraud/i,
    icon: 'shield-checkmark-outline',
    color: familyHome.orange,
    soft: familyHome.orangeSoft,
  },
  {
    match: /other|legal/i,
    icon: 'document-text-outline',
    color: familyHome.purple,
    soft: familyHome.purpleSoft,
  },
];

function lookForService(title: string) {
  for (const row of SERVICE_LOOKS) {
    if (row.match.test(title)) return row;
  }
  return {
    icon: 'document-text-outline' as IconName,
    color: familyHome.purple,
    soft: familyHome.purpleSoft,
  };
}

export function LegalAssistanceScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(true);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Legal Assistance" showBack showProfile={false} showBell />

      {variant === 'serviceable_with_membership' ? (
        <MemberLiveBody />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.gateContent, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {variant === 'loading' ? <LoadingState message="Loading Legal Assistance..." /> : null}
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
        <Icon name="document-text-outline" size={22} color={familyHome.greenDark} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.title}>LEGAL ASSISTANCE</Text>
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
  const accentStart = headline.indexOf(accent);
  const before = accentStart >= 0 ? headline.slice(0, accentStart) : headline;
  const after = accentStart >= 0 ? headline.slice(accentStart + accent.length) : '';

  return (
    <View style={[styles.heroCard, tone === 'outside' ? styles.heroOutside : styles.heroMembership]}>
      <View style={styles.heroCopy}>
        <View style={styles.heroAccentBar} />
        <Text style={styles.heroHeadline}>
          {before}
          <Text style={styles.heroAccent}>{accent}</Text>
          {after}
        </Text>
        <Text style={styles.heroBody}>{body}</Text>
      </View>
      <View style={styles.heroMedia}>
        <Image
          source={heroImage}
          style={styles.heroImage}
          resizeMode="cover"
          accessibilityLabel="Legal assistance"
        />
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
    void submit('Notify me when Legal Assistance is available in my area.', 'We will notify you');
  };

  return (
    <View style={styles.stack}>
      <TitleBlock />
      <HeroBanner
        tone="outside"
        headline="Trusted Legal Support for a Secure Tomorrow"
        accent="Secure Tomorrow"
        body="Get expert legal advice and support for your important matters, with confidence and peace of mind."
      />
      <FeaturesGrid />
      <View style={styles.soonBanner}>
        <View style={styles.soonIcon}>
          <Icon name="location" size={18} color={familyHome.red} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.soonTitle}>Service coming soon to your area</Text>
          <Text style={styles.soonBody}>
            {MEMBERSHIP_SERVICE_AREA_LINE} Legal Assistance will become available in your area as we expand our
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
        headline="Guidance for a Safer Tomorrow"
        accent="Safer Tomorrow"
        body="Get expert legal advice and support for your important matters, with confidence and ease."
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
              Legal Assistance is available only for AgeWell members.
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
              Get access to Legal Assistance and many other services for a safer, healthier and happier life.
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
  const [phone, setPhone] = useState('');
  const [when, setWhen] = useState('');
  const [pickingService, setPickingService] = useState(false);

  const offerings = catalog.data ?? [];
  const selected = offerings.find((item) => item.id === selectedId) ?? offerings[0] ?? null;

  useEffect(() => {
    if (!selectedId && offerings[0]) setSelectedId(offerings[0].id);
  }, [offerings, selectedId]);

  const recent = useMemo(() => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    return toLiveRequestViews(mine, { fallbackTitle: 'Legal assistance', limit: 3 });
  }, [requestsQuery.data?.items]);

  const allCount = useMemo(
    () => filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG).length,
    [requestsQuery.data?.items],
  );

  const onViewAllRequests = () => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    const lines = toLiveRequestViews(mine, { fallbackTitle: 'Legal assistance', limit: 20 })
      .map((item) => `• ${item.title} — ${item.statusLabel} (${item.dateLabel})`)
      .join('\n');
    Alert.alert('My Requests', lines || 'No requests yet.');
  };

  const onSelectCategory = (item: ServiceOffering) => {
    setSelectedId(item.id);
    setPickingService(false);
  };

  const onRequestCallback = () => {
    if (!selected) {
      Alert.alert('Select a category', 'Choose a category first.');
      return;
    }
    void submit(
      [
        `Call back: ${selected.title}.`,
        phone.trim() ? `Phone: ${phone.trim()}.` : null,
        when.trim() ? `Preferred: ${when.trim()}.` : null,
        selected.description || null,
      ]
        .filter(Boolean)
        .join(' '),
      'Call back requested',
    ).then((ok) => {
      if (ok) setWhen('');
    });
  };

  const selectedLook = lookForService(selected?.title ?? '');

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.liveContent} showsVerticalScrollIndicator={false}>
      <View style={styles.liveTitleRow}>
        <View style={styles.liveTitleIcon}>
          <Icon name="document-text-outline" size={22} color={familyHome.white} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.liveTitle}>Legal Assistance</Text>
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
        <Text style={styles.sectionTitle}>Select a Category</Text>
        <Text style={styles.sectionHint}>Choose the area you need assistance with.</Text>
      </View>

      {catalog.isPending ? <Text style={styles.empty}>Loading categories…</Text> : null}
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
              onPress={() => onSelectCategory(item)}
              style={[
                styles.serviceChip,
                { backgroundColor: look.soft, borderColor: active ? look.color : 'transparent' },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.title}
            >
              <Icon name={look.icon} size={22} color={look.color} />
              <Text style={[styles.serviceChipLabel, { color: look.color }]} numberOfLines={3}>
                {item.title}
              </Text>
              {item.description ? (
                <Text style={styles.serviceChipSub} numberOfLines={3}>
                  {item.description}
                </Text>
              ) : null}
              <Icon name="chevron-forward" size={14} color={familyHome.blue} />
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Request a Call Back</Text>
        <Text style={styles.sectionHint}>
          Our legal partner will call you at your preferred time to guide you.
        </Text>
      </View>

      <View style={styles.formCard}>
        <View style={styles.selectedRow}>
          <Text style={styles.fieldLabel}>Selected Category</Text>
          <View style={styles.selectedInner}>
            <View style={[styles.selectedIcon, { backgroundColor: selectedLook.soft }]}>
              <Icon name={selectedLook.icon} size={18} color={selectedLook.color} />
            </View>
            <Text style={styles.selectedTitle} numberOfLines={2}>
              {selected?.title ?? 'Choose a category'}
            </Text>
            <Pressable
              onPress={() => setPickingService((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel="Change selected category"
            >
              <Text style={styles.changeLink}>Change &gt;</Text>
            </Pressable>
          </View>
          {pickingService ? (
            <View style={styles.pickerList}>
              {offerings.map((item) => {
                const look = lookForService(item.title);
                const active = item.id === selected?.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onSelectCategory(item)}
                    style={[styles.pickerRow, active ? styles.pickerRowActive : null]}
                    accessibilityRole="button"
                  >
                    <Icon name={look.icon} size={16} color={look.color} />
                    <Text style={styles.pickerLabel}>{item.title}</Text>
                    {active ? <Icon name="checkmark-circle-outline" size={16} color={familyHome.green} /> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        <View style={styles.fieldsRow}>
          <View style={styles.fieldHalf}>
            <Text style={styles.fieldLabel}>Your Phone Number</Text>
            <View style={styles.inputWrap}>
              <Icon name="call-outline" size={16} color={familyHome.blue} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter mobile number"
                placeholderTextColor={familyHome.muted}
                style={styles.input}
                keyboardType="phone-pad"
                accessibilityLabel="Phone number"
              />
            </View>
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.fieldLabel}>Preferred Date & Time</Text>
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
        </View>

        <Pressable
          style={[styles.callCta, submitting ? styles.disabled : null]}
          onPress={onRequestCallback}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Request Call Back"
        >
          <Icon name="call-outline" size={18} color={familyHome.white} />
          <Text style={styles.callCtaText}>{submitting ? 'Sending…' : 'Request Call Back'}</Text>
        </Pressable>

        <View style={styles.noteBox}>
          <Icon name="help-circle-outline" size={16} color={familyHome.blue} />
          <Text style={styles.noteText}>{CALLBACK_NOTE}</Text>
        </View>
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
        <Text style={styles.empty}>No requests yet. Request a call back above.</Text>
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
  heroCard: {
    borderRadius: 18,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroOutside: { backgroundColor: '#EAF3FB' },
  heroMembership: { backgroundColor: '#EAF3FB' },
  heroCopy: { flex: 1.1, gap: spacing.sm },
  heroAccentBar: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: familyHome.green,
  },
  heroHeadline: { ...typography.subtitle, color: familyHome.text, lineHeight: 26 },
  heroAccent: { color: familyHome.greenDark },
  heroBody: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  heroMedia: { flex: 1, position: 'relative' },
  heroImage: {
    width: '100%',
    height: 132,
    borderRadius: 14,
    backgroundColor: familyHome.border,
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
    width: 120,
    minHeight: 128,
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
  selectedRow: { gap: spacing.sm },
  fieldLabel: { ...typography.captionStrong, color: familyHome.muted, marginBottom: 4 },
  selectedInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: familyHome.white,
    borderRadius: 12,
    padding: spacing.md,
  },
  selectedIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTitle: { ...typography.bodyStrong, color: familyHome.text, flex: 1 },
  changeLink: { ...typography.captionStrong, color: familyHome.blue },
  pickerList: {
    backgroundColor: familyHome.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: familyHome.border,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  pickerRowActive: { backgroundColor: familyHome.greenSoft },
  pickerLabel: { ...typography.body, color: familyHome.text, flex: 1 },
  fieldsRow: { flexDirection: 'row', gap: spacing.sm },
  fieldHalf: { flex: 1 },
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
  requestDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: familyHome.border },
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
