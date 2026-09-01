import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { MONTHLY_BLOOD_STATUS } from './mockHealth';
import { MembershipServiceHero } from './MembershipServiceHero';

export function MonthlyBloodTestScreen() {
  const insets = useSafeAreaInsets();
  const status = MONTHLY_BLOOD_STATUS;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Monthly Blood Test" showBack showProfile={false} showBell={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MembershipServiceHero slug="monthly-blood-test" />
        <Text style={styles.hint}>One complete body test monthly · home sample collection</Text>

        <View style={styles.statusCard}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
              {status.kind === 'completed' ? 'Completed this month' : 'Pending'}
            </Text>
          </View>

          {status.kind === 'completed' ? (
            <>
              <Text style={styles.title}>{status.reportTitle}</Text>
              <Text style={styles.meta}>Completed · {status.completedOn}</Text>

              <View style={styles.reportBox}>
                <Icon name="document-text-outline" size={20} color={familyHome.green} />
                <View style={styles.reportText}>
                  <Text style={styles.reportTitle}>Report ready</Text>
                  <Text style={styles.reportSub}>Open full report on the dashboard</Text>
                </View>
              </View>

              <Text style={styles.section}>Doctor’s suggestion</Text>
              <Text style={styles.suggestion}>{status.doctorSuggestion}</Text>

              <Pressable
                style={styles.primaryCta}
                onPress={() => Alert.alert('Report', 'Report viewer will open when documents API is connected.')}
                accessibilityRole="button"
              >
                <Text style={styles.primaryCtaText}>View Report</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>Sample collection scheduled</Text>
              <Text style={styles.meta}>{status.scheduledAt}</Text>
              <Text style={styles.suggestion}>{status.collection}</Text>
              <Pressable
                style={styles.primaryCta}
                onPress={() => Alert.alert('Reminder set', 'You will be reminded before the collection window.')}
                accessibilityRole="button"
              >
                <Text style={styles.primaryCtaText}>View Schedule</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
  hint: { ...typography.caption, color: familyHome.muted },
  statusCard: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 18,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: familyHome.greenSoft,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginBottom: spacing.xs,
  },
  statusBadgeText: { ...typography.captionStrong, color: familyHome.greenDark },
  title: { ...typography.title, color: familyHome.text },
  meta: { ...typography.caption, color: familyHome.muted },
  reportBox: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: familyHome.greenSoft,
    borderRadius: 14,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  reportText: { flex: 1, gap: 2 },
  reportTitle: { ...typography.bodyStrong, color: familyHome.text },
  reportSub: { ...typography.caption, color: familyHome.muted },
  section: { ...typography.subtitle, color: familyHome.text, marginTop: spacing.md },
  suggestion: { ...typography.body, color: familyHome.muted, lineHeight: 22 },
  primaryCta: {
    marginTop: spacing.lg,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: { ...typography.bodyStrong, color: familyHome.white },
});
