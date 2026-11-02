import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from '@/components/KeyboardAwareScrollView';
import { Icon, IconWell, type IconName } from '@/components/ui';
import { StatusPill, statusToneFromLabel } from '@/components';
import { colors, radius, shadows, spacing, tones, typography, type ColorTone } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import { staffScopeLabel } from '@/features/auth/serviceCities';
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
import type { AdminAttentionItem, AdminDashboardMetric } from './types';
import { useAdminLayout } from './useAdminLayout';

const METRIC_TONES: Record<string, ColorTone> = {
  seniors: 'safe',
  visits: 'info',
  emergencies: 'emergency',
  requests: 'warning',
  users: 'accent',
};

type MetricDensity = 'compact' | 'comfortable';

export function AdminDashboardScreen() {
  const { isDesktop, isPhone, width } = useAdminLayout();
  const user = useAuthStore((state) => state.user);
  const now = new Date();
  const displayName = staffScopeLabel(user);

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
  const missedVisits = (todayVisits.data?.items ?? []).filter((item) => item.status === 'NO_SHOW');
  const attention = buildAttentionItems({
    emergencies: openEmergencies.data?.items ?? [],
    requests: pendingRequests.data?.items ?? [],
    missedVisits,
    seniors: seniors.data?.items ?? [],
  });
  const upcoming = buildUpcomingVisitRows({
    visits: upcomingVisits.data?.items ?? [],
    seniors: seniors.data?.items ?? [],
  });
  const activity = buildActivityRows(audit.data?.items ?? []);
  const visitCounts = visitStatusCounts(todayVisits.data?.items ?? []);

  const emergencyCount = openEmergencies.data?.total ?? openEmergencies.data?.items?.length ?? 0;
  const pendingCount = pendingRequests.data?.total ?? pendingRequests.data?.items?.length ?? 0;
  const missedCount = missedVisits.length;
  const attentionLoading =
    openEmergencies.isPending || pendingRequests.isPending || todayVisits.isPending;
  const attentionHasUrgent = emergencyCount > 0;

  const wide = isDesktop && width >= 1180;
  const twoCol = wide || isDesktop ? styles.row2 : styles.stack;
  const threeCol = wide ? styles.row3 : styles.stack;
  const compact = !isDesktop;
  const metricDensity: MetricDensity = 'compact';
  const metricsTwoCol = compact;

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        isDesktop ? styles.contentDesktop : null,
        isPhone ? styles.contentPhone : null,
      ]}
    >
      <View style={[styles.hero, isPhone ? styles.heroPhone : null]}>
        <View style={[styles.heroCopy, isPhone ? styles.heroCopyPhone : null]}>
          <Text
            style={[styles.greeting, isPhone ? styles.greetingPhone : null]}
            accessibilityRole="header"
            numberOfLines={isPhone ? 2 : undefined}
          >
            {greetingForHour(now.getHours())}, {displayName}
          </Text>
          <Text style={styles.heroSub}>
            {isPhone ? 'What needs your attention today.' : "Here's what needs your attention across EldCare today."}
          </Text>
        </View>
        <View style={[styles.heroMeta, isPhone ? styles.heroMetaPhone : null]}>
          <Text style={styles.heroDate}>{formatDashboardDate(now, isPhone)}</Text>
        </View>
      </View>

      <View
        style={[
          styles.metrics,
          isDesktop ? styles.metricsDesktop : styles.metricsTablet,
        ]}
      >
        {cards.map((metric, index) => (
          <MetricCard
            key={metric.key}
            metric={metric}
            density={metricDensity}
            twoCol={metricsTwoCol}
            fullWidth={metricsTwoCol && cards.length % 2 === 1 && index === cards.length - 1}
          />
        ))}
      </View>

      <View>
        <Text style={styles.sectionLabel}>Analytics</Text>
        <View style={[threeCol, styles.sectionBody]}>
          <Panel title="Seniors by care status" href="/(admin)/seniors" flex={!compact}>
            <AdminDonutChart
              slices={seniorSlices}
              centerLabel="membership"
              size={isPhone ? 132 : 168}
              strokeWidth={isPhone ? 18 : 22}
            />
          </Panel>
          <Panel title="Today's visits" href="/(admin)/visits" flex={!compact}>
            <AdminDonutChart
              slices={visitSlices}
              centerValue={String(visitCounts.completed || todayVisits.data?.total || 0)}
              centerLabel="completed"
              size={isPhone ? 132 : 168}
              strokeWidth={isPhone ? 18 : 22}
            />
          </Panel>
          <Panel title="Service requests" href="/(admin)/requests" flex={!compact}>
            <AdminBarChart slices={requestBars} compact={isPhone} />
          </Panel>
        </View>
      </View>

      <NeedsAttentionPanel
        items={attention}
        loading={attentionLoading}
        urgent={attentionHasUrgent}
        compact={isPhone}
        summary={{
          emergencies: emergencyCount,
          requests: pendingCount,
          missed: missedCount,
        }}
        summariesLoading={{
          emergencies: openEmergencies.isPending,
          requests: pendingRequests.isPending,
          missed: todayVisits.isPending,
        }}
      />

      <View style={twoCol}>
        <Panel title="Today's activity" href="/(admin)/visits" flex={!compact}>
          {todayVisits.isPending ? (
            <LoadingBlock label="Loading today's activity…" />
          ) : todayVisits.isError ? (
            <EmptyBlock message="Could not load today's visits." />
          ) : (
            <View style={styles.todayStats}>
              <TodayStat label="Completed" value={visitCounts.completed} tone="safe" />
              <TodayStat label="Upcoming" value={visitCounts.upcoming} tone="info" />
              <TodayStat label="Missed" value={visitCounts.missed} tone="warning" />
              <TodayStat
                label="Pending requests"
                value={pendingCount}
                tone="warning"
                loading={pendingRequests.isPending}
              />
            </View>
          )}
        </Panel>
        <Panel title="Upcoming visits" href="/(admin)/visits" flex={!compact}>
          {upcomingVisits.isPending ? (
            <LoadingBlock label="Loading visits…" />
          ) : upcoming.length ? (
            upcoming.map((visit) => (
              <Pressable
                key={visit.id}
                onPress={() => router.push(visit.href as Href)}
                accessibilityRole="button"
                accessibilityLabel={`${visit.name} at ${visit.time}`}
                style={({ pressed }) => [
                  styles.visitRow,
                  isPhone ? styles.visitRowPhone : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={[styles.visitTime, isPhone ? styles.visitTimePhone : null]}>{visit.time}</Text>
                {isPhone ? null : (
                  <View style={styles.visitAvatar}>
                    <Text style={styles.visitInitial}>{visit.name.charAt(0)}</Text>
                  </View>
                )}
                <View style={styles.rowCopy}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {visit.name}
                  </Text>
                  <Text style={styles.itemDetail} numberOfLines={1}>
                    {visit.type}
                  </Text>
                </View>
                <StatusPill label={visit.status} tone={statusToneFromLabel(visit.status)} />
              </Pressable>
            ))
          ) : (
            <EmptyBlock message="No upcoming visits on the schedule." />
          )}
        </Panel>
      </View>

      <Panel title="Recent activity" href="/(admin)/audit">
        {audit.isPending ? (
          <LoadingBlock label="Loading activity…" />
        ) : activity.length ? (
          activity.map((item, index) => (
            <View key={item.id} style={styles.activityRow}>
              <View style={styles.timeline}>
                <View style={styles.timelineDot} />
                {index < activity.length - 1 ? <View style={styles.timelineLine} /> : null}
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDetail}>{item.detail}</Text>
                {item.timestamp ? <Text style={styles.itemTime}>{relativeOrEmpty(item.timestamp)}</Text> : null}
              </View>
            </View>
          ))
        ) : (
          <EmptyBlock message="No recent audit activity." />
        )}
      </Panel>
    </KeyboardAwareScrollView>
  );
}

