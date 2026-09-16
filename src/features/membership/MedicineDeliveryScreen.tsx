import { useState } from 'react';
import {
  Alert,
  Image,
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
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
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
import { useSystemBottomInset } from '@/utils/safeBottom';

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

const MEMBER_PROMO_FEATURES: { icon: IconName; label: string }[] = [
  { icon: 'shield-checkmark-outline', label: 'Safe & Reliable' },
  { icon: 'home-outline', label: 'Home Delivery' },
  { icon: 'time-outline', label: 'On-Time Delivery' },
];

/**
 * Medicine Delivery — membership-gated; recent orders come from real service_requests.
 */
export function MedicineDeliveryScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useSystemBottomInset(12) + spacing.xxl;
  const variant = useMembershipServicePageVariant(true);
  const { submitting, submit } = useMembershipSubmit('medicine');
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
      <AgeWellHeader title="AgeWell" showBack showProfile={false} showBell showTagline centerTitle />
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
            onUpload={onUploadPrescription}
            onViewPast={() => router.push('/(tabs)/orders' as Href)}
            onViewAll={() => setShowAll(true)}
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
        <View style={styles.titleWell}>
          <Icon name="pill" size={22} color={familyHome.green} />
        </View>
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
          <Text style={styles.benefitLine}>{item.line}</Text>
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
    <Pressable
      onPress={() => router.push('/account/help' as Href)}
      accessibilityRole="button"
      accessibilityLabel="Have Questions? Reach out to AgeWell support"
      style={({ pressed }) => [styles.helpBanner, pressed ? styles.pressed : null]}
    >
      <Icon name="help-circle-outline" size={18} color={familyHome.blue} />
      <View style={styles.flex}>
        <Text style={styles.helpTitle}>Have Questions?</Text>
        <Text style={styles.helpBody}>Our team is here to help. Reach out to us anytime.</Text>
      </View>
    </Pressable>
  );
}

