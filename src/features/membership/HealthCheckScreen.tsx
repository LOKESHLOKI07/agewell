import { useState } from 'react';
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
import { KeyboardAwareScrollView, LoadingState, PrimaryButton, SecondaryButton } from '@/components';
import { Icon, type IconName } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { queryClient } from '@/api/queryClient';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';
import { useServiceRequests } from '@/features/home/hooks/queries';
import { useHealthDocuments, useLabResults } from '@/features/health/hooks';
import { healthQueryKeys } from '@/features/health/queryKeys';
import { MEMBERSHIP_SERVICE_AREA_LINE } from './membershipServicePageVariant';
import {
  healthReportToneMeta,
  toHealthReadingViews,
  toHealthReportViews,
  type HealthReadingView,
  type HealthReportView,
} from './healthCheckModel';
import { membershipPurchaseHref } from './planCatalog';
import { SERVICE_HERO_IMAGES } from './serviceHeroes';
import { useMembershipServicePageVariant } from './useMembershipServicePageVariant';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useTabScreenBottomPad } from '@/utils/safeBottom';

const INCLUDED: { icon: IconName; title: string; line: string }[] = [
  { icon: 'heart-outline', title: 'Blood Pressure', line: 'Monitor your heart health' },
  { icon: 'medkit-outline', title: 'Pulse', line: 'Check your pulse rate' },
  { icon: 'medkit-outline', title: 'SpO₂', line: 'Know your oxygen level' },
  { icon: 'time-outline', title: 'Temperature', line: 'Track your body temperature' },
  { icon: 'water', title: 'Blood Sugar', line: 'Monitor your sugar levels' },
];

const MEMBER_EXTRAS: { icon: IconName; title: string }[] = [
  { icon: 'document-text-outline', title: 'Maintain digital health records' },
  { icon: 'clipboard-outline', title: 'Track your health over time' },
  { icon: 'shield-checkmark-outline', title: 'Early detection and preventive care' },
  { icon: 'plus-circle', title: 'Access to additional tests (e.g. ECG)' },
];

/**
 * Health Check — three gate states from product mockups; member hub uses real labs/docs/requests only.
 */
export function HealthCheckScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(true);
  const { submitting, submit } = useMembershipSubmit('health-check');
  const labsQuery = useLabResults();
  const docsQuery = useHealthDocuments();
  const requestsQuery = useServiceRequests();
  const [showAllReports, setShowAllReports] = useState(false);

  const readings = toHealthReadingViews(labsQuery.data?.items ?? [], 4);
  const allReports = toHealthReportViews({
    requests: requestsQuery.data?.items ?? [],
    documents: docsQuery.data?.items ?? [],
    labs: labsQuery.data?.items ?? [],
  });
  const reports = showAllReports ? allReports : allReports.slice(0, 4);
  const dataLoading = labsQuery.isPending || docsQuery.isPending || requestsQuery.isPending;
  const dataError = labsQuery.isError || docsQuery.isError || requestsQuery.isError;

  const refresh = () =>
    void Promise.all([labsQuery.refetch(), docsQuery.refetch(), requestsQuery.refetch()]);

  const requestAddon = () => {
    Alert.alert('Request add-on test', 'Choose an extra test (charges apply).', [
      {
        text: 'ECG',
        onPress: () => {
          void (async () => {
            const ok = await submit('Add-on test: ECG (charges apply)', 'Add-on test requested');
            if (ok) {
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: homeQueryKeys.serviceRequests }),
                requestsQuery.refetch(),
              ]);
            }
          })();
        },
      },
      {
        text: 'Other paid test',
        onPress: () => {
          void (async () => {
            const ok = await submit('Add-on test: Other paid test (charges apply)', 'Add-on test requested');
            if (ok) {
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: homeQueryKeys.serviceRequests }),
                requestsQuery.refetch(),
              ]);
            }
          })();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const bookMonthly = () => {
    void (async () => {
      const ok = await submit(
        'Vitals: Blood pressure (BP), Pulse, SpO₂ (oxygen), Temperature, Blood sugar',
        'Health check requested',
      );
      if (ok) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: homeQueryKeys.serviceRequests }),
          queryClient.invalidateQueries({ queryKey: healthQueryKeys.labResults }),
          refresh(),
        ]);
      }
    })();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader
        title={variant === 'serviceable_with_membership' ? 'Services' : 'AgeWell'}
        showBack
        showProfile={false}
        showBell
        showTagline={variant !== 'serviceable_with_membership'}
      />
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {variant === 'loading' ? <LoadingState message="Loading Health Check..." /> : null}

        {variant === 'non_serviceable' ? (
          <>
            <TitleBlock />
            <HeroBanner tone="soft" />
            <IncludedSection />
            <ComingSoonFooter />
            <HelpBanner />
          </>
        ) : null}

        {variant === 'serviceable_no_membership' ? (
          <>
            <TitleBlock />
            <HeroBanner tone="photo" />
            <IncludedSection title="What's Included (Free for Members)" />
            <MembershipRequiredFooter />
            <MoreWithMembership />
          </>
        ) : null}

        {variant === 'serviceable_with_membership' ? (
          <MemberBody
            readings={readings}
            reports={reports}
            hasMoreReports={allReports.length > 4 && !showAllReports}
            loading={dataLoading}
            error={dataError}
            submitting={submitting}
            onRetry={refresh}
            onViewAllReports={() => setShowAllReports(true)}
            onRequestAddon={requestAddon}
            onBookMonthly={bookMonthly}
          />
        ) : null}
      </KeyboardAwareScrollView>
    </View>
  );
}

