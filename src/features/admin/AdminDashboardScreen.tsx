import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, tones, typography } from '@/constants/theme';
import { QuickAccessTile, SectionTitle } from '@/components/ui';
import { AdminScreen } from './components/AdminScreen';
import { useAdminCareManagers, useAdminEmergencies, useAdminSeniors, useAdminServiceRequests, useAdminUsers, useAdminVisits } from './hooks';
import { buildDashboardMetrics, getSectionState } from './selectors';
import { useAdminLayout } from './useAdminLayout';

const QUICK_ACTIONS = [
  { label: 'Add User', href: '/(admin)/users/new', icon: 'person-add-outline' as const },
  { label: 'Add Senior', href: '/(admin)/seniors/new', icon: 'accessibility-outline' as const },
  { label: 'Add Visit', href: '/(admin)/visits/new', icon: 'calendar-outline' as const },
  { label: 'Send Notification', href: '/(admin)/notifications', icon: 'notifications-outline' as const },
];

export function AdminDashboardScreen() {
  const { isDesktop } = useAdminLayout();
  const users = useAdminUsers({ limit: 1, offset: 0 });
  const seniors = useAdminSeniors({ limit: 1, offset: 0 });
  const careManagers = useAdminCareManagers();
  const todayVisits = useAdminVisits({ limit: 1, offset: 0, today: true });
  const openEmergencies = useAdminEmergencies({ limit: 1, offset: 0, status: 'OPEN' });
  const pendingRequests = useAdminServiceRequests({ limit: 1, offset: 0, status: 'REQUESTED' });

  const metrics = buildDashboardMetrics({
    users,
    seniors,
    careManagers,
    todayVisits,
    openEmergencies,
    pendingRequests,
  });

  return (
    <AdminScreen title="Dashboard" subtitle="Live counts from AgeWell APIs.">
      <View style={[styles.grid, isDesktop ? styles.gridDesktop : null]}>
        {metrics.map((metric) => {
          const state = getSectionState({
            isPending: metric.state === 'loading',
            isError: metric.state === 'error',
            isEmpty: false,
          });
          const valueLabel =
            state === 'loading' ? 'Loading' : state === 'error' ? 'Unavailable' : String(metric.value ?? 0);
          const palette = tones[metric.tone === 'emergency' ? 'emergency' : 'default'];
          return (
            <Pressable
              key={metric.key}
              onPress={() => router.push(metric.href as Href)}
              accessibilityRole="button"
              accessibilityLabel={`${metric.label}: ${valueLabel}`}
              style={({ pressed }) => [
                styles.card,
                shadows.card,
                { borderColor: palette.border },
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.label}>{metric.label}</Text>
              <Text style={[styles.value, metric.tone === 'emergency' ? styles.emergencyValue : null]}>{valueLabel}</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle title="Quick access" />
      <View style={[styles.quick, isDesktop ? styles.quickDesktop : null]}>
        {QUICK_ACTIONS.map((action) => (
          <QuickAccessTile
            key={action.label}
            label={action.label}
            icon={action.icon}
            onPress={() => router.push(action.href as Href)}
          />
        ))}
      </View>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  gridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    minHeight: 112,
    minWidth: 180,
    flexGrow: 1,
    flexBasis: 180,
    justifyContent: 'space-between',
  },
  label: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  value: {
    ...typography.display,
    color: colors.text,
    marginTop: spacing.md,
  },
  emergencyValue: {
    color: colors.emergency,
  },
  quick: {
    gap: spacing.md,
  },
  quickDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pressed: {
    opacity: 0.92,
  },
});
