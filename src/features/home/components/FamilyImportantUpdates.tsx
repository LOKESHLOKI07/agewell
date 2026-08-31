import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { spacing, typography } from '@/constants/theme';
import type { Visit } from '@/features/home/types/home';
import { FamilyHomeCardShell, FamilyHomeIconWell, FamilyHomeSectionHeader } from './FamilyHomePrimitives';
import { familyHome } from './familyHomeTheme';

function formatVisitWhen(iso: string | null): string {
  if (!iso) {
    return 'Schedule pending';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Schedule pending';
  }
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface FamilyImportantUpdatesProps {
  parentStatusTitle: string;
  parentStatusSubtitle: string;
  updatedLabel: string;
  nextVisit: Visit | null;
  onOpenHealth: () => void;
  onOpenVisits: () => void;
  statusEyebrow?: string;
  notificationsHref?: Href;
}

export function FamilyImportantUpdates({
  parentStatusTitle,
  parentStatusSubtitle,
  updatedLabel,
  nextVisit,
  onOpenHealth,
  onOpenVisits,
  statusEyebrow = 'Your Status',
  notificationsHref = '/notifications' as Href,
}: FamilyImportantUpdatesProps) {
  return (
    <View style={styles.section}>
      <FamilyHomeSectionHeader
        title="Important Updates"
        actionLabel="View All"
        onAction={() => router.push(notificationsHref)}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <FamilyHomeCardShell background={familyHome.greenCard} onPress={onOpenHealth} style={styles.card}>
          <View style={styles.cardTop}>
            <FamilyHomeIconWell
              name="shield-checkmark-outline"
              color={familyHome.green}
              background={familyHome.white}
            />
            <View style={styles.dotGood} />
          </View>
          <Text style={styles.cardEyebrow}>{statusEyebrow}</Text>
          <Text style={styles.cardTitle}>{parentStatusTitle}</Text>
          <Text style={styles.cardMeta}>{updatedLabel}</Text>
          <Text style={styles.cardLink}>View Details ›</Text>
        </FamilyHomeCardShell>

        <FamilyHomeCardShell background={familyHome.blueSoft} onPress={onOpenVisits} style={styles.card}>
          <FamilyHomeIconWell name="calendar-outline" color={familyHome.blue} background={familyHome.white} />
          <Text style={styles.cardEyebrow}>Upcoming Visit</Text>
          <Text style={styles.cardTitle}>
            {nextVisit ? nextVisit.careManagerName || 'Care Manager Visit' : 'No visit scheduled'}
          </Text>
          <Text style={styles.cardMeta}>{nextVisit ? formatVisitWhen(nextVisit.scheduledAt) : parentStatusSubtitle}</Text>
          <Text style={styles.cardLink}>View Schedule ›</Text>
        </FamilyHomeCardShell>

        <FamilyHomeCardShell
          background={familyHome.orangeSoft}
          onPress={() => router.push('/addons' as Href)}
          style={styles.card}
        >
          <FamilyHomeIconWell name="restaurant-outline" color={familyHome.orange} background={familyHome.white} />
          <Text style={styles.cardEyebrow}>Upcoming Delivery</Text>
          <Text style={styles.cardTitle}>Lunch</Text>
          <Text style={styles.cardMeta}>Track meal and grocery deliveries here.</Text>
          <Text style={styles.cardLink}>Track Order ›</Text>
        </FamilyHomeCardShell>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.xl,
  },
  row: {
    gap: spacing.md,
    paddingRight: spacing.md,
  },
  card: {
    width: 220,
    minHeight: 168,
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotGood: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: familyHome.green,
  },
  cardEyebrow: {
    ...typography.captionStrong,
    color: familyHome.muted,
    marginTop: 4,
  },
  cardTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: familyHome.text,
  },
  cardMeta: {
    ...typography.caption,
    color: familyHome.muted,
  },
  cardLink: {
    ...typography.captionStrong,
    color: familyHome.green,
    marginTop: 4,
  },
});
