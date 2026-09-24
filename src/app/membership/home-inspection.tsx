import { Redirect } from 'expo-router';

/** Legacy route — Home Inspection was replaced by Personalised Diet Plan. */
export default function HomeInspectionLegacyRedirect() {
  return <Redirect href="/membership/personalised-diet-plan" />;
}
