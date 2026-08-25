import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { cardSurface, colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { Icon, IconWell } from '@/components/ui';
import { LiveIndicator } from '@/components/premium';
import type { Visit } from '@/features/home/types/home';
import { useCareAssociateLatestLocation } from '../hooks';
import {
  ASSOCIATE_NOT_ASSIGNED_MESSAGE,
  ASSOCIATE_NOT_SHARING_MESSAGE,
  ASSOCIATE_ON_THE_WAY_MESSAGE,
  LOCATION_FORBIDDEN_MESSAGE,
} from '../selectors';
import {
  associateDisplayName,
  formatLastUpdated,
  liveLocationStatus,
  mayClaimAssociateOnTheWay,
  parseMapCoordinate,
  visitHasAssignedAssociate,
  visitTimeLine,
} from '../live';

interface TrackCareAssociateCardProps {
  visit: Visit | null | undefined;
  href: Href;
  emptyHref?: Href;
  title?: string;
  actionLabel?: string;
}

export function TrackCareAssociateCard({ visit, href, emptyHref, title, actionLabel }: TrackCareAssociateCardProps) {
  const latest = useCareAssociateLatestLocation(visit?.id, { focused: false });
  const assigned = visitHasAssignedAssociate(visit);
  const status = liveLocationStatus({
    isFetching: latest.isFetching,
    error: latest.error,
    point: latest.data,
  });
  const name = associateDisplayName(visit);
  const coord = parseMapCoordinate(latest.data?.latitude, latest.data?.longitude);
  const onTheWay = assigned && mayClaimAssociateOnTheWay(status);
  const computedTitle = title ?? (onTheWay ? ASSOCIATE_ON_THE_WAY_MESSAGE : 'Track Care Associate');
  const lastUpdated = formatLastUpdated(latest.data?.timestamp);
  const subtitle = !visit
    ? 'Looking for your care visit…'
    : !assigned
      ? ASSOCIATE_NOT_ASSIGNED_MESSAGE
      : status === 'forbidden'
        ? LOCATION_FORBIDDEN_MESSAGE
        : coord
          ? `${name}${lastUpdated ? ` · ${lastUpdated}` : ''}`
          : ASSOCIATE_NOT_SHARING_MESSAGE;

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(visit ? href : (emptyHref ?? href))}
      accessibilityRole="button"
      accessibilityLabel={`${computedTitle}. ${subtitle}`}
      accessibilityHint="Opens Care Associate live tracking"
    >
      <IconWell tone={onTheWay ? 'safe' : 'accent'} size={48} rounded="full">
        <Icon name="navigate" size={20} color={onTheWay ? colors.safe : colors.accent} />
      </IconWell>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{computedTitle}</Text>
          {onTheWay ? <LiveIndicator label="LIVE" active /> : null}
        </View>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {visitTimeLine(visit) ? <Text style={styles.meta}>{visitTimeLine(visit)}</Text> : null}
      </View>
      <View style={styles.actionCol}>
        <Text style={styles.action}>{actionLabel ?? 'Track'}</Text>
      </View>
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
  copy: {
    flex: 1,
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
    marginTop: 2,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionCol: {
    minHeight: minTouchSize,
    justifyContent: 'center',
  },
  action: {
    ...typography.captionStrong,
    color: colors.accent,
  },
});
