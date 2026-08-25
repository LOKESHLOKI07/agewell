import { useLocalSearchParams } from 'expo-router';
import { FamilyCommunityEventScreen } from '@/features/community/FamilyCommunityScreen';

export default function FamilyCommunityEventRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FamilyCommunityEventScreen eventId={id} />;
}
