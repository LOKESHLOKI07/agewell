import { useState } from 'react';
import {
  Alert,
  Image,
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
  groceryOrderToneMeta,
  splitGroceryOrders,
  toGroceryOrderViews,
  type GroceryOrderView,
} from './groceryOrders';
import { membershipPurchaseHref } from './planCatalog';
import { SERVICE_HERO_IMAGES } from './serviceHeroes';
import { useMembershipServicePageVariant } from './useMembershipServicePageVariant';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useTabScreenBottomPad } from '@/utils/safeBottom';

const STEPS: { icon: IconName; title: string; line: string }[] = [
  {
    icon: 'document-text-outline',
    title: 'Upload List',
    line: 'Click a photo and upload your handwritten grocery list.',
  },
  {
    icon: 'business-outline',
    title: 'From Nearby Shops',
    line: 'Get groceries from a nearby or preferred shop.',
  },
  {
    icon: 'bike',
    title: 'Home Delivery',
    line: 'Fresh groceries & vegetables delivered to your doorstep.',
  },
  {
    icon: 'sparkles',
    title: 'Fresh & Reliable',
    line: 'Quality products for your healthy living.',
  },
];

/**
 * Grocery Delivery — three gate mockups; member hub uses real grocery service_requests + deliveries.
 */
export function GroceryDeliveryScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(true);
  const { submitting, submit } = useMembershipSubmit('grocery');
  const requestsQuery = useServiceRequests();
  const deliveriesQuery = useMemberDeliveries();
  const [writeOpen, setWriteOpen] = useState(false);
  const [typedList, setTypedList] = useState('');
  const [showAllPast, setShowAllPast] = useState(false);

  const allOrders = toGroceryOrderViews(requestsQuery.data?.items ?? [], deliveriesQuery.data?.items ?? []);
  const { current, past } = splitGroceryOrders(allOrders);
  const pastVisible = showAllPast ? past : past.slice(0, 3);
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
      <AgeWellHeader
        title={variant === 'serviceable_with_membership' ? 'Services' : 'AgeWell'}
        showBack
        showProfile={false}
        showBell
        showTagline={variant !== 'serviceable_with_membership'}
      />
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
            <HelpBanner withButton />
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
            <HelpBanner withButton />
          </>
        ) : null}

        {variant === 'serviceable_with_membership' ? (
          <MemberBody
            current={current}
            past={pastVisible}
            hasMorePast={past.length > 3 && !showAllPast}
            loading={loading}
            error={error}
            submitting={submitting}
            writeOpen={writeOpen}
            typedList={typedList}
            onTypedListChange={setTypedList}
            onOpenWrite={() => setWriteOpen(true)}
            onCloseWrite={() => setWriteOpen(false)}
            onUpload={onUploadList}
            onSubmitTyped={onSubmitTypedList}
            onViewAllPast={() => setShowAllPast(true)}
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
      <View style={styles.titleWell}>
        <Icon name="cart-outline" size={22} color={familyHome.green} />
      </View>
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
          <Text style={styles.stepLine}>{item.line}</Text>
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

function HelpBanner({ withButton = false }: { withButton?: boolean }) {
  return (
    <View style={styles.helpBanner}>
      <Icon name="help-circle-outline" size={18} color={familyHome.blue} />
      <View style={styles.flex}>
        <Text style={styles.helpTitle}>Have Questions?</Text>
        <Text style={styles.helpBody}>Our team is here to help. Reach out to us anytime.</Text>
      </View>
      {withButton ? (
        <SecondaryButton
          label="Contact Support"
          onPress={() => router.push('/account/help' as Href)}
          fullWidth={false}
        />
      ) : null}
    </View>
  );
}

function MemberBody({
  current,
  past,
  hasMorePast,
  loading,
  error,
  submitting,
  writeOpen,
  typedList,
  onTypedListChange,
  onOpenWrite,
  onCloseWrite,
  onUpload,
  onSubmitTyped,
  onViewAllPast,
  onRetry,
  onOpenOrder,
}: {
  current: GroceryOrderView[];
  past: GroceryOrderView[];
  hasMorePast: boolean;
  loading: boolean;
  error: boolean;
  submitting: boolean;
  writeOpen: boolean;
  typedList: string;
  onTypedListChange: (value: string) => void;
  onOpenWrite: () => void;
  onCloseWrite: () => void;
  onUpload: () => void;
  onSubmitTyped: () => void;
  onViewAllPast: () => void;
  onRetry: () => void;
  onOpenOrder: (order: GroceryOrderView) => void;
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.memberTitleLine}>
        <View style={styles.memberTitleWell}>
          <Icon name="cart-outline" size={18} color={familyHome.green} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.memberTitle}>Grocery & Shopping</Text>
          <Text style={styles.memberSubtitle}>Daily essentials, delivered with care</Text>
        </View>
      </View>

      <View style={styles.actionCards}>
        <Pressable
          onPress={onUpload}
          disabled={submitting}
          style={({ pressed }) => [styles.actionCard, styles.actionGreen, pressed ? styles.pressed : null]}
          accessibilityRole="button"
          accessibilityLabel="Upload Your List"
        >
          <View style={styles.actionTop}>
            <View style={styles.actionIcon}>
              <Icon name="document-text-outline" size={18} color={familyHome.green} />
            </View>
            <Icon name="chevron-forward" size={16} color={familyHome.muted} />
          </View>
          <Text style={styles.actionTitle}>{submitting ? 'Sending…' : 'Upload Your List'}</Text>
          <Text style={styles.actionBody}>Upload a photo, PDF or write your list.</Text>
        </Pressable>

        <Pressable
          onPress={onOpenWrite}
          disabled={submitting}
          style={({ pressed }) => [styles.actionCard, styles.actionBlue, pressed ? styles.pressed : null]}
          accessibilityRole="button"
          accessibilityLabel="Write Your List"
        >
          <View style={styles.actionTop}>
            <View style={styles.actionIcon}>
              <Icon name="create-outline" size={18} color={familyHome.blue} />
            </View>
            <Icon name="chevron-forward" size={16} color={familyHome.muted} />
          </View>
          <Text style={styles.actionTitle}>Write Your List</Text>
          <Text style={styles.actionBody}>Type your grocery and vegetable list.</Text>
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

      {loading ? <LoadingState message="Loading grocery orders..." /> : null}
      {error ? (
        <Pressable onPress={onRetry} style={styles.errorBanner} accessibilityRole="button">
          <Text style={styles.errorText}>Could not load grocery orders. Tap to retry.</Text>
        </Pressable>
      ) : null}

      {!loading && !error ? (
        <>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Current Request</Text>
            <Pressable onPress={() => router.push('/(tabs)/orders' as Href)} accessibilityRole="button">
              <Text style={styles.link}>View All &gt;</Text>
            </Pressable>
          </View>
          {current.length === 0 ? (
            <Text style={styles.empty}>No active grocery request. Upload or write a list to start.</Text>
          ) : (
            current.map((order) => <OrderCard key={order.id} order={order} onPress={() => onOpenOrder(order)} />)
          )}

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Past Requests</Text>
            {hasMorePast ? (
              <Pressable onPress={onViewAllPast} accessibilityRole="button">
                <Text style={styles.link}>View All &gt;</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => router.push('/(tabs)/orders' as Href)} accessibilityRole="button">
                <Text style={styles.link}>View All &gt;</Text>
              </Pressable>
            )}
          </View>
          {past.length === 0 ? (
            <Text style={styles.empty}>No past grocery orders yet.</Text>
          ) : (
            past.map((order) => <OrderCard key={order.id} order={order} onPress={() => onOpenOrder(order)} compact />)
          )}

          <View style={styles.noteBanner}>
            <Icon name="help-circle-outline" size={18} color={familyHome.blue} />
            <Text style={styles.noteBody}>
              Important Note: The cost of groceries and other products will be charged separately as per the actual
              bill. Our team will share the bill once your order is delivered.
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

function OrderCard({
  order,
  onPress,
  compact = false,
}: {
  order: GroceryOrderView;
  onPress: () => void;
  compact?: boolean;
}) {
  const tone = groceryOrderToneMeta(order.tone);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.orderCard, pressed ? styles.pressed : null]}>
      <View style={styles.orderTop}>
        <View style={[styles.statusPill, { backgroundColor: tone.soft }]}>
          <Text style={[styles.statusPillText, { color: tone.color }]}>{order.statusLabel}</Text>
        </View>
        <Icon name="chevron-forward" size={16} color={familyHome.muted} />
      </View>
      <Text style={styles.orderTitle}>{order.title}</Text>
      <Text style={styles.orderMeta}>{order.subtitle}</Text>
      <Text style={styles.orderDetail} numberOfLines={compact ? 2 : 4}>
        {order.statusDetail}
      </Text>
      {order.successBanner && !compact ? (
        <View style={styles.successBanner}>
          <Icon name="checkmark-circle-outline" size={16} color={familyHome.green} />
          <Text style={styles.successText}>{order.successBanner}</Text>
        </View>
      ) : null}
      {order.trackable ? <Text style={styles.trackHint}>Tap to track live</Text> : null}
      <View style={styles.billRow}>
        <Text style={styles.billLabel}>View Bill</Text>
        <Icon name="chevron-forward" size={14} color={familyHome.blue} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.lg },
  stack: { gap: spacing.md },
  flex: { flex: 1 },
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
    borderRadius: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 148,
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
  heroImage: { width: 110, height: 110 },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DFF5E2',
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginTop: 4,
  },
  heroBadgeText: { ...typography.caption, color: familyHome.greenDark, fontWeight: '600', fontSize: 10 },

  stepGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stepCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 14,
    padding: spacing.md,
    gap: 4,
    alignItems: 'center',
    minHeight: 110,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: { ...typography.captionStrong, color: familyHome.text, textAlign: 'center' },
  stepLine: { ...typography.caption, color: familyHome.muted, textAlign: 'center', fontSize: 11, lineHeight: 15 },

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

  helpBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
  },
  helpTitle: { ...typography.bodyStrong, color: familyHome.blueDark },
  helpBody: { ...typography.caption, color: familyHome.text, marginTop: 2, lineHeight: 18 },

  memberTitleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberTitleWell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberTitle: { ...typography.title, color: '#123B7A' },
  memberSubtitle: { ...typography.caption, color: familyHome.muted },

  actionCards: { flexDirection: 'row', gap: spacing.sm },
  actionCard: { flex: 1, borderRadius: 16, padding: spacing.md, minHeight: 120, gap: spacing.sm },
  actionGreen: { backgroundColor: familyHome.greenSoft },
  actionBlue: { backgroundColor: familyHome.blueSoft },
  actionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { ...typography.captionStrong, color: '#123B7A' },
  actionBody: { ...typography.caption, color: familyHome.muted, fontSize: 11, lineHeight: 15 },

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
  sectionTitle: { ...typography.subtitle, color: '#123B7A' },
  link: { ...typography.captionStrong, color: familyHome.blue },

  orderCard: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTitle: { ...typography.bodyStrong, color: '#123B7A', marginTop: 4 },
  orderMeta: { ...typography.caption, color: familyHome.muted },
  orderDetail: { ...typography.caption, color: familyHome.text, marginTop: 4, lineHeight: 17 },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  statusPillText: { ...typography.captionStrong, fontSize: 11 },
  successBanner: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
    alignItems: 'flex-start',
  },
  successText: { ...typography.caption, color: familyHome.greenDark, flex: 1, lineHeight: 17 },
  trackHint: { ...typography.caption, color: familyHome.blue, marginTop: 4 },
  billRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  billLabel: { ...typography.captionStrong, color: familyHome.blue },

  noteBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'flex-start',
  },
  noteBody: { ...typography.caption, color: familyHome.text, flex: 1, lineHeight: 18 },

  empty: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  errorBanner: { backgroundColor: familyHome.redSoft, borderRadius: 12, padding: spacing.md },
  errorText: { ...typography.caption, color: familyHome.red },
});
