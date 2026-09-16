import { useMemo, useState } from 'react';
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
import {
  filterOfferingsByKind,
  type ServiceOffering,
} from '@/features/membership/catalogTypes';
import {
  filterRequestsBySlug,
  toLiveRequestViews,
} from '@/features/membership/liveServiceRequests';
import { MEMBERSHIP_SERVICE_AREA_LINE } from '@/features/membership/membershipServicePageVariant';
import { membershipPurchaseHref } from '@/features/membership/planCatalog';
import { SERVICE_HERO_IMAGES } from '@/features/membership/serviceHeroes';
import { useMembershipServicePageVariant } from '@/features/membership/useMembershipServicePageVariant';
import { useMembershipSubmit } from '@/features/membership/useMembershipSubmit';
import { useServiceOfferings } from '@/features/membership/useCatalog';
import { useTabScreenBottomPad } from '@/utils/safeBottom';

const SLUG = 'ayurvedic-massage';
const heroImage = SERVICE_HERO_IMAGES['ayurvedic-massage'] ?? SERVICE_HERO_IMAGES.companion;

const DEFAULT_LEAD = 'Ayurvedic massage at home by certified therapist.';
const DEFAULT_PRICE = 'Cost: ₹1,500 / 45 mins & ₹2,000 / 60 mins.';

const FEATURE_ICONS: { match: RegExp; icon: IconName }[] = [
  { match: /authentic|ayurvedic|traditional|leaf|flower/i, icon: 'flower' },
  { match: /certified|therapist|trained|professional/i, icon: 'people-outline' },
  { match: /relax|rejuvenat|stress|heart|massage/i, icon: 'hand-heart' },
  { match: /home|comfort|privacy/i, icon: 'home' },
];

function iconForFeature(title: string, description: string): IconName {
  const hay = `${title} ${description}`;
  for (const row of FEATURE_ICONS) {
    if (row.match.test(hay)) return row.icon;
  }
  return 'hand-heart';
}

export function AyurvedicMassageScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(true);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="AgeWell" showBack showProfile={false} showBell />

      {variant === 'serviceable_with_membership' ? (
        <MemberLiveBody />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.gateContent, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {variant === 'loading' ? <LoadingState message="Loading Ayurvedic Massage..." /> : null}
          {variant === 'non_serviceable' ? <OutsideAreaBody /> : null}
          {variant === 'serviceable_no_membership' ? <NoMembershipBody /> : null}
        </ScrollView>
      )}
    </View>
  );
}

function useAddonServiceCopy() {
  const services = useServices();
  const catalog = useServiceOfferings(SLUG);
  const service = useMemo(
    () => (services.data ?? []).find((item) => item.slug === SLUG) ?? null,
    [services.data],
  );
  const features = useMemo(
    () => filterOfferingsByKind(catalog.data ?? [], 'feature'),
    [catalog.data],
  );
  const options = useMemo(
    () => filterOfferingsByKind(catalog.data ?? [], 'option'),
    [catalog.data],
  );
  const lead = service?.description?.trim() || DEFAULT_LEAD;
  const priceLine =
    options.length >= 2
      ? `Cost: ${options[0].priceLabel} / ${options[0].title} & ${options[1].priceLabel} / ${options[1].title}.`
      : options[0]?.priceLabel
        ? `Cost: ${options[0].priceLabel} / ${options[0].title}.`
        : DEFAULT_PRICE;
  return { service, features, options, lead, priceLine, catalog };
}

function TitleBlock({ lead, priceLine }: { lead: string; priceLine: string }) {
  return (
    <View style={styles.titleRow}>
      <View style={styles.titleIcon}>
        <Icon name="hand-heart" size={22} color={familyHome.greenDark} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.title}>AYURVEDIC MASSAGE</Text>
        <Text style={styles.lead}>{lead}</Text>
        <Text style={styles.priceLine}>{priceLine}</Text>
      </View>
    </View>
  );
}

