import { useMemo, useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView, LoadingState, PrimaryButton, SecondaryButton } from '@/components';
import { Icon, type IconName } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { ServiceHelpBanner } from '@/features/membership/ServiceHelpBanner';
import { MarketplaceServiceIcon } from '@/features/services/components/MarketplaceServiceIcon';
import {
  healthAppointmentBookHref,
  healthAppointmentHref,
} from '@/features/appointments/selectors';
import { useAppointments, useHealthcareProviders, useMedicalRecords } from '@/features/health/hooks';
import { MEMBERSHIP_SERVICE_AREA_LINE } from './membershipServicePageVariant';
import {
  doctorAssignedLabel,
  doctorVisitToneMeta,
  findUpcomingDoctorVisit,
  toDoctorReportCards,
  toPastDoctorVisits,
  type DoctorReportCard,
  type DoctorVisitCard,
  type DoctorVisitTone,
} from './doctorVisitModel';
import { membershipPurchaseHref } from './planCatalog';
import { SERVICE_HERO_IMAGES } from './serviceHeroes';
import { useMembershipServicePageVariant } from './useMembershipServicePageVariant';
import { useHasActiveMembership } from './useHasActiveMembership';
import { useTabScreenBottomPad } from '@/utils/safeBottom';
import { toDisplayDate } from '@/utils/date';

const VIDEO_URL = 'https://www.youtube.com/results?search_query=How+to+Prepare+for+Your+Doctor+Visit+AgeWell';

const FEATURES: { icon: IconName; title: string; line: string }[] = [
  { icon: 'stethoscope', title: 'Monthly Visit', line: 'One doctor/physician visit every month.' },
  { icon: 'document-text-outline', title: 'Review Reports', line: 'Discussion based on your latest health reports.' },
  { icon: 'chatbubble-outline', title: 'Personalised Guidance', line: 'Get expert advice for your health and well-being.' },
  { icon: 'medkit', title: 'Better Health', line: 'Proactive care for a healthier tomorrow.' },
];

const INFO_BULLETS = [
  'Based on your monthly health checks and Complete Blood Test, doctor reports will be provided.',
  'You can consult the doctor for basic viral medications.',
  'Additional doctor visits may be charged as per need.',
];

type ActivityItem = {
  id: string;
  whenLabel: string | null;
  title: string;
  summary: string;
  statusLabel: string;
  tone: DoctorVisitTone;
  icon: IconName;
  href: string;
};

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

function buildRecentActivity(
  pastVisits: DoctorVisitCard[],
  reports: DoctorReportCard[],
): ActivityItem[] {
  const fromVisits: ActivityItem[] = pastVisits.map((visit) => ({
    id: `visit-${visit.id}`,
    whenLabel: visit.whenLabel,
    title: 'Doctor Visit',
    summary:
      visit.doctorName && visit.doctorSpecialty
        ? `${visit.doctorName} (${visit.doctorSpecialty})`
        : doctorAssignedLabel(visit),
    statusLabel: visit.statusLabel,
    tone: visit.tone === 'completed' ? 'available' : visit.tone,
    icon: 'calendar-outline' as IconName,
    href: healthAppointmentHref(visit.id),
  }));
  const fromReports: ActivityItem[] = reports.map((report) => ({
    id: `report-${report.id}`,
    whenLabel: report.dateLabel,
    title: 'Visit Report',
    summary: report.summary || 'Report available in app',
    statusLabel: report.statusLabel === 'Report Available' ? 'Available' : report.statusLabel,
    tone: 'requested' as DoctorVisitTone,
    icon: 'document-text-outline' as IconName,
    href: '/health/history',
  }));
  return [...fromVisits, ...fromReports];
}
/**
 * Doctor / Physician Visit — gate mockups + member hub from real appointments/providers/records.
 */
