import { useEffect, useRef, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView, LoadingState, PrimaryButton, SecondaryButton } from '@/components';
import { Icon, type IconName } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import { useServicesLive } from '@/features/auth/useServicesLive';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { useSeniorProfile } from '@/features/home/hooks/queries';
import { findActiveEmergency } from '@/features/emergency/mappers';
import { useCreateEmergency, useEmergencyCases } from '@/features/emergency/hooks';
import {
  emergencyDetailHref,
  formatEmergencyWhen,
  getEmergencyCreateErrorMessage,
  recipientStatusLabel,
  RECIPIENT_CHIP_META,
  triggerSourceLabel,
} from '@/features/emergency/selectors';
import type { EmergencyCase, EmergencyRecipient } from '@/features/emergency/types/emergency';
import { resolveEmergencySupportVariant } from '@/features/membership/emergencySupportVariant';
import { useHasActiveMembership } from '@/features/membership/useHasActiveMembership';
import { membershipPurchaseHref } from '@/features/membership/planCatalog';
import { SERVICE_HERO_IMAGES } from '@/features/membership/serviceHeroes';
import { useTabScreenBottomPad } from '@/utils/safeBottom';
import { toDisplayDate } from '@/utils/date';

const HOLD_MS = 3000;
const VIDEO_URL = 'https://www.youtube.com/results?search_query=What+is+AgeWell+Emergency+Support';
const SERVICE_AREA_LINE = 'AgeWell is currently serving Kandivali & Borivali, Mumbai.';

const BENEFITS: { icon: IconName; title: string; line: string }[] = [
  { icon: 'people-outline', title: 'Alerts Family', line: 'Your loved ones are informed' },
  { icon: 'account-circle', title: 'Care Manager', line: 'Coordinates immediately' },
  { icon: 'people', title: 'Companion', line: 'On-ground assistance' },
  { icon: 'business-outline', title: 'Hospital Support', line: 'Pre-selected hospital network' },
];