function TitleBlock() {
  return (
    <View style={styles.titleBlock}>
      <View style={styles.titleWell}>
        <Icon name="medkit-outline" size={22} color={familyHome.green} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.title}>Health Check</Text>
        <Text style={styles.lead}>
          Free monthly checks for BP, pulse, SpO₂, temperature & blood sugar. Other tests, such as ECG, are available
          at extra charges.
        </Text>
      </View>
    </View>
  );
}

function HeroBanner({ tone }: { tone: 'soft' | 'photo' }) {
  return (
    <View style={[styles.heroCard, tone === 'photo' ? styles.heroCardPhoto : styles.heroCardSoft]}>
      <View style={styles.heroCopy}>
        <Text style={[styles.heroHeadline, tone === 'photo' ? styles.onDark : null]}>
          Your Health <Text style={styles.heroAccent}>Our Priority</Text>
        </Text>
        <Text style={[styles.heroSub, tone === 'photo' ? styles.onDarkMuted : null]}>
          {tone === 'photo'
            ? 'Small Checks Brighter Tomorrows. Regular health checks for a healthier, happier you.'
            : 'Regular health checks for a healthier, happier you.'}
        </Text>
      </View>
      <View style={styles.heroMedia}>
        <Image
          source={SERVICE_HERO_IMAGES['health-check']}
          style={styles.heroImage}
          resizeMode="contain"
          accessibilityLabel="Health check illustration"
        />
        {tone === 'soft' ? (
          <View style={styles.heroCallout}>
            <Text style={styles.heroCalloutText}>Care Today for a Brighter Tomorrow</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function IncludedSection({ title = "What's Included" }: { title?: string }) {
  return (
    <View style={styles.stack}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.includedGrid}>
        {INCLUDED.map((item) => (
          <View key={item.title} style={styles.includedCard}>
            <View style={styles.includedIcon}>
              <Icon name={item.icon} size={18} color={familyHome.green} />
            </View>
            <Text style={styles.includedTitle}>{item.title}</Text>
            <Text style={styles.includedLine}>{item.line}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ComingSoonFooter() {
  return (
    <View style={styles.soonBanner}>
      <Icon name="location" size={18} color={familyHome.red} />
      <View style={styles.flex}>
        <Text style={styles.soonTitle}>Service coming soon to your area</Text>
        <Text style={styles.soonBody}>
          {MEMBERSHIP_SERVICE_AREA_LINE} Health Check service will become available in your area as we expand our
          services.
        </Text>
      </View>
    </View>
  );
}

function MembershipRequiredFooter() {
  return (
    <View style={styles.membershipCard}>
      <View style={styles.membershipHead}>
        <View style={styles.lockWell}>
          <Icon name="lock-closed-outline" size={16} color="#B45309" />
        </View>
        <View style={styles.flex}>
          <Text style={styles.membershipTitle}>Membership Required</Text>
          <Text style={styles.membershipBody}>Health Check service is available to AgeWell members.</Text>
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
            Get access to monthly health checks and many other services for a safer, healthier and happier life.
          </Text>
        </View>
        <Icon name="chevron-forward" size={16} color="#B45309" />
      </Pressable>
      <PrimaryButton label="Join Membership  →" onPress={() => router.push(membershipPurchaseHref())} />
      <SecondaryButton label="View Membership Plans" onPress={() => router.push(membershipPurchaseHref())} />
    </View>
  );
}

function MoreWithMembership() {
  return (
    <View style={styles.stack}>
      <Text style={styles.sectionTitle}>More with Membership</Text>
      {MEMBER_EXTRAS.map((item) => (
        <View key={item.title} style={styles.extraRow}>
          <View style={styles.extraIcon}>
            <Icon name={item.icon} size={16} color={familyHome.green} />
          </View>
          <Text style={styles.extraTitle}>{item.title}</Text>
        </View>
      ))}
    </View>
  );
}

function HelpBanner() {
  return (
    <Pressable
      onPress={() => router.push('/account/help' as Href)}
      style={({ pressed }) => [styles.helpBanner, pressed ? styles.pressed : null]}
      accessibilityRole="button"
    >
      <Icon name="help-circle-outline" size={18} color={familyHome.blue} />
      <View style={styles.flex}>
        <Text style={styles.helpTitle}>Have Questions?</Text>
        <Text style={styles.helpBody}>Our team is here to help. Reach out to us anytime.</Text>
      </View>
    </Pressable>
  );
}

function MemberBody({
  readings,
  reports,
  hasMoreReports,
  loading,
  error,
  submitting,
  onRetry,
  onViewAllReports,
  onRequestAddon,
  onBookMonthly,
}: {
  readings: HealthReadingView[];
  reports: HealthReportView[];
  hasMoreReports: boolean;
  loading: boolean;
  error: boolean;
  submitting: boolean;
  onRetry: () => void;
  onViewAllReports: () => void;
  onRequestAddon: () => void;
  onBookMonthly: () => void;
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.memberTitleLine}>
        <View style={styles.memberTitleWell}>
          <Icon name="heart-outline" size={18} color={familyHome.white} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.memberTitle}>Health Checks</Text>
          <Text style={styles.memberSubtitle}>Track Today. Stay Healthier Tomorrow.</Text>
        </View>
      </View>

      <View style={styles.actionCards}>
        <Pressable
          onPress={() => router.push('/health/labs' as Href)}
          style={({ pressed }) => [styles.actionCard, styles.actionGreen, pressed ? styles.pressed : null]}
          accessibilityRole="button"
          accessibilityLabel="View Monthly Health Records"
        >
          <View style={styles.actionTop}>
            <View style={styles.actionIcon}>
              <Icon name="document-text-outline" size={18} color={familyHome.green} />
            </View>
            <Icon name="chevron-forward" size={16} color={familyHome.muted} />
          </View>
          <Text style={styles.actionTitle}>View Monthly Health Records</Text>
          <Text style={styles.actionBody}>See your test reports and health readings.</Text>
        </Pressable>

        <Pressable
          onPress={onRequestAddon}
          disabled={submitting}
          style={({ pressed }) => [styles.actionCard, styles.actionBlue, pressed ? styles.pressed : null]}
          accessibilityRole="button"
          accessibilityLabel="Request Add-on Tests"
        >
          <View style={styles.actionTop}>
            <View style={styles.actionIcon}>
              <Icon name="flask-outline" size={18} color={familyHome.blue} />
            </View>
            <Icon name="chevron-forward" size={16} color={familyHome.muted} />
          </View>
          <Text style={styles.actionTitle}>{submitting ? 'Sending…' : 'Request Add-on Tests'}</Text>
          <Text style={styles.actionBody}>Need additional tests? Generate a test request.</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={onBookMonthly}
        disabled={submitting}
        style={[styles.primaryCta, submitting ? styles.disabled : null]}
        accessibilityRole="button"
      >
        <Text style={styles.primaryCtaText}>{submitting ? 'Sending…' : 'Book monthly health check'}</Text>
      </Pressable>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Latest Health Readings</Text>
        <Pressable onPress={() => router.push('/health/labs' as Href)} accessibilityRole="button">
          <Text style={styles.link}>View Trends &gt;</Text>
        </Pressable>
      </View>

      {loading ? <LoadingState message="Loading health readings..." /> : null}
      {error ? (
        <Pressable onPress={onRetry} style={styles.errorBanner} accessibilityRole="button">
          <Text style={styles.errorText}>Could not load health data. Tap to retry.</Text>
        </Pressable>
      ) : null}
      {!loading && !error && readings.length === 0 ? (
        <Text style={styles.empty}>No health readings on file yet.</Text>
      ) : null}
      {!loading && !error && readings.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.readingRow}>
          {readings.map((item) => (
            <View key={item.id} style={styles.readingCard}>
              <View style={styles.readingIcon}>
                <Icon name={item.icon} size={16} color={familyHome.green} />
              </View>
              <Text style={styles.readingLabel}>{item.label}</Text>
              <Text style={styles.readingValue}>{item.value}</Text>
              {item.dateLabel ? <Text style={styles.readingDate}>{item.dateLabel}</Text> : null}
            </View>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Recent Test Reports</Text>
        {hasMoreReports ? (
          <Pressable onPress={onViewAllReports} accessibilityRole="button">
            <Text style={styles.link}>View All &gt;</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push('/health/documents' as Href)} accessibilityRole="button">
            <Text style={styles.link}>View All &gt;</Text>
          </Pressable>
        )}
      </View>

      {!loading && !error && reports.length === 0 ? (
        <Text style={styles.empty}>No test reports yet. Book a health check to get started.</Text>
      ) : null}
      {!loading && !error
        ? reports.map((report) => {
            const tone = healthReportToneMeta(report.tone);
            return (
              <Pressable
                key={report.id}
                onPress={() => router.push(report.href as Href)}
                style={({ pressed }) => [styles.reportRow, pressed ? styles.pressed : null]}
                accessibilityRole="button"
                accessibilityLabel={`${report.title}. ${report.statusLabel}`}
              >
                <View style={[styles.reportIcon, { backgroundColor: tone.soft }]}>
                  <Icon name="document-text-outline" size={16} color={tone.color} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.reportTitle}>{report.title}</Text>
                  {report.dateLabel ? <Text style={styles.reportMeta}>{report.dateLabel}</Text> : null}
                  <Text style={styles.reportSummary}>{report.summary}</Text>
                  <View style={[styles.statusPill, { backgroundColor: tone.soft }]}>
                    <Text style={[styles.statusPillText, { color: tone.color }]}>{report.statusLabel}</Text>
                  </View>
                  {report.tone === 'submitted' ? (
                    <Text style={styles.reportHint}>Our team will contact you soon.</Text>
                  ) : null}
                </View>
                <Icon name="chevron-forward" size={16} color={familyHome.muted} />
              </Pressable>
            );
          })
        : null}

      <Pressable
        onPress={() => router.push('/account/help' as Href)}
        style={({ pressed }) => [styles.expertBanner, pressed ? styles.pressed : null]}
        accessibilityRole="button"
      >
        <Icon name="help-circle-outline" size={18} color={familyHome.blue} />
        <View style={styles.flex}>
          <Text style={styles.helpBody}>
            Need help with your health tests? Talk to our customer support team (10 AM - 6 PM).
          </Text>
        </View>
        <Text style={styles.link}>Talk to Expert &gt;</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.lg },
  stack: { gap: spacing.md },
  flex: { flex: 1 },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.6 },

  titleBlock: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  titleWell: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.title, color: '#123B7A' },
  lead: { ...typography.caption, color: familyHome.muted, marginTop: 4, lineHeight: 18 },

  heroCard: {
    borderRadius: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 148,
    padding: spacing.lg,
    gap: spacing.md,
  },
  heroCardSoft: { backgroundColor: familyHome.greenSoft },
  heroCardPhoto: { backgroundColor: '#123B7A' },
  heroCopy: { flex: 1, gap: spacing.xs },
  heroHeadline: { ...typography.subtitle, color: '#123B7A', lineHeight: 24 },
  heroAccent: { color: familyHome.green, fontWeight: '700' },
  heroSub: { ...typography.caption, color: '#123B7A', lineHeight: 17 },
  onDark: { color: familyHome.white },
  onDarkMuted: { color: 'rgba(255,255,255,0.9)' },
  heroMedia: { width: 120, alignItems: 'center' },
  heroImage: { width: 110, height: 110 },
  heroCallout: {
    marginTop: 4,
    backgroundColor: familyHome.white,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    maxWidth: 120,
  },
  heroCalloutText: {
    ...typography.caption,
    color: familyHome.greenDark,
    fontWeight: '600',
    fontSize: 10,
    lineHeight: 13,
  },

  sectionTitle: { ...typography.subtitle, color: '#123B7A' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { ...typography.captionStrong, color: familyHome.blue },

  includedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  includedCard: {
    width: '31%',
    flexGrow: 1,
    minWidth: 100,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 14,
    padding: spacing.md,
    gap: 4,
    alignItems: 'center',
  },
  includedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  includedTitle: { ...typography.captionStrong, color: familyHome.text, textAlign: 'center' },
  includedLine: { ...typography.caption, color: familyHome.muted, textAlign: 'center', fontSize: 11, lineHeight: 15 },

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
  soonBody: { ...typography.caption, color: familyHome.text, marginTop: 4, lineHeight: 18 },

  membershipCard: {
    backgroundColor: familyHome.yellowSoft,
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#F5E6B8',
  },
  membershipHead: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  lockWell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  membershipTitle: { ...typography.bodyStrong, color: '#B45309' },
  membershipBody: { ...typography.caption, color: familyHome.text, marginTop: 2, lineHeight: 18 },
  joinPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FDE9A8',
    borderRadius: 14,
    padding: spacing.md,
  },
  joinPromoTitle: { ...typography.bodyStrong, color: '#92400E' },
  joinPromoBody: { ...typography.caption, color: familyHome.text, marginTop: 2, lineHeight: 17 },

  extraRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  extraIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraTitle: { ...typography.body, color: familyHome.text, flex: 1 },

  helpBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'flex-start',
  },
  helpTitle: { ...typography.bodyStrong, color: familyHome.blueDark },
  helpBody: { ...typography.caption, color: familyHome.text, marginTop: 2, lineHeight: 18 },

  memberTitleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberTitleWell: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: familyHome.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberTitle: { ...typography.title, color: '#123B7A' },
  memberSubtitle: { ...typography.caption, color: familyHome.muted },

  actionCards: { flexDirection: 'row', gap: spacing.sm },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    padding: spacing.md,
    minHeight: 120,
    gap: spacing.sm,
  },
  actionGreen: { backgroundColor: familyHome.greenSoft },
  actionBlue: { backgroundColor: familyHome.blueSoft },
  actionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { ...typography.captionStrong, color: '#123B7A' },
  actionBody: { ...typography.caption, color: familyHome.muted, fontSize: 11, lineHeight: 15 },

  primaryCta: {
    minHeight: minTouchSize,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  primaryCtaText: { ...typography.bodyStrong, color: familyHome.white },

  readingRow: { gap: spacing.sm, paddingVertical: 2 },
  readingCard: {
    width: 132,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: familyHome.border,
    padding: spacing.md,
    gap: 4,
    backgroundColor: familyHome.white,
  },
  readingIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readingLabel: { ...typography.caption, color: familyHome.muted },
  readingValue: { ...typography.bodyStrong, color: '#123B7A' },
  readingDate: { ...typography.caption, color: familyHome.muted, fontSize: 11 },

  reportRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.md,
  },
  reportIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTitle: { ...typography.bodyStrong, color: '#123B7A' },
  reportMeta: { ...typography.caption, color: familyHome.muted, marginTop: 2 },
  reportSummary: { ...typography.caption, color: familyHome.text, marginTop: 4, lineHeight: 17 },
  reportHint: { ...typography.caption, color: familyHome.muted, marginTop: 4 },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginTop: 6,
  },
  statusPillText: { ...typography.captionStrong, fontSize: 11 },

  empty: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  errorBanner: { backgroundColor: familyHome.redSoft, borderRadius: 12, padding: spacing.md },
  errorText: { ...typography.caption, color: familyHome.red },

  expertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
});
