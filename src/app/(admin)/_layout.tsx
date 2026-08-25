import { Redirect, Stack, type Href } from 'expo-router';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import { authenticatedHomeHref, isStaffRole } from '@/features/auth/roleRouting';
import { AdminShell } from '@/features/admin/components/AdminShell';

export default function AdminLayout() {
  const role = useAuthStore((state) => state.user?.role);
  if (role && !isStaffRole(role)) {
    return <Redirect href={authenticatedHomeHref(role) as Href} />;
  }

  return (
    <AdminShell>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </AdminShell>
  );
}
