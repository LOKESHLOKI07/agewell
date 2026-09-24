import { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView, LoadingState, PrimaryButton, SecondaryButton } from '@/components';
import { Icon, type IconName } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { queryClient } from '@/api/queryClient';
import { useMemberDeliveries } from '@/features/deliveries/hooks';
import { seniorDeliveryTrackHref } from '@/features/deliveries/selectors';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { ServiceHelpBanner } from '@/features/membership/ServiceHelpBanner';
import { MarketplaceServiceIcon } from '@/features/services/components/MarketplaceServiceIcon';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';
import { useServiceRequests } from '@/features/home/hooks/queries';
import { MEMBERSHIP_SERVICE_AREA_LINE } from './membershipServicePageVariant';
import {
  medicineOrderToneMeta,
  toMedicineOrderViews,
  type MedicineOrderView,
} from './medicineOrders';
import { membershipPurchaseHref } from './planCatalog';
import { SERVICE_HERO_IMAGES } from './serviceHeroes';
import { useMembershipServicePageVariant } from './useMembershipServicePageVariant';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useHasActiveMembership } from './useHasActiveMembership';
import { useSystemBottomInset } from '@/utils/safeBottom';
import { toDisplayDate } from '@/utils/date';

const VIDEO_URL = 'https://www.youtube.com/results?search_query=How+AgeWell+Medicine+Delivery+Works';

const GATE_BENEFITS: { icon: IconName; title: string; line: string }[] = [
  {
    icon: 'document-text-outline',
    title: 'Upload Prescription',
    line: 'Upload a clear photo of your prescription on the app',
  },
  {
    icon: 'pill',
    title: 'Wide Range',
    line: 'Get genuine medicines from trusted partners',
  },
  {
    icon: 'home-outline',
    title: 'Home Delivery',
    line: 'Medicines delivered to your doorstep',
  },
  {
    icon: 'time-outline',
    title: 'Plan Ahead',
    line: 'Keep at least 1 day before delivery',
  },
];

