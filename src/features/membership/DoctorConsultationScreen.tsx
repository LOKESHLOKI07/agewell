import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView, LoadingState, PrimaryButton, SecondaryButton } from '@/components';
import { Avatar, Icon, type IconName } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
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
  toLatestDoctorReport,
  toPastDoctorVisits,
  type DoctorReportCard,
  type DoctorVisitCard,
} from './doctorVisitModel';
import { membershipPurchaseHref } from './planCatalog';
import { SERVICE_HERO_IMAGES } from './serviceHeroes';
import { useMembershipServicePageVariant } from './useMembershipServicePageVariant';
import { useTabScreenBottomPad } from '@/utils/safeBottom';

const FEATURES: { icon: IconName; title: string; line: string }[] = [
  { icon: 'calendar-outline', title: 'Monthly Visit', line: 'One doctor/physician visit every month.' },
  { icon: 'document-text-outline', title: 'Review Reports', line: 'Discussion based on your latest health reports.' },
  { icon: 'chatbubble-outline', title: 'Personalised Guidance', line: 'Get expert advice for your health and well-being.' },
  { icon: 'heart-outline', title: 'Better Health', line: 'Proactive care for a healthier tomorrow.' },
];

/**
 * Doctor / Physician Visit — gate mockups + member hub from real appointments/providers/records.
 */
