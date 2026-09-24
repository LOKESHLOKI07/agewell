import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView, LoadingState, PrimaryButton, TextField } from '@/components';
import { Avatar, Icon, type IconName } from '@/components/ui';
import { getApiErrorMessage } from '@/api/errors';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { MarketplaceServiceIcon } from '@/features/services/components/MarketplaceServiceIcon';
import { useTabScreenBottomPad } from '@/utils/safeBottom';
import { toDisplayDate } from '@/utils/date';
import {
  CARE_MANAGER_CALL_HOURS_MESSAGE,
  isCareManagerCallOpen,
  telHref,
  whatsappHref,
} from './careManagerHours';
import {
  useAssignedCareManager,
  useCareActivities,
  useCareVisitSlots,
  useCreateCareCall,
  useCreateCareMessage,
  useCreateCareVisitRequest,
} from './careManagerHooks';
import {
  careActivityFollowUpLine,
  formatCareActivityWhen,
} from './careManagerMappers';
import type { AssignedCareManager, CareActivity } from './careManagerTypes';
import { resolveCareManagerPageVariant } from './careManagerVariant';
import { membershipPurchaseHref } from './planCatalog';
import { SERVICE_HERO_IMAGES } from './serviceHeroes';
import { useHasActiveMembership } from './useHasActiveMembership';

const VIDEO_URL = 'https://www.youtube.com/results?search_query=Meet+Our+Care+Managers+AgeWell';
const SERVICE_AREA_LINE = 'Kandivali & Borivali, Mumbai';
const HOURS_LABEL = '10 AM - 6 PM';

const SUPPORT_FEATURES: { icon: IconName; title: string; line: string; bg: string; color: string }[] = [
  {
    icon: 'calendar-outline',
    title: 'Regular Visits',
    line: 'Monthly visits to check your well-being',
    bg: familyHome.greenSoft,
    color: familyHome.green,
  },
  {
    icon: 'headset',
    title: 'Service Coordination',
    line: 'Helps you access all AgeWell services',
    bg: familyHome.blueSoft,
    color: familyHome.blue,
  },
  {
    icon: 'people-outline',
    title: 'Personalised Support',
    line: 'Understands your unique needs',
    bg: familyHome.orangeSoft,
    color: familyHome.orange,
  },
  {
    icon: 'heart-outline',
    title: 'Always Available',
    line: 'Here for you during emergencies',
    bg: familyHome.redSoft,
    color: familyHome.red,
  },
];

