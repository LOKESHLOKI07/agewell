import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';
import { AgeWellLogo } from '@/components/AgeWellLogo';
import { Icon } from '@/components/ui';
import { ApiError } from '@/api/errors';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import { useServicesLive } from '@/features/auth/useServicesLive';
import { useSeniorProfile } from '@/features/home/hooks/queries';
import { useHasActiveMembership } from '@/features/membership/useHasActiveMembership';
import { resolveEmergencySupportVariant } from '@/features/membership/emergencySupportVariant';
import { findActiveEmergency, isFirstResponseFullyNotified } from '@/features/emergency/mappers';
import { useCreateEmergency, useEmergencyCases } from '@/features/emergency/hooks';
import {
  emergencyDetailHref,
  getEmergencyCreateErrorMessage,
} from '@/features/emergency/selectors';
import type { EmergencyCase } from '@/features/emergency/types/emergency';
import {
  EMERGENCY_WIDGET_COLORS as C,
  EMERGENCY_WIDGET_COPY,
  EMERGENCY_WIDGET_HOLD_MS,
  EMERGENCY_WIDGET_TRIGGER,
  EMERGENCY_WIDGET_TYPE,
} from './widgetLink';

type Phase = 'ready' | 'sending' | 'success' | 'partial' | 'error' | 'already_active';

