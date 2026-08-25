import { StyleSheet, View } from 'react-native';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { spacing } from '@/constants/theme';
import { HealthInfoCard } from './components/HealthInfoCard';
import { HealthQueryView } from './components/HealthQueryView';
import { HealthSubScreen } from './components/HealthSubScreen';
import { useHealthcareProviders } from './hooks';

export function DoctorsScreen() {
  const query = useHealthcareProviders();
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: (query.data?.items.length ?? 0) === 0,
  });

  return (
    <HealthSubScreen title="Doctors">
      <HealthQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading doctors..."
        emptyIcon="people-outline"
        emptyTitle="No doctors on file"
        emptyMessage="Doctors from your appointments and medical records will appear here."
      >
        <View style={styles.list}>
          {query.data?.items.map((item) => (
            <HealthInfoCard
              key={item.id}
              title={item.name ?? 'Doctor'}
              icon="doctor"
              tone="safe"
              lines={item.specialty ? [item.specialty] : []}
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
