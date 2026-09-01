import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { parseOfferingMeta } from './catalogTypes';
import { MembershipServiceHero } from './MembershipServiceHero';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useServiceOfferings } from './useCatalog';

export function EventsTripsScreen() {
  const insets = useSafeAreaInsets();
  const { submitting, submit } = useMembershipSubmit('events-trips');
  const catalog = useServiceOfferings('events-trips');
  const items = catalog.data ?? [];

  const onBook = (title: string, cost: string, when: string) => {
    void submit(`Book interest: ${title} · ${when} · ${cost}`, 'Booking interest noted');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Events & Trips" showBack showProfile={false} showBell={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MembershipServiceHero slug="events-trips" />
        <Text style={styles.hint}>
          Interest-based local events · one nearby outing arranged monthly · members get first priority
        </Text>
        {catalog.isPending ? <Text style={styles.hint}>Loading events…</Text> : null}
        {catalog.isError ? (
          <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
            <Text style={styles.retry}>Unable to load · Tap to retry</Text>
          </Pressable>
        ) : null}

        {items.map((item) => {
          const meta = parseOfferingMeta(item.metaJson);
          const kind = meta.kind === 'trip' ? 'trip' : 'event';
          const when = meta.when ?? '';
          const place = meta.place ?? '';
          return (
            <View key={item.id} style={styles.card}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.image} accessibilityLabel={`${item.title} image`} />
              ) : null}
              <View style={styles.badgeRow}>
                <View style={[styles.kindBadge, kind === 'trip' ? styles.tripBadge : null]}>
                  <Text style={styles.kindBadgeText}>{kind === 'trip' ? 'Trip' : 'Local event'}</Text>
                </View>
                <Text style={styles.interest}>{item.badge}</Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              {when ? (
                <View style={styles.metaRow}>
                  <Icon name="calendar-outline" size={14} color={familyHome.muted} />
                  <Text style={styles.meta}>{when}</Text>
                </View>
              ) : null}
              {place ? (
                <View style={styles.metaRow}>
                  <Icon name="location" size={14} color={familyHome.muted} />
                  <Text style={styles.meta}>{place}</Text>
                </View>
              ) : null}
              <Text style={styles.itinerary}>{item.description}</Text>
              <View style={styles.footer}>
                <Text style={styles.cost}>{item.priceLabel || '—'}</Text>
                <Pressable
                  style={[styles.bookBtn, submitting ? { opacity: 0.6 } : null]}
                  onPress={() => onBook(item.title, item.priceLabel, when)}
                  disabled={submitting}
                  accessibilityRole="button"
                  accessibilityLabel={`Book ${item.title}`}
                >
                  <Text style={styles.bookLabel}>{submitting ? '…' : 'Book Now'}</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
  hint: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  retry: { ...typography.captionStrong, color: familyHome.green },
  card: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  image: { width: '100%', height: 140, borderRadius: 12, backgroundColor: familyHome.border, marginBottom: spacing.xs },
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kindBadge: {
    backgroundColor: familyHome.redSoft,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  tripBadge: { backgroundColor: familyHome.blueSoft },
  kindBadgeText: { ...typography.captionStrong, color: familyHome.text },
  interest: { ...typography.caption, color: familyHome.muted },
  title: { ...typography.subtitle, color: familyHome.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { ...typography.caption, color: familyHome.muted, flex: 1 },
  itinerary: { ...typography.caption, color: familyHome.text, lineHeight: 18 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  cost: { ...typography.bodyStrong, color: familyHome.greenDark },
  bookBtn: {
    backgroundColor: familyHome.green,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  bookLabel: { ...typography.captionStrong, color: familyHome.white },
});
