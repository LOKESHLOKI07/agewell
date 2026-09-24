import { useMemo, useState, type ComponentType } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SvgProps } from 'react-native-svg';
import {
  BloodPressureMonitor,
  Cardiogram,
  DiabetesMeasure,
  Lungs,
  ThermometerDigital,
} from 'healthicons-react-native/filled';
import { KeyboardAwareScrollView, LoadingState, PrimaryButton, SecondaryButton } from '@/components';
import { Icon, type IconName } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { queryClient } from '@/api/queryClient';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { ServiceHelpBanner } from '@/features/membership/ServiceHelpBanner';
import { MarketplaceServiceIcon } from '@/features/services/components/MarketplaceServiceIcon';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';
import { useServiceRequests } from '@/features/home/hooks/queries';
import { useHealthDocuments, useLabResults } from '@/features/health/hooks';
import { healthQueryKeys } from '@/features/health/queryKeys';
import { MEMBERSHIP_SERVICE_AREA_LINE } from './membershipServicePageVariant';
import {
  healthReportToneMeta,
  toHealthReportViews,
  type HealthReportView,
} from './healthCheckModel';
import { membershipPurchaseHref } from './planCatalog';
import { SERVICE_HERO_IMAGES } from './serviceHeroes';
import { useMembershipServicePageVariant } from './useMembershipServicePageVariant';
import type { ServiceOffering } from './catalogTypes';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useHasActiveMembership } from './useHasActiveMembership';
import { useServiceOfferings } from './useCatalog';
import { useTabScreenBottomPad } from '@/utils/safeBottom';
import { toDisplayDate } from '@/utils/date';

type HealthIcon = ComponentType<SvgProps>;

const VITAL_ICONS: { match: RegExp; Icon: HealthIcon }[] = [
  { match: /blood\s*pressure|\bbp\b/i, Icon: BloodPressureMonitor },
  { match: /pulse|heart\s*rate|\bhr\b|ecg|cardiogram/i, Icon: Cardiogram },
  { match: /spo\s*2|spo2|oxygen|oximeter|o2/i, Icon: Lungs },
  { match: /temp|thermometer|fever/i, Icon: ThermometerDigital },
  { match: /sugar|glucose|diabetes|glucometer|blood\s*sugar/i, Icon: DiabetesMeasure },
];

function vitalIconFor(title: string, description?: string): HealthIcon {
  const hay = `${title} ${description ?? ''}`;
  for (const row of VITAL_ICONS) {
    if (row.match.test(hay)) return row.Icon;
  }
  return Cardiogram;
}

const VIDEO_URL = 'https://www.youtube.com/results?search_query=How+AgeWell+Health+Checks+Help+You+Stay+Healthy';

const DEFAULT_VITALS: { title: string; soft: string; color: string }[] = [
  { title: 'Blood Pressure (BP)', soft: familyHome.greenSoft, color: familyHome.green },
  { title: 'Pulse', soft: familyHome.blueSoft, color: familyHome.blue },
  { title: 'SpO2', soft: '#F3FAF0', color: '#5B8C5A' },
  { title: 'Temperature', soft: familyHome.redSoft, color: familyHome.red },
  { title: 'Blood Sugar', soft: familyHome.blueSoft, color: familyHome.blue },
];

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

/**
 * Health Check — three gate states from product mockups; member hub uses real labs/docs/requests only.
 */