function GateHero({
  headline,
  accent,
  body,
  tag,
}: {
  headline: string;
  accent: string;
  body: string;
  tag: string;
}) {
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroCopy}>
        <Text style={styles.heroHeadline}>
          {headline}
          {'\n'}
          <Text style={styles.heroAccent}>{accent}</Text>
        </Text>
        <Text style={styles.heroBody}>{body}</Text>
      </View>
      <View style={styles.heroMedia}>
        <Image source={heroImage} style={styles.heroImage} resizeMode="cover" />
        <View style={styles.heroTag}>
          <Text style={styles.heroTagText}>{tag}</Text>
        </View>
      </View>
    </View>
  );
}

function FeaturesGrid({ items, loading }: { items: ServiceOffering[]; loading?: boolean }) {
  return (
    <View style={styles.featuresCard}>
      {loading ? <Text style={styles.empty}>Loading features…</Text> : null}
      {items.map((item) => (
        <View key={item.id} style={styles.featureCol}>
          <View style={styles.featureIcon}>
            <Icon name={iconForFeature(item.title, item.description)} size={18} color={familyHome.green} />
          </View>
          <Text style={styles.featureTitle}>{item.title}</Text>
          <Text style={styles.featureBody}>{item.description}</Text>
        </View>
      ))}
      {!loading && items.length === 0 ? (
        <Text style={styles.empty}>Features will appear here once configured in the catalog.</Text>
      ) : null}
    </View>
  );
}

function HelpBanner({ green }: { green?: boolean }) {
  return (
    <Pressable
      onPress={() => router.push('/account/help' as Href)}
      style={({ pressed }) => [
        green ? styles.helpBannerGreen : styles.helpBanner,
        pressed ? styles.pressed : null,
      ]}
      accessibilityRole="button"
    >
      <View style={green ? styles.helpIconGreen : styles.contactIcon}>
        <Icon name="help-circle-outline" size={16} color={familyHome.white} />
      </View>
      <View style={styles.flex}>
        <Text style={green ? styles.helpTitleGreen : styles.helpTitle}>Have Questions?</Text>
        <Text style={green ? styles.helpBodyGreen : styles.helpBody}>
          Our team is here to help. Reach out to us anytime.
        </Text>
      </View>
      <Icon name="chevron-forward" size={16} color={green ? familyHome.greenDark : familyHome.blue} />
    </Pressable>
  );
}

function OutsideAreaBody() {
  const { lead, priceLine, features, catalog } = useAddonServiceCopy();
  const { submitting, submit } = useMembershipSubmit(SLUG);

  return (
    <View style={styles.stack}>
      <TitleBlock lead={lead} priceLine={priceLine} />
      <GateHero
        headline="Ancient Care for a"
        accent="Healthier Tomorrow"
        body="Relax, rejuvenate and improve your well-being with authentic Ayurvedic massage at the comfort of your home, delivered by certified therapists."
        tag="Natural Healing Happier Living."
      />
      <FeaturesGrid items={features} loading={catalog.isPending} />
      <View style={styles.soonBanner}>
        <View style={styles.soonIcon}>
          <Icon name="location" size={18} color={familyHome.red} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.soonTitle}>Service coming soon to your area</Text>
          <Text style={styles.soonBody}>
            {MEMBERSHIP_SERVICE_AREA_LINE} Ayurvedic Massage will become available in your area as we expand
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
          onPress={() =>
            void submit(
              'Notify me when Ayurvedic Massage is available in my area.',
              'We will notify you',
            )
          }
          disabled={submitting}
          style={[styles.notifyBtn, submitting ? styles.disabled : null]}
          accessibilityRole="button"
          accessibilityLabel="Notify Me"
        >
          <Text style={styles.notifyBtnText}>{submitting ? 'Saving…' : 'Notify Me'}</Text>
        </Pressable>
      </View>
      <HelpBanner green />
    </View>
  );
}