function membershipValidLabel(endDate: string | null | undefined): string | null {
  if (!endDate) {
    return null;
  }
  const parsed = new Date(endDate);
  if (Number.isNaN(parsed.getTime())) {
    const display = toDisplayDate(endDate);
    return display ? `Membership valid upto ${display}` : null;
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `Membership valid upto ${parsed.getDate()} ${months[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

function upcomingIsoDates(count = 14): { iso: string; label: string }[] {
  const dates: { iso: string; label: string }[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let index = 0; index < count; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    dates.push({
      iso,
      label: date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }),
    });
  }
  return dates;
}

export function CareManagerVisitScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const membership = useHasActiveMembership();
  const assignedQuery = useAssignedCareManager();
  const activitiesQuery = useCareActivities(assignedQuery.data?.assigned === true);
  const callMutation = useCreateCareCall();
  const messageMutation = useCreateCareMessage();
  const visitMutation = useCreateCareVisitRequest();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const assigned = assignedQuery.data;
  const variant = resolveCareManagerPageVariant({
    inServiceArea: assigned?.inServiceArea ?? false,
    areaReady: assignedQuery.isFetched || assignedQuery.isError,
    assignedReady: assignedQuery.isFetched || assignedQuery.isError,
    assigned: Boolean(assigned?.assigned && assigned.careManager),
  });
  const activities = activitiesQuery.data?.items ?? [];
  const visibleActivities = showAll ? activities : activities.slice(0, 3);
  const validTill = membershipValidLabel(membership.query.data?.endDate);

  const onCall = async (manager: AssignedCareManager) => {
    if (!isCareManagerCallOpen()) {
      Alert.alert('Calling hours', CARE_MANAGER_CALL_HOURS_MESSAGE);
      return;
    }
    try {
      await callMutation.mutateAsync();
    } catch (error) {
      Alert.alert('Unable to request a call', getApiErrorMessage(error));
      return;
    }
    if (manager.phone) {
      await Linking.openURL(telHref(manager.phone)).catch(() => {
        Alert.alert('Unable to call', `Please dial ${manager.phone} manually.`);
      });
    }
  };

  const onMessage = async (manager: AssignedCareManager) => {
    try {
      await messageMutation.mutateAsync();
    } catch (error) {
      Alert.alert('Unable to start a message', getApiErrorMessage(error));
      return;
    }
    if (!manager.phone) {
      Alert.alert('WhatsApp unavailable', 'No Care Manager WhatsApp number is on file yet.');
      return;
    }
    const href = whatsappHref(
      manager.phone,
      `Hello ${manager.name ?? 'Care Manager'}, I would like to connect with AgeWell.`,
    );
    await Linking.openURL(href).catch(() => {
      Alert.alert('Unable to open WhatsApp', 'Please message the Care Manager from your contacts.');
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ServicePageHeader />
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleBlock}>
          <View style={styles.titleLine}>
            <MarketplaceServiceIcon
              serviceId="care-manager"
              fallbackIcon="headset"
              fallbackColor={familyHome.red}
              size={36}
            />
            <Text style={styles.title}>Care Manager</Text>
          </View>
          {variant === 'assigned' && validTill ? (
            <View style={styles.memberBadge}>
              <Icon name="checkmark-circle-outline" size={14} color={familyHome.green} />
              <Text style={styles.memberBadgeTitle}>{validTill}</Text>
            </View>
          ) : null}
        </View>

        {variant === 'loading' ? <LoadingState message="Loading Care Manager..." /> : null}
        {variant === 'non_serviceable' ? <ComingSoonBody /> : null}
        {variant === 'unassigned' ? <UnassignedBody /> : null}
        {variant === 'assigned' && assigned?.careManager ? (
          <AssignedBody
            manager={assigned.careManager}
            activities={visibleActivities}
            total={activities.length}
            onViewAll={() => setShowAll(true)}
            calling={callMutation.isPending}
            messaging={messageMutation.isPending}
            onCall={() => void onCall(assigned.careManager as AssignedCareManager)}
            onMessage={() => void onMessage(assigned.careManager as AssignedCareManager)}
            onSchedule={() => setScheduleOpen(true)}
          />
        ) : null}
      </KeyboardAwareScrollView>
      {variant === 'assigned' ? (
        <ScheduleVisitModal
          open={scheduleOpen}
          submitting={visitMutation.isPending}
          onClose={() => setScheduleOpen(false)}
          onConfirm={async (scheduledAt, reason) => {
            try {
              await visitMutation.mutateAsync({ scheduledAt, reason });
              setScheduleOpen(false);
              Alert.alert('Visit requested', 'Your Care Manager visit request has been sent to AgeWell.');
            } catch (error) {
              Alert.alert('Unable to schedule', getApiErrorMessage(error));
            }
          }}
        />
      ) : null}
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
          <Text style={styles.soonTitle}>Care Manager Service coming soon to your area</Text>
          <Text style={styles.soonBody}>
            Our Care Manager service is currently available in {SERVICE_AREA_LINE}. We are working to bring this
            service to more locations soon.
          </Text>
        </View>
      </View>
      <View style={styles.infoBanner}>
        <Icon name="help-circle-outline" size={18} color={familyHome.blue} />
        <View style={styles.bannerCopy}>
          <Text style={styles.infoTitle}>Stay Connected</Text>
          <Text style={styles.infoBody}>Leave your details and we will notify you when Care Manager services are available in your area.</Text>
        </View>
        <Icon name="chevron-forward" size={16} color={familyHome.muted} />
      </View>
    </View>
  );
}

function UnassignedBody() {
  return (
    <View style={styles.stack}>
      <VideoCard />
      <ExplainerCopy />
      <BenefitGrid />
      <View style={styles.memberBanner}>
        <Icon name="ribbon-outline" size={18} color={familyHome.greenDark} />
        <View style={styles.bannerCopy}>
          <Text style={styles.availableTitle}>Become a Member Today</Text>
          <Text style={styles.availableBody}>
            Get a dedicated Care Manager, regular visits, service coordination and personalised support with our membership plans.
          </Text>
        </View>
        <Pressable
          onPress={() => router.push(membershipPurchaseHref())}
          accessibilityRole="button"
          accessibilityLabel="View plans"
          style={styles.viewPlans}
        >
          <Text style={styles.viewPlansLabel}>View Plans</Text>
          <Icon name="chevron-forward" size={14} color={familyHome.white} />
        </Pressable>
      </View>
      <View style={styles.availableBanner}>
        <Icon name="location" size={18} color={familyHome.greenDark} />
        <View style={styles.bannerCopy}>
          <Text style={styles.availableTitle}>Good news! Our services are available in your area</Text>
          <Text style={styles.availableBody}>({SERVICE_AREA_LINE}).</Text>
        </View>
      </View>
      <Pressable
        onPress={() =>
          Alert.alert(
            'Talk to Expert',
            'AgeWell will assign a Care Manager and reach you during service hours (10:00 AM–6:00 PM).',
          )
        }
        accessibilityRole="button"
        accessibilityLabel="Talk to Expert"
        style={styles.infoBanner}
      >
        <Icon name="help-circle-outline" size={18} color={familyHome.blue} />
        <View style={styles.bannerCopy}>
          <Text style={styles.infoTitle}>Need help or have questions?</Text>
          <Text style={styles.infoBody}>Talk to our team and we will guide you on the best plan for you.</Text>
        </View>
        <Text style={styles.talkLabel}>Talk to Expert</Text>
      </Pressable>
    </View>
  );
}

function AssignedBody({
  manager,
  activities,
  total,
  onViewAll,
  calling,
  messaging,
  onCall,
  onMessage,
  onSchedule,
}: {
  manager: AssignedCareManager;
  activities: CareActivity[];
  total: number;
  onViewAll: () => void;
  calling: boolean;
  messaging: boolean;
  onCall: () => void;
  onMessage: () => void;
  onSchedule: () => void;
}) {
  const name = manager.name ?? [manager.firstName, manager.lastName].filter(Boolean).join(' ') ?? 'Care Manager';
  return (
    <View style={styles.memberStack}>
      <View style={styles.profileCard}>
        <Avatar name={name} size={72} />
        <View style={styles.flex}>
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profileRole}>Care Manager</Text>
          <View style={styles.profileMetaRow}>
            <Icon name="location" size={12} color={familyHome.blue} />
            <Text style={styles.profileMeta}>{SERVICE_AREA_LINE}</Text>
          </View>
          <View style={styles.assignedPill}>
            <View style={styles.assignedDot} />
            <Text style={styles.assignedText}>Assigned to you</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={onCall}
          disabled={calling}
          accessibilityRole="button"
          accessibilityLabel="Call Care Manager"
          style={({ pressed }) => [styles.callBtn, pressed ? styles.pressed : null]}
        >
          <Icon name="call-outline" size={16} color={familyHome.white} />
          <Text style={styles.callLabel}>{calling ? 'Requesting…' : 'Call'}</Text>
          <Text style={styles.callHours}>{HOURS_LABEL}</Text>
        </Pressable>
        <Pressable
          onPress={onMessage}
          disabled={messaging}
          accessibilityRole="button"
          accessibilityLabel="Message Care Manager on WhatsApp"
          style={({ pressed }) => [styles.messageBtn, pressed ? styles.pressed : null]}
        >
          <Icon name="chatbubble-outline" size={16} color={familyHome.green} />
          <Text style={styles.messageLabel}>{messaging ? 'Opening…' : 'Message'}</Text>
          <Text style={styles.messageHours}>{HOURS_LABEL}</Text>
        </Pressable>
        <Pressable
          onPress={onSchedule}
          accessibilityRole="button"
          accessibilityLabel="Schedule a Visit"
          style={({ pressed }) => [styles.scheduleBtn, pressed ? styles.pressed : null]}
        >
          <Icon name="calendar-outline" size={16} color={familyHome.blue} />
          <Text style={styles.scheduleLabel}>Schedule a Visit</Text>
        </Pressable>
      </View>

      <View style={styles.activityHead}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {total > activities.length ? (
          <Pressable onPress={onViewAll} accessibilityRole="button" accessibilityLabel="View all Care Manager activity">
            <Text style={styles.viewAll}>View All ›</Text>
          </Pressable>
        ) : null}
      </View>
      {activities.length === 0 ? (
        <Text style={styles.emptyActivity}>No Care Manager activity on file yet.</Text>
      ) : (
        <View style={styles.activityList}>
          {activities.map((item, index) => (
            <View
              key={item.id}
              style={[styles.activityRow, index < activities.length - 1 ? styles.activityRowBorder : null]}
            >
              <View style={styles.activityIcon}>
                <Icon name={item.icon} size={14} color={familyHome.green} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.activityWhen}>{formatCareActivityWhen(item.occurredAt ?? item.scheduledAt)}</Text>
                <Text style={styles.activityTitle}>{item.title}</Text>
                {item.reason ? <Text style={styles.activityBody}>{item.reason}</Text> : null}
                {careActivityFollowUpLine(item) ? (
                  <Text style={styles.activityFollow}>{careActivityFollowUpLine(item)}</Text>
                ) : null}
              </View>
              <Icon name="chevron-forward" size={16} color={familyHome.muted} />
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>How your Care Manager supports you</Text>
      <SupportFeatureGrid />
      <VideoCard compact />
    </View>
  );
}

function ExplainerCopy() {
  return (
    <Text style={styles.explainer}>
      Our Care Managers understand your needs, coordinate services and ensure you always have the right support. Watch
      this short video to learn how our Care Manager service helps you and your family in everyday life.
    </Text>
  );
}

function SupportFeatureGrid() {
  return (
    <View style={styles.supportGrid}>
      {SUPPORT_FEATURES.map((item) => (
        <View key={item.title} style={[styles.supportCard, { backgroundColor: item.bg }]}>
          <Icon name={item.icon} size={18} color={item.color} />
          <Text style={styles.supportTitle}>{item.title}</Text>
          <Text style={styles.supportLine}>{item.line}</Text>
        </View>
      ))}
    </View>
  );
}

function BenefitGrid() {
  return <SupportFeatureGrid />;
}

function VideoCard({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Pressable
        onPress={() => void Linking.openURL(VIDEO_URL)}
        accessibilityRole="button"
        accessibilityLabel="Watch on YouTube: Meet Our Care Managers"
        style={({ pressed }) => [styles.videoCardCompact, pressed ? styles.pressed : null]}
      >
        <View style={styles.videoThumb}>
          <Image source={SERVICE_HERO_IMAGES['care-manager']} style={styles.videoThumbImage} resizeMode="cover" />
          <View style={styles.videoThumbPlay}>
            <Icon name="play" size={14} color={familyHome.white} />
          </View>
          <Text style={styles.videoThumbDuration}>3:12</Text>
        </View>
        <View style={styles.videoCompactCopy}>
          <View style={styles.watchRow}>
            <Icon name="play" size={12} color={familyHome.red} />
            <Text style={styles.watchLabel}>Watch on YouTube</Text>
          </View>
          <Text style={styles.videoCompactTitle}>Meet Our Care Managers</Text>
          <Text style={styles.videoCompactBody}>
            A short video on how our care managers support you every day.
          </Text>
        </View>
        <Icon name="chevron-forward" size={16} color={familyHome.muted} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => void Linking.openURL(VIDEO_URL)}
      accessibilityRole="button"
      accessibilityLabel="Watch: What is AgeWell Care Manager Service?"
      style={({ pressed }) => [styles.videoCard, pressed ? styles.pressed : null]}
    >
      <View style={styles.videoHero}>
        <Image source={SERVICE_HERO_IMAGES['care-manager']} style={styles.videoImage} resizeMode="cover" />
        <View style={styles.videoOverlay} pointerEvents="none">
          <Text style={styles.videoHeadline}>What is AgeWell Care Manager Service?</Text>
        </View>
        <View style={styles.playWrap} pointerEvents="none">
          <View style={styles.playBtn}>
            <Icon name="play" size={22} color={familyHome.white} />
          </View>
        </View>
        <Text style={styles.videoDuration}>2:36</Text>
      </View>
      <View style={styles.videoCaption}>
        <Icon name="play" size={14} color={familyHome.red} />
        <Text style={styles.videoCaptionText}>Watch: What is AgeWell Care Manager Service?</Text>
        <Icon name="chevron-forward" size={16} color={familyHome.muted} />
      </View>
    </Pressable>
  );
}

function ScheduleVisitModal({
  open,
  submitting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (scheduledAt: string, reason?: string) => Promise<void>;
}) {
  const dates = useMemo(() => upcomingIsoDates(), []);
  const [dateIso, setDateIso] = useState(dates[1]?.iso ?? dates[0]?.iso ?? '');
  const [slotAt, setSlotAt] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const slotsQuery = useCareVisitSlots(open ? dateIso : null);
  const slots = slotsQuery.data ?? [];

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Text style={styles.modalTitle}>Schedule a Visit</Text>
        <Text style={styles.modalHint}>Choose a date and an available time between 10:00 AM and 6:00 PM.</Text>
        <Text style={styles.sectionTitle}>Date</Text>
        <View style={styles.chipWrap}>
          {dates.map((item) => {
            const selected = item.iso === dateIso;
            return (
              <Pressable
                key={item.iso}
                onPress={() => {
                  setDateIso(item.iso);
                  setSlotAt(null);
                }}
                style={[styles.chip, selected ? styles.chipOn : null]}
              >
                <Text style={[styles.chipLabel, selected ? styles.chipLabelOn : null]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.sectionTitle}>Time slot</Text>
        {slotsQuery.isPending ? <Text style={styles.modalHint}>Loading slots…</Text> : null}
        {!slotsQuery.isPending && slots.length === 0 ? (
          <Text style={styles.modalHint}>No slots available on this date. Same-day times that are too soon are hidden.</Text>
        ) : null}
        <View style={styles.chipWrap}>
          {slots.map((slot) => {
            const selected = slot.startAt === slotAt;
            return (
              <Pressable
                key={slot.startAt}
                onPress={() => setSlotAt(slot.startAt)}
                style={[styles.chip, selected ? styles.chipOn : null]}
              >
                <Text style={[styles.chipLabel, selected ? styles.chipLabelOn : null]}>{slot.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <TextField label="Reason / topic (optional)" value={reason} onChangeText={setReason} />
        <PrimaryButton
          label="Confirm visit request"
          loading={submitting}
          disabled={!slotAt}
          onPress={() => {
            if (slotAt) {
              void onConfirm(slotAt, reason.trim() || undefined);
            }
          }}
        />
        <Pressable onPress={onClose} accessibilityRole="button" style={styles.modalCancel}>
          <Text style={styles.modalCancelLabel}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  stack: { gap: spacing.md },
  memberStack: { gap: spacing.sm },
  flex: { flex: 1 },
  titleBlock: { gap: 6 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  titleWell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: familyHome.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.title, color: '#123B7A' },
  memberBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  memberBadgeTitle: { ...typography.captionStrong, color: familyHome.greenDark },
  explainer: { ...typography.body, color: familyHome.text, lineHeight: 22 },
  supportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  supportCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 14,
    padding: spacing.md,
    gap: 4,
    minHeight: 108,
  },
  supportTitle: { ...typography.bodyStrong, color: familyHome.text, fontSize: 13, marginTop: 4 },
  supportLine: { ...typography.caption, color: familyHome.muted, lineHeight: 15, fontSize: 11 },
  soonBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.redSoft,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#F5C2C4',
  },
  soonTitle: { ...typography.bodyStrong, color: familyHome.red },
  soonBody: { ...typography.caption, color: familyHome.text, marginTop: 4, lineHeight: 18 },
  infoBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
  },
  infoTitle: { ...typography.bodyStrong, color: familyHome.blueDark },
  infoBody: { ...typography.caption, color: familyHome.text, marginTop: 2, lineHeight: 18 },
  availableBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  availableTitle: { ...typography.bodyStrong, color: familyHome.greenDark },
  availableBody: { ...typography.caption, color: familyHome.text, marginTop: 4, lineHeight: 18 },
  memberBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
  },
  viewPlans: {
    backgroundColor: familyHome.green,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewPlansLabel: { ...typography.captionStrong, color: familyHome.white },
  talkLabel: { ...typography.captionStrong, color: familyHome.blue },
  bannerCopy: { flex: 1 },
  videoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: familyHome.border,
    backgroundColor: familyHome.white,
  },
  videoCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: familyHome.border,
    backgroundColor: '#F7F8FA',
    padding: spacing.sm,
  },
  videoThumb: {
    width: 78,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#123B7A',
  },
  videoThumbImage: { width: '100%', height: '100%' },
  videoThumbPlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  videoThumbDuration: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    ...typography.caption,
    color: familyHome.white,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
    fontSize: 9,
  },
  videoCompactCopy: { flex: 1, gap: 1 },
  watchRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  watchLabel: { ...typography.captionStrong, color: familyHome.muted, fontSize: 10 },
  videoCompactTitle: { ...typography.captionStrong, color: familyHome.text, fontSize: 13 },
  videoCompactBody: { ...typography.caption, color: familyHome.muted, lineHeight: 14, fontSize: 10 },
  videoHero: {
    height: 188,
    backgroundColor: '#123B7A',
    overflow: 'hidden',
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
  videoHeadline: { ...typography.subtitle, color: familyHome.white },
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
    color: familyHome.white,
    ...typography.caption,
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: minTouchSize,
    backgroundColor: familyHome.white,
  },
  videoCaptionText: { ...typography.captionStrong, color: familyHome.text, flex: 1 },
  profileCard: {
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
  },
  profileName: { ...typography.subtitle, color: '#123B7A' },
  profileRole: { ...typography.caption, color: familyHome.muted, marginBottom: 4 },
  profileMeta: { ...typography.caption, color: familyHome.blue, flex: 1, lineHeight: 18 },
  profileMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  assignedPill: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  assignedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: familyHome.green },
  assignedText: { ...typography.captionStrong, color: familyHome.greenDark },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  callBtn: {
    flex: 1,
    minHeight: 64,
    borderRadius: 12,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
  },
  callLabel: { ...typography.captionStrong, color: familyHome.white },
  callHours: { ...typography.caption, color: familyHome.white, fontSize: 10, opacity: 0.9 },
  messageBtn: {
    flex: 1,
    minHeight: 64,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: familyHome.green,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
  },
  messageLabel: { ...typography.captionStrong, color: familyHome.green },
  messageHours: { ...typography.caption, color: familyHome.green, fontSize: 10 },
  scheduleBtn: {
    flex: 1,
    minHeight: 64,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: familyHome.blue,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
  },
  scheduleLabel: { ...typography.captionStrong, color: familyHome.blue, textAlign: 'center', fontSize: 11 },
  activityHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...typography.bodyStrong, color: '#123B7A', fontSize: 15 },
  viewAll: { ...typography.captionStrong, color: familyHome.green },
  emptyActivity: { ...typography.caption, color: familyHome.muted },
  activityList: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    backgroundColor: familyHome.white,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    minHeight: 52,
  },
  activityRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: familyHome.border,
  },
  activityIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityWhen: { ...typography.caption, color: familyHome.muted, fontSize: 11 },
  activityTitle: { ...typography.captionStrong, color: familyHome.text, fontSize: 13 },
  activityBody: { ...typography.caption, color: familyHome.muted, marginTop: 1, fontSize: 11 },
  activityFollow: { ...typography.caption, color: familyHome.blue, marginTop: 2, fontSize: 11 },
  pressed: { opacity: 0.85 },
  modalRoot: { flex: 1, padding: spacing.xl, paddingTop: spacing.xxxl, gap: spacing.md, backgroundColor: familyHome.white },
  modalTitle: { ...typography.title, color: familyHome.text },
  modalHint: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: familyHome.greenSoft, borderColor: familyHome.green },
  chipLabel: { ...typography.caption, color: familyHome.text },
  chipLabelOn: { ...typography.captionStrong, color: familyHome.greenDark },
  modalCancel: { minHeight: minTouchSize, alignItems: 'center', justifyContent: 'center' },
  modalCancelLabel: { ...typography.bodyStrong, color: familyHome.muted },
});

