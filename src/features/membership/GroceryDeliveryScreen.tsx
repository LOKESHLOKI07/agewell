import { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView, LoadingState, PrimaryButton, SecondaryButton } from '@/components';
import { Icon, type IconName } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
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
  groceryOrderToneMeta,
  toGroceryOrderViews,
  type GroceryOrderView,
} from './groceryOrders';
import { membershipPurchaseHref } from './planCatalog';
import { SERVICE_HERO_IMAGES } from './serviceHeroes';
import { useHasActiveMembership } from './useHasActiveMembership';
import { useMembershipServicePageVariant } from './useMembershipServicePageVariant';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useTabScreenBottomPad } from '@/utils/safeBottom';
import { toDisplayDate } from '@/utils/date';

const VIDEO_URL =
  'https://www.youtube.com/results?search_query=Healthy+Eating+Made+Easy+AgeWell+Grocery';

const STEPS: { icon: IconName; title: string; line: string }[] = [
  {
    icon: 'document-text-outline',
    title: 'Upload List',
    line: 'Click a photo and upload your handwritten grocery list.',
  },
  {
    icon: 'cart-outline',
    title: 'From Nearby Shops',
    line: 'Get groceries from a nearby or preferred shop.',
  },
  {
    icon: 'bike',
    title: 'Home Delivery',
    line: 'Fresh groceries & vegetables delivered to your doorstep.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Fresh & Reliable',
    line: 'Quality products for your healthy living.',
  },
];