function membershipValidLabel(endDate: string | null | undefined): string | null {
  if (!endDate) {
    return null;
  }
  const display = toDisplayDate(endDate);
  if (!display) {
    return null;
  }
  const parsed = new Date(endDate);
  if (Number.isNaN(parsed.getTime())) {
    return `Valid till ${display}`;
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `Valid till ${parsed.getDate()} ${months[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

function recipientFor(emergency: EmergencyCase | null, role: string): EmergencyRecipient | null {
  if (!emergency) {
    return null;
  }
  return emergency.recipients.find((item) => item.role === role) ?? null;
}

/**
 * Emergency Support UI 3 — out of area / membership required / active SOS.
 */
export function MembershipSosScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const role = useAuthStore((state) => state.user?.role);
  const isFamily = role === 'FAMILY';
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
  const cases = listQuery.data?.items ?? [];
  const active = findActiveEmergency(cases);
  const recent = cases.slice(0, 8);
  const submitting = createMutation.isPending;
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTick = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [holdMs, setHoldMs] = useState(0);
  const [holding, setHolding] = useState(false);

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

  const fireSos = async () => {
    clearHold();
    try {
      await createMutation.mutateAsync({ type: 'MEDICAL', triggerSource: 'APP_SOS' });
    } catch {
      return;
    }
  };

  const onHoldStart = () => {
    if (submitting || active) {
      return;
    }
    setHolding(true);
    setHoldMs(0);
    const started = Date.now();
    holdTick.current = setInterval(() => {
      setHoldMs(Math.min(HOLD_MS, Date.now() - started));
    }, 50);
    holdTimer.current = setTimeout(() => {
      void fireSos();
    }, HOLD_MS);
  };

  const showMemberSos = variant === 'serviceable_with_membership';
  const showComingSoon = variant === 'non_serviceable';
  const showMembershipGate = variant === 'serviceable_no_membership';
  const validTill = membershipValidLabel(membership.query.data?.endDate);
  const holdProgress = Math.min(1, holdMs / HOLD_MS);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="AgeWell" showBack={false} showProfile={false} showBell />
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <View style={styles.titleLine}>
              <View style={styles.sirenWell}>
                <Icon name="siren" size={18} color={familyHome.red} />
              </View>
              <Text style={styles.title}>Emergency Support</Text>
            </View>
            <Text style={styles.subtitle}>Help is just one tap away</Text>
          </View>
          {showMemberSos && !isFamily ? (
            <View style={styles.memberBadge}>
              <Icon name="checkmark-circle-outline" size={14} color={familyHome.green} />
              <View>
                <Text style={styles.memberBadgeTitle}>Active Member</Text>
                {validTill ? <Text style={styles.memberBadgeSub}>{validTill}</Text> : null}
              </View>
            </View>
          ) : null}
        </View>

        {variant === 'loading' ? <LoadingState message="Loading Emergency Support..." /> : null}
        {showComingSoon ? <ComingSoonBody /> : null}
        {showMembershipGate ? <MembershipGateBody /> : null}
        {showMemberSos ? (
          <MemberSosBody
            active={active}
            recent={showAll ? recent : recent.slice(0, 3)}
            totalRecent={recent.length}
            onViewAll={() => setShowAll(true)}
            holding={holding}
            holdProgress={holdProgress}
            submitting={submitting}
            showHoldButton={!isFamily}
            error={createMutation.isError ? getEmergencyCreateErrorMessage(createMutation.error) : null}
            preferredHospital={senior.data?.preferredHospital ?? null}
            onHoldStart={onHoldStart}
            onHoldEnd={clearHold}
          />
        ) : null}
      </KeyboardAwareScrollView>
    </View>
  );
}

function ComingSoonBody() {
  return (
    <View style={styles.stack}>
      <VideoCard />
      <ExplainerCopy />
      <BenefitGrid />
      <View style={styles.soonBanner}>
        <Icon name="location" size={18} color={familyHome.red} />
        <View style={styles.bannerCopy}>
          <Text style={styles.soonTitle}>Service coming soon to your area</Text>
          <Text style={styles.soonBody}>
            {SERVICE_AREA_LINE} Emergency Support will become available in your area as we expand our services.
          </Text>
        </View>
      </View>
      <View style={styles.infoBanner}>
        <Icon name="help-circle-outline" size={18} color={familyHome.blue} />
        <View style={styles.bannerCopy}>
          <Text style={styles.infoTitle}>Stay Connected</Text>
          <Text style={styles.infoBody}>Follow us for updates as we bring AgeWell to more locations soon.</Text>
        </View>
      </View>
    </View>
  );
}

function MembershipGateBody() {
  return (
    <View style={styles.stack}>
      <VideoCard />
      <ExplainerCopy />
      <BenefitGrid />
      <View style={styles.availableBanner}>
        <Icon name="location" size={18} color={familyHome.greenDark} />
        <View style={styles.bannerCopy}>
          <Text style={styles.availableTitle}>Emergency Support is available in your area</Text>
          <Text style={styles.availableBody}>AgeWell currently provides this service in Kandivali & Borivali, Mumbai.</Text>
        </View>
      </View>
      <View style={styles.membershipBanner}>
        <Icon name="lock-closed-outline" size={18} color="#B45309" />
        <View style={styles.bannerCopy}>
          <Text style={styles.membershipTitle}>Membership Required</Text>
          <Text style={styles.membershipBody}>
            Emergency Support with the AgeWell SOS system is available to active members.
          </Text>
        </View>
      </View>
      <PrimaryButton label="Get Membership  →" onPress={() => router.push(membershipPurchaseHref())} />
      <SecondaryButton label="View Membership Plans" onPress={() => router.push(membershipPurchaseHref())} />
    </View>
  );
}

function MemberSosBody({
  active,
  recent,
  totalRecent,
  onViewAll,
  holding,
  holdProgress,
  submitting,
  showHoldButton,
  error,
  preferredHospital,
  onHoldStart,
  onHoldEnd,
}: {
  active: EmergencyCase | null;
  recent: EmergencyCase[];
  totalRecent: number;
  onViewAll: () => void;
  holding: boolean;
  holdProgress: number;
  submitting: boolean;
  showHoldButton: boolean;
  error: string | null;
  preferredHospital: string | null;
  onHoldStart: () => void;
  onHoldEnd: () => void;
}) {
  return (
    <View style={styles.stack}>
      {showHoldButton ? (
        <View style={styles.panicBanner}>
          <Icon name="lock-closed-outline" size={16} color={familyHome.red} />
          <Text style={styles.panicText}>
            Connected with your home panic button. Press here or use your home panic button for emergency assistance.
          </Text>
        </View>
      ) : (
        <View style={styles.infoBanner}>
          <Icon name="help-circle-outline" size={18} color={familyHome.blue} />
          <Text style={styles.infoBody}>
            SOS is sent from the member app or home panic button. Respond below when an alert is active.
          </Text>
        </View>
      )}

      {showHoldButton ? (
        <View style={styles.sosBlock}>
          <Pressable
            onPressIn={onHoldStart}
            onPressOut={onHoldEnd}
            disabled={submitting || Boolean(active)}
            accessibilityRole="button"
            accessibilityLabel="SOS. Press and hold for 3 seconds to send an emergency alert"
            style={({ pressed }) => [styles.sos, (pressed || holding) && !submitting ? styles.sosPressed : null]}
          >
            <View style={[styles.sosFill, { height: `${Math.round(holdProgress * 100)}%` }]} />
            <Text style={styles.sosText}>SOS</Text>
            <Text style={styles.sosHold}>
              {submitting ? 'SENDING…' : holding ? 'KEEP HOLDING' : 'PRESS & HOLD'}
            </Text>
            <Text style={styles.sosHoldSub}>{submitting ? 'Notifying care circle' : 'FOR 3 SECONDS'}</Text>
          </Pressable>
          <View style={styles.sosHintRow}>
            <Text style={styles.sosHint}>Press only when emergency assistance is required. Accidental presses may delay help for others.</Text>
          </View>
        </View>
      ) : null}

      {preferredHospital ? (
        <View style={styles.availableBanner}>
          <Icon name="business-outline" size={18} color={familyHome.greenDark} />
          <View style={styles.bannerCopy}>
            <Text style={styles.availableTitle}>Preferred hospital</Text>
            <Text style={styles.availableBody}>{preferredHospital}</Text>
          </View>
        </View>
      ) : null}

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      <Text style={styles.sectionTitle}>Alerts will be sent to</Text>
      <View style={styles.recipientGrid}>
        {RECIPIENT_CHIP_META.map((item) => {
          const recipient = recipientFor(active, item.role);
          const pending = !recipient || recipient.status !== 'RESPONDED';
          return (
            <View key={item.role} style={styles.recipientCard}>
              <View style={styles.recipientIcon}>
                <Icon name={item.icon} size={18} color={familyHome.green} />
              </View>
              <Text style={styles.recipientLabel}>{item.label}</Text>
              <Text style={styles.recipientSub}>
                {item.role === 'FAMILY'
                  ? 'Notified immediately'
                  : item.role === 'CARE_MANAGER'
                    ? 'Alerted after 30s if no response'
                    : item.role === 'COMPANION'
                      ? 'Notified immediately'
                      : 'Escalates with Care Manager'}
              </Text>
              <Text style={[styles.recipientStatus, pending ? styles.statusPending : styles.statusDone]}>
                {active
                  ? recipientStatusLabel(recipient?.status ?? 'PENDING', recipient?.respondedAt, recipient?.notifiedAt)
                  : 'Ready'}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.activityHead}>
        <Text style={styles.sectionTitle}>Recent Emergency Activity</Text>
        {totalRecent > recent.length ? (
          <Pressable onPress={onViewAll} accessibilityRole="button" accessibilityLabel="View all emergency activity">
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        ) : null}
      </View>
      {recent.length === 0 ? (
        <Text style={styles.emptyActivity}>No emergency cases on file yet.</Text>
      ) : (
        <View style={styles.activityList}>
          {recent.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(emergencyDetailHref(item.id) as unknown as Href)}
              accessibilityRole="button"
              accessibilityLabel={item.caseNumber ?? 'Emergency case'}
              style={({ pressed }) => [styles.activityRow, pressed ? styles.pressed : null]}
            >
              <View
                style={[
                  styles.activityDot,
                  item.status === 'RESOLVED' || item.status === 'CANCELLED'
                    ? styles.dotClosed
                    : styles.dotOpen,
                ]}
              />
              <View style={styles.activityBody}>
                <Text style={styles.activityId}>{item.caseNumber ? `#${item.caseNumber}` : 'Emergency case'}</Text>
                <Text style={styles.activityMeta}>
                  {formatEmergencyWhen(item.triggeredAt ?? item.createdAt) ?? 'Time not on file'}
                </Text>
                <Text style={styles.activityMeta}>Triggered by {triggerSourceLabel(item.triggerSource)}</Text>
              </View>
              <Text
                style={[
                  styles.activityStatus,
                  item.status === 'RESOLVED' ? styles.statusDone : styles.statusPending,
                ]}
              >
                {item.status === 'RESOLVED' || item.status === 'CANCELLED'
                  ? item.closedAt
                    ? 'Closed'
                    : 'Resolved'
                  : 'Open'}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <VideoCard compact />
    </View>
  );
}

