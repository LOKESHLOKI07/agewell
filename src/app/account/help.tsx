import { InfoParagraph, SimpleInfoScreen } from '@/features/profile/SimpleInfoScreen';

export default function HelpScreen() {
  return (
    <SimpleInfoScreen title="Help & Support" subtitle="We are here for the family">
      <InfoParagraph>
        For this prototype, support is simulated. In the live product, AgeWell care coordinators will be available
        through the app.
      </InfoParagraph>
      <InfoParagraph>Email: support@example.com</InfoParagraph>
      <InfoParagraph>Hours: 8:00 AM – 8:00 PM IST</InfoParagraph>
    </SimpleInfoScreen>
  );
}