function NeedsAttentionPanel({
  items,
  loading,
  urgent,
  compact,
  summary,
  summariesLoading,
}: {
  items: AdminAttentionItem[];
  loading: boolean;
  urgent: boolean;
  compact?: boolean;
  summary: { emergencies: number; requests: number; missed: number };
  summariesLoading: { emergencies: boolean; requests: boolean; missed: boolean };
}) {
  return (
    <View
      style={[
        styles.attentionPanel,
        compact ? styles.attentionPanelPhone : null,
        urgent ? styles.attentionPanelUrgent : null,
      ]}
      accessibilityLabel="Needs attention"
    >
      <Pressable
        onPress={() => router.push('/(admin)/emergencies' as Href)}
        accessibilityRole="button"
        accessibilityLabel="Needs attention"
        style={styles.attentionHead}
      >
        <View style={styles.attentionTitleRow}>
          <View style={[styles.attentionBadge, urgent ? styles.attentionBadgeUrgent : null]}>
            <Icon
              name="warning-outline"
              size={16}
              color={urgent ? colors.emergency : colors.textSecondary}
            />
          </View>
          <Text style={[styles.attentionTitle, urgent ? styles.attentionTitleUrgent : null]}>
            Needs attention
          </Text>
        </View>
        <Icon name="chevron-forward" size={16} color={urgent ? colors.emergency : colors.textMuted} />
      </Pressable>

      <View style={[styles.summaryRow, compact ? styles.summaryRowPhone : null]}>
        <SummaryChip
          label={compact ? 'Emergencies' : 'Open emergencies'}
          value={summary.emergencies}
          loading={summariesLoading.emergencies}
          tone="emergency"
          href="/(admin)/emergencies"
          compact={compact}
        />
        <SummaryChip
          label={compact ? 'Requests' : 'Pending requests'}
          value={summary.requests}
          loading={summariesLoading.requests}
          tone="warning"
          href="/(admin)/requests"
          compact={compact}
        />
        <SummaryChip
          label={compact ? 'Missed' : 'Missed visits'}
          value={summary.missed}
          loading={summariesLoading.missed}
          tone="warning"
          href="/(admin)/visits"
          compact={compact}
        />
      </View>

      {loading ? (
        <LoadingBlock label="Checking open issues…" />
      ) : items.length ? (
        items.map((item) => (
          <View key={item.id} style={[styles.attentionRow, compact ? styles.attentionRowPhone : null]}>
            <IconWell
              tone={item.kind === 'emergency' ? 'emergency' : item.kind === 'visit' ? 'warning' : 'info'}
              size={compact ? 36 : 40}
            >
              <Icon
                name={
                  item.kind === 'emergency'
                    ? 'warning-outline'
                    : item.kind === 'visit'
                      ? 'calendar-outline'
                      : 'clipboard-outline'
                }
                size={18}
                color={
                  item.kind === 'emergency'
                    ? colors.emergency
                    : item.kind === 'visit'
                      ? colors.warning
                      : colors.info
                }
              />
            </IconWell>
            <View style={styles.rowCopy}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDetail}>{item.detail}</Text>
              {item.timestamp ? <Text style={styles.itemTime}>{relativeOrEmpty(item.timestamp)}</Text> : null}
            </View>
            <Pressable
              onPress={() => router.push(item.href as Href)}
              accessibilityRole="button"
              accessibilityLabel={item.actionLabel}
              style={({ pressed }) => [
                styles.actionBtn,
                compact ? styles.actionBtnPhone : null,
                item.kind === 'emergency' ? styles.actionBtnEmergency : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.actionLabel}>{item.actionLabel}</Text>
            </Pressable>
          </View>
        ))
      ) : (
        <EmptyBlock message="Nothing needs attention right now." tone="safe" />
      )}
    </View>
  );
}

