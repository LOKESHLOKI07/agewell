import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { useMemberDeliveries } from '@/features/deliveries/hooks';
import {
  findDeliveryForRequest,
  isDeliveryTrackable,
  seniorDeliveryTrackHref,
} from '@/features/deliveries/selectors';
import type { MemberDelivery } from '@/features/deliveries/types';
import { staffDeliveryStatusPresentation } from '@/features/care/staffHomeModel';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { useServiceRequests } from '@/features/home/hooks/queries';
import { humanizeStatus } from '@/features/home/selectors/homeViewModel';
import { useTabScreenBottomPad } from '@/utils/safeBottom';

const ORDER_SLUGS = new Set(['grocery', 'food', 'medicine', 'pooja']);

/** Member Orders tab — shows service requests with live delivery tracking when available. */
export function OrdersPlaceholderScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const query = useServiceRequests();
  const deliveriesQuery = useMemberDeliveries();
  const items = query.data?.items ?? [];
  const deliveries = deliveriesQuery.data?.items ?? [];
  const orders = items.filter((item) => item.serviceSlug && ORDER_SLUGS.has(item.serviceSlug));
  const requests = items.filter((item) => !item.serviceSlug || !ORDER_SLUGS.has(item.serviceSlug));
  const liveDeliveries = deliveries.filter((item) => isDeliveryTrackable(item));

  const onRefresh = () => {
    void Promise.all([query.refetch(), deliveriesQuery.refetch()]);
  };

  const openTrack = (delivery: MemberDelivery) => {
    router.push(seniorDeliveryTrackHref(delivery.id) as Href);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Orders" showBack={false} showProfile showBell={false} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        refreshControl={
          <RefreshControl
            refreshing={query.isFetching || deliveriesQuery.isFetching}
            onRefresh={onRefresh}
            tintColor={familyHome.green}
          />
        }
      >
        <Text style={styles.hint}>
          Grocery, food, and medicine orders appear here. When a delivery is en route, tap Track live to open the map.
        </Text>

        {deliveriesQuery.isError ? (
          <Pressable style={styles.errorBanner} onPress={() => void deliveriesQuery.refetch()}>
            <Text style={styles.errorText}>Could not load live deliveries. Tap to retry.</Text>
          </Pressable>
        ) : null}

        {liveDeliveries.length > 0 ? (
          <View style={styles.liveSection}>
            <Text style={styles.section}>Live now</Text>
            {liveDeliveries.map((delivery) => (
              <Pressable
                key={delivery.id}
                onPress={() => openTrack(delivery)}
                style={({ pressed }) => [styles.liveCard, pressed ? styles.pressed : null]}
                accessibilityRole="button"
                accessibilityLabel={`Track ${delivery.title} live`}
              >
                <View style={styles.liveIcon}>
                  <Icon name="navigate" size={22} color={familyHome.white} />
                </View>
                <View style={styles.body}>
                  <Text style={styles.liveTitle}>{delivery.title} · En Route</Text>
                  <Text style={styles.meta}>
                    {delivery.executiveName ? `${delivery.executiveName} · ` : ''}Tap to track on map
                  </Text>
                </View>
                <Text style={styles.liveCta}>Track live</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text style={styles.section}>Orders</Text>
        {orders.length === 0 ? (
          <Text style={styles.empty}>No grocery / food / medicine / pooja orders yet.</Text>
        ) : (
          orders.map((item) => {
            const delivery = findDeliveryForRequest(item, deliveries);
            const trackable = isDeliveryTrackable(delivery);
            const statusLabel = delivery
              ? staffDeliveryStatusPresentation(delivery.status).label
              : humanizeStatus(item.status);
            return (
              <View key={item.id} style={styles.row}>
                <View style={styles.iconWell}>
                  <Icon name="cart-outline" size={18} color={familyHome.green} />
                </View>
                <View style={styles.body}>
                  <Text style={styles.title}>{item.serviceName}</Text>
                  <Text style={styles.meta}>{item.notes ?? 'No notes'}</Text>
                  {delivery?.executiveName ? (
                    <Text style={styles.meta}>With {delivery.executiveName}</Text>
                  ) : null}
                </View>
                <View style={styles.actions}>
                  <Text style={[styles.status, trackable ? styles.statusLive : null]}>{statusLabel}</Text>
                  {delivery ? (
                    <Pressable
                      onPress={() => openTrack(delivery)}
                      accessibilityRole="button"
                      accessibilityLabel={
                        trackable ? `Track ${item.serviceName} delivery live` : `View ${item.serviceName} delivery`
                      }
                      style={({ pressed }) => [styles.trackBtn, pressed ? styles.pressed : null]}
                    >
                      <Icon name="navigate" size={14} color={familyHome.green} />
                      <Text style={styles.trackLabel}>{trackable ? 'Track live' : 'View map'}</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })
        )}

        <Text style={styles.section}>Other requests</Text>
        {requests.length === 0 ? (
          <Text style={styles.empty}>No other service requests yet.</Text>
        ) : (
          requests.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={[styles.iconWell, { backgroundColor: familyHome.blueSoft }]}>
                <Icon name="clipboard-outline" size={18} color={familyHome.blue} />
              </View>
              <View style={styles.body}>
                <Text style={styles.title}>{item.serviceName}</Text>
                <Text style={styles.meta}>{item.notes ?? 'No notes'}</Text>
              </View>
              <Text style={styles.status}>{humanizeStatus(item.status)}</Text>
            </View>
          ))
        )}

        <Pressable
          style={styles.link}
          onPress={() => router.push('/(tabs)/services' as Href)}
          accessibilityRole="button"
        >
          <Text style={styles.linkText}>Browse services →</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, gap: spacing.md },
  hint: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  section: { ...typography.subtitle, color: familyHome.text, marginTop: spacing.sm },
  empty: { ...typography.caption, color: familyHome.muted },
  errorBanner: {
    borderRadius: 12,
    backgroundColor: familyHome.orangeSoft,
    padding: spacing.md,
  },
  errorText: { ...typography.captionStrong, color: familyHome.orange },
  liveSection: { gap: spacing.sm },
  liveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 16,
    backgroundColor: familyHome.green,
    padding: spacing.lg,
  },
  liveIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveTitle: { ...typography.bodyStrong, color: familyHome.white },
  liveCta: { ...typography.captionStrong, color: familyHome.white },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.lg,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  title: { ...typography.bodyStrong, color: familyHome.text },
  meta: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  actions: { alignItems: 'flex-end', gap: spacing.sm, maxWidth: 100 },
  status: { ...typography.captionStrong, color: familyHome.greenDark, textAlign: 'right' },
  statusLive: { color: familyHome.orange },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    backgroundColor: familyHome.greenSoft,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  trackLabel: { ...typography.captionStrong, color: familyHome.green, fontSize: 11 },
  pressed: { opacity: 0.9 },
  link: { marginTop: spacing.md, minHeight: 44, justifyContent: 'center' },
  linkText: { ...typography.bodyStrong, color: familyHome.green },
});
