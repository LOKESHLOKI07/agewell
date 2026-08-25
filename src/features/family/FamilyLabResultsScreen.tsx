import { HealthInfoCard } from '@/features/health/components/HealthInfoCard';
import { formatRecordDate } from '@/features/health/selectors';
import { useFamilyLabResults, useFamilyScope } from './hooks';
import { FamilyHealthListScreen } from './components/FamilyHealthListScreen';

export function FamilyLabResultsScreen() {
  const { selectedSeniorId } = useFamilyScope();
  const query = useFamilyLabResults(selectedSeniorId);
  return (
    <FamilyHealthListScreen
      title="Lab Results"
      query={query}
      loadingMessage="Loading lab results..."
      emptyIcon="flask-outline"
      emptyTitle="No lab results"
      emptyMessage="Lab results will appear here when they are on file."
      renderItem={(item) => (
        <HealthInfoCard
          key={item.id}
          title={item.testName ?? 'Lab result'}
          lines={[item.resultValue, formatRecordDate(item.date)].filter((line): line is string => Boolean(line))}
        />
      )}
    />
  );
}
