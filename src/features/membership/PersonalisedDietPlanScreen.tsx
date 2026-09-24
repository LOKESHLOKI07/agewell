import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BloodDrop,
} from 'healthicons-react-native/filled';
import { LoadingState, PrimaryButton, SecondaryButton } from '@/components';
import { Icon, type IconName } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { MarketplaceServiceIcon } from '@/features/services/components/MarketplaceServiceIcon';
import { useHealthDocuments, useLabResults } from '@/features/health/hooks';
import { MEMBERSHIP_SERVICE_AREA_LINE } from './membershipServicePageVariant';
import { membershipPurchaseHref } from './planCatalog';
import { SERVICE_HERO_IMAGES } from './serviceHeroes';
import { ServiceHelpBanner } from './ServiceHelpBanner';
import { useMembershipServicePageVariant } from './useMembershipServicePageVariant';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useTabScreenBottomPad } from '@/utils/safeBottom';

const SLUG = 'personalised-diet-plan';
const heroImage = SERVICE_HERO_IMAGES['personalised-diet-plan'];

const LEAD =
  'A specific diet plan based on your health reports, including recommended foods, meal timings & dietary guidance to support your health and well-being.';

const GATE_FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'document-text-outline',
    title: 'Based on Your Health Reports',
    body: 'Personalised as per your latest health reports',
  },
  {
    icon: 'salad',
    title: 'Tailored Meal Plan',
    body: 'Food recommendations for your health needs',
  },
  {
    icon: 'person-outline',
    title: 'Expert Guidance',
    body: 'Practical advice for healthier living',
  },
  {
    icon: 'heart-outline',
    title: 'Support Your Health',
    body: 'Nutrition that helps improve your well-being',
  },
];

type DietTab = 'plan' | 'recommendations' | 'progress';

const INSIGHTS: {
  id: string;
  title: string;
  line: string;
  soft: string;
  color: string;
  kind: 'iron' | 'd' | 'b12' | 'calcium';
}[] = [
  {
    id: 'iron',
    title: 'Low Iron',
    line: 'Your iron levels are below normal.',
    soft: familyHome.redSoft,
    color: familyHome.red,
    kind: 'iron',
  },
  {
    id: 'vitd',
    title: 'Low Vitamin D',
    line: 'Needs improvement.',
    soft: familyHome.orangeSoft,
    color: familyHome.orange,
    kind: 'd',
  },
  {
    id: 'b12',
    title: 'Low Vitamin B12',
    line: 'Needs improvement.',
    soft: familyHome.blueSoft,
    color: familyHome.blue,
    kind: 'b12',
  },
  {
    id: 'calcium',
    title: 'Calcium Normal',
    line: 'Within healthy range.',
    soft: familyHome.greenSoft,
    color: familyHome.green,
    kind: 'calcium',
  },
];

const RECOMMENDATIONS: {
  id: string;
  title: string;
  foods: string;
  icon: IconName;
  soft: string;
  color: string;
}[] = [
  {
    id: 'iron-foods',
    title: 'Iron Rich Foods',
    foods: 'Methi, Beetroot, Dates, Lentils, Jaggery',
    icon: 'leaf',
    soft: familyHome.greenSoft,
    color: familyHome.green,
  },
  {
    id: 'vitd-foods',
    title: 'Vitamin D Sources',
    foods: 'Mushrooms, Fortified Milk, Eggs, Cheese',
    icon: 'sparkles',
    soft: familyHome.orangeSoft,
    color: familyHome.orange,
  },
  {
    id: 'b12-foods',
    title: 'Vitamin B12 Sources',
    foods: 'Milk, Curd, Paneer, Fortified Cereals',
    icon: 'restaurant-outline',
    soft: familyHome.blueSoft,
    color: familyHome.blue,
  },
  {
    id: 'calcium-foods',
    title: 'Calcium Rich Foods',
    foods: 'Ragi, Sesame Seeds, Almonds, Green Leafy Vegetables',
    icon: 'flower',
    soft: familyHome.purpleSoft,
    color: familyHome.purple,
  },
];

/**
 * Personalised Diet Plan — three gate states matching product mocks;
 * member hub shows insights + nutrition recommendations from health context.
 */
