import { Redirect, useLocalSearchParams, type Href } from 'expo-router';
import { ComingSoonServiceScreen } from '@/features/membership/ComingSoonServiceScreen';
import { findMembershipService } from '@/features/services/serviceCatalog';

const READY_REDIRECTS: Record<string, Href> = {
  'care-manager': '/membership/care-manager' as Href,
  companion: '/membership/companion' as Href,
  'emergency-sos': '/(tabs)/sos' as Href,
  grocery: '/membership/grocery' as Href,
  food: '/membership/food' as Href,
  medicine: '/membership/medicine' as Href,
  pooja: '/membership/pooja' as Href,
  'lab-testing': '/membership/lab-testing' as Href,
  'monthly-blood-test': '/membership/monthly-blood-test' as Href,
  doctor: '/membership/doctor' as Href,
  'medical-history': '/membership/medical-history' as Href,
  'tech-assistance': '/membership/tech-assistance' as Href,
  legal: '/membership/legal' as Href,
  ca: '/membership/ca' as Href,
  transport: '/membership/transport' as Href,
  'home-repair': '/membership/home-repair' as Href,
  'events-trips': '/membership/events-trips' as Href,
  'home-inspection': '/membership/home-inspection' as Href,
  cctv: '/membership/cctv' as Href,
};

export default function MembershipServiceByIdScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const service = findMembershipService(id);

  if (id && READY_REDIRECTS[id]) {
    return <Redirect href={READY_REDIRECTS[id]} />;
  }

  if (!service) {
    return (
      <ComingSoonServiceScreen
        title="Service"
        description="This AgeWell membership service was not found."
        icon="help-circle-outline"
        color="#6B6B6B"
        background="#F5F5F5"
      />
    );
  }

  return (
    <ComingSoonServiceScreen
      title={service.title}
      description={service.description}
      icon={service.icon}
      color={service.color}
      background={service.background}
    />
  );
}
