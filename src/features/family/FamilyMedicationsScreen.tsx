import { HealthInfoCard } from '@/features/health/components/HealthInfoCard';
import { useFamilyMedicationSchedules, useFamilyScope } from './hooks';
import { FamilyHealthListScreen } from './components/FamilyHealthListScreen';

export function FamilyMedicationsScreen() {
  const { selectedSeniorId } = useFamilyScope();
  const query = useFamilyMedicationSchedules(selectedSeniorId);
  return (
    <FamilyHealthListScreen
      title="Medications"
      query={query}
      loadingMessage="Loading medications..."
      emptyIcon="medkit-outline"
      emptyTitle="No medications"
      emptyMessage="Medication schedules will appear here when they are on file."
      renderItem={(item) => (
        <HealthInfoCard
          key={item.id}
          title={item.medicationName}
          lines={[item.dosage, item.scheduleTime, item.frequency].filter((line): line is string => Boolean(line))}
        />
      )}
    />
  );
}