export function DoctorConsultationScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(true);
  const membership = useHasActiveMembership();
  const validTill = membershipValidLabel(membership.query.data?.endDate);
  const appointmentsQuery = useAppointments();
  const providersQuery = useHealthcareProviders();
  const recordsQuery = useMedicalRecords();
  const [showAll, setShowAll] = useState(false);

  const appointments = appointmentsQuery.data?.items ?? [];
  const providers = providersQuery.data?.items ?? [];
  const records = recordsQuery.data?.items ?? [];

  const upcoming = findUpcomingDoctorVisit(appointments, providers);
  const pastVisits = toPastDoctorVisits(appointments, providers, 10);
  const reports = toDoctorReportCards(records, 10);
  const allActivity = useMemo(() => buildRecentActivity(pastVisits, reports), [pastVisits, reports]);
  const activity = showAll ? allActivity : allActivity.slice(0, 3);

  const loading = appointmentsQuery.isPending || providersQuery.isPending || recordsQuery.isPending;
  const error = appointmentsQuery.isError || providersQuery.isError || recordsQuery.isError;

  const refresh = () =>
    void Promise.all([appointmentsQuery.refetch(), providersQuery.refetch(), recordsQuery.refetch()]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ServicePageHeader />
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {variant === 'loading' ? <LoadingState message="Loading Doctor Visit..." /> : null}

        {variant === 'non_serviceable' ? (
          <>
            <TitleBlock />
            <HeroBanner tone="soft" headline={['Compassionate Care for a ', 'Healthier You']} />
            <FeaturesRow />
            <ComingSoonFooter />
            <ServiceHelpBanner />
          </>
        ) : null}

        {variant === 'serviceable_no_membership' ? (
          <>
            <TitleBlock />
            <HeroBanner
              tone="photo"
              headline={['Trusted Care for a ', 'Healthier Tomorrow']}
              sub="Consult with experienced doctors at your home for personalised guidance and better health."
            />
            <FeaturesRow title="What You Get" />
            <MembershipRequiredFooter />
            <ServiceHelpBanner />
          </>
        ) : null}

        {variant === 'serviceable_with_membership' ? (
          <MemberBody
            upcoming={upcoming}
            activity={activity}
            hasMore={allActivity.length > 3 && !showAll}
            loading={loading}
            error={error}
            validTill={validTill}
            onRetry={refresh}
            onViewAll={() => {
              if (allActivity.length > 3 && !showAll) {
                setShowAll(true);
                return;
              }
              router.push('/health/appointments' as Href);
            }}
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
        serviceId="doctor"
        fallbackIcon="doctor"
        fallbackColor={familyHome.green}
        size={48}
      />
      <View style={styles.flex}>
        <Text style={styles.title}>Doctor/Physician Visit</Text>
        <Text style={styles.lead}>
          One monthly doctor/physician visit to review health and provide guidance based on the reports available.
        </Text>
      </View>
    </View>
  );
}

function HeroBanner({
  tone,
  headline,
  sub = 'Personalised medical guidance at your home for a better tomorrow.',
}: {
  tone: 'soft' | 'photo';
  headline: [string, string];
  sub?: string;
}) {
  return (
    <View style={[styles.heroCard, tone === 'photo' ? styles.heroPhoto : styles.heroSoft]}>
      <View style={styles.heroCopy}>
        <Text style={[styles.heroHeadline, tone === 'photo' ? styles.onDark : null]}>
          {headline[0]}
          <Text style={styles.heroAccent}>{headline[1]}</Text>
        </Text>
        <Text style={[styles.heroSub, tone === 'photo' ? styles.onDarkMuted : null]}>{sub}</Text>
      </View>
      <Image
        source={SERVICE_HERO_IMAGES.doctor}
        style={styles.heroImage}
        resizeMode="contain"
        accessibilityLabel="Doctor visit illustration"
      />
    </View>
  );
}

function FeaturesRow({ title }: { title?: string }) {
  return (
    <View style={styles.stack}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      <View style={styles.featureGrid}>
        {FEATURES.map((item) => (
          <View key={item.title} style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Icon name={item.icon} size={18} color={familyHome.green} />
            </View>
            <Text style={styles.featureTitle}>{item.title}</Text>
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
          {MEMBERSHIP_SERVICE_AREA_LINE} Doctor/Physician Visit service will become available in your area as we expand
          our services.
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
          <Text style={styles.membershipBody}>Doctor/Physician Visit service is available to AgeWell members.</Text>
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
            Get access to monthly doctor visits and many other services for a safer, healthier and happier life.
          </Text>
        </View>
        <Icon name="chevron-forward" size={16} color="#B45309" />
      </Pressable>
      <PrimaryButton label="Join Membership  →" onPress={() => router.push(membershipPurchaseHref())} />
      <SecondaryButton label="View Membership Plans" onPress={() => router.push(membershipPurchaseHref())} />
    </View>
  );
}

function MemberBody({
  upcoming,
  activity,
  hasMore: _hasMore,
  loading,
  error,
  validTill,
  onRetry,
  onViewAll,
}: {
  upcoming: DoctorVisitCard | null;
  activity: ActivityItem[];
  hasMore: boolean;
  loading: boolean;
  error: boolean;
  validTill: string | null;
  onRetry: () => void;
  onViewAll: () => void;
}) {
  return (
    <View style={styles.memberStack}>
      <View style={styles.titleBlockMember}>
        <View style={styles.memberTitleLine}>
          <MarketplaceServiceIcon
            serviceId="doctor"
            fallbackIcon="stethoscope"
            fallbackColor={familyHome.green}
            size={36}
          />
          <Text style={styles.memberTitle}>Doctor Visit</Text>
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
          onPress={() => router.push('/health/history' as Href)}
          style={({ pressed }) => [styles.actionCard, styles.actionGreen, pressed ? styles.pressed : null]}
          accessibilityRole="button"
          accessibilityLabel="Monthly Doctor Visit Report"
        >
          <View style={styles.actionTop}>
            <View style={styles.actionIcon}>
              <Icon name="calendar-outline" size={18} color={familyHome.green} />
            </View>
            <Icon name="chevron-forward" size={16} color={familyHome.muted} />
          </View>
          <Text style={styles.actionTitle}>Monthly Doctor Visit Report</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push(healthAppointmentBookHref() as Href)}
          style={({ pressed }) => [styles.actionCard, styles.actionBlue, pressed ? styles.pressed : null]}
          accessibilityRole="button"
          accessibilityLabel="Schedule a Doctor Visit"
        >
          <View style={styles.actionTop}>
            <View style={styles.actionIcon}>
              <Icon name="document-text-outline" size={18} color={familyHome.blue} />
            </View>
            <Icon name="chevron-forward" size={16} color={familyHome.muted} />
          </View>
          <Text style={styles.actionTitle}>Schedule a Doctor Visit</Text>
        </Pressable>
      </View>

      {upcoming ? (
        <Pressable
          onPress={() => router.push(healthAppointmentHref(upcoming.id) as unknown as Href)}
          style={({ pressed }) => [styles.upcomingBanner, pressed ? styles.pressed : null]}
          accessibilityRole="button"
          accessibilityLabel={`Upcoming visit. ${upcoming.whenLabel}`}
        >
          <Icon name="calendar-outline" size={16} color={familyHome.green} />
          <View style={styles.flex}>
            <Text style={styles.upcomingLabel}>Upcoming · {upcoming.whenLabel}</Text>
            <Text style={styles.upcomingDoctor} numberOfLines={1}>
              {doctorAssignedLabel(upcoming)}
            </Text>
          </View>
          <Icon name="chevron-forward" size={16} color={familyHome.muted} />
        </Pressable>
      ) : null}

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Pressable onPress={onViewAll} accessibilityRole="button" accessibilityLabel="View all doctor activity">
          <Text style={styles.link}>View All ›</Text>
        </Pressable>
      </View>

      {loading ? <LoadingState message="Loading your doctor visits..." /> : null}
      {error ? (
        <Pressable onPress={onRetry} style={styles.errorBanner} accessibilityRole="button">
          <Text style={styles.errorText}>Could not load doctor visits. Tap to retry.</Text>
        </Pressable>
      ) : null}

      {!loading && !error && activity.length === 0 ? (
        <Text style={styles.empty}>No doctor visits yet. Schedule a visit to get started.</Text>
      ) : null}

      {!loading && !error && activity.length > 0 ? (
        <View style={styles.activityList}>
          {activity.map((item, index) => {
            const tone = doctorVisitToneMeta(item.tone);
            return (
              <Pressable
                key={item.id}
                onPress={() => router.push(item.href as Href)}
                style={({ pressed }) => [
                  styles.activityRow,
                  index < activity.length - 1 ? styles.activityRowBorder : null,
                  pressed ? styles.pressed : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}. ${item.statusLabel}`}
              >
                <View style={[styles.activityIcon, { backgroundColor: tone.soft }]}>
                  <Icon name={item.icon} size={14} color={tone.color} />
                </View>
                <View style={styles.flex}>
                  {item.whenLabel ? <Text style={styles.activityWhen}>{item.whenLabel}</Text> : null}
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activitySummary} numberOfLines={1}>
                    {item.summary}
                  </Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: tone.soft }]}>
                  <Text style={[styles.statusPillText, { color: tone.color }]}>{item.statusLabel}</Text>
                </View>
                <Icon name="chevron-forward" size={16} color={familyHome.muted} />
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.infoCard}>
        <View style={styles.infoHead}>
          <Icon name="help-circle-outline" size={16} color={familyHome.blue} />
          <Text style={styles.infoTitle}>Important Information</Text>
        </View>
        {INFO_BULLETS.map((line) => (
          <View key={line} style={styles.infoBulletRow}>
            <Text style={styles.infoBullet}>•</Text>
            <Text style={styles.infoBody}>{line}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => void Linking.openURL(VIDEO_URL)}
        accessibilityRole="button"
        accessibilityLabel="Watch on YouTube: How to Prepare for Your Doctor Visit"
        style={({ pressed }) => [styles.videoCardCompact, pressed ? styles.pressed : null]}
      >
        <View style={styles.videoThumb}>
          <Image source={SERVICE_HERO_IMAGES.doctor} style={styles.videoThumbImage} resizeMode="cover" />
          <View style={styles.videoThumbPlay}>
            <Icon name="play" size={14} color={familyHome.white} />
          </View>
          <Text style={styles.videoThumbDuration}>4:12</Text>
        </View>
        <View style={styles.videoCompactCopy}>
          <View style={styles.watchRow}>
            <Icon name="play" size={12} color={familyHome.red} />
            <Text style={styles.watchLabel}>Watch on YouTube</Text>
          </View>
          <Text style={styles.videoCompactTitle}>How to Prepare for Your Doctor Visit</Text>
          <Text style={styles.videoCompactBody}>
            Simple tips for a better consultation and healthier you.
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
  heroSoft: { backgroundColor: familyHome.blueSoft },
  heroPhoto: { backgroundColor: '#123B7A' },
  heroCopy: { flex: 1, gap: spacing.xs },
  heroHeadline: { ...typography.subtitle, color: '#123B7A', lineHeight: 24 },
  heroAccent: { color: familyHome.green, fontWeight: '700' },
  heroSub: { ...typography.caption, color: '#123B7A', lineHeight: 17 },
  onDark: { color: familyHome.white },
  onDarkMuted: { color: 'rgba(255,255,255,0.9)' },
  heroImage: { width: 156, height: 156 },

  sectionTitle: { ...typography.bodyStrong, color: '#123B7A', fontSize: 14 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { ...typography.captionStrong, color: familyHome.green },

  featureGrid: { flexDirection: 'row', gap: spacing.sm },
  featureCard: {
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
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    backgroundColor: familyHome.greenSoft,
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

  upcomingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 12,
    padding: spacing.md,
  },
  upcomingLabel: { ...typography.captionStrong, color: familyHome.greenDark, fontSize: 12 },
  upcomingDoctor: { ...typography.caption, color: familyHome.muted, fontSize: 11, marginTop: 1 },

  activityList: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    backgroundColor: familyHome.white,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  activityRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: familyHome.border,
  },
  activityIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityWhen: { ...typography.caption, color: familyHome.muted, fontSize: 10 },
  activityTitle: { ...typography.captionStrong, color: familyHome.text, fontSize: 13 },
  activitySummary: { ...typography.caption, color: familyHome.muted, fontSize: 10, marginTop: 1 },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'center',
  },
  statusPillText: { ...typography.captionStrong, fontSize: 10 },

  infoCard: {
    backgroundColor: familyHome.blueSoft,
    borderRadius: 14,
    padding: spacing.md,
    gap: 6,
  },
  infoHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  infoTitle: { ...typography.bodyStrong, color: familyHome.blueDark, fontSize: 13 },
  infoBulletRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  infoBullet: { ...typography.caption, color: familyHome.blueDark, lineHeight: 16 },
  infoBody: { ...typography.caption, color: familyHome.text, flex: 1, fontSize: 11, lineHeight: 16 },

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