function NoMembershipBody() {
  const { lead, priceLine, features, catalog } = useAddonServiceCopy();

  return (
    <View style={styles.stack}>
      <TitleBlock lead={lead} priceLine={priceLine} />
      <GateHero
        headline="Ancient Healing for a"
        accent="Healthier You"
        body="Experience the therapeutic benefits of Ayurvedic massage at the comfort of your home, delivered by certified and experienced therapists."
        tag="Traditional Care Modern Comfort."
      />
      <FeaturesGrid items={features} loading={catalog.isPending} />
      <View style={styles.membershipCard}>
        <View style={styles.membershipHead}>
          <View style={styles.lockWell}>
            <Icon name="lock-closed-outline" size={16} color="#B45309" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.membershipTitle}>Membership Required</Text>
            <Text style={styles.membershipBody}>
              Ayurvedic Massage service is available only for AgeWell members.
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
              Get access to Ayurvedic Massage and many other services for a healthier and happier life.
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
      <HelpBanner />
    </View>
  );
}

function MemberLiveBody() {
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const { lead, options, catalog } = useAddonServiceCopy();
  const requestsQuery = useServiceRequests();
  const { submitting, submit } = useMembershipSubmit(SLUG);
  const [optionId, setOptionId] = useState('');
  const selected = options.find((item) => item.id === optionId) ?? options[0];

  const recent = useMemo(() => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    return toLiveRequestViews(mine, { fallbackTitle: 'Ayurvedic massage', limit: 5 });
  }, [requestsQuery.data?.items]);

  const onBook = () => {
    if (!selected) {
      Alert.alert('No options', 'Duration options will appear once configured in the catalog.');
      return;
    }
    void submit(
      `${selected.title} · ${selected.priceLabel || 'Charges apply'}. ${selected.description || lead}`.trim(),
      'Booking request submitted',
    );
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.liveContent, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.liveTitleRow}>
        <View style={styles.liveTitleIcon}>
          <Icon name="hand-heart" size={22} color={familyHome.white} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.liveTitle}>Ayurvedic Massage</Text>
          <Text style={styles.subtitle}>Ancient care for a healthier tomorrow.</Text>
        </View>
      </View>

      <Text style={styles.lead}>{lead}</Text>

      <Text style={styles.sectionTitle}>Choose duration</Text>
      {catalog.isPending ? <Text style={styles.empty}>Loading options…</Text> : null}
      {catalog.isError ? (
        <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
          <Text style={styles.link}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}

      <View style={styles.optionList}>
        {options.map((item) => {
          const active = (optionId || options[0]?.id) === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setOptionId(item.id)}
              style={[styles.optionRow, active ? styles.optionRowActive : null]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <View style={styles.flex}>
                <Text style={styles.optionTitle}>{item.title}</Text>
                <Text style={styles.optionMeta}>{item.priceLabel || 'Charges apply'}</Text>
              </View>
              {active ? (
                <Icon name="checkmark-circle-outline" size={20} color={familyHome.green} />
              ) : (
                <View style={styles.radio} />
              )}
            </Pressable>
          );
        })}
        {!catalog.isPending && options.length === 0 ? (
          <Text style={styles.empty}>No duration options configured yet.</Text>
        ) : null}
      </View>

      <Pressable
        onPress={onBook}
        disabled={submitting || !selected}
        style={[styles.bookBtn, submitting || !selected ? styles.disabled : null]}
        accessibilityRole="button"
        accessibilityLabel="Book Ayurvedic Massage"
      >
        <Text style={styles.bookBtnText}>{submitting ? 'Sending…' : 'Book Now'}</Text>
      </Pressable>

      {recent.length > 0 ? (
        <View style={styles.requestBlock}>
          <Text style={styles.sectionTitle}>Recent requests</Text>
          {recent.map((item) => (
            <View key={item.id} style={styles.requestRow}>
              <Text style={styles.requestTitle}>{item.title}</Text>
              <Text style={styles.requestMeta}>
                {item.statusLabel} · {item.dateLabel}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  flex: { flex: 1 },
  stack: { gap: spacing.md },
  gateContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.md },
  liveContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  titleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    lineHeight: 24,
    color: familyHome.blueDark,
    fontWeight: '700',
  },
  lead: { ...typography.caption, color: familyHome.blue, lineHeight: 18, marginTop: 4 },
  priceLine: { ...typography.caption, color: familyHome.blue, lineHeight: 18, marginTop: 2 },
  heroCard: {
    flexDirection: 'row',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: familyHome.blueSoft,
    minHeight: 168,
  },
  heroCopy: { flex: 1, padding: spacing.lg, justifyContent: 'center', gap: spacing.sm },
  heroHeadline: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    lineHeight: 26,
    color: familyHome.blueDark,
    fontWeight: '700',
  },
  heroAccent: { color: familyHome.green },
  heroBody: { ...typography.caption, color: familyHome.blue, lineHeight: 18 },
  heroMedia: { width: 140, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroTag: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  heroTagText: { ...typography.captionStrong, color: familyHome.blueDark, fontSize: 10, lineHeight: 13 },
  featuresCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: familyHome.greenSoft,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
  },
  featureCol: { width: '47%', gap: 4, padding: spacing.sm },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: { ...typography.captionStrong, color: familyHome.blueDark },
  featureBody: { ...typography.caption, color: familyHome.blue, lineHeight: 16 },
  soonBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.redSoft,
    borderRadius: 14,
    padding: spacing.lg,
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
  soonBody: { ...typography.caption, color: familyHome.text, lineHeight: 18, marginTop: 2 },
  notifyCard: {
    backgroundColor: familyHome.blueSoft,
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.md,
  },
  notifyLeft: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  notifyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: familyHome.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: familyHome.blue,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: familyHome.white,
  },
  notifyBtnText: { ...typography.captionStrong, color: familyHome.blue },
  membershipCard: {
    backgroundColor: familyHome.yellowSoft,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
  },
  membershipHead: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  lockWell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  membershipTitle: { ...typography.bodyStrong, color: familyHome.text },
  membershipBody: { ...typography.caption, color: familyHome.muted, lineHeight: 18, marginTop: 2 },
  joinPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: familyHome.white,
    borderRadius: 12,
    padding: spacing.md,
  },
  joinPromoTitle: { ...typography.bodyStrong, color: '#B45309' },
  joinPromoBody: { ...typography.caption, color: familyHome.muted, lineHeight: 18, marginTop: 2 },
  helpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 14,
    padding: spacing.lg,
  },
  helpBannerGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 14,
    padding: spacing.lg,
  },
  contactIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: familyHome.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpIconGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpTitle: { ...typography.bodyStrong, color: familyHome.blueDark },
  helpBody: { ...typography.caption, color: familyHome.blue, lineHeight: 18, marginTop: 2 },
  helpTitleGreen: { ...typography.bodyStrong, color: familyHome.greenDark },
  helpBodyGreen: { ...typography.caption, color: familyHome.greenDark, lineHeight: 18, marginTop: 2 },
  liveTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  liveTitleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveTitle: { ...typography.subtitle, color: familyHome.text },
  subtitle: { ...typography.caption, color: familyHome.muted },
  sectionTitle: { ...typography.subtitle, color: familyHome.text, marginTop: spacing.sm },
  optionList: { gap: spacing.sm },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  optionRowActive: { borderColor: familyHome.green, backgroundColor: familyHome.greenSoft },
  optionTitle: { ...typography.bodyStrong, color: familyHome.text },
  optionMeta: { ...typography.caption, color: familyHome.muted, marginTop: 2 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: familyHome.border,
  },
  bookBtn: {
    backgroundColor: familyHome.green,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  bookBtnText: { ...typography.bodyStrong, color: familyHome.white },
  requestBlock: { gap: spacing.sm, marginTop: spacing.sm },
  requestRow: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 12,
    padding: spacing.md,
    gap: 2,
  },
  requestTitle: { ...typography.bodyStrong, color: familyHome.text },
  requestMeta: { ...typography.caption, color: familyHome.muted },
  empty: { ...typography.caption, color: familyHome.muted },
  link: { ...typography.captionStrong, color: familyHome.blue },
  pressed: { opacity: 0.92 },
  disabled: { opacity: 0.6 },
});
