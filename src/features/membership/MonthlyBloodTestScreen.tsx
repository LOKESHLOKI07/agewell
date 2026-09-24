import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView, LoadingState } from '@/components';
import { Icon, type IconName } from '@/components/ui';
import { queryClient } from '@/api/queryClient';
import { spacing, typography } from '@/constants/theme';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { MarketplaceServiceIcon } from '@/features/services/components/MarketplaceServiceIcon';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';
import { useServiceRequests } from '@/features/home/hooks/queries';
import { useHealthDocuments, useLabResults } from '@/features/health/hooks';
import { healthQueryKeys } from '@/features/health/queryKeys';
import { gatedMembershipScreen } from './MembershipServiceGate';
import {
  monthlyBloodActivityToneMeta,
  toMonthlyBloodActivityViews,
} from './monthlyBloodModel';
import { filterOfferingsByKind, type ServiceOffering } from './catalogTypes';
import { SERVICE_HERO_IMAGES } from './serviceHeroes';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useHasActiveMembership } from './useHasActiveMembership';
import { useServiceOfferings } from './useCatalog';
import { useTabScreenBottomPad } from '@/utils/safeBottom';
import { toDisplayDate } from '@/utils/date';

const VIDEO_URL = 'https://www.youtube.com/results?search_query=Understanding+Your+Monthly+Blood+Test+AgeWell';

