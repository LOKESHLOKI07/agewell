import { Redirect } from 'expo-router';

export default function AddAppointmentRedirect() {
  return <Redirect href="/health/appointments/new" />;
}
