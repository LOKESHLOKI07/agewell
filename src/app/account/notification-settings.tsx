import { InfoParagraph, SimpleInfoScreen } from '@/features/profile/SimpleInfoScreen';

export default function NotificationSettingsScreen() {
  return (
    <SimpleInfoScreen title="Notifications" subtitle="How AgeWell alerts work">
      <InfoParagraph>
        In-app notifications come from your AgeWell account. You can mark them read from the Notifications screen.
      </InfoParagraph>
      <InfoParagraph>
        Push, SMS, and WhatsApp delivery are not available in the app yet. When those channels are connected, this
        screen will let you manage preferences.
      </InfoParagraph>
    </SimpleInfoScreen>
  );
}
