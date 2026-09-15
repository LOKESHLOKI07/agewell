import { useLocalSearchParams } from 'expo-router';
import { DeliveryLiveMapScreen } from '@/features/tracking/DeliveryLiveMapScreen';

export default function DeliveryTrackRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DeliveryLiveMapScreen deliveryId={id} />;
}