const HOLD_SIZE = 200;
const RING_STROKE = 10;
const RING_R = (HOLD_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;

/**
 * Confirmation surface opened from the home-screen widget.
 * Hold lives here; success/partial stay on this screen (no jump to case detail).
 */
export function WidgetSosScreen() {
  const insets = useSafeAreaInsets();
  const role = useAuthStore((state) => state.user?.role);
  const status = useAuthStore((state) => state.status);
  const senior = useSeniorProfile();
  const inServiceArea = useServicesLive();
  const membership = useHasActiveMembership();
  const variant = resolveEmergencySupportVariant({
    role,
    inServiceArea,
    hasMembership: membership.hasMembership,
    areaReady: senior.isFetched || senior.isError,
    membershipReady: !membership.isPending,
  });
  const listQuery = useEmergencyCases(true);
  const createMutation = useCreateEmergency();
  const active = findActiveEmergency(listQuery.data?.items ?? []);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTick = useRef<ReturnType<typeof setInterval> | null>(null);
  const [holding, setHolding] = useState(false);
  const [holdMs, setHoldMs] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [created, setCreated] = useState<EmergencyCase | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (holdTick.current) {
      clearInterval(holdTick.current);
      holdTick.current = null;
    }
    setHolding(false);
    setHoldMs(0);
  };

  useEffect(() => () => clearHold(), []);

  useEffect(() => {
    if (phase !== 'ready' || holding || createMutation.isPending) {
      return;
    }
    if (active) {
      setCreated(active);
      setPhase('already_active');
    }
  }, [active, phase, holding, createMutation.isPending]);

  const fire = async () => {
    clearHold();
    setPhase('sending');
    setErrorMessage(null);
    try {
      const result = await createMutation.mutateAsync({
        type: EMERGENCY_WIDGET_TYPE,
        triggerSource: EMERGENCY_WIDGET_TRIGGER,
      });
      setCreated(result);
      setPhase(isFirstResponseFullyNotified(result) ? 'success' : 'partial');
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const refreshed = await listQuery.refetch();
        const existing = findActiveEmergency(refreshed.data?.items ?? []) ?? active;
        if (existing) {
          setCreated(existing);
          setPhase('already_active');
          return;
        }
      }
      const networkish =
        error instanceof ApiError && (error.status === undefined || error.status === 0);
      setErrorMessage(
        networkish
          ? 'Unable to send request. Please check your connection and try again.'
          : getEmergencyCreateErrorMessage(error),
      );
      setPhase('error');
    }
  };

  const onHoldStart = () => {
    if (phase !== 'ready' || createMutation.isPending || variant !== 'serviceable_with_membership' || role !== 'SENIOR') {
      return;
    }
    setHolding(true);
    setHoldMs(0);
    const started = Date.now();
    holdTick.current = setInterval(() => {
      setHoldMs(Math.min(EMERGENCY_WIDGET_HOLD_MS, Date.now() - started));
    }, 50);
    holdTimer.current = setTimeout(() => {
      void fire();
    }, EMERGENCY_WIDGET_HOLD_MS);
  };

  const holdProgress = Math.min(1, holdMs / EMERGENCY_WIDGET_HOLD_MS);
  const holdRemainingSec = Math.max(0, (EMERGENCY_WIDGET_HOLD_MS - holdMs) / 1000);
  const authorizedSenior = role === 'SENIOR' && variant === 'serviceable_with_membership';
  const caseId = created?.id;

  const goHome = () => {
    router.replace('/(tabs)' as Href);
  };

  const viewStatus = () => {
    if (!caseId) {
      return;
    }
    router.replace(emergencyDetailHref(caseId) as unknown as Href);
  };

  const retry = () => {
    createMutation.reset();
    setErrorMessage(null);
    setPhase(active ? 'already_active' : 'ready');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.header}>
        <Pressable
          onPress={goHome}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backBtn}
          hitSlop={12}
        >
          <Icon name="chevron-back" size={24} color={C.text} />
        </Pressable>
        <AgeWellLogo compact width={120} height={48} />
        <View style={styles.emergencyPill}>
          <Text style={styles.emergencyPillText}>EMERGENCY</Text>
        </View>
      </View>

      {phase === 'sending' ? (
        <View style={styles.centerBlock}>
          <Text style={styles.sendingTitle}>SENDING...</Text>
          <Text style={styles.sendingSub}>Notifying your emergency contacts</Text>
          <ActivityIndicator size="large" color={C.red} style={styles.spinner} />
          <View style={styles.infoChip}>
            <Icon name="people-outline" size={18} color={C.red} />
            <Text style={styles.infoChipText}>Please wait. This may take a few seconds.</Text>
          </View>
        </View>
      ) : null}

      {phase === 'success' ? (
        <View style={styles.centerBlock}>
          <View style={styles.successIcon}>
            <Icon name="checkmark" size={40} color={C.white} />
          </View>
          <Text style={styles.successTitle}>Help is on the way</Text>
          <Text style={styles.successBody}>Your emergency contacts have been notified.</Text>
          <View style={[styles.infoChip, styles.successChip]}>
            <Icon name="people-outline" size={18} color={C.green} />
            <Text style={[styles.infoChipText, { color: C.green }]}>Your care team is with you.</Text>
          </View>
          <Pressable style={styles.primaryGreen} onPress={viewStatus} accessibilityRole="button">
            <Text style={styles.primaryGreenText}>View Emergency Status</Text>
          </Pressable>
          <Pressable style={styles.secondaryGreen} onPress={goHome} accessibilityRole="button">
            <Text style={styles.secondaryGreenText}>Return to Home</Text>
          </Pressable>
        </View>
      ) : null}

      {phase === 'partial' ? (
        <View style={styles.centerBlock}>
          <View style={[styles.resultCard, styles.partialCard]}>
            <Icon name="warning" size={28} color={C.amber} />
            <Text style={styles.partialTitle}>Help request received</Text>
            <Text style={styles.partialBody}>
              We couldn&apos;t reach one or more of your emergency contacts. AgeWell will keep trying to get you
              help.
            </Text>
            <Pressable style={styles.primaryAmber} onPress={viewStatus} accessibilityRole="button">
              <Text style={styles.primaryGreenText}>View Status</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {phase === 'error' ? (
        <View style={styles.centerBlock}>
          <View style={[styles.resultCard, styles.errorCard]}>
            <Icon name="alert-circle-outline" size={28} color={C.red} />
            <Text style={styles.errorTitle}>Unable to send request</Text>
            <Text style={styles.errorBody}>
              {errorMessage ?? 'Please check your connection and try again.'}
            </Text>
            <Pressable style={styles.primaryRed} onPress={retry} accessibilityRole="button">
              <Text style={styles.primaryGreenText}>Try Again</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {phase === 'already_active' ? (
        <View style={styles.centerBlock}>
          <View style={[styles.resultCard, styles.successChip]}>
            <Icon name="shield-checkmark-outline" size={28} color={C.green} />
            <Text style={styles.partialTitle}>Help is already being arranged</Text>
            <Text style={styles.partialBody}>
              An AgeWell emergency request is already active. Your care team has been alerted.
            </Text>
            <Pressable style={styles.primaryGreen} onPress={viewStatus} accessibilityRole="button">
              <Text style={styles.primaryGreenText}>View Emergency Status</Text>
            </Pressable>
            <Pressable style={styles.secondaryGreen} onPress={goHome} accessibilityRole="button">
              <Text style={styles.secondaryGreenText}>Return to Home</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {phase === 'ready' ? (
        <View style={styles.centerBlock}>
          <Text style={styles.readyTitle}>{holding ? 'Keep holding...' : 'Need emergency help?'}</Text>
          <Text style={styles.readySub}>
            {holding ? 'Release only if you want to cancel.' : 'Hold the button for 3 seconds to get help.'}
          </Text>

          {status !== 'AUTHENTICATED' ? (
            <Text style={styles.gate}>Sign in to AgeWell to use Emergency Support.</Text>
          ) : role !== 'SENIOR' ? (
            <Text style={styles.gate}>This Home Screen button is for AgeWell members.</Text>
          ) : variant === 'loading' ? (
            <Text style={styles.gate}>Checking Emergency Support…</Text>
          ) : variant === 'non_serviceable' ? (
            <Text style={styles.gate}>Emergency Support is not available in this service area yet.</Text>
          ) : variant === 'serviceable_no_membership' ? (
            <Text style={styles.gate}>Active membership is required for Emergency Support.</Text>
          ) : null}

          {authorizedSenior ? (
            <>
              <Pressable
                onPressIn={onHoldStart}
                onPressOut={clearHold}
                accessibilityRole="button"
                accessibilityLabel="Get Help. Press and hold for 3 seconds to send an AgeWell emergency alert"
                style={styles.holdOuter}
              >
                <View style={styles.holdInner}>
                  <Svg width={HOLD_SIZE} height={HOLD_SIZE} style={StyleSheet.absoluteFill}>
                    <Circle
                      cx={HOLD_SIZE / 2}
                      cy={HOLD_SIZE / 2}
                      r={RING_R}
                      stroke={C.redSoft}
                      strokeWidth={RING_STROKE}
                      fill="none"
                    />
                    <G transform={`rotate(-90 ${HOLD_SIZE / 2} ${HOLD_SIZE / 2})`}>
                      <Circle
                        cx={HOLD_SIZE / 2}
                        cy={HOLD_SIZE / 2}
                        r={RING_R}
                        stroke={C.red}
                        strokeWidth={RING_STROKE}
                        fill="none"
                        strokeDasharray={`${RING_C}`}
                        strokeDashoffset={RING_C * (1 - holdProgress)}
                        strokeLinecap="round"
                      />
                    </G>
                  </Svg>
                  <View style={[styles.sosCore, holding ? styles.sosCorePressed : null]}>
                    {holding ? (
                      <>
                        <Text style={styles.countdown}>{holdRemainingSec.toFixed(1)}s</Text>
                        <Text style={styles.sosHoldLabel}>KEEP HOLDING</Text>
                      </>
                    ) : (
                      <>
                        <Icon name="call-outline" size={28} color={C.white} />
                        <Text style={styles.sosText}>{EMERGENCY_WIDGET_COPY.action}</Text>
                      </>
                    )}
                  </View>
                </View>
              </Pressable>
              <View style={styles.infoChip}>
                <Icon name="shield-checkmark-outline" size={18} color={C.red} />
                <Text style={styles.infoChipText}>This will alert your emergency contacts through AgeWell.</Text>
              </View>
              <Text style={styles.disclaimer}>This does not call 911 or ambulance.</Text>
            </>
          ) : (
            <Pressable style={styles.primaryRed} onPress={goHome} accessibilityRole="button">
              <Text style={styles.primaryGreenText}>Open AgeWell</Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.white,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backBtn: {
    width: minTouchSize,
    height: minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyPill: {
    backgroundColor: C.red,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  emergencyPillText: {
    ...typography.captionStrong,
    color: C.white,
    letterSpacing: 0.6,
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  readyTitle: {
    ...typography.display,
    color: C.red,
    textAlign: 'center',
    fontSize: 28,
  },
  readySub: {
    ...typography.body,
    color: C.muted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  gate: {
    ...typography.bodyStrong,
    color: C.text,
    textAlign: 'center',
  },
  holdOuter: {
    marginVertical: spacing.md,
  },
  holdInner: {
    width: HOLD_SIZE,
    height: HOLD_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosCore: {
    width: HOLD_SIZE - 36,
    height: HOLD_SIZE - 36,
    borderRadius: (HOLD_SIZE - 36) / 2,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  sosCorePressed: {
    transform: [{ scale: 0.98 }],
  },
  sosText: {
    ...typography.title,
    color: C.white,
    letterSpacing: 1,
  },
  sosHoldLabel: {
    ...typography.captionStrong,
    color: C.white,
  },
  countdown: {
    ...typography.display,
    color: C.white,
    fontSize: 36,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.redSoft,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    maxWidth: 320,
  },
  infoChipText: {
    ...typography.caption,
    color: C.red,
    flex: 1,
  },
  disclaimer: {
    ...typography.caption,
    color: C.muted,
    textAlign: 'center',
  },
  sendingTitle: {
    ...typography.display,
    color: C.text,
    letterSpacing: 1,
  },
  sendingSub: {
    ...typography.body,
    color: C.muted,
    textAlign: 'center',
  },
  spinner: {
    marginVertical: spacing.lg,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  successTitle: {
    ...typography.display,
    color: C.green,
    textAlign: 'center',
    fontSize: 28,
  },
  successBody: {
    ...typography.body,
    color: C.muted,
    textAlign: 'center',
  },
  successChip: {
    backgroundColor: C.greenSoft,
  },
  resultCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  partialCard: {
    backgroundColor: C.amberSoft,
  },
  errorCard: {
    backgroundColor: C.redSoft,
  },
  partialTitle: {
    ...typography.title,
    color: C.text,
    textAlign: 'center',
  },
  partialBody: {
    ...typography.body,
    color: C.muted,
    textAlign: 'center',
  },
  errorTitle: {
    ...typography.title,
    color: C.red,
    textAlign: 'center',
  },
  errorBody: {
    ...typography.body,
    color: C.muted,
    textAlign: 'center',
  },
  primaryGreen: {
    marginTop: spacing.sm,
    width: '100%',
    minHeight: minTouchSize,
    borderRadius: 14,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  primaryAmber: {
    marginTop: spacing.sm,
    width: '100%',
    minHeight: minTouchSize,
    borderRadius: 14,
    backgroundColor: C.amber,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  primaryRed: {
    marginTop: spacing.sm,
    width: '100%',
    maxWidth: 340,
    minHeight: minTouchSize,
    borderRadius: 14,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  primaryGreenText: {
    ...typography.bodyStrong,
    color: C.white,
  },
  secondaryGreen: {
    width: '100%',
    minHeight: minTouchSize,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: C.green,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  secondaryGreenText: {
    ...typography.bodyStrong,
    color: C.green,
  },
});
