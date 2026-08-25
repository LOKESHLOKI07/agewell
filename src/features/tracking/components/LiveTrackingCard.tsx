import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { ErrorState } from '@/components';
import { colors, minTouchSize, spacing, typography, cardSurface } from '@/constants/theme';
import { Icon, IconWell } from '@/components/ui';
import { LiveIndicator, StatusPill } from '@/components/premium';
import { useOwnViewerLocation } from '../hooks';
import { trackingHref } from '../selectors';
import { homeTrackingCopy, parseSavedHomeCoordinate } from '../live';
import { useTrackingShareStore } from '../shareStore';
import { useI18n } from '@/i18n';

type LiveTrackingCardProps = {
  /** Senior address field — only shown as Home when it is lat,lng coordinates. */
  homeAddress?: string | null;
};

export function LiveTrackingCard({ homeAddress }: LiveTrackingCardProps = {}) {
  const { t } = useI18n();
  const viewer = useOwnViewerLocation();
  const isSharing = useTrackingShareStore((state) => state.isSharing);
  const copy = homeTrackingCopy({ isSharing, state: viewer.state });
  const savedHome = parseSavedHomeCoordinate(homeAddress);
  const liveActive = isSharing || copy.title === 'Live Location Active';

  if (viewer.state.kind === 'error' && !isSharing) {
    return (
      <View style={styles.container}>
        <ErrorState
          title={t('tracking.unavailable')}
          message={viewer.state.message}
          onRetry={() => {
            void viewer.sessions.refetch();
            void viewer.latest.refetch();
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.card}
        onPress={() => router.push(trackingHref() as Href)}
        accessibilityRole="button"
        accessibilityLabel={`${liveActive ? t('tracking.liveLocationActive') : t('tracking.startLiveLocation')}. ${copy.subtitle}`}
        accessibilityHint={copy.action}
      >
        <IconWell tone="accent" size={48} rounded="full">
          <Icon name="navigate" size={20} color={colors.accent} />
        </IconWell>
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>
              {liveActive ? t('tracking.liveLocationActive') : t('tracking.startLiveLocation')}
            </Text>
            {liveActive ? <LiveIndicator label="LIVE" active /> : null}
          </View>
          <StatusPill label={t('tracking.liveLabel')} tone="accent" iconLabel="GPS" />
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </View>
        <Text style={styles.actionText}>{liveActive ? t('tracking.viewLocation') : t('common.start')}</Text>
      </Pressable>

      {savedHome ? (
        <View
          style={styles.homeCard}
          accessibilityRole="text"
          accessibilityLabel={`${t('tracking.homeLabel')}. ${savedHome.latitude}, ${savedHome.longitude}`}
        >
          <IconWell tone="primary" size={44} rounded="full">
            <Icon name="home-outline" size={18} color={colors.primary} />
          </IconWell>
          <View style={styles.homeCopy}>
            <Text style={styles.homeTitle}>{t('tracking.homeLabel')}</Text>
            <Text style={styles.homeSubtitle}>{t('tracking.homeStatic')}</Text>
            <Text style={styles.homeCoords}>
              {savedHome.latitude.toFixed(5)}, {savedHome.longitude.toFixed(5)}
            </Text>
          </View>
          <StatusPill label="HOME" tone="primary" iconLabel="📍" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  card: {
    ...cardSurface,
    backgroundColor: colors.accentSoft,
    padding: spacing.lg,
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  textContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
    flexShrink: 1,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  actionText: {
    ...typography.captionStrong,
    color: colors.accent,
  },
  homeCard: {
    ...cardSurface,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: minTouchSize,
  },
  homeCopy: {
    flex: 1,
    gap: 2,
  },
  homeTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  homeSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  homeCoords: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
