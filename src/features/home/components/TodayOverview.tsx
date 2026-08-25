import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router, type Href } from 'expo-router';
import { colors, typography, spacing, minTouchSize } from '@/constants/theme';
import { SectionTitle } from '@/components/ui';
import { EmptyState } from '@/components';
import { ScheduleCard } from '@/components/premium';
import type { HomeSectionState, TodayCareItem } from '../types/home';
import { HomeInlineError, HomeSkeletonRow } from './HomeInlineStatus';
import { useI18n } from '@/i18n';

type TodayOverviewProps = {
  userName: string | null;
  nameState: HomeSectionState;
  nameError: unknown;
  onRetryName: () => void;
  items: TodayCareItem[];
  todayState: HomeSectionState;
  todayError: unknown;
  onRetryToday: () => void;
};

export function TodayOverview({
  userName,
  nameState,
  nameError,
  onRetryName,
  items,
  todayState,
  todayError,
  onRetryToday,
}: TodayOverviewProps) {
  const { t } = useI18n();
  const preview = items.slice(0, 4);
  const firstName = userName?.split(' ')[0] ?? null;

  return (
    <View style={styles.container}>
      {nameState === 'loading' ? (
        <View style={styles.greetingSkeleton} accessibilityLabel={t('common.loading')}>
          <View style={styles.greetingBar} />
        </View>
      ) : nameState === 'error' ? (
        <HomeInlineError error={nameError} onRetry={onRetryName} />
      ) : (
        <Text style={styles.carePlan}>
          {firstName ? t('home.carePlanNamed').replace('{name}', firstName) : t('home.carePlan')}
        </Text>
      )}

      <SectionTitle
        title={t('home.todaysCare')}
        subtitle={t('home.todaysCareSubtitle')}
        actionLabel={items.length > 0 ? t('home.viewFullSchedule') : undefined}
        onAction={items.length > 0 ? () => router.push('/schedule' as Href) : undefined}
      />

      {todayState === 'loading' ? (
        <View style={styles.list}>
          <HomeSkeletonRow />
          <HomeSkeletonRow />
        </View>
      ) : todayState === 'error' && items.length === 0 ? (
        <HomeInlineError error={todayError} onRetry={onRetryToday} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title={t('home.noCareTodayTitle')}
          message={t('home.noCareToday')}
          actionLabel={t('home.viewFullSchedule')}
          onAction={() => router.push('/schedule' as Href)}
        />
      ) : (
        <View style={styles.list}>
          {preview.map((item) => (
            <ScheduleCard
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              status={item.status}
              icon={item.icon}
              onPress={item.href ? () => router.push(item.href as Href) : undefined}
            />
          ))}
          <Pressable
            style={styles.more}
            onPress={() => router.push('/schedule' as Href)}
            accessibilityRole="button"
            accessibilityLabel={t('home.viewFullSchedule')}
          >
            <Text style={styles.moreText}>
              {items.length > preview.length
                ? `${t('home.viewFullSchedule')} (${items.length})`
                : t('home.viewFullSchedule')}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  carePlan: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  greetingSkeleton: {
    height: 24,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  greetingBar: {
    height: 16,
    width: '75%',
    backgroundColor: colors.border,
    borderRadius: 8,
  },
  list: {
    gap: spacing.md,
  },
  more: {
    minHeight: minTouchSize,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  moreText: {
    ...typography.captionStrong,
    color: colors.primary,
  },
});
