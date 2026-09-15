import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from '@/components/KeyboardAwareScrollView';
import { Icon, IconWell, type IconName } from '@/components/ui';
import { StatusPill, statusToneFromLabel } from '@/components';
import { colors, radius, shadows, spacing, tones, typography, type ColorTone } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import { AdminBarChart } from './components/AdminBarChart';
import { AdminDonutChart } from './components/AdminDonutChart';
import {
  buildActivityRows,
  buildAttentionItems,
  buildDashboardCards,
  buildUpcomingVisitRows,
  formatDashboardDate,
  greetingForHour,
  relativeOrEmpty,
  seniorStatusSlices,
  serviceRequestCategoryBars,
  todayVisitSlices,
  visitStatusCounts,
} from './dashboardModel';
import {
  useAdminAuditLogs,
  useAdminEmergencies,
  useAdminSeniors,
  useAdminServiceRequests,
  useAdminServices,
  useAdminUsers,
  useAdminVisits,
} from './hooks';
import { getSectionState } from './selectors';
import type { AdminDashboardMetric } from './types';
import { useAdminLayout } from './useAdminLayout';

const METRIC_TONES: Record<string, ColorTone> = {
  seniors: 'safe',
  visits: 'info',
  emergencies: 'emergency',
  requests: 'warning',
  users: 'accent',
};

