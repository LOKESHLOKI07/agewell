import { Pressable, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { spacing } from '@/constants/theme';
import { HealthInfoCard } from './components/HealthInfoCard';
import { HealthQueryView } from './components/HealthQueryView';
import { HealthSubScreen } from './components/HealthSubScreen';
import { useMedicationSchedules } from './hooks';
import { healthMedicationHref } from './selectors';

export function MedicationsScreen() {
  const query = useMedicationSchedules();
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: (query.data?.items.length ?? 0) === 0,
  });

  return (
    <HealthSubScreen title="Medications">
      <HealthQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading medications..."
        emptyIcon="medkit-outline"
        emptyTitle="No medications"
        emptyMessage="Medication schedules will appear here when they are on file."
      >
        <View style={styles.list}>
          {query.data?.items.map((item) => {
            const lines = [item.dosage, item.scheduleTime, item.frequency].filter(
              (line): line is string => Boolean(line),
            );
            return (
              <Pressable
                key={item.id}
                onPress={() => router.push(healthMedicationHref(item.medicationId) as unknown as Href)}
                accessibilityRole="button"
                accessibilityLabel={`${item.medicationName}. ${lines.join('. ')}`}
                accessibilityHint="Opens this medication"
              >
                <HealthInfoCard title={item.medicationName} lines={lines} icon="pill" />
              </Pressable>
            );
          })}
        </View>
      </HealthQueryView>
    </HealthSubScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
});
