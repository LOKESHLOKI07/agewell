import { useLocalSearchParams } from 'expo-router';
import { CareAssociateShareScreen } from '@/features/tracking/CareAssociateShareScreen';

export default function CareVisitShareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CareAssociateShareScreen visitId={id} />;
}
