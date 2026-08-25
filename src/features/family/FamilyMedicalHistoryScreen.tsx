import { HealthInfoCard } from '@/features/health/components/HealthInfoCard';
import { useFamilyMedicalRecords, useFamilyScope } from './hooks';
import { FamilyHealthListScreen } from './components/FamilyHealthListScreen';

export function FamilyMedicalHistoryScreen() {
  const { selectedSeniorId } = useFamilyScope();
  const query = useFamilyMedicalRecords(selectedSeniorId);
  return (
    <FamilyHealthListScreen
      title="Medical History"
      query={query}
      loadingMessage="Loading medical history..."
      emptyIcon="document-text-outline"
      emptyTitle="No medical history"
      emptyMessage="Doctor notes will appear here when they are on file."
      renderItem={(item) => (
        <HealthInfoCard key={item.id} title={item.providerName ?? 'Doctor note'} lines={item.notes ? [item.notes] : []} />
      )}
    />
  );
}
