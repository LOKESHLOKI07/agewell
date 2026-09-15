import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingState } from '@/components';
import { Icon } from '@/components/ui';
import { queryClient } from '@/api/queryClient';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';
import { useServiceRequests } from '@/features/home/hooks/queries';
import { useHealthDocuments, useLabResults } from '@/features/health/hooks';
import { healthQueryKeys } from '@/features/health/queryKeys';
import { MembershipServiceHero } from './MembershipServiceHero';
import { gatedMembershipScreen } from './MembershipServiceGate';
import {
  toMonthlyBloodStatusView,
  type MonthlyBloodStatusView,
} from './monthlyBloodModel';
import { useMembershipSubmit } from './useMembershipSubmit';

const EXTRA_TESTS = ['LFT', 'KFT', 'Lipid profile', 'Thyroid', 'Urine routine'] as const;

export const MonthlyBloodTestScreen = gatedMembershipScreen(
  'monthly-blood-test',
  'Monthly Blood Test',
  MonthlyBloodTestLive,
);

function MonthlyBloodTestLive() {
  const insets = useSafeAreaInsets();
  const labsQuery = useLabResults();
  const docsQuery = useHealthDocuments();
  const requestsQuery = useServiceRequests();
  const [extra, setExtra] = useState<(typeof EXTRA_TESTS)[number] | null>(null);
  const { submitting, submit } = useMembershipSubmit('monthly-blood-test');

  const status = toMonthlyBloodStatusView({
    requests: requestsQuery.data?.items ?? [],
    labs: labsQuery.data?.items ?? [],
    documents: docsQuery.data?.items ?? [],
  });
  const loading = labsQuery.isPending || docsQuery.isPending || requestsQuery.isPending;

  const refresh = () =>
    void Promise.all([labsQuery.refetch(), docsQuery.refetch(), requestsQuery.refetch()]);

  const onRequestCbc = () => {
    void (async () => {
      const ok = await submit(
        'Monthly CBC · home sample collection',
        'Monthly blood test requested',
      );
      if (ok) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: homeQueryKeys.serviceRequests }),
          queryClient.invalidateQueries({ queryKey: healthQueryKeys.labResults }),
          refresh(),
        ]);
      }
    })();
  };

  const onRequestExtra = () => {
    if (!extra) {
      Alert.alert('Select a test', 'Choose an extra test such as LFT, KFT, lipid profile, thyroid or urine routine.');
      return;
    }
    void (async () => {
      const ok = await submit(`Extra test: ${extra} (charges apply)`, 'Extra blood test requested');
      if (ok) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: homeQueryKeys.serviceRequests }),
          refresh(),
        ]);
      }
    })();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Monthly Blood Test" showBack showProfile={false} showBell={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MembershipServiceHero slug="monthly-blood-test" />
        <Text style={styles.hint}>
          One CBC every month with home sample collection and reports in the app. LFT, KFT, lipid profile, thyroid and
          urine routine are available at extra charges.
        </Text>

        {loading ? <LoadingState message="Loading blood test status..." /> : <StatusCard status={status} />}

        {status.kind === 'idle' && !loading ? (
          <Pressable
            style={[styles.primaryCta, submitting ? styles.disabled : null]}
            onPress={onRequestCbc}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityState={{ disabled: submitting, busy: submitting }}
          >
            <Text style={styles.primaryCtaText}>{submitting ? 'Sending…' : 'Request monthly CBC'}</Text>
          </Pressable>
        ) : null}

        <Text style={styles.section}>Extra tests (charges apply)</Text>
        <View style={styles.extraList}>
          {EXTRA_TESTS.map((item) => {
            const active = extra === item;
            return (
              <Pressable
                key={item}
                onPress={() => setExtra(item)}
                style={[styles.extraRow, active ? styles.extraRowActive : null]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <Text style={styles.extraTitle}>{item}</Text>
                {active ? <Icon name="checkmark-circle-outline" size={20} color={familyHome.green} /> : <View style={styles.radio} />}
              </Pressable>
            );
          })}
        </View>
        <Pressable
          style={[styles.primaryCta, submitting ? styles.disabled : null]}
          onPress={onRequestExtra}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityState={{ disabled: submitting, busy: submitting }}
        >
          <Text style={styles.primaryCtaText}>{submitting ? 'Sending…' : 'Request extra test'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function StatusCard({ status }: { status: MonthlyBloodStatusView }) {
  if (status.kind === 'idle') {
    return (
      <View style={styles.statusCard}>
        <View style={[styles.statusBadge, styles.statusBadgeMuted]}>
          <Text style={[styles.statusBadgeText, styles.statusBadgeTextMuted]}>CBC not scheduled</Text>
        </View>
        <Text style={styles.title}>{status.title}</Text>
        <Text style={styles.suggestion}>{status.body}</Text>
      </View>
    );
  }

  if (status.kind === 'pending') {
    return (
      <View style={styles.statusCard}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>CBC pending</Text>
        </View>
        <Text style={styles.title}>CBC sample collection scheduled</Text>
        <Text style={styles.meta}>{status.scheduledAt}</Text>
        <Text style={styles.suggestion}>{status.collection}</Text>
        <Pressable
          style={styles.primaryCta}
          onPress={() => router.push(status.href as Href)}
          accessibilityRole="button"
        >
          <Text style={styles.primaryCtaText}>View Schedule</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.statusCard}>
      <View style={styles.statusBadge}>
        <Text style={styles.statusBadgeText}>CBC completed this month</Text>
      </View>
      <Text style={styles.title}>{status.reportTitle}</Text>
      <Text style={styles.meta}>Completed · {status.completedOn}</Text>

      <View style={styles.reportBox}>
        <Icon name="document-text-outline" size={20} color={familyHome.green} />
        <View style={styles.reportText}>
          <Text style={styles.reportTitle}>Report ready</Text>
          <Text style={styles.reportSub}>Open full report on the dashboard</Text>
        </View>
      </View>

      {status.doctorSuggestion ? (
        <>
          <Text style={styles.section}>Doctor’s suggestion</Text>
          <Text style={styles.suggestion}>{status.doctorSuggestion}</Text>
        </>
      ) : null}

      <Pressable
        style={styles.primaryCta}
        onPress={() => router.push(status.href as Href)}
        accessibilityRole="button"
      >
        <Text style={styles.primaryCtaText}>View Report</Text>
      </Pressable>
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
  statusBadgeMuted: { backgroundColor: familyHome.blueSoft },
  statusBadgeText: { ...typography.captionStrong, color: familyHome.greenDark },
  statusBadgeTextMuted: { color: familyHome.blueDark },
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
  extraList: { gap: spacing.sm },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.lg,
  },
  extraRowActive: {
    borderColor: familyHome.green,
    backgroundColor: familyHome.greenSoft,
  },
  extraTitle: { ...typography.bodyStrong, color: familyHome.text },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: familyHome.border,
  },
  disabled: { opacity: 0.7 },
});