export function PersonalisedDietPlanScreen() {
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
          {variant === 'loading' ? <LoadingState message="Loading Personalised Diet Plan..." /> : null}
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
        fallbackIcon="salad"
        fallbackColor={familyHome.greenDark}
        size={48}
      />
      <View style={styles.flex}>
        <Text style={styles.title}>PERSONALISED DIET PLAN</Text>
        <Text style={styles.lead}>{LEAD}</Text>
      </View>
    </View>
  );
}

function SoftHero({
  headline,
  accent,
  body,
}: {
  headline: string;
  accent: string;
  body: string;
}) {
  return (
    <View style={styles.softHero} accessibilityRole="summary">
      <View style={styles.softHeroCopy}>
        <Text style={styles.softHeroHeadline}>
          {headline}
          <Text style={styles.softHeroAccent}>{accent}</Text>
        </Text>
        <Text style={styles.softHeroBody}>{body}</Text>
      </View>
      <Image source={heroImage} style={styles.softHeroImage} resizeMode="cover" />
    </View>
  );
}

function PhotoHero() {
  return (
    <View style={styles.photoHero} accessibilityRole="summary">
      <View style={styles.photoHeroCopy}>
        <Text style={styles.photoHeroHeadline}>
          Better Nutrition{'\n'}
          <Text style={styles.softHeroAccent}>for a Healthier You</Text>
        </Text>
        <Text style={styles.photoHeroBody}>
          Personalised diet guidance to help you stay active and feel your best every day.
        </Text>
      </View>
      <Image source={heroImage} style={styles.photoHeroImage} resizeMode="cover" />
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
          <Text style={styles.featureTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.featureBody} numberOfLines={3}>
            {item.body}
          </Text>
        </View>
      ))}
    </View>
  );
}

function OutsideAreaBody() {
  const { submitting, submit } = useMembershipSubmit(SLUG);

  const onNotify = () => {
    void submit(
      'Notify me when Personalised Diet Plan is available in my area.',
      'We will notify you',
    );
  };

  return (
    <View style={styles.stack}>
      <TitleBlock />
      <SoftHero
        headline="Better Nutrition, "
        accent="Healthier You"
        body="Personalised diet guidance based on your health reports."
      />
      <View style={styles.soonBanner}>
        <Icon name="location" size={18} color={familyHome.red} />
        <View style={styles.flex}>
          <Text style={styles.soonTitle}>Service coming soon to your area</Text>
          <Text style={styles.soonBody}>
            {MEMBERSHIP_SERVICE_AREA_LINE} Personalised Diet Plan will become available in your area as we
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
            <Text style={styles.notifyTitle}>Get Notified</Text>
            <Text style={styles.notifyBody}>
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
      <View style={styles.membershipCard}>
        <View style={styles.membershipHead}>
          <View style={styles.lockWell}>
            <Icon name="ribbon-outline" size={16} color={familyHome.greenDark} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.membershipTitle}>Membership Required</Text>
            <Text style={styles.membershipBody}>
              Personalised Diet Plan is available only for AgeWell members.
            </Text>
          </View>
        </View>
        <PrimaryButton label="Join Membership  →" onPress={() => router.push(membershipPurchaseHref())} />
      </View>
      <ServiceHelpBanner />
    </View>
  );
}

function NoMembershipBody() {
  return (
    <View style={styles.stack}>
      <TitleBlock />
      <PhotoHero />
      <FeaturesGrid />
      <View style={styles.membershipCard}>
        <View style={styles.membershipHead}>
          <View style={styles.lockWell}>
            <Icon name="lock-closed-outline" size={16} color="#B45309" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.membershipTitle}>Membership Required</Text>
            <Text style={styles.membershipBody}>
              Personalised Diet Plan is available only for AgeWell members.
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
              Get access to Personalised Diet Plan and many other services for a safer, healthier and happier
              life.
            </Text>
          </View>
          <Icon name="chevron-forward" size={16} color="#B45309" />
        </Pressable>
        <PrimaryButton label="Join Membership  →" onPress={() => router.push(membershipPurchaseHref())} />
        <SecondaryButton label="View Membership Plans" onPress={() => router.push(membershipPurchaseHref())} />
      </View>
      <ServiceHelpBanner />
    </View>
  );
}