function MemberBody({
  orders,
  ordersLoading,
  ordersError,
  hasMore,
  submitting,
  onUpload,
  onViewPast,
  onViewAll,
  onRetry,
  onOpenOrder,
}: {
  orders: MedicineOrderView[];
  ordersLoading: boolean;
  ordersError: boolean;
  hasMore: boolean;
  submitting: boolean;
  onUpload: () => void;
  onViewPast: () => void;
  onViewAll: () => void;
  onRetry: () => void;
  onOpenOrder: (order: MedicineOrderView) => void;
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.memberTitleLine}>
        <View style={styles.memberTitleWell}>
          <Icon name="pill" size={18} color={familyHome.blue} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title}>Medicine Delivery</Text>
          <Text style={styles.memberSubtitle}>Upload prescription, we deliver to your home</Text>
        </View>
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
          <Text style={styles.actionBody}>Take a clear photo of your prescription.</Text>
        </Pressable>

        <Pressable
          onPress={onViewPast}
          accessibilityRole="button"
          accessibilityLabel="View Past Orders"
          style={({ pressed }) => [styles.pastCard, pressed ? styles.pressed : null]}
        >
          <View style={styles.actionCardTop}>
            <View style={[styles.actionIconWell, styles.pastIconWell]}>
              <Icon name="document-text-outline" size={18} color={familyHome.blue} />
            </View>
            <Icon name="chevron-forward" size={16} color={familyHome.muted} />
          </View>
          <Text style={styles.actionTitle}>View Past Orders</Text>
          <Text style={styles.actionBody}>Check your delivery history.</Text>
        </Pressable>
      </View>

      <View style={styles.ordersCard}>
        <View style={styles.activityHead}>
          <Text style={styles.sectionTitle}>Recent Orders & Delivery Status</Text>
          {hasMore ? (
            <Pressable onPress={onViewAll} accessibilityRole="button" accessibilityLabel="View all medicine orders">
              <Text style={styles.viewAll}>View All &gt;</Text>
            </Pressable>
          ) : null}
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
              const isLast = index === orders.length - 1;
              return (
                <Pressable
                  key={order.id}
                  onPress={() => onOpenOrder(order)}
                  accessibilityRole="button"
                  accessibilityLabel={`${order.orderCode}. ${order.statusLabel}`}
                  style={({ pressed }) => [styles.orderRow, pressed ? styles.pressed : null]}
                >
                  <View style={styles.timelineCol}>
                    <View style={[styles.orderIcon, { backgroundColor: meta.soft }]}>
                      <Icon name={meta.icon} size={16} color={meta.color} />
                    </View>
                    {!isLast ? <View style={styles.timelineLine} /> : null}
                  </View>
                  <View style={styles.orderBody}>
                    <Text style={styles.orderCode}>{order.orderCode}</Text>
                    <Text style={styles.orderMeta}>{order.subtitle}</Text>
                    <View style={[styles.statusPill, { backgroundColor: meta.soft }]}>
                      <Text style={[styles.statusPillText, { color: meta.color }]}>{order.statusLabel}</Text>
                    </View>
                    <Text style={styles.statusDetail}>{order.statusDetail}</Text>
                    {order.trackable ? (
                      <Text style={styles.statusSubDetail}>Tap to track live</Text>
                    ) : null}
                  </View>
                  <Icon name="chevron-forward" size={16} color={familyHome.muted} />
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      <View style={styles.memberPromo}>
        <View style={styles.memberPromoTop}>
          <View style={styles.flex}>
            <Text style={styles.memberPromoHeadline}>
              Your Medicines, <Text style={styles.bannerAccent}>Our Responsibility</Text>
            </Text>
            <Text style={styles.memberPromoBody}>
              Safe, timely and reliable delivery of your medicines at your home.
            </Text>
          </View>
          <View style={styles.memberPromoMedia}>
            <Image
              source={SERVICE_HERO_IMAGES.medicine}
              style={styles.memberPromoImage}
              resizeMode="contain"
            />
            <Text style={styles.memberPromoBadge}>Better Health Brighter Days</Text>
          </View>
        </View>
        <View style={styles.memberPromoFeatures}>
          {MEMBER_PROMO_FEATURES.map((item) => (
            <View key={item.label} style={styles.memberPromoFeature}>
              <View style={styles.memberPromoFeatureIcon}>
                <Icon name={item.icon} size={14} color={familyHome.green} />
              </View>
              <Text style={styles.memberPromoFeatureLabel} numberOfLines={2}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.lg,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  stack: { gap: spacing.lg },
  flex: { flex: 1 },
  flexMin: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.88 },

  titleBlock: { gap: spacing.sm },
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
    borderRadius: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    minHeight: 148,
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
  bannerImage: { width: 96, height: 96 },
  bannerCalloutFull: {
    width: '100%',
    ...typography.captionStrong,
    color: familyHome.greenDark,
    fontSize: 12,
    lineHeight: 16,
  },

  benefitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  benefitCard: {
    width: '47%',
    maxWidth: '48%',
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 140,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 14,
    padding: spacing.md,
    gap: 4,
    minHeight: 96,
  },
  benefitIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  benefitTitle: { ...typography.captionStrong, color: familyHome.text },
  benefitLine: { ...typography.caption, color: familyHome.muted, lineHeight: 16 },

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
    borderRadius: 10,
    backgroundColor: familyHome.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberSubtitle: { ...typography.body, color: familyHome.muted },

  actionCards: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  uploadCard: {
    flexGrow: 1,
    flexBasis: 140,
    minWidth: 140,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 16,
    padding: spacing.md,
    minHeight: 120,
    gap: spacing.sm,
  },
  pastCard: {
    flexGrow: 1,
    flexBasis: 140,
    minWidth: 140,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.md,
    minHeight: 120,
    gap: spacing.sm,
  },
  actionIconWell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastIconWell: { backgroundColor: familyHome.white },
  actionTitle: { ...typography.captionStrong, color: '#123B7A' },
  actionBody: { ...typography.caption, color: familyHome.muted, lineHeight: 15, fontSize: 11 },
  actionCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  ordersCard: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.md,
  },
  activityHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...typography.subtitle, color: '#123B7A', flex: 1, paddingRight: spacing.sm },
  viewAll: { ...typography.captionStrong, color: familyHome.blue },
  orderList: { gap: 0 },
  emptyOrders: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  errorBanner: {
    backgroundColor: familyHome.redSoft,
    borderRadius: 12,
    padding: spacing.md,
  },
  errorText: { ...typography.caption, color: familyHome.red },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: familyHome.border,
  },
  timelineCol: { alignItems: 'center', width: 32 },
  orderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    backgroundColor: familyHome.border,
    marginTop: 4,
  },
  orderBody: { flex: 1, minWidth: 0, gap: 2 },
  orderCode: { ...typography.bodyStrong, color: '#123B7A' },
  orderMeta: { ...typography.caption, color: familyHome.muted },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginTop: 4,
  },
  statusPillText: { ...typography.captionStrong, fontSize: 11 },
  statusDetail: { ...typography.caption, color: familyHome.text, marginTop: 4 },
  statusSubDetail: { ...typography.caption, color: familyHome.blue, marginTop: 2 },

  memberPromo: {
    gap: spacing.md,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 18,
    padding: spacing.lg,
  },
  memberPromoTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    alignItems: 'center',
  },
  memberPromoHeadline: { ...typography.subtitle, color: '#123B7A', lineHeight: 24 },
  memberPromoBody: { ...typography.caption, color: familyHome.text, marginTop: 6, lineHeight: 18 },
  memberPromoFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  memberPromoFeature: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    alignItems: 'center',
    gap: 6,
    backgroundColor: familyHome.white,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  memberPromoFeatureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberPromoFeatureLabel: {
    ...typography.captionStrong,
    color: familyHome.greenDark,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 14,
  },
  memberPromoMedia: { width: 96, alignItems: 'center', flexShrink: 0 },
  memberPromoImage: { width: 90, height: 90 },
  memberPromoBadge: {
    ...typography.caption,
    color: familyHome.greenDark,
    fontWeight: '600',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
});