export function HealthCheckScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(true);
  const membership = useHasActiveMembership();
  const validTill = membershipValidLabel(membership.query.data?.endDate);
  const catalog = useServiceOfferings('health-check');
  const offerings = catalog.data ?? [];
  const includedOfferings = useMemo(
    () => offerings.filter((item) => item.badge.toLowerCase() === 'included'),
    [offerings],
  );
  const extraOfferings = useMemo(
    () => offerings.filter((item) => item.badge.toLowerCase() === 'extra'),
    [offerings],
  );
  const { submitting, submit } = useMembershipSubmit('health-check');
  const labsQuery = useLabResults();
  const docsQuery = useHealthDocuments();
  const requestsQuery = useServiceRequests();
  const [showAllReports, setShowAllReports] = useState(false);

  const allReports = toHealthReportViews({
    requests: requestsQuery.data?.items ?? [],
    documents: docsQuery.data?.items ?? [],
    labs: labsQuery.data?.items ?? [],
  });
  const reports = showAllReports ? allReports : allReports.slice(0, 3);
  const dataLoading = labsQuery.isPending || docsQuery.isPending || requestsQuery.isPending;
  const dataError = labsQuery.isError || docsQuery.isError || requestsQuery.isError;

  const refresh = () =>
    void Promise.all([labsQuery.refetch(), docsQuery.refetch(), requestsQuery.refetch()]);

  const requestAddon = () => {
    if (extraOfferings.length === 0) {
      Alert.alert('No add-on tests', 'Add-on tests will appear here once configured in the catalog.');
      return;
    }
    Alert.alert(
      'Request add-on test',
      'Choose an extra test (charges apply).',
      [
        ...extraOfferings.map((item) => ({
          text: item.title,
          onPress: () => {
            void (async () => {
              const ok = await submit(
                `Add-on test: ${item.title} (${item.priceLabel || 'charges apply'})`,
                'Add-on test requested',
              );
              if (ok) {
                await Promise.all([
                  queryClient.invalidateQueries({ queryKey: homeQueryKeys.serviceRequests }),
                  requestsQuery.refetch(),
                ]);
              }
            })();
          },
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
    );
  };

  const bookMonthly = () => {
    const vitals =
      includedOfferings.map((item) => item.title).join(', ') ||
      'Monthly vitals check';
    void (async () => {
      const ok = await submit(`Vitals: ${vitals}`, 'Health check requested');
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
      <ServicePageHeader />
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {variant === 'loading' ? <LoadingState message="Loading Health Check..." /> : null}

        {variant === 'non_serviceable' ? (
          <>
            <TitleBlock />
            <HeroBanner tone="soft" />
            <IncludedSection items={includedOfferings} loading={catalog.isPending} />
            <ComingSoonFooter />
            <ServiceHelpBanner />
          </>
        ) : null}

        {variant === 'serviceable_no_membership' ? (
          <>
            <TitleBlock />
            <HeroBanner tone="photo" />
            <IncludedSection
              title="What's Included (Free for Members)"
              items={includedOfferings}
              loading={catalog.isPending}
            />
            <MembershipRequiredFooter />
            <MoreWithMembership extras={extraOfferings} />
            <ServiceHelpBanner />
          </>
        ) : null}

        {variant === 'serviceable_with_membership' ? (
          <MemberBody
            reports={reports}
            included={includedOfferings}
            hasMoreReports={allReports.length > 3 && !showAllReports}
            loading={dataLoading}
            error={dataError}
            submitting={submitting}
            validTill={validTill}
            onRetry={refresh}
            onViewAllReports={() => {
              if (allReports.length > 3 && !showAllReports) {
                setShowAllReports(true);
                return;
              }
              router.push('/health/documents' as Href);
            }}
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
      <MarketplaceServiceIcon
        serviceId="health-check"
        fallbackIcon="medkit-outline"
        fallbackColor={familyHome.green}
        size={48}
      />
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

function IncludedSection({
  title = "What's Included",
  items,
  loading,
}: {
  title?: string;
  items: ServiceOffering[];
  loading?: boolean;
}) {
  return (
    <View style={styles.stack}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {loading ? <Text style={styles.empty}>Loading included checks…</Text> : null}
      <View style={styles.includedGrid}>
        {items.map((item) => {
          const VitalIcon = vitalIconFor(item.title, item.description);
          return (
            <View key={item.id} style={styles.includedCard}>
              <View style={styles.includedIcon}>
                <VitalIcon width={18} height={18} color={familyHome.green} />
              </View>
              <Text style={styles.includedTitle}>{item.title}</Text>
            </View>
          );
        })}
        {!loading && items.length === 0 ? (
          <Text style={styles.empty}>Included checks will appear here once configured.</Text>
        ) : null}
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

function MoreWithMembership({ extras }: { extras: ServiceOffering[] }) {
  return (
    <View style={styles.stack}>
      <Text style={styles.sectionTitle}>More with Membership</Text>
      {extras.map((item) => (
        <View key={item.id} style={styles.extraRow}>
          <View style={styles.extraIcon}>
            <Icon name="plus-circle" size={16} color={familyHome.green} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.extraTitle}>{item.title}</Text>
            <Text style={styles.includedLine}>{item.description}</Text>
          </View>
        </View>
      ))}
      {extras.length === 0 ? (
        <Text style={styles.empty}>Add-on tests are configured in the admin catalog.</Text>
      ) : null}
    </View>
  );
}


function MemberBody({
  reports,
  included,
  hasMoreReports: _hasMoreReports,
  loading,
  error,
  submitting,
  validTill,
  onRetry,
  onViewAllReports,
  onRequestAddon,
  onBookMonthly,
}: {
  reports: HealthReportView[];
  included: ServiceOffering[];
  hasMoreReports: boolean;
  loading: boolean;
  error: boolean;
  submitting: boolean;
  validTill: string | null;
  onRetry: () => void;
  onViewAllReports: () => void;
  onRequestAddon: () => void;
  onBookMonthly: () => void;
}) {
  const vitals =
    included.length > 0
      ? included.map((item, index) => {
          const fallback = DEFAULT_VITALS[index % DEFAULT_VITALS.length];
          return {
            id: item.id,
            title: item.title,
            soft: fallback.soft,
            color: fallback.color,
            Icon: vitalIconFor(item.title, item.description),
          };
        })
      : DEFAULT_VITALS.map((item) => ({
          id: item.title,
          title: item.title,
          soft: item.soft,
          color: item.color,
          Icon: vitalIconFor(item.title),
        }));

  return (
    <View style={styles.memberStack}>
      <View style={styles.titleBlockMember}>
        <View style={styles.memberTitleLine}>
          <MarketplaceServiceIcon
            serviceId="health-check"
            fallbackIcon="heart-outline"
            fallbackColor={familyHome.red}
            size={36}
          />
          <Text style={styles.memberTitle}>Health Checks</Text>
        </View>
        {validTill ? (
          <View style={styles.memberBadge}>
            <Icon name="checkmark-circle-outline" size={14} color={familyHome.green} />
            <Text style={styles.memberBadgeTitle}>{validTill}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actionCards}>
        <Pressable
          onPress={() => router.push('/health/labs' as Href)}
          style={({ pressed }) => [styles.actionCard, styles.actionGreen, pressed ? styles.pressed : null]}
          accessibilityRole="button"
          accessibilityLabel="View All Health Records"
        >
          <View style={styles.actionTop}>
            <View style={styles.actionIcon}>
              <Icon name="document-text-outline" size={18} color={familyHome.green} />
            </View>
            <Icon name="chevron-forward" size={16} color={familyHome.muted} />
          </View>
          <Text style={styles.actionTitle}>View All Health Records</Text>
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
        </Pressable>
      </View>

      <Pressable
        onPress={onBookMonthly}
        disabled={submitting}
        style={({ pressed }) => [styles.primaryCta, submitting ? styles.disabled : null, pressed ? styles.pressed : null]}
        accessibilityRole="button"
        accessibilityLabel="Schedule a Health Check"
      >
        <Icon name="calendar-outline" size={18} color={familyHome.white} />
        <Text style={styles.primaryCtaText}>{submitting ? 'Sending…' : 'Schedule a Health Check'}</Text>
        <Icon name="chevron-forward" size={16} color={familyHome.white} />
      </Pressable>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Pressable onPress={onViewAllReports} accessibilityRole="button" accessibilityLabel="View all health activity">
          <Text style={styles.link}>View All ›</Text>
        </Pressable>
      </View>

      {loading ? <LoadingState message="Loading health activity..." /> : null}
      {error ? (
        <Pressable onPress={onRetry} style={styles.errorBanner} accessibilityRole="button">
          <Text style={styles.errorText}>Could not load health data. Tap to retry.</Text>
        </Pressable>
      ) : null}
      {!loading && !error && reports.length === 0 ? (
        <Text style={styles.empty}>No health checks yet. Schedule one to get started.</Text>
      ) : null}
      {!loading && !error && reports.length > 0 ? (
        <View style={styles.activityList}>
          {reports.map((report, index) => {
            const tone = healthReportToneMeta(report.tone);
            return (
              <Pressable
                key={report.id}
                onPress={() => router.push(report.href as Href)}
                style={({ pressed }) => [
                  styles.reportRow,
                  index < reports.length - 1 ? styles.reportRowBorder : null,
                  pressed ? styles.pressed : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${report.title}. ${report.statusLabel}`}
              >
                <View style={[styles.reportIcon, { backgroundColor: tone.soft }]}>
                  <Icon name="document-text-outline" size={14} color={tone.color} />
                </View>
                <View style={styles.flex}>
                  {report.dateLabel ? <Text style={styles.reportMeta}>{report.dateLabel}</Text> : null}
                  <Text style={styles.reportTitle}>{report.title}</Text>
                  {report.summary ? (
                    <Text style={styles.reportSummary} numberOfLines={1}>
                      {report.summary}
                    </Text>
                  ) : null}
                </View>
                <View style={[styles.statusPill, { backgroundColor: tone.soft }]}>
                  <Text style={[styles.statusPillText, { color: tone.color }]}>{report.statusLabel}</Text>
                </View>
                <Icon name="chevron-forward" size={16} color={familyHome.muted} />
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>What's included in a Health Check?</Text>
      <View style={styles.vitalRow}>
        {vitals.map((item) => {
          const VitalIcon = item.Icon;
          return (
            <View key={item.id} style={[styles.vitalCard, { backgroundColor: item.soft }]}>
              <VitalIcon width={18} height={18} color={item.color} />
              <Text style={styles.vitalTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.infoBanner}>
        <Icon name="help-circle-outline" size={16} color={familyHome.blue} />
        <Text style={styles.infoBannerText}>
          Basic vitals are included with membership. Additional tests such as ECG may attract extra charges.
        </Text>
      </View>

      <Pressable
        onPress={() => void Linking.openURL(VIDEO_URL)}
        accessibilityRole="button"
        accessibilityLabel="Watch on YouTube: How AgeWell Health Checks Help You Stay Healthy"
        style={({ pressed }) => [styles.videoCardCompact, pressed ? styles.pressed : null]}
      >
        <View style={styles.videoThumb}>
          <Image source={SERVICE_HERO_IMAGES['health-check']} style={styles.videoThumbImage} resizeMode="cover" />
          <View style={styles.videoThumbPlay}>
            <Icon name="play" size={14} color={familyHome.white} />
          </View>
          <Text style={styles.videoThumbDuration}>3:05</Text>
        </View>
        <View style={styles.videoCompactCopy}>
          <View style={styles.watchRow}>
            <Icon name="play" size={12} color={familyHome.red} />
            <Text style={styles.watchLabel}>Watch on YouTube</Text>
          </View>
          <Text style={styles.videoCompactTitle}>How AgeWell Health Checks Help You Stay Healthy</Text>
          <Text style={styles.videoCompactBody}>
            See how monthly vitals checks help you and your family stay on top of everyday health.
          </Text>
        </View>
        <Icon name="chevron-forward" size={16} color={familyHome.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
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
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 188,
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
  heroImage: { width: 156, height: 156 },
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

  sectionTitle: { ...typography.bodyStrong, color: '#123B7A', fontSize: 14 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { ...typography.captionStrong, color: familyHome.green },

  includedGrid: { flexDirection: 'row', gap: spacing.sm },
  includedCard: {
    flex: 1,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 78,
  },
  includedIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  includedTitle: {
    ...typography.captionStrong,
    color: familyHome.text,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 13,
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
  includedLine: { ...typography.caption, color: familyHome.muted, marginTop: 2, lineHeight: 16 },

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

  memberStack: { gap: spacing.sm },
  titleBlockMember: { gap: 6 },
  memberTitleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberTitleWell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: familyHome.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberTitle: { ...typography.title, color: '#123B7A' },
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

  actionCards: { flexDirection: 'row', gap: spacing.sm },
  actionCard: {
    flex: 1,
    borderRadius: 14,
    padding: spacing.md,
    minHeight: 88,
    gap: 6,
  },
  actionGreen: { backgroundColor: familyHome.greenSoft },
  actionBlue: { backgroundColor: familyHome.blueSoft },
  actionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { ...typography.captionStrong, color: '#123B7A', fontSize: 12, lineHeight: 16 },

  primaryCta: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  primaryCtaText: { ...typography.bodyStrong, color: familyHome.white, flex: 1, textAlign: 'center' },

  activityList: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    backgroundColor: familyHome.white,
    overflow: 'hidden',
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  reportRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: familyHome.border,
  },
  reportIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTitle: { ...typography.captionStrong, color: familyHome.text, fontSize: 13 },
  reportMeta: { ...typography.caption, color: familyHome.muted, fontSize: 10 },
  reportSummary: { ...typography.caption, color: familyHome.muted, marginTop: 1, fontSize: 10 },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'center',
  },
  statusPillText: { ...typography.captionStrong, fontSize: 10 },

  vitalRow: { flexDirection: 'row', gap: 6 },
  vitalCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    gap: 4,
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalTitle: {
    ...typography.captionStrong,
    color: familyHome.text,
    textAlign: 'center',
    fontSize: 9,
    lineHeight: 11,
  },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 12,
    padding: spacing.md,
  },
  infoBannerText: {
    ...typography.caption,
    color: familyHome.text,
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },

  empty: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  errorBanner: { backgroundColor: familyHome.redSoft, borderRadius: 12, padding: spacing.md },
  errorText: { ...typography.caption, color: familyHome.red },

  videoCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: familyHome.border,
    backgroundColor: '#F7F8FA',
    padding: spacing.sm,
  },
  videoThumb: {
    width: 78,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#123B7A',
  },
  videoThumbImage: { width: '100%', height: '100%' },
  videoThumbPlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  videoThumbDuration: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    ...typography.caption,
    color: familyHome.white,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
    fontSize: 9,
  },
  videoCompactCopy: { flex: 1, gap: 1 },
  watchRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  watchLabel: { ...typography.captionStrong, color: familyHome.muted, fontSize: 10 },
  videoCompactTitle: { ...typography.captionStrong, color: familyHome.text, fontSize: 12 },
  videoCompactBody: { ...typography.caption, color: familyHome.muted, lineHeight: 14, fontSize: 10 },
});

