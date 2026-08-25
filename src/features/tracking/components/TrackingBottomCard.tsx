import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import type { LiveLocationStatus } from '../live';
import { liveStatusLabel } from '../live';

interface TrackingBottomCardProps {
  status: LiveLocationStatus;
  name: string;
  visitTitle: string;
  visitMeta: string | null;
  employeeId: string | null;
  lastUpdated: string | null;
  message: string;
  followEnabled: boolean;
  onFollow: () => void;
}

export function TrackingBottomCard({
  status,
  name,
  visitTitle,
  visitMeta,
  employeeId,
  lastUpdated,
  message,
  followEnabled,
  onFollow,
}: TrackingBottomCardProps) {
  const live = status === 'live';
  return (
    <View style={[styles.card, shadows.float]} accessibilityRole="summary">
      <View style={styles.row}>
        <View
          style={[styles.pill, live ? styles.pillLive : styles.pillMuted]}
          accessibilityLabel="Live location status"
          accessibilityValue={{ text: liveStatusLabel(status) }}
        >
          <View style={[styles.dot, live ? styles.dotLive : styles.dotMuted]} />
          <Text style={[styles.pillText, live ? styles.pillTextLive : styles.pillTextMuted]}>
            {liveStatusLabel(status)}
          </Text>
        </View>
      </View>

      <Text style={styles.name} accessibilityLabel="Care Associate location">
        {name}
      </Text>
      <Text style={styles.role}>Care Associate{employeeId ? ` · ${employeeId}` : ''}</Text>

      <Text style={styles.visit}>{visitTitle}</Text>
      {visitMeta ? <Text style={styles.meta}>{visitMeta}</Text> : null}

      <Text style={styles.updated}>{lastUpdated ?? message}</Text>
      {!live ? <Text style={styles.message}>{message}</Text> : null}

      <Pressable
        onPress={onFollow}
        style={({ pressed }) => [styles.follow, pressed ? styles.pressed : null]}
        accessibilityRole="button"
        accessibilityLabel={followEnabled ? 'Stop following Care Associate' : 'Follow Care Associate'}
        accessibilityState={{ selected: followEnabled }}
      >
        <Text style={styles.followLabel}>{followEnabled ? 'Following location' : 'Follow location'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 28,
  },
  pillLive: {
    backgroundColor: colors.safeSoft,
  },
  pillMuted: {
    backgroundColor: colors.surfaceMuted,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotLive: {
    backgroundColor: colors.safe,
  },
  dotMuted: {
    backgroundColor: colors.textMuted,
  },
  pillText: {
    ...typography.label,
    letterSpacing: 0.8,
  },
  pillTextLive: {
    color: colors.safe,
  },
  pillTextMuted: {
    color: colors.textSecondary,
  },
  name: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.xs,
  },
  role: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  visit: {
    ...typography.bodyStrong,
    color: colors.text,
    marginTop: spacing.sm,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  updated: {
    ...typography.captionStrong,
    color: colors.text,
    marginTop: spacing.sm,
  },
  message: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  follow: {
    marginTop: spacing.md,
    minHeight: minTouchSize,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followLabel: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  pressed: {
    opacity: 0.9,
  },
});
