import { useLocalSearchParams } from 'expo-router';
import { seniorDisplayName } from '@/features/home/api/mappers';
import { useSeniorProfile } from '@/features/home/hooks/queries';
import { BookAppointmentScreen } from '@/features/appointments/BookAppointmentScreen';
import { AppointmentDetailScreen } from '@/features/appointments/AppointmentDetailScreen';
import { useHealthcareProviders } from './hooks';

export function HealthBookAppointmentScreen() {
  const seniorQuery = useSeniorProfile();
  const providersQuery = useHealthcareProviders();
  const senior = seniorQuery.data;
  return (
    <BookAppointmentScreen
      subtitle={senior ? `For ${seniorDisplayName(senior)}` : null}
      seniorId={senior?.id ?? null}
      seniorPending={seniorQuery.isPending}
      providersQuery={providersQuery}
      successHref="/health/appointments"
    />
  );
}

export function HealthAppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AppointmentDetailScreen appointmentId={id} />;
}