export function DoctorConsultationScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(true);
  const appointmentsQuery = useAppointments();
  const providersQuery = useHealthcareProviders();
  const recordsQuery = useMedicalRecords();

  const appointments = appointmentsQuery.data?.items ?? [];
  const providers = providersQuery.data?.items ?? [];
  const records = recordsQuery.data?.items ?? [];

  const upcoming = findUpcomingDoctorVisit(appointments, providers);
  const pastVisits = toPastDoctorVisits(appointments, providers, 5);
  const latestReport = toLatestDoctorReport(records);
  const reports = toDoctorReportCards(records, 5);

  const loading = appointmentsQuery.isPending || providersQuery.isPending || recordsQuery.isPending;
  const error = appointmentsQuery.isError || providersQuery.isError || recordsQuery.isError;

  const refresh = () =>
    void Promise.all([appointmentsQuery.refetch(), providersQuery.refetch(), recordsQuery.refetch()]);

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
        {variant === 'loading' ? <LoadingState message="Loading Doctor Visit..." /> : null}

        {variant === 'non_serviceable' ? (
          <>
            <TitleBlock />
            <HeroBanner tone="soft" headline={['Compassionate Care for a ', 'Healthier You']} />
            <FeaturesRow />
            <ComingSoonFooter />
            <HelpBanner withButton />
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
            <HelpBanner />
          </>
        ) : null}

        {variant === 'serviceable_with_membership' ? (
          <MemberBody
            upcoming={upcoming}
            pastVisits={pastVisits}
            latestReport={latestReport}
            reports={reports}
            loading={loading}
            error={error}
            onRetry={refresh}
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
        <Icon name="doctor" size={22} color={familyHome.green} />
      </View>
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
            <Text style={styles.featureLine}>{item.line}</Text>
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

function HelpBanner({ withButton = false }: { withButton?: boolean }) {
  return (
    <View style={styles.helpBanner}>
      <Icon name="help-circle-outline" size={18} color={familyHome.blue} />
      <View style={styles.flex}>
        <Text style={styles.helpTitle}>Have Questions?</Text>
        <Text style={styles.helpBody}>Our team is here to help. Reach out to us anytime.</Text>
        {withButton ? (
          <SecondaryButton
            label="Contact Support"
            onPress={() => router.push('/account/help' as Href)}
            fullWidth={false}
          />
        ) : null}
      </View>
    </View>
  );
}

function MemberBody({
  upcoming,
  pastVisits,
  latestReport,
  reports,
  loading,
  error,
  onRetry,
}: {
  upcoming: DoctorVisitCard | null;
  pastVisits: DoctorVisitCard[];
  latestReport: DoctorReportCard | null;
  reports: DoctorReportCard[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.memberTitleLine}>
        <View style={styles.memberTitleWell}>
          <Icon name="doctor" size={18} color={familyHome.green} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.memberTitle}>Doctor Visit</Text>
          <Text style={styles.memberSubtitle}>Expert care at your doorstep.</Text>
        </View>
      </View>

      <View style={styles.actionCards}>
        <Pressable
          onPress={() => router.push(healthAppointmentBookHref() as Href)}
          style={({ pressed }) => [styles.actionCard, styles.actionGreen, pressed ? styles.pressed : null]}
          accessibilityRole="button"
          accessibilityLabel="Book or schedule doctor visit"
        >
          <View style={styles.actionTop}>
            <View style={styles.actionIcon}>
              <Icon name="calendar-outline" size={18} color={familyHome.green} />
            </View>
            <Icon name="chevron-forward" size={16} color={familyHome.muted} />
          </View>
          <Text style={styles.actionTitle}>Book / Schedule Doctor Visit</Text>
          <Text style={styles.actionBody}>Choose a convenient date and time.</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/health/appointments' as Href)}
          style={({ pressed }) => [styles.actionCard, styles.actionBlue, pressed ? styles.pressed : null]}
          accessibilityRole="button"
          accessibilityLabel="View past visits"
        >
          <View style={styles.actionTop}>
            <View style={styles.actionIcon}>
              <Icon name="document-text-outline" size={18} color={familyHome.blue} />
            </View>
            <Icon name="chevron-forward" size={16} color={familyHome.muted} />
          </View>
          <Text style={styles.actionTitle}>View Past Visits</Text>
          <Text style={styles.actionBody}>Check your visit history and reports.</Text>
        </Pressable>
      </View>

      {loading ? <LoadingState message="Loading your doctor visits..." /> : null}
      {error ? (
        <Pressable onPress={onRetry} style={styles.errorBanner} accessibilityRole="button">
          <Text style={styles.errorText}>Could not load doctor visits. Tap to retry.</Text>
        </Pressable>
      ) : null}

      {!loading && !error ? (
        <>
          <Text style={styles.sectionTitle}>Upcoming Visit</Text>
          {upcoming ? (
            <UpcomingCard visit={upcoming} />
          ) : (
            <Text style={styles.empty}>No upcoming doctor visit. Book one when you are ready.</Text>
          )}

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Latest Visit Report</Text>
            <Pressable onPress={() => router.push('/health/history' as Href)} accessibilityRole="button">
              <Text style={styles.link}>View Report &gt;</Text>
            </Pressable>
          </View>
          {latestReport ? (
            <ReportRow report={latestReport} onPress={() => router.push('/health/history' as Href)} />
          ) : (
            <Text style={styles.empty}>No visit reports on file yet.</Text>
          )}

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Past Visits</Text>
            <Pressable onPress={() => router.push('/health/appointments' as Href)} accessibilityRole="button">
              <Text style={styles.link}>View All &gt;</Text>
            </Pressable>
          </View>
          {pastVisits.length === 0 && reports.length === 0 ? (
            <Text style={styles.empty}>No past doctor visits yet.</Text>
          ) : null}
          {pastVisits.map((visit) => (
            <PastVisitRow
              key={visit.id}
              visit={visit}
              onPress={() => router.push(healthAppointmentHref(visit.id) as unknown as Href)}
            />
          ))}
          {pastVisits.length === 0
            ? reports.slice(0, 3).map((report) => (
                <ReportRow
                  key={report.id}
                  report={report}
                  onPress={() => router.push('/health/history' as Href)}
                />
              ))
            : null}
        </>
      ) : null}

      <Pressable
        onPress={() => router.push('/account/help' as Href)}
        style={({ pressed }) => [styles.expertBanner, pressed ? styles.pressed : null]}
        accessibilityRole="button"
      >
        <Icon name="help-circle-outline" size={18} color={familyHome.blue} />
        <View style={styles.flex}>
          <Text style={styles.helpBody}>
            Need to talk to our care team? For any queries or to reschedule, contact us (10 AM – 6 PM).
          </Text>
        </View>
        <Text style={styles.link}>Talk to Expert &gt;</Text>
      </Pressable>
    </View>
  );
}

function UpcomingCard({ visit }: { visit: DoctorVisitCard }) {
  const tone = doctorVisitToneMeta(visit.tone);
  return (
    <View style={styles.upcomingCard}>
      <Text style={styles.upcomingWhen}>{visit.whenLabel}</Text>
      <View style={styles.homeRow}>
        <Icon name="home-outline" size={16} color={familyHome.green} />
        <Text style={styles.homeLabel}>{visit.title}</Text>
        <View style={[styles.statusPill, { backgroundColor: tone.soft }]}>
          <Text style={[styles.statusPillText, { color: tone.color }]}>{visit.statusLabel}</Text>
        </View>
      </View>
      <View style={styles.doctorCard}>
        <Avatar name={visit.doctorName ?? 'Doctor'} size={48} />
        <View style={styles.flex}>
          <Text style={styles.doctorName}>{doctorAssignedLabel(visit)}</Text>
          {visit.doctorId ? (
            <Pressable
              onPress={() => router.push('/health/doctors' as Href)}
              accessibilityRole="button"
              accessibilityLabel="View doctor profile"
            >
              <Text style={styles.link}>View Profile &gt;</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <Pressable
        onPress={() => router.push(healthAppointmentHref(visit.id) as unknown as Href)}
        style={styles.viewVisitBtn}
        accessibilityRole="button"
      >
        <Text style={styles.viewVisitText}>View visit details</Text>
      </Pressable>
    </View>
  );
}

function PastVisitRow({ visit, onPress }: { visit: DoctorVisitCard; onPress: () => void }) {
  const tone = doctorVisitToneMeta(visit.tone === 'completed' ? 'available' : visit.tone);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.reportRow, pressed ? styles.pressed : null]}>
      <View style={[styles.reportIcon, { backgroundColor: tone.soft }]}>
        <Icon name="document-text-outline" size={16} color={tone.color} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.reportTitle}>{visit.whenLabel}</Text>
        <Text style={styles.reportSummary}>
          {visit.doctorName ? `${visit.doctorName} · ${visit.summary}` : visit.summary}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: tone.soft }]}>
          <Text style={[styles.statusPillText, { color: tone.color }]}>
            {visit.tone === 'completed' ? 'Report Available' : visit.statusLabel}
          </Text>
        </View>
      </View>
      <Icon name="chevron-forward" size={16} color={familyHome.muted} />
    </Pressable>
  );
}