export function AdminDashboardScreen() {
  const { isDesktop, width } = useAdminLayout();
  const email = useAuthStore((state) => state.user?.email);
  const now = new Date();
  const rawName = email?.split('@')[0] || 'Admin';
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  const seniors = useAdminSeniors({ limit: 100, offset: 0 });
  const membershipSeniors = useAdminSeniors({ limit: 1, offset: 0, segment: 'membership' });
  const outsideAreaSeniors = useAdminSeniors({ limit: 1, offset: 0, segment: 'outside_area' });
  const inAreaNoMembershipSeniors = useAdminSeniors({ limit: 1, offset: 0, segment: 'in_area_no_membership' });
  const todayVisits = useAdminVisits({ limit: 100, offset: 0, today: true });
  const upcomingVisits = useAdminVisits({ limit: 8, offset: 0, upcoming: true });
  const openEmergencies = useAdminEmergencies({ limit: 20, offset: 0, status: 'OPEN' });
  const pendingRequests = useAdminServiceRequests({ limit: 20, offset: 0, status: 'REQUESTED' });
  const assignedRequests = useAdminServiceRequests({ limit: 1, offset: 0, status: 'ASSIGNED' });
  const recentRequests = useAdminServiceRequests({ limit: 50, offset: 0 });
  const users = useAdminUsers({ limit: 1, offset: 0 });
  const careManagerUsers = useAdminUsers({ limit: 1, offset: 0, role: 'CARE_MANAGER' });
  const adminUsers = useAdminUsers({ limit: 1, offset: 0, role: 'ADMIN' });
  const services = useAdminServices();
  const audit = useAdminAuditLogs({ limit: 8, offset: 0 });

  const cards = buildDashboardCards({
    seniors,
    membershipSeniors,
    outsideAreaSeniors,
    inAreaNoMembershipSeniors,
    todayVisits: { ...todayVisits, items: todayVisits.data?.items },
    openEmergencies: { ...openEmergencies, items: openEmergencies.data?.items },
    pendingRequests,
    assignedRequests,
    users,
    careManagerUsers,
    adminUsers,
  });

  const seniorSlices = seniorStatusSlices({
    membership: membershipSeniors.data?.total ?? 0,
    inAreaNoMembership: inAreaNoMembershipSeniors.data?.total ?? 0,
    outsideArea: outsideAreaSeniors.data?.total ?? 0,
  });
  const visitSlices = todayVisitSlices(todayVisits.data?.items ?? []);
  const requestBars = serviceRequestCategoryBars(recentRequests.data?.items ?? [], services.data ?? []);
  const attention = buildAttentionItems({
    emergencies: openEmergencies.data?.items ?? [],
    requests: pendingRequests.data?.items ?? [],
    missedVisits: (todayVisits.data?.items ?? []).filter((item) => item.status === 'NO_SHOW'),
    seniors: seniors.data?.items ?? [],
  });
  const upcoming = buildUpcomingVisitRows({
    visits: upcomingVisits.data?.items ?? [],
    seniors: seniors.data?.items ?? [],
  });
  const activity = buildActivityRows(audit.data?.items ?? []);
  const visitCounts = visitStatusCounts(todayVisits.data?.items ?? []);

  const wide = isDesktop && width >= 1180;
  const threeCol = wide ? styles.row3 : styles.stack;

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isDesktop ? styles.contentDesktop : null]}
    >
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.greeting} accessibilityRole="header">
            {greetingForHour(now.getHours())}, {displayName} 👋
          </Text>
          <Text style={styles.heroSub}>Here's what's happening across AgeWell today.</Text>
        </View>
        <View style={styles.heroMeta}>
          <Text style={styles.heroDate}>{formatDashboardDate(now)}</Text>
          <Text style={styles.heroNote}>Make a difference today!</Text>
        </View>
      </View>

      <View style={[styles.metrics, isDesktop ? styles.metricsDesktop : null]}>
        {cards.map((metric) => (
          <MetricCard key={metric.key} metric={metric} compact={!isDesktop} />
        ))}
      </View>

      <View style={threeCol}>
        <Panel title="Seniors by care status" href="/(admin)/seniors" flex>
          <AdminDonutChart slices={seniorSlices} centerLabel="membership" />
        </Panel>
        <Panel title="Today's visits" href="/(admin)/visits" flex>
          <AdminDonutChart
            slices={visitSlices}
            centerValue={String(visitCounts.completed || todayVisits.data?.total || 0)}
            centerLabel="completed"
          />
        </Panel>
        <Panel title="Service requests" href="/(admin)/requests" flex>
          <AdminBarChart slices={requestBars} />
        </Panel>
      </View>

      <View style={threeCol}>
        <Panel title="Needs attention" href="/(admin)/emergencies" flex>
          {attention.length ? (
            attention.map((item) => (
              <View key={item.id} style={styles.attentionRow}>
                <IconWell tone={item.kind === 'emergency' ? 'emergency' : item.kind === 'visit' ? 'warning' : 'info'} size={36}>
                  <Icon
                    name={
                      item.kind === 'emergency'
                        ? 'warning-outline'
                        : item.kind === 'visit'
                          ? 'calendar-outline'
                          : 'clipboard-outline'
                    }
                    size={16}
                    color={
                      item.kind === 'emergency'
                        ? colors.emergency
                        : item.kind === 'visit'
                          ? colors.warning
                          : colors.info
                    }
                  />
                </IconWell>
                <View style={styles.attentionCopy}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDetail}>{item.detail}</Text>
                  {item.timestamp ? <Text style={styles.itemTime}>{relativeOrEmpty(item.timestamp)}</Text> : null}
                </View>
                <Pressable
                  onPress={() => router.push(item.href as Href)}
                  accessibilityRole="button"
                  accessibilityLabel={item.actionLabel}
                  style={({ pressed }) => [styles.actionBtn, pressed ? styles.pressed : null]}
                >
                  <Text style={styles.actionLabel}>{item.actionLabel}</Text>
                </Pressable>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>Nothing needs attention right now.</Text>
          )}
        </Panel>

        <Panel title="Upcoming visits" href="/(admin)/visits" flex>
          {upcoming.length ? (
            upcoming.map((visit) => (
              <Pressable
                key={visit.id}
                onPress={() => router.push(visit.href as Href)}
                accessibilityRole="button"
                accessibilityLabel={`${visit.name} at ${visit.time}`}
                style={({ pressed }) => [styles.visitRow, pressed ? styles.pressed : null]}
              >
                <Text style={styles.visitTime}>{visit.time}</Text>
                <View style={styles.visitAvatar}>
                  <Text style={styles.visitInitial}>{visit.name.charAt(0)}</Text>
                </View>
                <View style={styles.attentionCopy}>
                  <Text style={styles.itemTitle}>{visit.name}</Text>
                  <Text style={styles.itemDetail} numberOfLines={1}>
                    {visit.type}
                  </Text>
                </View>
                <StatusPill label={visit.status} tone={statusToneFromLabel(visit.status)} />
              </Pressable>
            ))
          ) : (
            <Text style={styles.empty}>No upcoming visits on the schedule.</Text>
          )}
        </Panel>

        <Panel title="Recent activity" href="/(admin)/audit" flex>
          {activity.length ? (
            activity.map((item, index) => (
              <View key={item.id} style={styles.activityRow}>
                <View style={styles.timeline}>
                  <View style={styles.timelineDot} />
                  {index < activity.length - 1 ? <View style={styles.timelineLine} /> : null}
                </View>
                <View style={styles.attentionCopy}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDetail}>{item.detail}</Text>
                  {item.timestamp ? <Text style={styles.itemTime}>{relativeOrEmpty(item.timestamp)}</Text> : null}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No recent audit activity.</Text>
          )}
        </Panel>
      </View>
    </KeyboardAwareScrollView>
  );
}

