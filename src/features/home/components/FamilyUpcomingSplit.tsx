import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Icon, type IconName } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { useCommunityEvents } from '@/features/community/hooks';
import { communityEventHref } from '@/features/community/selectors';
import {
  formatEventWhen,
  shortOrderId,
  upcomingCommunityEvents,
  upcomingDeliveries,
} from '@/features/home/memberHome';
import { humanizeStatus } from '@/features/home/selectors/homeViewModel';
import type { ServiceRequest } from '@/features/home/types/home';
import { familyHome } from './familyHomeTheme';

function deliveryIcon(slug: string | null): IconName {
  if (slug === 'food') {
    return 'restaurant-outline';
  }
  if (slug === 'medicine') {
    return 'pill';
  }
  return 'cart-outline';
}

export function FamilyUpcomingSplit({ requests }: { requests: ServiceRequest[] }) {
  const eventsQuery = useCommunityEvents();
  const deliveries = upcomingDeliveries(requests);
  const events = upcomingCommunityEvents(eventsQuery.data?.items ?? []);
  const showDeliveries = deliveries.length > 0;
  const showEvents = events.length > 0;

  if (!showDeliveries && !showEvents) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.columns}>
        {showDeliveries ? (
          <View style={styles.column}>
            <View style={styles.headerRow}>
              <Text style={styles.heading}>Upcoming Deliveries</Text>
            </View>
            {deliveries.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push('/(tabs)/orders' as Href)}
                accessibilityRole="button"
                accessibilityLabel={`${item.serviceName}, ${humanizeStatus(item.status)}`}
                style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
              >
                <View style={[styles.iconWell, { backgroundColor: familyHome.greenSoft }]}>
                  <Icon name={deliveryIcon(item.serviceSlug)} size={16} color={familyHome.green} />
                </View>
                <View style={styles.body}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.serviceName}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    Order ID: {shortOrderId(item.id)}
                  </Text>
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>{humanizeStatus(item.status)}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {showEvents ? (
          <View style={styles.column}>
            <View style={styles.headerRow}>
              <Text style={styles.heading}>Upcoming Events</Text>
              <Pressable
                onPress={() => router.push('/(tabs)/community' as Href)}
                accessibilityRole="button"
                accessibilityLabel="View all events"
              >
                <Text style={styles.viewAll}>View All ›</Text>
              </Pressable>
            </View>
            {events.map((event) => (
              <Pressable
                key={event.id}
                onPress={() => router.push(communityEventHref(event.id) as unknown as Href)}
                accessibilityRole="button"
                accessibilityLabel={event.title ?? 'Community event'}
                style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
              >
                <View style={[styles.iconWell, { backgroundColor: familyHome.orangeSoft }]}>
                  <Icon name="calendar-star" size={16} color={familyHome.orange} />
                </View>
                <View style={styles.body}>
                  <Text style={styles.title} numberOfLines={1}>
                    {event.title ?? 'Community event'}
                  </Text>
                  <Text style={styles.meta} numberOfLines={2}>
                    {formatEventWhen(event.eventDate)}
                  </Text>
                  {event.capacity != null ? (
                    <Text style={styles.seats}>Seats: {event.capacity}</Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.xl,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  column: {
    flex: 1,
    minWidth: 0,
  },
  heading: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: familyHome.text,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  viewAll: {
    ...typography.captionStrong,
    color: familyHome.green,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: familyHome.white,
  },
  iconWell: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...typography.captionStrong,
    color: familyHome.text,
  },
  meta: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 10,
    lineHeight: 14,
  },
  pill: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: familyHome.greenSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillText: {
    ...typography.captionStrong,
    color: familyHome.greenDark,
    fontSize: 10,
  },
  seats: {
    ...typography.captionStrong,
    color: familyHome.orange,
    fontSize: 10,
  },
  pressed: {
    opacity: 0.92,
  },
});