const FALLBACK_EXTRAS: {
  id: string;
  title: string;
  description: string;
  soft: string;
  color: string;
  icon: IconName;
}[] = [
  {
    id: 'fallback-lft',
    title: 'LFT',
    description: 'Liver function test',
    soft: familyHome.greenSoft,
    color: familyHome.red,
    icon: 'water',
  },
  {
    id: 'fallback-kft',
    title: 'KFT',
    description: 'Kidney function test',
    soft: familyHome.blueSoft,
    color: familyHome.blue,
    icon: 'water',
  },
  {
    id: 'fallback-lipid',
    title: 'Lipid Profile',
    description: 'Cholesterol & triglycerides',
    soft: familyHome.yellowSoft,
    color: familyHome.orange,
    icon: 'water',
  },
  {
    id: 'fallback-thyroid',
    title: 'Thyroid',
    description: 'Thyroid stimulating hormone',
    soft: familyHome.redSoft,
    color: familyHome.red,
    icon: 'medkit-outline',
  },
  {
    id: 'fallback-urine',
    title: 'Urine Routine',
    description: 'Urine routine examination',
    soft: familyHome.blueSoft,
    color: familyHome.blue,
    icon: 'flask-outline',
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

function extraTone(title: string, index: number): { soft: string; color: string; icon: IconName } {
  const hay = title.toLowerCase();
  if (/lft|liver/.test(hay)) return { soft: familyHome.greenSoft, color: familyHome.red, icon: 'water' };
  if (/kft|kidney/.test(hay)) return { soft: familyHome.blueSoft, color: familyHome.blue, icon: 'water' };
  if (/lipid|cholest/.test(hay)) return { soft: familyHome.yellowSoft, color: familyHome.orange, icon: 'water' };
  if (/thyroid|tsh/.test(hay)) return { soft: familyHome.redSoft, color: familyHome.red, icon: 'medkit-outline' };
  if (/urine/.test(hay)) return { soft: familyHome.blueSoft, color: familyHome.blue, icon: 'flask-outline' };
  const fallback = FALLBACK_EXTRAS[index % FALLBACK_EXTRAS.length];
  return { soft: fallback.soft, color: fallback.color, icon: fallback.icon };
}

export const MonthlyBloodTestScreen = gatedMembershipScreen(
  'monthly-blood-test',
  'Monthly Blood Test',
  MonthlyBloodTestLive,
);

function MonthlyBloodTestLive() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const membership = useHasActiveMembership();
  const validTill = membershipValidLabel(membership.query.data?.endDate);
  const catalog = useServiceOfferings('monthly-blood-test');
  const extraTests = useMemo(
    () => filterOfferingsByKind(catalog.data ?? [], 'extra'),
    [catalog.data],
  );
  const labsQuery = useLabResults();
  const docsQuery = useHealthDocuments();
  const requestsQuery = useServiceRequests();
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const { submitting, submit } = useMembershipSubmit('monthly-blood-test');

  const displayExtras = useMemo(() => {
    if (extraTests.length > 0) {
      return extraTests.map((item, index) => {
        const tone = extraTone(item.title, index);
        return {
          id: item.id,
          title: item.title,
          description: item.description || item.priceLabel || 'Charges apply',
          soft: tone.soft,
          color: tone.color,
          icon: tone.icon,
          offering: item as ServiceOffering,
        };
      });
    }
    return FALLBACK_EXTRAS.map((item) => ({ ...item, offering: null as ServiceOffering | null }));
  }, [extraTests]);

  const selectedExtras = displayExtras.filter((item) => extraIds.includes(item.id));

  const toggleExtra = (id: string) => {
    setExtraIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const allActivities = useMemo(
    () =>
      toMonthlyBloodActivityViews({
        requests: requestsQuery.data?.items ?? [],
        labs: labsQuery.data?.items ?? [],
        documents: docsQuery.data?.items ?? [],
      }),
    [requestsQuery.data?.items, labsQuery.data?.items, docsQuery.data?.items],
  );
  const activities = showAll ? allActivities : allActivities.slice(0, 3);
  const loading = labsQuery.isPending || docsQuery.isPending || requestsQuery.isPending;

  const refresh = () =>
    void Promise.all([labsQuery.refetch(), docsQuery.refetch(), requestsQuery.refetch()]);

  const onRequestCbc = () => {
    void (async () => {
      const ok = await submit(
        'Monthly CBC · home sample collection',
        'Monthly blood test requested',
      );
      if (ok) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: homeQueryKeys.serviceRequests }),
          queryClient.invalidateQueries({ queryKey: healthQueryKeys.labResults }),
          refresh(),
        ]);
      }
    })();
  };

  const onRequestExtra = () => {
    const catalogSelected = selectedExtras.filter((item) => item.offering);
    if (catalogSelected.length === 0) {
      if (selectedExtras.length === 0) {
        Alert.alert('Select tests', 'Choose one or more additional tests to request.');
        return;
      }
      Alert.alert('No extra tests', 'Extra blood tests will appear here once configured in the catalog.');
      return;
    }
    const note = catalogSelected
      .map((item) => `${item.offering!.title} (${item.offering!.priceLabel || 'charges apply'})`)
      .join(', ');
    void (async () => {
      const ok = await submit(
        `Extra tests: ${note}`,
        catalogSelected.length === 1 ? 'Extra blood test requested' : 'Extra blood tests requested',
      );
      if (ok) {
        setExtraIds([]);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: homeQueryKeys.serviceRequests }),
          refresh(),
        ]);
      }
    })();
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
              serviceId="monthly-blood-test"
              fallbackIcon="water"
              fallbackColor={familyHome.red}
              size={36}
            />
            <Text style={styles.pageTitle}>Monthly Blood Test</Text>
          </View>
          {validTill ? (
            <View style={styles.memberBadge}>
              <Icon name="checkmark-circle-outline" size={14} color={familyHome.green} />
              <Text style={styles.memberBadgeTitle}>{validTill}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actionCards}>
          <Pressable
            onPress={() => router.push('/health/labs' as Href)}
            style={({ pressed }) => [styles.actionCard, styles.actionGreen, pressed ? styles.pressed : null]}
            accessibilityRole="button"
            accessibilityLabel="View All Test Reports"
          >
            <View style={styles.actionTop}>
              <View style={styles.actionIcon}>
                <Icon name="document-text-outline" size={18} color={familyHome.green} />
              </View>
              <Icon name="chevron-forward" size={16} color={familyHome.muted} />
            </View>
            <Text style={styles.actionTitle}>View All Test Reports</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              if (displayExtras.length === 0) {
                return;
              }
              // Keep current multi-selection; open the section by ensuring at least one hint
              if (extraIds.length === 0 && displayExtras[0]) {
                setExtraIds([displayExtras[0].id]);
              }
            }}
            style={({ pressed }) => [styles.actionCard, styles.actionBlue, pressed ? styles.pressed : null]}
            accessibilityRole="button"
            accessibilityLabel="Request Additional Tests"
          >
            <View style={styles.actionTop}>
              <View style={styles.actionIcon}>
                <Icon name="flask-outline" size={18} color={familyHome.blue} />
              </View>
              <Icon name="chevron-forward" size={16} color={familyHome.muted} />
            </View>
            <Text style={styles.actionTitle}>Request Additional Tests</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={onRequestCbc}
          disabled={submitting}
          style={({ pressed }) => [styles.primaryCta, submitting ? styles.disabled : null, pressed ? styles.pressed : null]}
          accessibilityRole="button"
          accessibilityLabel="Schedule a Blood Test"
        >
          <Icon name="calendar-outline" size={18} color={familyHome.white} />
          <Text style={styles.primaryCtaText}>{submitting ? 'Sending…' : 'Schedule a Blood Test'}</Text>
          <Icon name="chevron-forward" size={16} color={familyHome.white} />
        </Pressable>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Pressable
            onPress={() => {
              if (allActivities.length > 3 && !showAll) {
                setShowAll(true);
                return;
              }
              router.push('/health/labs' as Href);
            }}
            accessibilityRole="button"
            accessibilityLabel="View all blood test activity"
          >
            <Text style={styles.viewAll}>View All ›</Text>
          </Pressable>
        </View>

        {loading ? <LoadingState message="Loading blood test activity..." /> : null}
        {!loading && activities.length === 0 ? (
          <Text style={styles.empty}>No blood tests yet. Schedule a CBC to get started.</Text>
        ) : null}
        {!loading && activities.length > 0 ? (
          <View style={styles.activityList}>
            {activities.map((item, index) => {
              const tone = monthlyBloodActivityToneMeta(item.tone);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(item.href as Href)}
                  style={({ pressed }) => [
                    styles.activityRow,
                    index < activities.length - 1 ? styles.activityRowBorder : null,
                    pressed ? styles.pressed : null,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}. ${item.statusLabel}`}
                >
                  <View style={[styles.activityIcon, { backgroundColor: tone.soft }]}>
                    <Icon name={item.icon} size={14} color={tone.color} />
                  </View>
                  <View style={styles.flex}>
                    {item.dateLabel ? <Text style={styles.activityWhen}>{item.dateLabel}</Text> : null}
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <Text style={styles.activitySummary} numberOfLines={1}>
                      {item.summary}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: tone.soft }]}>
                    <Text style={[styles.statusPillText, { color: tone.color }]}>{item.statusLabel}</Text>
                  </View>
                  <Icon name="chevron-forward" size={16} color={familyHome.muted} />
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Additional Tests (Charges Apply)</Text>
        {catalog.isPending ? <Text style={styles.empty}>Loading extra tests…</Text> : null}
        {catalog.isError ? (
          <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
            <Text style={styles.empty}>Unable to load extra tests · Tap to retry</Text>
          </Pressable>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.extraRow}>
          {displayExtras.map((item) => {
            const active = extraIds.includes(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => toggleExtra(item.id)}
                style={[
                  styles.extraCard,
                  { backgroundColor: active ? familyHome.greenSoft : item.soft },
                  active ? styles.extraCardActive : null,
                ]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
                accessibilityLabel={`${item.title}. ${active ? 'Selected' : 'Not selected'}`}
              >
                <View style={styles.extraCardTop}>
                  <Icon name={item.icon} size={18} color={active ? familyHome.green : item.color} />
                  {active ? (
                    <Icon name="checkmark-circle-outline" size={16} color={familyHome.green} />
                  ) : (
                    <View style={styles.radio} />
                  )}
                </View>
                <Text style={styles.extraTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.extraBody} numberOfLines={2}>
                  {item.description}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {extraIds.length > 0 ? (
          <Text style={styles.selectionHint}>
            {extraIds.length} test{extraIds.length === 1 ? '' : 's'} selected
          </Text>
        ) : (
          <Text style={styles.selectionHint}>Tap tests to select one or more</Text>
        )}

        <Pressable
          onPress={onRequestExtra}
          disabled={submitting || extraIds.length === 0}
          style={({ pressed }) => [
            styles.secondaryCta,
            submitting || extraIds.length === 0 ? styles.disabled : null,
            pressed ? styles.pressed : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Request Additional Tests"
        >
          <Icon name="flask-outline" size={16} color={familyHome.white} />
          <Text style={styles.primaryCtaText}>
            {submitting
              ? 'Sending…'
              : extraIds.length > 1
                ? `Request ${extraIds.length} Additional Tests`
                : 'Request Additional Test'}
          </Text>
        </Pressable>

        <View style={styles.infoBanner}>
          <Icon name="help-circle-outline" size={16} color={familyHome.blue} />
          <Text style={styles.infoBannerText}>
            This monthly blood test includes CBC (Complete Blood Count) with home sample collection. Additional tests
            such as LFT, KFT, Lipid Profile, Thyroid and Urine Routine are available on request and may include extra
            charges.
          </Text>
        </View>

        <Pressable
          onPress={() => void Linking.openURL(VIDEO_URL)}
          accessibilityRole="button"
          accessibilityLabel="Watch on YouTube: Understanding Your Monthly Blood Test"
          style={({ pressed }) => [styles.videoCardCompact, pressed ? styles.pressed : null]}
        >
          <View style={styles.videoThumb}>
            <Image
              source={SERVICE_HERO_IMAGES['monthly-blood-test']}
              style={styles.videoThumbImage}
              resizeMode="cover"
            />
            <View style={styles.videoThumbPlay}>
              <Icon name="play" size={14} color={familyHome.white} />
            </View>
            <Text style={styles.videoThumbDuration}>2:40</Text>
          </View>
          <View style={styles.videoCompactCopy}>
            <View style={styles.watchRow}>
              <Icon name="play" size={12} color={familyHome.red} />
              <Text style={styles.watchLabel}>Watch on YouTube</Text>
            </View>
            <Text style={styles.videoCompactTitle}>Understanding Your Monthly Blood Test</Text>
            <Text style={styles.videoCompactBody}>
              Learn how regular blood tests help you stay healthier and detect issues early.
            </Text>
          </View>
          <Icon name="chevron-forward" size={16} color={familyHome.muted} />
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.7 },

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
  pageTitle: { ...typography.title, color: '#123B7A' },
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

  actionCards: { flexDirection: 'row', gap: spacing.sm },
  actionCard: {
    flex: 1,
    borderRadius: 14,
    padding: spacing.md,
    minHeight: 88,
    gap: 6,
  },
  actionGreen: { backgroundColor: familyHome.greenSoft },
  actionBlue: { backgroundColor: familyHome.blueSoft },
  actionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { ...typography.captionStrong, color: '#123B7A', fontSize: 12, lineHeight: 16 },

  primaryCta: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  secondaryCta: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  primaryCtaText: { ...typography.bodyStrong, color: familyHome.white, flexShrink: 1 },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { ...typography.bodyStrong, color: '#123B7A', fontSize: 14, flex: 1 },
  viewAll: { ...typography.captionStrong, color: familyHome.green },
  empty: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  selectionHint: { ...typography.caption, color: familyHome.muted, fontSize: 11 },

  activityList: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    backgroundColor: familyHome.white,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  activityRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: familyHome.border,
  },
  activityIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityWhen: { ...typography.caption, color: familyHome.muted, fontSize: 10 },
  activityTitle: { ...typography.captionStrong, color: familyHome.text, fontSize: 13 },
  activitySummary: { ...typography.caption, color: familyHome.muted, fontSize: 10, marginTop: 1 },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'center',
  },
  statusPillText: { ...typography.captionStrong, fontSize: 10 },

  extraRow: { gap: spacing.sm, paddingVertical: 2 },
  extraCard: {
    width: 112,
    borderRadius: 14,
    padding: spacing.sm,
    gap: 4,
    minHeight: 118,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  extraCardActive: {
    borderColor: familyHome.green,
  },
  extraCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  extraTitle: { ...typography.captionStrong, color: familyHome.text, fontSize: 12 },
  extraBody: { ...typography.caption, color: familyHome.muted, fontSize: 10, lineHeight: 13 },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: familyHome.border,
  },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 12,
    padding: spacing.md,
  },
  infoBannerText: {
    ...typography.caption,
    color: familyHome.text,
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
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
  videoCompactTitle: { ...typography.captionStrong, color: familyHome.text, fontSize: 12 },
  videoCompactBody: { ...typography.caption, color: familyHome.muted, lineHeight: 14, fontSize: 10 },
});
