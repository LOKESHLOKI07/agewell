import { Redirect, useLocalSearchParams, type Href } from 'expo-router';
import { ComingSoonServiceScreen } from '@/features/membership/ComingSoonServiceScreen';
import { findMembershipService } from '@/features/services/serviceCatalog';

const READY_REDIRECTS: Record<string, Href> = {
  'emergency-sos': '/(tabs)/sos' as Href,
  'care-manager': '/membership/care-manager' as Href,
  companion: '/membership/companion' as Href,
  medicine: '/membership/medicine' as Href,
  'health-check': '/membership/health-check' as Href,
  'monthly-blood-test': '/membership/monthly-blood-test' as Href,
  doctor: '/membership/doctor' as Href,
  grocery: '/membership/grocery' as Href,
  'small-errands': '/membership/small-errands' as Href,
  'errand-coordination': '/membership/errand-coordination' as Href,
  'cyber-security': '/membership/cyber-security' as Href,
  'banking-companion': '/membership/banking-companion' as Href,
  ca: '/membership/ca' as Href,
  'events-trips': '/membership/events-trips' as Href,
  'home-repair': '/membership/home-repair' as Href,
  pooja: '/membership/pooja' as Href,
  legal: '/membership/legal' as Href,
  'local-transport': '/membership/local-transport' as Href,
  transport: '/membership/transport' as Href,
  'home-inspection': '/membership/home-inspection' as Href,
  cctv: '/membership/cctv' as Href,
  // Add-on / legacy extras still reachable by deep link
  food: '/membership/food' as Href,
  'lab-testing': '/membership/lab-testing' as Href,
  'medical-history': '/membership/medical-history' as Href,
  'tech-assistance': '/membership/cyber-security' as Href,
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
