import { Redirect, type Href } from 'expo-router';

export default function EmergencyStatusRedirect() {
  return <Redirect href={'/emergency' as Href} />;
}
