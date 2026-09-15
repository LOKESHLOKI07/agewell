import { useLocalSearchParams } from 'expo-router';
import { DeliveryExecutiveShareScreen } from '@/features/tracking/DeliveryExecutiveShareScreen';

export default function DeliveryShareRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DeliveryExecutiveShareScreen deliveryId={id} />;
}
