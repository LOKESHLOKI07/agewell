import { StyleSheet, View } from 'react-native';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { spacing } from '@/constants/theme';
import { HealthInfoCard } from './components/HealthInfoCard';
import { HealthQueryView } from './components/HealthQueryView';
import { HealthSubScreen } from './components/HealthSubScreen';
import { useLabResults } from './hooks';
import { formatRecordDate } from './selectors';

export function LabResultsScreen() {
  const query = useLabResults();
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: (query.data?.items.length ?? 0) === 0,
  });

  return (
    <HealthSubScreen title="Lab Results">
      <HealthQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading lab results..."
        emptyIcon="flask-outline"
        emptyTitle="No lab results"
        emptyMessage="Lab results will appear here when they are on file."
      >
        <View style={styles.list}>
          {query.data?.items.map((item) => (
            <HealthInfoCard
              key={item.id}
              title={item.testName ?? 'Lab result'}
              icon="test-tube"
              tone="accent"
              lines={[item.resultValue, formatRecordDate(item.date)].filter((line): line is string => Boolean(line))}
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
