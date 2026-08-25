import { useLocalSearchParams } from 'expo-router';
import { CareAssociateLiveMapScreen } from '@/features/tracking/CareAssociateLiveMapScreen';
import { useSeniorProfile } from '@/features/home/hooks/queries';

export default function SeniorVisitTrackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const senior = useSeniorProfile();
  return <CareAssociateLiveMapScreen visitId={id} viewer="senior" homeAddress={senior.data?.address} />;
}