function SummaryChip({
  label,
  value,
  loading,
  tone,
  href,
  compact,
}: {
  label: string;
  value: number;
  loading: boolean;
  tone: 'emergency' | 'warning';
  href: string;
  compact?: boolean;
}) {
  const palette = tones[tone];
  const display = loading ? '—' : String(value);
  const elevated = !loading && value > 0;

  return (
    <Pressable
      onPress={() => router.push(href as Href)}
      accessibilityRole="button"
      accessibilityLabel={`${display} ${label}`}
      style={({ pressed }) => [
        styles.summaryChip,
        compact ? styles.summaryChipPhone : null,
        elevated ? { backgroundColor: palette.bg, borderColor: palette.border } : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text style={[styles.summaryValue, elevated ? { color: palette.fg } : null]}>{display}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </Pressable>
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

function MetricCard({
  metric,
  density,
  twoCol,
  fullWidth,
}: {
  metric: AdminDashboardMetric;
  density: MetricDensity;
  twoCol: boolean;
  fullWidth?: boolean;
}) {
  const state = getSectionState({
    isPending: metric.state === 'loading',
    isError: metric.state === 'error',
    isEmpty: false,
  });
  const valueLabel = state === 'loading' ? '—' : state === 'error' ? 'Unavailable' : String(metric.value ?? 0);
  const tone = METRIC_TONES[metric.key] ?? 'default';
  const palette = tones[tone];
  const iconBg = metric.key === 'users' ? colors.primarySoft : palette.bg;
  const iconFg = metric.key === 'users' ? colors.primary : palette.fg;
  const isEmergency = metric.key === 'emergencies' || metric.tone === 'emergency';
  const compact = density === 'compact';

  return (
    <Pressable
      onPress={() => router.push(metric.href as Href)}
      accessibilityRole="button"
      accessibilityLabel={`${metric.label}: ${valueLabel}`}
      style={({ pressed }) => [
        styles.metric,
        compact ? styles.metricCompact : styles.metricComfortable,
        twoCol ? styles.metricPhoneTile : null,
        fullWidth ? styles.metricPhoneTileFull : null,
        isEmergency && state === 'ready' && (metric.value ?? 0) > 0 ? styles.metricUrgent : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {compact ? (
        <>
          <Text style={styles.metricLabel}>{metric.label}</Text>
          <Text style={[styles.metricValueCompact, isEmergency ? styles.metricEmergency : null]}>
            {valueLabel}
          </Text>
          {state === 'ready' && metric.breakdown?.length ? (
            <Text style={styles.breakdownInline} numberOfLines={twoCol ? 2 : 1}>
              {metric.breakdown.map((item) => `${item.value} ${item.label}`).join(' · ')}
            </Text>
          ) : state === 'loading' ? (
            <Text style={styles.breakdownInline}>Loading…</Text>
          ) : null}
        </>
      ) : (
        <>
          <View style={styles.metricHead}>
            <View style={[styles.metricIcon, { backgroundColor: iconBg }]}>
              <Icon name={(metric.icon as IconName) || 'grid-outline'} size={18} color={iconFg} />
            </View>
            <Text style={styles.metricLabel}>{metric.label}</Text>
          </View>
          <Text style={[styles.metricValue, isEmergency ? styles.metricEmergency : null]}>{valueLabel}</Text>
          {state === 'ready'
            ? metric.breakdown?.map((item) => (
                <View key={item.label} style={styles.breakdownRow}>
                  <View style={[styles.breakdownDot, { backgroundColor: item.color }]} />
                  <Text style={styles.breakdownLabel}>
                    {item.value} {item.label}
                  </Text>
                </View>
              ))
            : state === 'loading' ? (
                <Text style={styles.breakdownLabel}>Loading…</Text>
              ) : state === 'error' ? (
                <Text style={styles.breakdownLabel}>Could not load</Text>
              ) : null}
        </>
      )}
    </Pressable>
  );
}

function TodayStat({
  label,
  value,
  tone,
  loading,
}: {
  label: string;
  value: number;
  tone: ColorTone;
  loading?: boolean;
}) {
  const palette = tones[tone];
  return (
    <View style={[styles.todayStat, { backgroundColor: palette.bg }]}>
      <Text style={[styles.todayStatValue, { color: palette.fg }]}>{loading ? '—' : value}</Text>
      <Text style={styles.todayStatLabel}>{label}</Text>
    </View>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <View style={styles.stateBlock} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.stateText}>{label}</Text>
    </View>
  );
}

function EmptyBlock({ message, tone = 'default' }: { message: string; tone?: 'default' | 'safe' }) {
  return (
    <View style={[styles.stateBlock, tone === 'safe' ? styles.stateBlockSafe : null]}>
      {tone === 'safe' ? (
        <Icon name="checkmark-circle-outline" size={20} color={colors.safe} />
      ) : null}
      <Text style={[styles.stateText, tone === 'safe' ? styles.stateTextSafe : null]}>{message}</Text>
    </View>
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
  contentPhone: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  heroPhone: {
    flexDirection: 'column',
    gap: spacing.xs,
  },
  heroCopy: {
    flex: 1,
    minWidth: 220,
  },
  heroCopyPhone: {
    minWidth: 0,
    width: '100%',
  },
  greeting: {
    ...typography.display,
    color: colors.text,
  },
  greetingPhone: {
    ...typography.title,
  },
  heroSub: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  heroMeta: {
    alignItems: 'flex-end',
    paddingTop: spacing.xs,
  },
  heroMetaPhone: {
    alignItems: 'flex-start',
    paddingTop: 0,
  },
  heroDate: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  metrics: {
    gap: spacing.md,
  },
  metricsDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricsTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metric: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricCompact: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 120,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 2,
  },
  metricComfortable: {
    flexBasis: '100%',
    padding: spacing.xl,
    gap: spacing.sm,
    minHeight: 120,
  },
  metricTwoCol: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 160,
  },
  metricPhoneTile: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: '47%',
    minWidth: 0,
    minHeight: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  metricPhoneTileFull: {
    flexBasis: '100%',
  },
  metricUrgent: {
    borderColor: colors.emergency,
    backgroundColor: colors.emergencySoft,
  },
  metricHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  metricValue: {
    ...typography.display,
    color: colors.text,
    marginVertical: spacing.xs,
  },
  metricValueCompact: {
    ...typography.title,
    color: colors.text,
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
  breakdownInline: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionLabel: {
    ...typography.captionStrong,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    gap: spacing.lg,
  },
  row2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
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
    padding: spacing.lg,
    ...shadows.card,
    gap: spacing.md,
    minWidth: 0,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: colors.border,
  },
  panelFlex: {
    flex: 1,
    flexBasis: 280,
    minWidth: 260,
    alignSelf: 'auto',
    padding: spacing.xl,
  },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginBottom: spacing.xs,
  },
  panelTitle: {
    ...typography.heading,
    color: colors.text,
  },
  attentionPanel: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadows.card,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  attentionPanelPhone: {
    padding: spacing.lg,
  },
  attentionPanelUrgent: {
    backgroundColor: colors.emergencySoft,
    borderColor: colors.emergency,
  },
  attentionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  attentionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  attentionBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  attentionBadgeUrgent: {
    backgroundColor: colors.white,
  },
  attentionTitle: {
    ...typography.heading,
    color: colors.text,
  },
  attentionTitleUrgent: {
    color: colors.emergency,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryRowPhone: {
    gap: spacing.xs,
  },
  summaryChip: {
    flexGrow: 1,
    flexBasis: 140,
    minHeight: 64,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    gap: 2,
  },
  summaryChipPhone: {
    flexBasis: 0,
    minHeight: 56,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  summaryValue: {
    ...typography.subtitle,
    color: colors.text,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  attentionRowPhone: {
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    minHeight: 0,
  },
  rowCopy: {
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
    minHeight: 40,
    minWidth: 72,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPhone: {
    alignSelf: 'flex-start',
    minWidth: 0,
  },
  actionBtnEmergency: {
    backgroundColor: colors.emergency,
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
    minHeight: 52,
  },
  visitRowPhone: {
    gap: spacing.sm,
    minHeight: 48,
    flexWrap: 'wrap',
  },
  visitTimePhone: {
    width: 56,
  },
  todayStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  todayStat: {
    flexGrow: 1,
    flexBasis: 120,
    minHeight: 72,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    gap: 2,
  },
  todayStatValue: {
    ...typography.title,
  },
  todayStatLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  visitTime: {
    ...typography.captionStrong,
    color: colors.primaryDark,
    width: 72,
  },
  visitAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  stateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  stateBlockSafe: {
    backgroundColor: colors.safeSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  stateText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  stateTextSafe: {
    color: colors.safe,
  },
  pressed: {
    opacity: 0.92,
  },
});