function Panel({
  title,
  href,
  children,
  flex,
}: {
  title: string;
  href: string;
  children: ReactNode;
  flex?: boolean;
}) {
  return (
    <View style={[styles.panel, flex ? styles.panelFlex : null]}>
      <Pressable
        onPress={() => router.push(href as Href)}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={styles.panelHead}
      >
        <Text style={styles.panelTitle}>{title}</Text>
        <Icon name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>
      {children}
    </View>
  );
}

function MetricCard({ metric, compact }: { metric: AdminDashboardMetric; compact: boolean }) {
  const state = getSectionState({
    isPending: metric.state === 'loading',
    isError: metric.state === 'error',
    isEmpty: false,
  });
  const valueLabel = state === 'loading' ? '—' : state === 'error' ? 'Unavailable' : String(metric.value ?? 0);
  const tone = METRIC_TONES[metric.key] ?? 'default';
  const palette = tones[tone];
  const iconBg = metric.key === 'users' ? colors.sidebar : palette.bg;
  const iconFg = metric.key === 'users' ? colors.white : palette.fg;

  return (
    <Pressable
      onPress={() => router.push(metric.href as Href)}
      accessibilityRole="button"
      accessibilityLabel={`${metric.label}: ${valueLabel}`}
      style={({ pressed }) => [styles.metric, compact ? styles.metricCompact : null, pressed ? styles.pressed : null]}
    >
      <View style={styles.metricHead}>
        <View style={[styles.metricIcon, { backgroundColor: iconBg }]}>
          <Icon name={(metric.icon as IconName) || 'grid-outline'} size={18} color={iconFg} />
        </View>
        <Text style={styles.metricLabel}>{metric.label}</Text>
      </View>
      <Text style={[styles.metricValue, metric.tone === 'emergency' ? styles.metricEmergency : null]}>{valueLabel}</Text>
      {state === 'ready'
        ? metric.breakdown?.map((item) => (
            <View key={item.label} style={styles.breakdownRow}>
              <View style={[styles.breakdownDot, { backgroundColor: item.color }]} />
              <Text style={styles.breakdownLabel}>
                {item.value} {item.label}
              </Text>
            </View>
          ))
        : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.adminCanvas,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
    gap: spacing.xl,
  },
  contentDesktop: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
  },
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  heroCopy: {
    flex: 1,
    minWidth: 220,
  },
  greeting: {
    ...typography.display,
    color: colors.text,
  },
  heroSub: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  heroMeta: {
    alignItems: 'flex-end',
  },
  heroDate: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  heroNote: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 4,
  },
  metrics: {
    gap: spacing.md,
  },
  metricsDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metric: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
    flexGrow: 1,
    flexBasis: 180,
    minWidth: 170,
    gap: spacing.xs,
  },
  metricCompact: {
    flexBasis: '100%',
  },
  metricHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    flex: 1,
  },
  metricValue: {
    ...typography.display,
    color: colors.text,
    marginVertical: spacing.xs,
  },
  metricEmergency: {
    color: colors.emergency,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  breakdownDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  breakdownLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  row3: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  stack: {
    gap: spacing.lg,
  },
  panel: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadows.card,
    gap: spacing.md,
    minWidth: 260,
  },
  panelFlex: {
    flex: 1,
    flexBasis: 280,
  },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  panelTitle: {
    ...typography.heading,
    color: colors.text,
  },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  attentionCopy: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  itemDetail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemTime: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.sidebar,
  },
  actionLabel: {
    ...typography.captionStrong,
    color: colors.white,
  },
  visitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  visitTime: {
    ...typography.captionStrong,
    color: colors.sidebarActive,
    width: 72,
  },
  visitAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitInitial: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  activityRow: {
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 56,
  },
  timeline: {
    width: 14,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.sidebarActive,
    marginTop: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.92,
  },
});
