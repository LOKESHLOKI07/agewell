import { Redirect, type Href } from 'expo-router';

/** Legacy claim route — family accounts are created by the senior and use normal sign-in. */
export default function FamilyInviteRoute() {
  return <Redirect href={'/(auth)/login' as Href} />;
}