function MemberLiveBody() {
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const [tab, setTab] = useState<DietTab>('plan');
  const labsQuery = useLabResults();
  const docsQuery = useHealthDocuments();
  const { submitting, submit } = useMembershipSubmit(SLUG);

  const reports = useMemo(() => {
    const labs = (labsQuery.data?.items ?? []).slice(0, 2).map((item) => ({
      id: item.id,
      title: item.testName?.trim() || 'Lab report',
      date: item.date?.slice(0, 10) || '',
      icon: 'test-tube' as IconName,
      color: familyHome.purple,
      soft: familyHome.purpleSoft,
    }));
    const docs = (docsQuery.data?.items ?? []).slice(0, 2).map((item) => ({
      id: item.id,
      title: item.documentType?.trim() || 'Health report',
      date: '',
      icon: 'document-text-outline' as IconName,
      color: familyHome.red,
      soft: familyHome.redSoft,
    }));
    const merged = [...docs, ...labs].slice(0, 3);
    if (merged.length > 0) return merged;
    return [
      {
        id: 'fallback-checkup',
        title: 'Complete Health Checkup Report',
        date: '12 Sep 2026',
        icon: 'document-text-outline' as IconName,
        color: familyHome.red,
        soft: familyHome.redSoft,
      },
      {
        id: 'fallback-cbc',
        title: 'CBC (Blood Test) Report',
        date: '12 Sep 2026',
        icon: 'test-tube' as IconName,
        color: familyHome.purple,
        soft: familyHome.purpleSoft,
      },
    ];
  }, [docsQuery.data?.items, labsQuery.data?.items]);

  const onRequestUpdate = () => {
    void submit(
      'Request updated personalised diet plan based on latest health reports.',
      'Diet plan update requested',
    );
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.liveContent, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.liveHero}>
        <View style={styles.liveHeroIcon}>
          <Icon name="restaurant-outline" size={22} color={familyHome.green} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.liveHeroTitle}>Personalised Diet Plan</Text>
          <Text style={styles.liveHeroSub}>Better nutrition. A healthier you.</Text>
        </View>
        <Pressable
          onPress={() => router.push('/health/reports' as Href)}
          style={({ pressed }) => [styles.reportsChip, pressed ? styles.pressed : null]}
          accessibilityRole="button"
          accessibilityLabel="View My Health Reports"
        >
          <Icon name="document-text-outline" size={14} color={familyHome.green} />
          <Text style={styles.reportsChipText}>View My{'\n'}Health Reports</Text>
          <Icon name="chevron-forward" size={14} color={familyHome.green} />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {(
          [
            { key: 'plan' as const, label: 'My Diet Plan' },
            { key: 'recommendations' as const, label: 'Recommendations' },
            { key: 'progress' as const, label: 'Progress' },
          ] as const
        ).map((item) => {
          const active = tab === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setTab(item.key)}
              style={[styles.tab, active ? styles.tabActive : null]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'plan' ? (
        <>
          <View style={styles.infoBanner}>
            <Icon name="document-text-outline" size={18} color={familyHome.green} />
            <Text style={styles.infoBannerBody}>
              Your diet plan is prepared based on your latest CBC results and health check-up reports.
            </Text>
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Key Insights from Your Reports</Text>
            <Pressable onPress={() => router.push('/health/labs' as Href)} accessibilityRole="button">
              <Text style={styles.link}>View Full Report ›</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.insightRow}
          >
            {INSIGHTS.map((item) => (
              <View key={item.id} style={[styles.insightCard, { backgroundColor: item.soft }]}>
                <View style={[styles.insightIcon, { backgroundColor: familyHome.white }]}>
                  {item.kind === 'iron' ? (
                    <BloodDrop width={18} height={18} color={item.color} />
                  ) : (
                    <Text style={[styles.insightGlyph, { color: item.color }]}>
                      {item.kind === 'd' ? 'D' : item.kind === 'b12' ? 'B12' : 'Ca'}
                    </Text>
                  )}
                </View>
                <Text style={styles.insightTitle}>{item.title}</Text>
                <Text style={styles.insightLine}>{item.line}</Text>
              </View>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Your Nutrition Recommendations</Text>
          <Text style={styles.sectionSub}>Include these natural food sources in your daily diet.</Text>
          <View style={styles.recList}>
            {RECOMMENDATIONS.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [styles.recCard, pressed ? styles.pressed : null]}
                accessibilityRole="button"
              >
                <View style={[styles.recThumb, { backgroundColor: item.soft }]}>
                  <Icon name={item.icon} size={20} color={item.color} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.recTitle}>{item.title}</Text>
                  <Text style={styles.recFoods}>{item.foods}</Text>
                </View>
                <Icon name="chevron-forward" size={16} color={familyHome.muted} />
              </Pressable>
            ))}
            <View style={styles.tipsCard}>
              <View style={styles.tipsIcon}>
                <Icon name="leaf" size={18} color={familyHome.blue} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.recTitle}>Additional Tips</Text>
                <Text style={styles.recFoods}>
                  Stay hydrated, prefer seasonal fruits, and keep regular meal timings.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Your Reports</Text>
            <Pressable onPress={() => router.push('/health/reports' as Href)} accessibilityRole="button">
              <Text style={styles.link}>View All ›</Text>
            </Pressable>
          </View>
          <View style={styles.recList}>
            {reports.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push('/health/reports' as Href)}
                style={({ pressed }) => [styles.reportCard, pressed ? styles.pressed : null]}
                accessibilityRole="button"
              >
                <View style={[styles.recThumb, { backgroundColor: item.soft }]}>
                  <Icon name={item.icon} size={18} color={item.color} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.recTitle}>{item.title}</Text>
                  {item.date ? <Text style={styles.recFoods}>{item.date}</Text> : null}
                </View>
                <Icon name="chevron-forward" size={16} color={familyHome.muted} />
              </Pressable>
            ))}
          </View>

          <PrimaryButton
            label={submitting ? 'Sending…' : 'Request Updated Diet Plan'}
            onPress={onRequestUpdate}
            disabled={submitting}
          />
          <ServiceHelpBanner />
        </>
      ) : null}

      {tab === 'recommendations' ? (
        <View style={styles.stack}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <Text style={styles.sectionSub}>Food sources matched to your latest report insights.</Text>
          <View style={styles.recList}>
            {RECOMMENDATIONS.map((item) => (
              <View key={item.id} style={styles.recCard}>
                <View style={[styles.recThumb, { backgroundColor: item.soft }]}>
                  <Icon name={item.icon} size={20} color={item.color} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.recTitle}>{item.title}</Text>
                  <Text style={styles.recFoods}>{item.foods}</Text>
                </View>
              </View>
            ))}
          </View>
          <ServiceHelpBanner />
        </View>
      ) : null}

      {tab === 'progress' ? (
        <View style={styles.stack}>
          <View style={styles.progressCard}>
            <Icon name="medkit" size={22} color={familyHome.green} />
            <View style={styles.flex}>
              <Text style={styles.recTitle}>Track with your next check-up</Text>
              <Text style={styles.recFoods}>
                Progress updates appear after your next CBC and monthly health check. Keep following your
                nutrition recommendations in the meantime.
              </Text>
            </View>
          </View>
          <PrimaryButton
            label="Book Health Check"
            onPress={() => router.push('/membership/health-check' as Href)}
          />
          <ServiceHelpBanner />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  flex: { flex: 1, minWidth: 0 },
  gateContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  liveContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  stack: { gap: spacing.lg },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.6 },

  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  titleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.subtitle, color: '#123B7A', letterSpacing: 0.3 },
  lead: { ...typography.caption, color: familyHome.muted, lineHeight: 18, marginTop: 4 },

  softHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 18,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  softHeroCopy: { flex: 1, gap: 6 },
  softHeroHeadline: { ...typography.subtitle, color: '#123B7A', lineHeight: 26 },
  softHeroAccent: { color: familyHome.greenDark, fontWeight: '700' },
  softHeroBody: { ...typography.caption, color: familyHome.muted, lineHeight: 17 },
  softHeroImage: { width: 96, height: 96, borderRadius: 14 },

  photoHero: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: familyHome.greenSoft,
    borderRadius: 18,
    overflow: 'hidden',
    minHeight: 140,
  },
  photoHeroCopy: { flex: 1, padding: spacing.lg, gap: 6, justifyContent: 'center' },
  photoHeroHeadline: { ...typography.subtitle, color: '#123B7A', lineHeight: 26 },
  photoHeroBody: { ...typography.caption, color: familyHome.muted, lineHeight: 17 },
  photoHeroImage: { width: 132, height: '100%', minHeight: 140 },

  featuresCard: {
    flexDirection: 'row',
    backgroundColor: '#EAF6F4',
    borderRadius: 18,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  featureCol: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: 2 },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    ...typography.captionStrong,
    color: familyHome.text,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 13,
  },
  featureBody: {
    ...typography.caption,
    color: familyHome.muted,
    textAlign: 'center',
    fontSize: 9,
    lineHeight: 12,
  },

  soonBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.redSoft,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#F5C2C4',
  },
  soonTitle: { ...typography.bodyStrong, color: familyHome.red },
  soonBody: { ...typography.caption, color: familyHome.muted, lineHeight: 18, marginTop: 2 },

  notifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  notifyLeft: { flex: 1, flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  notifyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyTitle: { ...typography.bodyStrong, color: familyHome.text },
  notifyBody: { ...typography.caption, color: familyHome.muted, lineHeight: 16 },
  notifyBtn: {
    backgroundColor: familyHome.green,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: minTouchSize,
    justifyContent: 'center',
  },
  notifyBtnText: { ...typography.captionStrong, color: familyHome.white },

  membershipCard: {
    backgroundColor: '#FFF8F0',
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#F5E6D3',
  },
  membershipHead: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  lockWell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FCEFDF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  membershipTitle: { ...typography.bodyStrong, color: '#123B7A' },
  membershipBody: { ...typography.caption, color: familyHome.muted, lineHeight: 17, marginTop: 2 },
  joinPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FCEFDF',
    borderRadius: 12,
    padding: spacing.md,
  },
  joinPromoTitle: { ...typography.captionStrong, color: '#9A3412' },
  joinPromoBody: { ...typography.caption, color: '#B45309', lineHeight: 16, marginTop: 2 },

  liveHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: familyHome.green,
    borderRadius: 18,
    padding: spacing.lg,
  },
  liveHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveHeroTitle: { ...typography.subtitle, color: familyHome.white },
  liveHeroSub: { ...typography.caption, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  reportsChip: {
    maxWidth: 108,
    backgroundColor: familyHome.white,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  reportsChipText: {
    ...typography.captionStrong,
    color: familyHome.greenDark,
    fontSize: 9,
    lineHeight: 12,
    textAlign: 'center',
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: familyHome.surfaceMuted,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabActive: { backgroundColor: familyHome.green },
  tabText: { ...typography.captionStrong, color: familyHome.muted, fontSize: 11, textAlign: 'center' },
  tabTextActive: { color: familyHome.white },

  infoBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: familyHome.blueSoft,
    borderRadius: 14,
    padding: spacing.lg,
  },
  infoBannerBody: { ...typography.caption, color: familyHome.muted, lineHeight: 18, flex: 1 },

  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: { ...typography.subtitle, color: '#123B7A', flex: 1 },
  sectionSub: { ...typography.caption, color: familyHome.muted, lineHeight: 17, marginTop: -8 },
  link: { ...typography.captionStrong, color: familyHome.blue },

  insightRow: { gap: spacing.sm, paddingRight: spacing.xl },
  insightCard: {
    width: 132,
    borderRadius: 14,
    padding: spacing.md,
    gap: 6,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightGlyph: { ...typography.captionStrong, fontSize: 11 },
  insightTitle: { ...typography.captionStrong, color: familyHome.text },
  insightLine: { ...typography.caption, color: familyHome.muted, fontSize: 11, lineHeight: 15 },

  recList: { gap: spacing.sm },
  recCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.md,
    backgroundColor: familyHome.white,
  },
  recThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recTitle: { ...typography.bodyStrong, color: familyHome.text },
  recFoods: { ...typography.caption, color: familyHome.muted, lineHeight: 17, marginTop: 2 },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 14,
    padding: spacing.md,
  },
  tipsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.md,
  },
  progressCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'flex-start',
  },
});
