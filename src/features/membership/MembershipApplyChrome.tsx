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

export function MembershipApplyStepper({
  currentStep,
}: {
  currentStep: MembershipApplyStepIndex;
}) {
  return (
    <View style={styles.stepper}>
      <View style={styles.stepCirclesRow}>
        {MEMBERSHIP_APPLY_STEPS.map((step, index) => {
          const done = index < currentStep;
          const active = index === currentStep;
          return (
            <View key={step.key} style={styles.stepCircleCluster}>
              <View
                style={[
                  styles.stepCircle,
                  done || active ? styles.stepCircleActive : styles.stepCircleIdle,
                ]}
              >
                {done ? (
                  <Icon name="checkmark" size={12} color={familyHome.white} />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      active ? styles.stepNumberActive : styles.stepNumberIdle,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              {index < MEMBERSHIP_APPLY_STEPS.length - 1 ? (
                <View
                  style={[
                    styles.connector,
                    index < currentStep ? styles.connectorDone : styles.connectorIdle,
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>
      <View style={styles.stepLabelsRow}>
        {MEMBERSHIP_APPLY_STEPS.map((step, index) => {
          const done = index < currentStep;
          const active = index === currentStep;
          return (
            <Text
              key={step.key}
              style={[
                styles.stepLabel,
                done || active ? styles.stepLabelActive : styles.stepLabelIdle,
              ]}
              numberOfLines={2}
            >
              {step.label}
            </Text>
          );
        })}
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
        {!nextLoading ? <Icon name="arrow-forward" size={16} color={familyHome.white} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    gap: 6,
  },
  stepCirclesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepCircleActive: {
    backgroundColor: familyHome.greenDark,
  },
  stepCircleIdle: {
    backgroundColor: '#E8E8E8',
  },
  stepNumber: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    fontWeight: '600',
  },
  stepNumberActive: {
    color: familyHome.white,
  },
  stepNumberIdle: {
    color: familyHome.muted,
  },
  connector: {
    width: 24,
    height: 2,
    marginHorizontal: 2,
  },
  connectorDone: {
    backgroundColor: familyHome.green,
  },
  connectorIdle: {
    backgroundColor: '#E0E0E0',
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepLabel: {
    width: '20%',
    fontFamily: 'Poppins_500Medium',
    fontSize: 8,
    lineHeight: 11,
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 1,
  },
  stepLabelActive: {
    color: APPLY_NAVY,
  },
  stepLabelIdle: {
    color: familyHome.muted,
  },
  fieldLabel: {
    ...typography.captionStrong,
    color: APPLY_NAVY,
    marginBottom: 4,
    marginTop: 2,
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
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: familyHome.greenDark,
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