function ReportRow({ report, onPress }: { report: DoctorReportCard; onPress: () => void }) {
  const tone = doctorVisitToneMeta(report.tone);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.reportRow, pressed ? styles.pressed : null]}>
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
      </View>
      <Icon name="chevron-forward" size={16} color={familyHome.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.lg },
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
    borderRadius: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 148,
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
  heroImage: { width: 110, height: 110 },

  sectionTitle: { ...typography.subtitle, color: '#123B7A' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { ...typography.captionStrong, color: familyHome.blue },

  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  featureCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 14,
    padding: spacing.md,
    gap: 4,
    alignItems: 'center',
    minHeight: 110,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: { ...typography.captionStrong, color: familyHome.text, textAlign: 'center' },
  featureLine: { ...typography.caption, color: familyHome.muted, textAlign: 'center', fontSize: 11, lineHeight: 15 },

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

  memberTitleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberTitleWell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberTitle: { ...typography.title, color: '#123B7A' },
  memberSubtitle: { ...typography.caption, color: familyHome.muted },

  actionCards: { flexDirection: 'row', gap: spacing.sm },
  actionCard: { flex: 1, borderRadius: 16, padding: spacing.md, minHeight: 120, gap: spacing.sm },
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

  upcomingCard: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  upcomingWhen: { ...typography.bodyStrong, color: '#123B7A' },
  homeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  homeLabel: { ...typography.body, color: familyHome.text, flex: 1 },
  doctorCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: familyHome.greenSoft,
    borderRadius: 14,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  doctorName: { ...typography.bodyStrong, color: '#123B7A' },
  viewVisitBtn: {
    marginTop: spacing.sm,
    minHeight: minTouchSize,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewVisitText: { ...typography.bodyStrong, color: familyHome.green },

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