const FRESH_ESSENTIALS: { icon: IconName; title: string; line: string }[] = [
  {
    icon: 'leaf',
    title: 'Fresh Grocery',
    line: 'Quality products for a healthier you.',
  },
  {
    icon: 'cart-outline',
    title: 'Fresh Vegetables',
    line: 'Farm fresh, handpicked with care.',
  },
  {
    icon: 'home-outline',
    title: 'Convenient & Safe',
    line: 'Delivered to your doorstep.',
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
 * Grocery Delivery — three gate mockups; member hub uses real grocery service_requests + deliveries.
 */
export function GroceryDeliveryScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(true);
  const membership = useHasActiveMembership();
  const validTill = membershipValidLabel(membership.query.data?.endDate);
  const { submitting, submit } = useMembershipSubmit('grocery');
  const requestsQuery = useServiceRequests();
  const deliveriesQuery = useMemberDeliveries();
  const [writeOpen, setWriteOpen] = useState(false);
  const [typedList, setTypedList] = useState('');
  const [showAll, setShowAll] = useState(false);

  const allOrders = toGroceryOrderViews(requestsQuery.data?.items ?? [], deliveriesQuery.data?.items ?? []);
  const visibleOrders = showAll ? allOrders : allOrders.slice(0, 3);
  const loading = requestsQuery.isPending || deliveriesQuery.isPending;
  const error = requestsQuery.isError;

  const refresh = () => void Promise.all([requestsQuery.refetch(), deliveriesQuery.refetch()]);

  const placeOrder = async (notes: string) => {
    const ok = await submit(notes, 'Grocery order placed');
    if (!ok) {
      return;
    }
    setTypedList('');
    setWriteOpen(false);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: homeQueryKeys.serviceRequests }),
      refresh(),
    ]);
  };

  const onUploadList = async () => {
    Alert.alert('Upload Your List', 'Choose how to attach your grocery list.', [
      {
        text: 'Camera',
        onPress: () => {
          void (async () => {
            const cam = await ImagePicker.requestCameraPermissionsAsync();
            if (!cam.granted) {
              Alert.alert('Permission needed', 'Allow camera access to photograph your list.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
            if (result.canceled || !result.assets[0]) {
              return;
            }
            await placeOrder(
              `Handwritten grocery list photo: ${result.assets[0].fileName ?? 'camera photo'}`,
            );
          })();
        },
      },
      {
        text: 'Gallery',
        onPress: () => {
          void (async () => {
            const library = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!library.granted) {
              Alert.alert('Permission needed', 'Allow photo access to upload your list.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.7,
            });
            if (result.canceled || !result.assets[0]) {
              return;
            }
            await placeOrder(
              `Handwritten grocery list photo: ${result.assets[0].fileName ?? 'gallery photo'}`,
            );
          })();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const onSubmitTypedList = () => {
    const text = typedList.trim();
    if (!text) {
      Alert.alert('List empty', 'Type your grocery and vegetable list first.');
      return;
    }
    void placeOrder(`Typed grocery list:\n${text}`);
  };

  const openOrder = (order: GroceryOrderView) => {
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
        {variant === 'loading' ? <LoadingState message="Loading Grocery Delivery..." /> : null}

        {variant === 'non_serviceable' ? (
          <>
            <TitleBlock />
            <HeroBanner
              headline={['Fresh Essentials ', 'At Your Doorstep']}
              sub="Upload your list, we’ll take care of the rest."
              badge="Good Food Happier Days"
              tone="soft"
            />
            <StepsRow />
            <ComingSoonFooter />
            <ServiceHelpBanner />
          </>
        ) : null}

        {variant === 'serviceable_no_membership' ? (
          <>
            <TitleBlock />
            <HeroBanner
              headline={['Fresh Groceries for a ', 'Healthier Tomorrow']}
              sub="Upload your list, and we'll take care of the rest."
              badge="Good Food Brighter Days"
              tone="photo"
            />
            <StepsRow />
            <MembershipRequiredFooter />
            <ServiceHelpBanner />
          </>
        ) : null}

        {variant === 'serviceable_with_membership' ? (
          <MemberBody
            orders={visibleOrders}
            hasMore={allOrders.length > 3 && !showAll}
            loading={loading}
            error={error}
            submitting={submitting}
            validTill={validTill}
            writeOpen={writeOpen}
            typedList={typedList}
            onTypedListChange={setTypedList}
            onOpenWrite={() => setWriteOpen(true)}
            onCloseWrite={() => setWriteOpen(false)}
            onUpload={onUploadList}
            onSubmitTyped={onSubmitTypedList}
            onViewAll={() => setShowAll(true)}
            onRetry={refresh}
            onOpenOrder={openOrder}
          />
        ) : null}
      </KeyboardAwareScrollView>
    </View>
  );
}

function TitleBlock() {
  return (
    <View style={styles.titleBlock}>
      <MarketplaceServiceIcon
        serviceId="grocery"
        fallbackIcon="cart-outline"
        fallbackColor={familyHome.green}
        size={48}
      />
      <View style={styles.flex}>
        <Text style={styles.title}>Grocery Delivery</Text>
        <Text style={styles.lead}>
          Upload your handwritten grocery list on the app and receive fresh groceries & vegetables from a nearby or
          preferred shop.
        </Text>
      </View>
    </View>
  );
}

function HeroBanner({
  headline,
  sub,
  badge,
  tone,
}: {
  headline: [string, string];
  sub: string;
  badge: string;
  tone: 'soft' | 'photo';
}) {
  return (
    <View style={[styles.heroCard, tone === 'photo' ? styles.heroPhoto : styles.heroSoft]}>
      <View style={styles.heroCopy}>
        <Text style={[styles.heroHeadline, tone === 'photo' ? styles.onDark : null]}>
          {headline[0]}
          <Text style={styles.heroAccent}>{headline[1]}</Text>
        </Text>
        <Text style={[styles.heroSub, tone === 'photo' ? styles.onDarkMuted : null]}>{sub}</Text>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{badge}</Text>
        </View>
      </View>
      <Image
        source={SERVICE_HERO_IMAGES.grocery}
        style={styles.heroImage}
        resizeMode="contain"
        accessibilityLabel="Grocery delivery illustration"
      />
    </View>
  );
}

function StepsRow() {
  return (
    <View style={styles.stepGrid}>
      {STEPS.map((item) => (
        <View key={item.title} style={styles.stepCard}>
          <View style={styles.stepIcon}>
            <Icon name={item.icon} size={18} color={familyHome.green} />
          </View>
          <Text style={styles.stepTitle}>{item.title}</Text>
        </View>
      ))}
    </View>
  );
}

function ComingSoonFooter() {
  return (
    <View style={styles.soonBanner}>
      <Icon name="location" size={18} color={familyHome.red} />
      <View style={styles.flex}>
        <Text style={styles.soonTitle}>Service coming soon to your area</Text>
        <Text style={styles.soonBody}>
          {MEMBERSHIP_SERVICE_AREA_LINE} Grocery Delivery will become available in your area as we expand our
          services.
        </Text>
      </View>
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
          <Text style={styles.membershipBody}>Grocery Delivery service is available to AgeWell members.</Text>
        </View>
      </View>
      <Pressable
        onPress={() => router.push(membershipPurchaseHref())}
        style={({ pressed }) => [styles.joinPromo, pressed ? styles.pressed : null]}
        accessibilityRole="button"
      >
        <View style={styles.flex}>
          <Text style={styles.joinPromoTitle}>Join AgeWell Membership</Text>
          <Text style={styles.joinPromoBody}>
            Get access to grocery delivery and many other services for a safer, healthier and happier life.
          </Text>
        </View>
        <Icon name="chevron-forward" size={16} color="#B45309" />
      </Pressable>
      <PrimaryButton label="Join Membership  →" onPress={() => router.push(membershipPurchaseHref())} />
      <SecondaryButton label="View Membership Plans" onPress={() => router.push(membershipPurchaseHref())} />
    </View>
  );
}

function MemberBody({
  orders,
  hasMore,
  loading,
  error,
  submitting,
  validTill,
  writeOpen,
  typedList,
  onTypedListChange,
  onOpenWrite,
  onCloseWrite,
  onUpload,
  onSubmitTyped,
  onViewAll,
  onRetry,
  onOpenOrder,
}: {
  orders: GroceryOrderView[];
  hasMore: boolean;
  loading: boolean;
  error: boolean;
  submitting: boolean;
  validTill: string | null;
  writeOpen: boolean;
  typedList: string;
  onTypedListChange: (value: string) => void;
  onOpenWrite: () => void;
  onCloseWrite: () => void;
  onUpload: () => void;
  onSubmitTyped: () => void;
  onViewAll: () => void;
  onRetry: () => void;
  onOpenOrder: (order: GroceryOrderView) => void;
}) {
  return (
    <View style={styles.memberStack}>
      <View style={styles.memberTitleBlock}>
        <View style={styles.memberTitleLine}>
          <MarketplaceServiceIcon
            serviceId="grocery"
            fallbackIcon="cart-outline"
            fallbackColor={familyHome.green}
            size={36}
          />
          <Text style={styles.memberTitle}>Grocery & Shopping</Text>
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
          style={({ pressed }) => [styles.actionCard, styles.actionGreen, pressed ? styles.pressed : null]}
          accessibilityRole="button"
          accessibilityLabel="Upload Your List"
        >
          <View style={styles.actionIcon}>
            <Icon name="document-text-outline" size={18} color={familyHome.green} />
          </View>
          <Text style={styles.actionTitle}>{submitting ? 'Sending…' : 'Upload Your List'}</Text>
          <Icon name="chevron-forward" size={16} color={familyHome.muted} />
        </Pressable>

        <Pressable
          onPress={onOpenWrite}
          disabled={submitting}
          style={({ pressed }) => [styles.actionCard, styles.actionBlue, pressed ? styles.pressed : null]}
          accessibilityRole="button"
          accessibilityLabel="Write Your List"
        >
          <View style={[styles.actionIcon, styles.actionIconBlue]}>
            <Icon name="create-outline" size={18} color={familyHome.blue} />
          </View>
          <Text style={styles.actionTitle}>Write Your List</Text>
          <Icon name="chevron-forward" size={16} color={familyHome.muted} />
        </Pressable>
      </View>

      {writeOpen ? (
        <View style={styles.writeCard}>
          <Text style={styles.sectionTitle}>Write your grocery list</Text>
          <TextInput
            value={typedList}
            onChangeText={onTypedListChange}
            placeholder="Milk, eggs, tomatoes, atta…"
            placeholderTextColor={familyHome.muted}
            multiline
            style={styles.writeInput}
            accessibilityLabel="Typed grocery list"
          />
          <View style={styles.writeActions}>
            <SecondaryButton label="Cancel" onPress={onCloseWrite} fullWidth={false} />
            <PrimaryButton
              label={submitting ? 'Sending…' : 'Place order'}
              onPress={onSubmitTyped}
              loading={submitting}
              fullWidth={false}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Pressable
          onPress={hasMore ? onViewAll : () => router.push('/(tabs)/orders' as Href)}
          accessibilityRole="button"
          accessibilityLabel="View all grocery activity"
        >
          <Text style={styles.link}>View All ›</Text>
        </Pressable>
      </View>

      {loading ? <LoadingState message="Loading grocery orders..." /> : null}
      {error ? (
        <Pressable onPress={onRetry} style={styles.errorBanner} accessibilityRole="button">
          <Text style={styles.errorText}>Could not load grocery orders. Tap to retry.</Text>
        </Pressable>
      ) : null}

      {!loading && !error && orders.length === 0 ? (
        <Text style={styles.empty}>No grocery orders yet. Upload or write a list to get started.</Text>
      ) : null}

      {!loading && !error && orders.length > 0 ? (
        <View style={styles.activityList}>
          {orders.map((order, index) => {
            const tone = groceryOrderToneMeta(order.tone);
            const icon: IconName =
              /household|shopping/i.test(order.title) ? 'document-text-outline' : 'cart-outline';
            return (
              <Pressable
                key={order.id}
                onPress={() => onOpenOrder(order)}
                style={({ pressed }) => [
                  styles.activityRow,
                  index < orders.length - 1 ? styles.activityRowBorder : null,
                  pressed ? styles.pressed : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${order.title}. ${order.statusLabel}`}
              >
                <View style={[styles.activityIcon, { backgroundColor: tone.soft }]}>
                  <Icon name={icon} size={14} color={tone.color} />
                </View>
                <View style={styles.flex}>
                  {order.whenLabel ? <Text style={styles.activityWhen}>{order.whenLabel}</Text> : null}
                  <Text style={styles.activityTitle}>{order.title}</Text>
                  <Text style={styles.activitySummary} numberOfLines={1}>
                    {order.itemsSummary}
                  </Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: tone.soft }]}>
                  <Text style={[styles.statusPillText, { color: tone.color }]}>{order.statusLabel}</Text>
                </View>
                <Icon name="chevron-forward" size={16} color={familyHome.muted} />
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.freshCard}>
        <Text style={styles.freshTitle}>Fresh Essentials, Delivered to You</Text>
        <View style={styles.freshGrid}>
          {FRESH_ESSENTIALS.map((item) => (
            <View key={item.title} style={styles.freshItem}>
              <View style={styles.freshIcon}>
                <Icon name={item.icon} size={18} color={familyHome.green} />
              </View>
              <Text style={styles.freshItemTitle}>{item.title}</Text>
              <Text style={styles.freshItemLine}>{item.line}</Text>
            </View>
          ))}
        </View>
      </View>

      <Pressable
        onPress={() => void Linking.openURL(VIDEO_URL)}
        accessibilityRole="button"
        accessibilityLabel="Watch on YouTube: Healthy Eating Made Easy"
        style={({ pressed }) => [styles.videoCardCompact, pressed ? styles.pressed : null]}
      >
        <View style={styles.videoThumb}>
          <Image source={SERVICE_HERO_IMAGES.grocery} style={styles.videoThumbImage} resizeMode="cover" />
          <View style={styles.videoThumbPlay}>
            <Icon name="play" size={14} color={familyHome.white} />
          </View>
          <Text style={styles.videoThumbDuration}>3:28</Text>
        </View>
        <View style={styles.videoCompactCopy}>
          <View style={styles.watchRow}>
            <Icon name="play" size={12} color={familyHome.red} />
            <Text style={styles.watchLabel}>Watch on YouTube</Text>
          </View>
          <Text style={styles.videoCompactTitle}>Healthy Eating Made Easy</Text>
          <Text style={styles.videoCompactBody}>
            Learn how fresh groceries and vegetables can help you stay healthy and active.
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
  memberStack: { gap: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.88 },

  titleBlock: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  titleWell: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.title, color: '#123B7A' },
  lead: { ...typography.caption, color: familyHome.muted, marginTop: 4, lineHeight: 18 },

  heroCard: {
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 188,
    padding: spacing.lg,
    gap: spacing.md,
  },
  heroSoft: { backgroundColor: familyHome.greenSoft },
  heroPhoto: { backgroundColor: '#123B7A' },
  heroCopy: { flex: 1, gap: spacing.xs },
  heroHeadline: { ...typography.subtitle, color: '#123B7A', lineHeight: 24 },
  heroAccent: { color: familyHome.green, fontWeight: '700' },
  heroSub: { ...typography.caption, color: '#123B7A', lineHeight: 17 },
  onDark: { color: familyHome.white },
  onDarkMuted: { color: 'rgba(255,255,255,0.9)' },
  heroImage: { width: 156, height: 156 },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DFF5E2',
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginTop: 4,
  },
  heroBadgeText: { ...typography.caption, color: familyHome.greenDark, fontWeight: '600', fontSize: 10 },

  stepGrid: { flexDirection: 'row', gap: spacing.sm },
  stepCard: {
    flex: 1,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 78,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
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

  memberTitleBlock: { gap: 6 },
  memberTitleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberTitleWell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberTitle: { ...typography.title, color: familyHome.green, flexShrink: 1 },
  memberBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  memberBadgeTitle: { ...typography.captionStrong, color: familyHome.greenDark, fontSize: 11 },

  actionCards: { flexDirection: 'row', gap: spacing.sm },
  actionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    minHeight: 56,
  },
  actionGreen: { backgroundColor: familyHome.greenSoft },
  actionBlue: { backgroundColor: familyHome.blueSoft },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconBlue: { backgroundColor: familyHome.white },
  actionTitle: { ...typography.captionStrong, color: '#123B7A', flex: 1, fontSize: 12, lineHeight: 16 },

  writeCard: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
  },
  writeInput: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 12,
    padding: spacing.md,
    ...typography.body,
    color: familyHome.text,
    textAlignVertical: 'top',
  },
  writeActions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...typography.subtitle, color: '#123B7A', fontSize: 16 },
  link: { ...typography.captionStrong, color: familyHome.green },

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
  activityTitle: { ...typography.captionStrong, color: '#123B7A', fontSize: 13 },
  activitySummary: { ...typography.caption, color: familyHome.muted, fontSize: 10, marginTop: 1 },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'center',
  },
  statusPillText: { ...typography.captionStrong, fontSize: 10 },

  freshCard: {
    backgroundColor: familyHome.greenSoft,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.md,
  },
  freshTitle: {
    ...typography.bodyStrong,
    color: '#123B7A',
    textAlign: 'center',
    fontSize: 14,
  },
  freshGrid: { flexDirection: 'row', gap: spacing.sm },
  freshItem: { flex: 1, alignItems: 'center', gap: 4 },
  freshIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freshItemTitle: {
    ...typography.captionStrong,
    color: familyHome.green,
    textAlign: 'center',
    fontSize: 11,
  },
  freshItemLine: {
    ...typography.caption,
    color: familyHome.muted,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 13,
  },

  empty: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  errorBanner: { backgroundColor: familyHome.redSoft, borderRadius: 12, padding: spacing.md },
  errorText: { ...typography.caption, color: familyHome.red },

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
    fontSize: 10,
    overflow: 'hidden',
  },
  videoCompactCopy: { flex: 1, minWidth: 0, gap: 2 },
  watchRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  watchLabel: { ...typography.caption, color: familyHome.blue, fontSize: 10 },
  videoCompactTitle: { ...typography.captionStrong, color: '#123B7A', fontSize: 13 },
  videoCompactBody: { ...typography.caption, color: familyHome.muted, fontSize: 10, lineHeight: 14 },
});
