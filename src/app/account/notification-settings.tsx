import { InfoParagraph, SimpleInfoScreen } from '@/features/profile/SimpleInfoScreen';

export default function NotificationSettingsScreen() {
  return (
    <SimpleInfoScreen title="Notifications" subtitle="How AgeWell alerts work">
      <InfoParagraph>
        Emergency SOS alerts are delivered as phone push notifications (Android via FCM, iPhone via APNs through Expo).
        When you allow notifications, they can sound and vibrate even if AgeWell is closed or your phone is locked —
        subject to your device notification settings.
      </InfoParagraph>
      <InfoParagraph>
        In-app notifications also appear in the Notifications screen. SMS and WhatsApp are not connected yet.
      </InfoParagraph>
    </SimpleInfoScreen>
  );
}
