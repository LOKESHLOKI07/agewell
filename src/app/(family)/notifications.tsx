import { NotificationListScreen } from '@/features/notifications/NotificationListScreen';

export default function FamilyNotificationsTab() {
  return (
    <NotificationListScreen
      showBack={false}
      subtitle="Updates for seniors you are authorized to support."
      emptyMessage="Authorized senior notifications will appear here."
    />
  );
}
