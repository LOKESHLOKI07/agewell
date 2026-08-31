import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { NavCard, PrimaryButton } from '@/components';
import { colors, spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { queryClient } from '@/api/queryClient';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';
import { useTabScreenBottomPad } from '@/utils/safeBottom';
import { HEALTH_OVERVIEW_LINKS } from './selectors';
import { healthQueryKeys } from './queryKeys';

export function HealthScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const bottomPad = useTabScreenBottomPad(spacing.xxxl);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: healthQueryKeys.medications }),
        queryClient.invalidateQueries({ queryKey: healthQueryKeys.medicationSchedules }),
        queryClient.invalidateQueries({ queryKey: healthQueryKeys.medicalRecords }),
        queryClient.invalidateQueries({ queryKey: healthQueryKeys.labResults }),
        queryClient.invalidateQueries({ queryKey: healthQueryKeys.documents }),
        queryClient.invalidateQueries({ queryKey: healthQueryKeys.providers }),
        queryClient.invalidateQueries({ queryKey: healthQueryKeys.appointments }),
        queryClient.invalidateQueries({ queryKey: homeQueryKeys.seniorMe }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      <AgeWellHeader title="My Health" showProfile={true} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.primary} />
        }
      >
        <Text style={styles.sectionTitle}>Health Dashboard</Text>
        <Text style={styles.intro}>Choose a section to see your health records.</Text>

        {HEALTH_OVERVIEW_LINKS.map((item) => (
          <NavCard
            key={item.key}
            icon={item.icon}
            title={item.title}
            subtitle={item.subtitle}
            tone={item.tone}
            onPress={() => router.push(item.href as Href)}
            accessibilityHint={item.accessibilityHint}
          />
        ))}

        <View style={styles.cta}>
          <PrimaryButton
            label="View reports"
            onPress={() => router.push('/health/documents' as Href)}
            accessibilityHint="Opens health documents on file"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
  },
  intro: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  cta: {
    marginTop: spacing.lg,
  },
});
