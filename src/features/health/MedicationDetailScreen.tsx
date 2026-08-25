import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { spacing } from '@/constants/theme';
import { HealthInfoCard } from './components/HealthInfoCard';
import { HealthQueryView } from './components/HealthQueryView';
import { HealthSubScreen } from './components/HealthSubScreen';
import { useMedicationSchedules } from './hooks';
import { findScheduleMedication, schedulesForMedication } from './selectors';

export function MedicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useMedicationSchedules();
  const schedules = schedulesForMedication(query.data?.items ?? [], id ?? '');
  const sample = findScheduleMedication(query.data?.items ?? [], id);
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && schedules.length === 0,
  });

  return (
    <HealthSubScreen title={sample?.medicationName ?? 'Medication'}>
      <HealthQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading medication..."
        emptyIcon="medkit-outline"
        emptyTitle="Medication not found"
        emptyMessage="We could not find this medication in your records."
      >
        <View style={styles.list}>
          {schedules.map((item) => (
            <HealthInfoCard
              key={item.id}
              title={item.medicationName}
              lines={[item.dosage, item.scheduleTime, item.frequency].filter((line): line is string => Boolean(line))}
            />
          ))}
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
