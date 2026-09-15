import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { cardSurface, colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { Icon, IconWell } from '@/components/ui';
import { LiveIndicator } from '@/components/premium';
import type { MemberDelivery } from '@/features/deliveries/types';
import { deliveryExecutiveDisplayName, isDeliveryTrackable, seniorDeliveryTrackHref } from '@/features/deliveries/selectors';
import { useDeliveryExecutiveLatestLocation } from '../hooks';
import { DELIVERY_NOT_SHARING_MESSAGE, DELIVERY_ON_THE_WAY_MESSAGE, LOCATION_FORBIDDEN_MESSAGE } from '../selectors';
import { formatLastUpdated, liveLocationStatus, mayClaimAssociateOnTheWay, parseMapCoordinate } from '../live';

interface TrackDeliveryCardProps {
  delivery: MemberDelivery;
}

export function TrackDeliveryCard({ delivery }: TrackDeliveryCardProps) {
  const latest = useDeliveryExecutiveLatestLocation(delivery.id, { focused: false });
  const trackable = isDeliveryTrackable(delivery);
  const status = liveLocationStatus({
    isFetching: latest.isFetching,
    error: latest.error,
    point: latest.data,
  });
  const name = deliveryExecutiveDisplayName(delivery);
  const coord = parseMapCoordinate(latest.data?.latitude, latest.data?.longitude);
  const onTheWay = trackable && mayClaimAssociateOnTheWay(status);
  const title = onTheWay ? DELIVERY_ON_THE_WAY_MESSAGE : `Track ${delivery.title}`;
  const lastUpdated = formatLastUpdated(latest.data?.timestamp);
  const subtitle = !trackable
    ? 'Your order is being prepared.'
    : status === 'forbidden'
      ? LOCATION_FORBIDDEN_MESSAGE
      : coord
        ? `${name}${lastUpdated ? ` · ${lastUpdated}` : ''}`
        : DELIVERY_NOT_SHARING_MESSAGE;

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(seniorDeliveryTrackHref(delivery.id) as Href)}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      accessibilityHint="Opens delivery live tracking map"
    >
      <IconWell tone={onTheWay ? 'safe' : 'accent'} size={48} rounded="full">
        <Icon name="bike" size={20} color={onTheWay ? colors.safe : colors.accent} />
      </IconWell>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {onTheWay ? <LiveIndicator label="LIVE" active /> : null}
        </View>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.action}>Track</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardSurface,
    backgroundColor: colors.accentSoft,
    padding: spacing.lg,
    minHeight: minTouchSize + 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  copy: { flex: 1 },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.bodyStrong, color: colors.text, flexShrink: 1 },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  action: { ...typography.captionStrong, color: colors.accent },
});
