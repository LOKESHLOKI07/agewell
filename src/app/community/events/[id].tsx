import { EventDetailScreen } from '@/features/community/EventDetailScreen';
import { useLocalSearchParams } from 'expo-router';

export default function CommunityEventRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EventDetailScreen eventId={id} />;
}
