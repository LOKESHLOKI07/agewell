import { HealthInfoCard } from '@/features/health/components/HealthInfoCard';
import { useFamilyProviders, useFamilyScope } from './hooks';
import { FamilyHealthListScreen } from './components/FamilyHealthListScreen';

export function FamilyDoctorsScreen() {
  const { selectedSeniorId } = useFamilyScope();
  const query = useFamilyProviders(selectedSeniorId);
  return (
    <FamilyHealthListScreen
      title="Doctors"
      query={query}
      loadingMessage="Loading doctors..."
      emptyIcon="people-outline"
      emptyTitle="No doctors on file"
      emptyMessage="Doctors from appointments and medical records will appear here."
      renderItem={(item) => (
        <HealthInfoCard key={item.id} title={item.name ?? 'Doctor'} lines={item.specialty ? [item.specialty] : []} />
      )}
    />
  );
}
