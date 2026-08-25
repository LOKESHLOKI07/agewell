import { InfoParagraph, SimpleInfoScreen } from '@/features/profile/SimpleInfoScreen';

export default function PaymentMethodsScreen() {
  return (
    <SimpleInfoScreen title="Payment methods" subtitle="Prototype only">
      <InfoParagraph>
        No real cards or UPI details are stored in this app. Phase 2 will connect Razorpay for membership billing.
      </InfoParagraph>
      <InfoParagraph>Current mock method: UPI · AgeWell Family auto-pay</InfoParagraph>
    </SimpleInfoScreen>
  );
}
