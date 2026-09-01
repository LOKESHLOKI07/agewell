import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { useServiceRequests } from '@/features/home/hooks/queries';
import { humanizeStatus } from '@/features/home/selectors/homeViewModel';
import { useTabScreenBottomPad } from '@/utils/safeBottom';

const ORDER_SLUGS = new Set(['grocery', 'food', 'medicine', 'pooja']);

/** Member Orders tab — shows real service requests (order + request types). */
export function OrdersPlaceholderScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const query = useServiceRequests();
  const items = query.data?.items ?? [];
  const orders = items.filter((item) => item.serviceSlug && ORDER_SLUGS.has(item.serviceSlug));
  const requests = items.filter((item) => !item.serviceSlug || !ORDER_SLUGS.has(item.serviceSlug));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Orders" showBack={false} showProfile showBell={false} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        refreshControl={
          <RefreshControl
            refreshing={query.isFetching}
            onRefresh={() => void query.refetch()}
            tintColor={familyHome.green}
          />
        }
      >
        <Text style={styles.hint}>
          Grocery, food, medicine and other requests you submit appear here for tracking.
        </Text>

        <Text style={styles.section}>Orders</Text>
        {orders.length === 0 ? (
          <Text style={styles.empty}>No grocery / food / medicine / pooja orders yet.</Text>
        ) : (
          orders.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={styles.iconWell}>
                <Icon name="cart-outline" size={18} color={familyHome.green} />
              </View>
              <View style={styles.body}>
                <Text style={styles.title}>{item.serviceName}</Text>
                <Text style={styles.meta}>{item.notes ?? 'No notes'}</Text>
              </View>
              <Text style={styles.status}>{humanizeStatus(item.status)}</Text>
            </View>
          ))
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
  status: { ...typography.captionStrong, color: familyHome.greenDark, maxWidth: 90, textAlign: 'right' },
  link: { marginTop: spacing.md, minHeight: 44, justifyContent: 'center' },
  linkText: { ...typography.bodyStrong, color: familyHome.green },
});
