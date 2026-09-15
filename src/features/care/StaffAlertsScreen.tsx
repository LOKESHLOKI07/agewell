import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBadge } from '@/components/StatusBadge';
import { cardSurface, colors, spacing, tones, typography } from '@/constants/theme';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { emergencyStatusLabel, emergencyTypeLabel, formatEmergencyWhen } from '@/features/emergency/selectors';
import { CareQueryView } from './components/CareQueryView';
import { CareScreen } from './components/CareScreen';
import { useStaffEmergencies } from './hooks';
import { emergencyRespondHref } from './selectors';

export function StaffAlertsScreen() {
  const insets = useSafeAreaInsets();
  const query = useStaffEmergencies();
  const items = query.data ?? [];
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: items.length === 0,
  });

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <CareScreen title="Alerts" subtitle="Open emergencies that need a response.">
        <CareQueryView
          state={state}
          error={query.error}
          onRetry={() => void query.refetch()}
          loadingMessage="Loading alerts..."
          emptyIcon="notifications-outline"
          emptyTitle="No open alerts"
          emptyMessage="Emergency requests assigned to care associates will appear here."
        >
          <View style={styles.list}>
            {items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push(emergencyRespondHref(item.id) as unknown as Href)}
                accessibilityRole="button"
                accessibilityLabel={`${emergencyTypeLabel(item.type)}. ${emergencyStatusLabel(item.status)}`}
                style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
              >
                <View style={styles.row}>
                  <View style={styles.body}>
                    <Text style={styles.title}>{item.caseNumber ? `#${item.caseNumber}` : emergencyTypeLabel(item.type)}</Text>
                    <Text style={styles.meta}>
                      {item.seniorName ?? 'Assigned senior'} · {formatEmergencyWhen(item.triggeredAt ?? item.createdAt) ?? 'Time not on file'}
                    </Text>
                  </View>
                  <StatusBadge
                    presentation={{
                      label: emergencyStatusLabel(item.status),
                      color: tones.emergency.fg,
                      background: tones.emergency.bg,
                    }}
                  />
                </View>
              </Pressable>
            ))}
          </View>
        </CareQueryView>
      </CareScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    ...cardSurface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.94,
  },
});