const WHY_FEATURES: { icon: IconName; title: string; line: string; color: string; soft: string }[] = [
  {
    icon: 'shield-checkmark-outline',
    title: 'Safe & Reliable',
    line: 'Genuine medicines from trusted partners',
    color: familyHome.green,
    soft: familyHome.greenSoft,
  },
  {
    icon: 'home-outline',
    title: 'Home Delivery',
    line: 'Delivered safely to your doorstep',
    color: familyHome.blue,
    soft: familyHome.blueSoft,
  },
  {
    icon: 'time-outline',
    title: 'On-Time Delivery',
    line: 'Timely delivery you can count on',
    color: familyHome.orange,
    soft: familyHome.orangeSoft,
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

/**
 * Medicine Delivery — membership-gated; recent orders come from real service_requests.
 */
export function MedicineDeliveryScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useSystemBottomInset(12) + spacing.xxl;
  const variant = useMembershipServicePageVariant(true);
  const membership = useHasActiveMembership();
  const { submitting, submit } = useMembershipSubmit('medicine');
  const validTill = membershipValidLabel(membership.query.data?.endDate);
  const requestsQuery = useServiceRequests();
  const deliveriesQuery = useMemberDeliveries();
  const [showAll, setShowAll] = useState(false);
  const allOrders = toMedicineOrderViews(requestsQuery.data?.items ?? [], deliveriesQuery.data?.items ?? []);
  const visibleOrders = showAll ? allOrders : allOrders.slice(0, 3);
  const ordersLoading = requestsQuery.isPending || deliveriesQuery.isPending;
  const ordersError = requestsQuery.isError;

  const pickAndSubmit = async (fromCamera: boolean) => {
    if (fromCamera) {
      const cam = await ImagePicker.requestCameraPermissionsAsync();
      if (!cam.granted) {
        Alert.alert('Permission needed', 'Allow camera access to photograph a prescription.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (result.canceled || !result.assets[0]) {
        return;
      }
      await createOrder(result.assets[0].fileName ?? 'Prescription photo');
      return;
    }

    const library = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!library.granted) {
      Alert.alert('Permission needed', 'Allow photo access to upload a prescription.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    await createOrder(result.assets[0].fileName ?? 'Prescription from gallery');
  };

  const createOrder = async (prescriptionName: string) => {
    const ok = await submit(`Prescription upload: ${prescriptionName}`, 'Medicine order created');
    if (!ok) {
      return;
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: homeQueryKeys.serviceRequests }),
      deliveriesQuery.refetch(),
      requestsQuery.refetch(),
    ]);
  };

  const onUploadPrescription = () => {
    Alert.alert('Upload Prescription', 'Take a clear photo of your prescription.', [
      { text: 'Camera', onPress: () => void pickAndSubmit(true) },
      { text: 'Gallery', onPress: () => void pickAndSubmit(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openOrder = (order: MedicineOrderView) => {
    if (order.deliveryId) {
      router.push(seniorDeliveryTrackHref(order.deliveryId) as Href);
      return;
    }
    router.push('/(tabs)/orders' as Href);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ServicePageHeader />
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {variant === 'loading' ? <LoadingState message="Loading Medicine Delivery..." /> : null}

        {variant === 'non_serviceable' ? (
          <>
            <ServiceTitleBlock />
            <MarketingBanner
              headline={['Your Health, ', 'Our Priority']}
              subline="Safe. Reliable. At Your Doorstep."
              callout="Right Medicines For a Healthier Tomorrow"
              tone="green"
            />
            <BenefitRow />
            <ComingSoonFooter />
          </>
        ) : null}

        {variant === 'serviceable_no_membership' ? (
          <>
            <ServiceTitleBlock />
            <MarketingBanner
              headline={['Your Medicines, ', 'Our Care']}
              subline="Safe. Reliable. At Your Doorstep."
              callout={null}
              tone="navy"
            />
            <BenefitRow />
            <MembershipRequiredFooter />
            <HelpFooter />
          </>
        ) : null}

        {variant === 'serviceable_with_membership' ? (
          <MemberBody
            orders={visibleOrders}
            ordersLoading={ordersLoading}
            ordersError={ordersError}
            hasMore={allOrders.length > 3 && !showAll}
            submitting={submitting}
            validTill={validTill}
            onUpload={onUploadPrescription}
            onWritePrescription={() => router.push('/membership/doctor' as Href)}
            onViewAll={() => {
              if (allOrders.length > 3 && !showAll) {
                setShowAll(true);
                return;
              }
              router.push('/(tabs)/orders' as Href);
            }}
            onRetry={() => void Promise.all([requestsQuery.refetch(), deliveriesQuery.refetch()])}
            onOpenOrder={openOrder}
          />
        ) : null}
      </KeyboardAwareScrollView>
    </View>
  );
}

function ServiceTitleBlock() {
  return (
    <View style={styles.titleBlock}>
      <View style={styles.titleLine}>
        <MarketplaceServiceIcon
          serviceId="medicine"
          fallbackIcon="pill"
          fallbackColor={familyHome.green}
          size={48}
        />
        <View style={styles.titleTextWrap}>
          <Text style={styles.title} numberOfLines={2}>Medicine Delivery</Text>
        </View>
      </View>
      <Text style={styles.lead}>
        Medicines delivered to your doorstep. Upload prescriptions on the app and receive medicine delivery. (Keep at
        least 1 day before delivery)
      </Text>
    </View>
  );
}

function MarketingBanner({
  headline,
  subline,
  callout,
  tone,
}: {
  headline: string[];
  subline: string;
  callout: string | null;
  tone: 'green' | 'navy';
}) {
  return (
    <View
      style={[styles.bannerCard, tone === 'navy' ? styles.bannerCardNavy : styles.bannerCardGreen]}
      accessibilityRole="summary"
    >
      <View style={styles.bannerCopy}>
        <Text style={[styles.bannerHeadline, tone === 'navy' ? styles.bannerHeadlineOnDark : null]}>
          {headline.map((part, index) => {
            const accent = part === 'Our Priority' || part === 'Our Care';
            return (
              <Text
                key={`${part}-${index}`}
                style={
                  accent
                    ? tone === 'navy'
                      ? styles.bannerAccentOnDark
                      : styles.bannerAccent
                    : null
                }
              >
                {part}
              </Text>
            );
          })}
        </Text>
        <Text style={[styles.bannerSubline, tone === 'navy' ? styles.bannerSublineOnDark : null]}>
          {subline}
        </Text>
      </View>
      <View style={styles.bannerMedia}>
        <Image
          source={SERVICE_HERO_IMAGES.medicine}
          style={styles.bannerImage}
          resizeMode="contain"
          accessibilityLabel="Medicine delivery illustration"
        />
      </View>
      {callout ? (
        <Text style={styles.bannerCalloutFull} numberOfLines={2}>
          {callout}
        </Text>
      ) : null}
    </View>
  );
}

function BenefitRow() {
  return (
    <View style={styles.benefitGrid}>
      {GATE_BENEFITS.map((item) => (
        <View key={item.title} style={styles.benefitCard}>
          <View style={styles.benefitIcon}>
            <Icon name={item.icon} size={16} color={familyHome.green} />
          </View>
          <Text style={styles.benefitTitle}>{item.title}</Text>
        </View>
      ))}
    </View>
  );
}

function ComingSoonFooter() {
  return (
    <View style={styles.stack}>
      <View style={styles.soonBanner}>
        <Icon name="location" size={18} color={familyHome.red} />
        <View style={styles.flex}>
          <Text style={styles.soonTitle}>Service coming soon to your area</Text>
          <Text style={styles.soonBody}>
            {MEMBERSHIP_SERVICE_AREA_LINE} Medicine Delivery will become available in your area as we expand our
            services.
          </Text>
        </View>
      </View>
      <Pressable
        disabled
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        accessibilityLabel="Upload Prescription. Unavailable outside the service area"
        style={styles.disabledCta}
      >
        <Text style={styles.disabledCtaLabel}>Upload Prescription</Text>
        <Icon name="chevron-forward" size={16} color="#9CA3AF" />
      </Pressable>
      <HelpFooter />
    </View>
  );
}

function MembershipRequiredFooter() {
  return (
    <View style={styles.membershipCard}>
      <View style={styles.membershipHead}>
        <View style={styles.lockWell}>
          <Icon name="lock-closed-outline" size={16} color="#B45309" />
        </View>
        <View style={styles.flex}>
          <Text style={styles.membershipTitle}>Membership Required</Text>
          <Text style={styles.membershipBody}>Medicine Delivery is available to AgeWell members.</Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push(membershipPurchaseHref())}
        accessibilityRole="button"
        accessibilityLabel="Join AgeWell Membership"
        style={({ pressed }) => [styles.joinPromo, pressed ? styles.pressed : null]}
      >
        <View style={styles.flex}>
          <Text style={styles.joinPromoTitle}>Join AgeWell Membership</Text>
          <Text style={styles.joinPromoBody}>
            Get access to Medicine Delivery and many other services for a safer, healthier and happier life.
          </Text>
        </View>
        <Icon name="chevron-forward" size={16} color="#B45309" />
      </Pressable>

      <PrimaryButton label="Join Membership  →" onPress={() => router.push(membershipPurchaseHref())} />
      <SecondaryButton
        label="View Membership Plans"
        onPress={() => router.push(membershipPurchaseHref())}
      />
    </View>
  );
}

function HelpFooter() {
  return (
    <ServiceHelpBanner />
  );
}

function MemberBody({
  orders,
  ordersLoading,
  ordersError,
  hasMore: _hasMore,
  submitting,
  validTill,
  onUpload,
  onWritePrescription,
  onViewAll,
  onRetry,
  onOpenOrder,
}: {
  orders: MedicineOrderView[];
  ordersLoading: boolean;
  ordersError: boolean;
  hasMore: boolean;
  submitting: boolean;
  validTill: string | null;
  onUpload: () => void;
  onWritePrescription: () => void;
  onViewAll: () => void;
  onRetry: () => void;
  onOpenOrder: (order: MedicineOrderView) => void;
}) {
  return (
    <View style={styles.memberStack}>
      <View style={styles.titleBlock}>
        <View style={styles.memberTitleLine}>
          <MarketplaceServiceIcon
            serviceId="medicine"
            fallbackIcon="pill"
            fallbackColor={familyHome.blue}
            size={36}
          />
          <Text style={styles.title}>Medicine Delivery</Text>
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
          onPress={onUpload}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Upload Prescription"
          style={({ pressed }) => [styles.uploadCard, pressed ? styles.pressed : null]}
        >
          <View style={styles.actionCardTop}>
            <View style={styles.actionIconWell}>
              <Icon name="camera-outline" size={18} color={familyHome.green} />
            </View>
            <Icon name="chevron-forward" size={16} color={familyHome.muted} />
          </View>
          <Text style={styles.actionTitle}>{submitting ? 'Uploading…' : 'Upload Prescription'}</Text>
          <Text style={styles.actionBody}>Take a clear photo of your prescription</Text>
        </Pressable>

        <Pressable
          onPress={onWritePrescription}
          accessibilityRole="button"
          accessibilityLabel="Write a Prescription"
          style={({ pressed }) => [styles.pastCard, pressed ? styles.pressed : null]}
        >
          <View style={styles.actionCardTop}>
            <View style={[styles.actionIconWell, styles.pastIconWell]}>
              <Icon name="create-outline" size={18} color={familyHome.blue} />
            </View>
            <Icon name="chevron-forward" size={16} color={familyHome.muted} />
          </View>
          <Text style={styles.actionTitle}>Write a Prescription</Text>
          <Text style={styles.actionBody}>Request a prescription through our doctors</Text>
        </Pressable>
      </View>

      <View style={styles.activityHead}>
        <Text style={styles.sectionTitle}>Recent Orders & Delivery Status</Text>
        <Pressable onPress={onViewAll} accessibilityRole="button" accessibilityLabel="View all medicine orders">
          <Text style={styles.viewAll}>View All ›</Text>
        </Pressable>
      </View>

      {ordersLoading ? <LoadingState message="Loading your medicine orders..." /> : null}

      {ordersError ? (
        <Pressable onPress={onRetry} accessibilityRole="button" style={styles.errorBanner}>
          <Text style={styles.errorText}>Could not load medicine orders. Tap to retry.</Text>
        </Pressable>
      ) : null}

      {!ordersLoading && !ordersError && orders.length === 0 ? (
        <Text style={styles.emptyOrders}>No medicine orders yet. Upload a prescription to get started.</Text>
      ) : null}

      {!ordersLoading && !ordersError && orders.length > 0 ? (
        <View style={styles.orderList}>
          {orders.map((order, index) => {
            const meta = medicineOrderToneMeta(order.tone);
            return (
              <Pressable
                key={order.id}
                onPress={() => onOpenOrder(order)}
                accessibilityRole="button"
                accessibilityLabel={`${order.orderCode}. ${order.statusLabel}`}
                style={({ pressed }) => [
                  styles.orderRow,
                  index < orders.length - 1 ? styles.orderRowBorder : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <View style={[styles.orderDot, { backgroundColor: meta.color }]} />
                <View style={styles.orderBody}>
                  <Text style={styles.orderCode}>{order.orderCode}</Text>
                  <Text style={styles.orderMeta} numberOfLines={1}>
                    {order.subtitle}
                    {order.statusDetail ? ` • ${order.statusDetail}` : ''}
                  </Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: meta.soft }]}>
                  <Text style={[styles.statusPillText, { color: meta.color }]}>{order.statusLabel}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Why choose AgeWell Medicine Delivery</Text>
      <View style={styles.whyRow}>
        {WHY_FEATURES.map((item) => (
          <View key={item.title} style={[styles.whyCard, { backgroundColor: item.soft }]}>
            <Icon name={item.icon} size={18} color={item.color} />
            <Text style={styles.whyTitle}>{item.title}</Text>
            <Text style={styles.whyLine}>{item.line}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => void Linking.openURL(VIDEO_URL)}
        accessibilityRole="button"
        accessibilityLabel="Watch on YouTube: How AgeWell Medicine Delivery Works"
        style={({ pressed }) => [styles.videoCardCompact, pressed ? styles.pressed : null]}
      >
        <View style={styles.videoThumb}>
          <Image source={SERVICE_HERO_IMAGES.medicine} style={styles.videoThumbImage} resizeMode="cover" />
          <View style={styles.videoThumbPlay}>
            <Icon name="play" size={14} color={familyHome.white} />
          </View>
          <Text style={styles.videoThumbDuration}>2:15</Text>
        </View>
        <View style={styles.videoCompactCopy}>
          <View style={styles.watchRow}>
            <Icon name="play" size={12} color={familyHome.red} />
            <Text style={styles.watchLabel}>Watch on YouTube</Text>
          </View>
          <Text style={styles.videoCompactTitle}>How AgeWell Medicine Delivery Works</Text>
          <Text style={styles.videoCompactBody}>
            From prescription upload to doorstep delivery — see how AgeWell brings your medicines home.
          </Text>
        </View>
        <Icon name="chevron-forward" size={16} color={familyHome.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  stack: { gap: spacing.md },
  memberStack: { gap: spacing.sm },
  flex: { flex: 1 },
  flexMin: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.88 },

  titleBlock: { gap: 6 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  titleTextWrap: { flex: 1, minWidth: 0 },
  titleWell: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: { ...typography.title, color: '#123B7A', flexShrink: 1 },
  lead: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },

  bannerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    minHeight: 188,
    padding: spacing.lg,
    gap: spacing.md,
  },
  bannerCardGreen: { backgroundColor: familyHome.greenSoft },
  bannerCardNavy: { backgroundColor: '#123B7A' },
  bannerCopy: { flex: 1, minWidth: 140, gap: spacing.xs },
  bannerHeadline: { ...typography.subtitle, color: '#123B7A', lineHeight: 24 },
  bannerHeadlineOnDark: { color: familyHome.white },
  bannerAccent: { color: familyHome.green, fontWeight: '700' },
  bannerAccentOnDark: { color: '#B8F0C0', fontWeight: '700' },
  bannerSubline: { ...typography.caption, color: '#123B7A', lineHeight: 17 },
  bannerSublineOnDark: { color: 'rgba(255,255,255,0.9)' },
  bannerMedia: { width: 96, alignItems: 'center', flexShrink: 0 },
  bannerImage: { width: 156, height: 156 },
  bannerCalloutFull: {
    width: '100%',
    ...typography.captionStrong,
    color: familyHome.greenDark,
    fontSize: 12,
    lineHeight: 16,
  },

  benefitGrid: { flexDirection: 'row', gap: spacing.sm },
  benefitCard: {
    flex: 1,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: 4,
    minHeight: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: {
    ...typography.captionStrong,
    color: familyHome.text,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 13,
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
  soonTitle: { ...typography.bodyStrong, color: familyHome.red },
  soonBody: { ...typography.caption, color: familyHome.text, marginTop: 4, lineHeight: 18 },
  disabledCta: {
    minHeight: minTouchSize,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  disabledCtaLabel: { ...typography.bodyStrong, color: '#9CA3AF' },

  membershipCard: {
    backgroundColor: familyHome.yellowSoft,
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#F5E6B8',
  },
  membershipHead: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  lockWell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  membershipTitle: { ...typography.bodyStrong, color: '#B45309' },
  membershipBody: { ...typography.caption, color: familyHome.text, marginTop: 2, lineHeight: 18 },
  joinPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FDE9A8',
    borderRadius: 14,
    padding: spacing.md,
  },
  joinPromoTitle: { ...typography.bodyStrong, color: '#92400E' },
  joinPromoBody: { ...typography.caption, color: familyHome.text, marginTop: 2, lineHeight: 17 },

  helpBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'flex-start',
  },
  helpTitle: { ...typography.bodyStrong, color: familyHome.blueDark },
  helpBody: { ...typography.caption, color: familyHome.text, marginTop: 4, lineHeight: 18 },

  memberTitleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberTitleWell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: familyHome.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  uploadCard: {
    flex: 1,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 14,
    padding: spacing.md,
    minHeight: 108,
    gap: 6,
  },
  pastCard: {
    flex: 1,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 14,
    padding: spacing.md,
    minHeight: 108,
    gap: 6,
  },
  actionIconWell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastIconWell: { backgroundColor: familyHome.white },
  actionTitle: { ...typography.captionStrong, color: '#123B7A', fontSize: 13 },
  actionBody: { ...typography.caption, color: familyHome.muted, lineHeight: 14, fontSize: 10 },
  actionCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  activityHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { ...typography.bodyStrong, color: '#123B7A', fontSize: 14, flex: 1, paddingRight: spacing.sm },
  viewAll: { ...typography.captionStrong, color: familyHome.green, flexShrink: 0 },
  orderList: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    backgroundColor: familyHome.white,
    overflow: 'hidden',
  },
  emptyOrders: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  errorBanner: {
    backgroundColor: familyHome.redSoft,
    borderRadius: 12,
    padding: spacing.md,
  },
  errorText: { ...typography.caption, color: familyHome.red },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 52,
  },
  orderRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: familyHome.border,
  },
  orderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  orderBody: { flex: 1, minWidth: 0 },
  orderCode: { ...typography.captionStrong, color: familyHome.text, fontSize: 12 },
  orderMeta: { ...typography.caption, color: familyHome.muted, fontSize: 10, marginTop: 1 },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'center',
  },
  statusPillText: { ...typography.captionStrong, fontSize: 10 },

  whyRow: { flexDirection: 'row', gap: spacing.sm },
  whyCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: 4,
    minHeight: 100,
    alignItems: 'center',
  },
  whyTitle: {
    ...typography.captionStrong,
    color: familyHome.text,
    textAlign: 'center',
    fontSize: 11,
    marginTop: 2,
  },
  whyLine: {
    ...typography.caption,
    color: familyHome.muted,
    textAlign: 'center',
    fontSize: 9,
    lineHeight: 12,
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

