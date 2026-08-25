import { StyleSheet, View } from 'react-native';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { spacing } from '@/constants/theme';
import { HealthInfoCard } from './components/HealthInfoCard';
import { HealthQueryView } from './components/HealthQueryView';
import { HealthSubScreen } from './components/HealthSubScreen';
import { useMedicalRecords } from './hooks';

export function MedicalHistoryScreen() {
  const query = useMedicalRecords();
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: (query.data?.items.length ?? 0) === 0,
  });

  return (
    <HealthSubScreen title="Medical History">
      <HealthQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading medical history..."
        emptyIcon="document-text-outline"
        emptyTitle="No medical history"
        emptyMessage="Doctor notes will appear here when they are on file."
      >
        <View style={styles.list}>
          {query.data?.items.map((item) => (
            <HealthInfoCard
              key={item.id}
              title={item.providerName ?? 'Doctor note'}
              icon="clipboard-text-outline"
              tone="info"
              lines={item.notes ? [item.notes] : []}
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