function ExplainerCopy() {
  return (
    <Text style={styles.explainer}>
      Emergency Support helps connect you with your trusted AgeWell support network during an emergency. A panic
      button can alert your family, care manager and companion. We provide 24×7 emergency assistance and hospital
      coordination, with a preferred hospital pre-selected for emergencies.
    </Text>
  );
}

function BenefitGrid() {
  return (
    <View style={styles.benefitGrid}>
      {BENEFITS.map((item) => (
        <View key={item.title} style={styles.benefitCard}>
          <View style={styles.benefitIcon}>
            <Icon name={item.icon} size={18} color={familyHome.green} />
          </View>
          <Text style={styles.benefitTitle}>{item.title}</Text>
          <Text style={styles.benefitLine}>{item.line}</Text>
        </View>
      ))}
    </View>
  );
}

function VideoCard({ compact = false }: { compact?: boolean }) {
  return (
    <Pressable
      onPress={() => void Linking.openURL(VIDEO_URL)}
      accessibilityRole="button"
      accessibilityLabel="Watch: What is AgeWell Emergency Support?"
      style={({ pressed }) => [styles.videoCard, pressed ? styles.pressed : null]}
    >
      <View style={[styles.videoHero, compact ? styles.videoHeroCompact : null]}>
        <Image source={SERVICE_HERO_IMAGES['emergency-sos']} style={styles.videoImage} resizeMode="cover" />
        <View style={styles.videoOverlay} pointerEvents="none">
          <Text style={styles.videoHeadline}>What is AgeWell Emergency Support?</Text>
        </View>
        <View style={styles.playWrap} pointerEvents="none">
          <View style={styles.playBtn}>
            <Icon name="play" size={22} color={familyHome.white} />
          </View>
        </View>
        <Text style={styles.videoDuration}>2:28</Text>
      </View>
      <View style={styles.videoCaption}>
        <Icon name="play" size={14} color={familyHome.red} />
        <Text style={styles.videoCaptionText}>Watch: What is AgeWell Emergency Support?</Text>
        <Icon name="chevron-forward" size={16} color={familyHome.muted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: familyHome.white,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  stack: {
    gap: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleCopy: {
    flex: 1,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sirenWell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: familyHome.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    color: '#123B7A',
  },
  subtitle: {
    ...typography.body,
    color: familyHome.muted,
    marginTop: 2,
    marginLeft: 40,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    maxWidth: 140,
  },
  memberBadgeTitle: {
    ...typography.captionStrong,
    color: familyHome.greenDark,
  },
  memberBadgeSub: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 10,
  },
  explainer: {
    ...typography.body,
    color: familyHome.text,
    lineHeight: 22,
  },
  benefitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  benefitCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 16,
    padding: spacing.md,
    gap: 4,
    minHeight: 92,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  benefitTitle: {
    ...typography.captionStrong,
    color: familyHome.text,
  },
  benefitLine: {
    ...typography.caption,
    color: familyHome.muted,
  },
  soonBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.redSoft,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#F5C2C4',
  },
  soonTitle: {
    ...typography.bodyStrong,
    color: familyHome.red,
  },
  soonBody: {
    ...typography.caption,
    color: familyHome.text,
    marginTop: 4,
    lineHeight: 18,
  },
  infoBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'flex-start',
  },
  infoTitle: {
    ...typography.bodyStrong,
    color: familyHome.blueDark,
  },
  infoBody: {
    ...typography.caption,
    color: familyHome.text,
    marginTop: 2,
    lineHeight: 18,
    flex: 1,
  },
  availableBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  availableTitle: {
    ...typography.bodyStrong,
    color: familyHome.greenDark,
  },
  availableBody: {
    ...typography.caption,
    color: familyHome.text,
    marginTop: 4,
    lineHeight: 18,
  },
  membershipBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.yellowSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  membershipTitle: {
    ...typography.bodyStrong,
    color: '#B45309',
  },
  membershipBody: {
    ...typography.caption,
    color: familyHome.text,
    marginTop: 4,
    lineHeight: 18,
  },
  bannerCopy: {
    flex: 1,
  },
  panicBanner: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: familyHome.redSoft,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'flex-start',
  },
  panicText: {
    ...typography.caption,
    color: familyHome.red,
    flex: 1,
    lineHeight: 18,
  },
  sosBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sos: {
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: familyHome.red,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 8,
    borderColor: '#FFD0D2',
  },
  sosFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#C62B32',
  },
  sosPressed: {
    transform: [{ scale: 0.98 }],
  },
  sosText: {
    ...typography.display,
    color: familyHome.white,
    letterSpacing: 2,
    zIndex: 1,
  },
  sosHold: {
    ...typography.captionStrong,
    color: familyHome.white,
    marginTop: 4,
    zIndex: 1,
  },
  sosHoldSub: {
    ...typography.caption,
    color: familyHome.white,
    opacity: 0.9,
    zIndex: 1,
  },
  sosHintRow: {
    flex: 1,
  },
  sosHint: {
    ...typography.caption,
    color: familyHome.muted,
    textAlign: 'left',
    lineHeight: 18,
  },
  error: {
    ...typography.body,
    color: familyHome.red,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: familyHome.text,
  },
  recipientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  recipientCard: {
    width: '48%',
    flexGrow: 1,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 16,
    padding: spacing.md,
    minHeight: 108,
    backgroundColor: '#F7FBFA',
  },
  recipientIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  recipientLabel: {
    ...typography.captionStrong,
    color: familyHome.text,
  },
  recipientSub: {
    ...typography.caption,
    color: familyHome.muted,
    marginTop: 2,
  },
  recipientStatus: {
    ...typography.captionStrong,
    marginTop: 8,
  },
  statusPending: {
    color: familyHome.muted,
  },
  statusDone: {
    color: familyHome.greenDark,
  },
  activityHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAll: {
    ...typography.captionStrong,
    color: familyHome.green,
  },
  emptyActivity: {
    ...typography.caption,
    color: familyHome.muted,
  },
  activityList: {
    gap: spacing.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 16,
    padding: spacing.lg,
    minHeight: minTouchSize,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  dotOpen: {
    backgroundColor: familyHome.green,
  },
  dotClosed: {
    backgroundColor: familyHome.muted,
  },
  activityBody: {
    flex: 1,
  },
  activityId: {
    ...typography.bodyStrong,
    color: familyHome.text,
  },
  activityMeta: {
    ...typography.caption,
    color: familyHome.muted,
    marginTop: 2,
  },
  activityStatus: {
    ...typography.captionStrong,
  },
  videoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: familyHome.border,
    backgroundColor: familyHome.white,
  },
  videoHero: {
    height: 168,
    backgroundColor: '#123B7A',
    overflow: 'hidden',
  },
  videoHeroCompact: {
    height: 148,
  },
  videoImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,24,56,0.28)',
    justifyContent: 'flex-end',
    padding: spacing.lg,
    paddingRight: 88,
  },
  videoHeadline: {
    ...typography.subtitle,
    color: familyHome.white,
  },
  playWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: familyHome.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoDuration: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    ...typography.caption,
    color: familyHome.white,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  videoCaption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: minTouchSize,
    backgroundColor: familyHome.white,
  },
  videoCaptionText: {
    ...typography.captionStrong,
    color: familyHome.text,
    flex: 1,
  },
  pressed: {
    opacity: 0.94,
  },
});
