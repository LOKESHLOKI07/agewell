import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import {
  MEMBERSHIP_APPLY_STEPS,
  type MembershipApplyStepIndex,
} from './applicationForm';

export const APPLY_NAVY = '#1B2A4A';

/** Same chrome as membership service pages: logo left, Back right. */
export function MembershipApplyHeader({ onBack }: { onBack?: () => void }) {
  return <ServicePageHeader onBack={onBack} showBell={false} />;
}

function StepCircle({
  index,
  filled,
}: {
  index: number;
  filled: boolean;
}) {
  return (
    <View style={[styles.stepCircle, filled ? styles.stepCircleActive : styles.stepCircleIdle]}>
      <Text style={[styles.stepNumber, filled ? styles.stepNumberActive : styles.stepNumberIdle]}>
        {index + 1}
      </Text>
    </View>
  );
}

export function MembershipApplyStepper({
  currentStep,
}: {
  currentStep: MembershipApplyStepIndex;
}) {
  return (
    <View style={styles.stepper}>
      <View style={styles.stepTrack}>
        <View style={styles.stepCol}>
          <StepCircle index={0} filled={currentStep >= 0} />
          <Text style={[styles.stepLabel, currentStep >= 0 ? styles.stepLabelActive : styles.stepLabelIdle]}>
            {MEMBERSHIP_APPLY_STEPS[0].label}
          </Text>
        </View>
        <View style={[styles.connector, currentStep >= 1 ? styles.connectorDone : styles.connectorIdle]} />
        <View style={styles.stepCol}>
          <StepCircle index={1} filled={currentStep >= 1} />
          <Text style={[styles.stepLabel, currentStep >= 1 ? styles.stepLabelActive : styles.stepLabelIdle]}>
            {MEMBERSHIP_APPLY_STEPS[1].label}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function ApplyFieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={styles.fieldLabel}>
      {label}
      {required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}

export function ApplyFooterButtons({
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  nextLoading,
  showBack = true,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  showBack?: boolean;
}) {
  return (
    <View style={styles.footer}>
      {showBack && onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [styles.backOutline, pressed ? styles.pressed : null]}
        >
          <Icon name="arrow-back" size={16} color={familyHome.greenDark} />
          <Text style={styles.backOutlineLabel}>Back</Text>
        </Pressable>
      ) : null}
      <Pressable
        onPress={onNext}
        disabled={nextDisabled || nextLoading}
        accessibilityRole="button"
        accessibilityLabel={nextLabel}
        accessibilityState={{ disabled: Boolean(nextDisabled || nextLoading) }}
        style={({ pressed }) => [
          styles.nextBtn,
          !showBack ? styles.nextBtnFull : null,
          pressed && !nextDisabled ? styles.pressed : null,
          nextDisabled || nextLoading ? styles.nextDisabled : null,
        ]}
      >
        <Text style={styles.nextLabel}>{nextLoading ? 'Submitting…' : nextLabel}</Text>
        {!nextLoading && !nextLabel.includes('→') ? (
          <Icon name="arrow-forward" size={16} color={familyHome.white} />
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  stepTrack: {
    width: 220,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepCol: {
    width: 78,
    alignItems: 'center',
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepCircleActive: {
    backgroundColor: familyHome.green,
  },
  stepCircleIdle: {
    backgroundColor: '#E8E8E8',
  },
  stepNumber: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    fontWeight: '600',
  },
  stepNumberActive: {
    color: familyHome.white,
  },
  stepNumberIdle: {
    color: familyHome.muted,
  },
  connector: {
    flex: 1,
    height: 2,
    marginTop: 14,
    marginHorizontal: 2,
  },
  connectorDone: {
    backgroundColor: familyHome.green,
  },
  connectorIdle: {
    backgroundColor: '#E0E0E0',
  },
  stepLabel: {
    marginTop: 8,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: APPLY_NAVY,
  },
  stepLabelIdle: {
    color: familyHome.muted,
  },
  fieldLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: APPLY_NAVY,
    marginBottom: 8,
    paddingLeft: 4,
  },
  required: {
    color: familyHome.red,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  backOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: familyHome.greenDark,
    backgroundColor: familyHome.white,
  },
  backOutlineLabel: {
    ...typography.bodyStrong,
    color: familyHome.greenDark,
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: 28,
    backgroundColor: familyHome.green,
    paddingHorizontal: spacing.lg,
  },
  nextBtnFull: {
    flex: 1,
  },
  nextLabel: {
    ...typography.bodyStrong,
    color: familyHome.white,
  },
  nextDisabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.9,
  },
});
