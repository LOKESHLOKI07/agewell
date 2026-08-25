import { useLocalSearchParams } from 'expo-router';
import { CareAssociateLiveMapScreen } from '@/features/tracking/CareAssociateLiveMapScreen';
import { useFamilyScope } from '@/features/family/hooks';

export default function FamilyVisitTrackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedSenior } = useFamilyScope();
  return <CareAssociateLiveMapScreen visitId={id} viewer="family" homeAddress={selectedSenior?.address} />;
}
