import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { ErrorState } from '@/components';
import { cardSurface, colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { Icon, IconWell } from '@/components/ui';
import { useSeniorViewerLocation } from '../hooks';
import { careTrackingHref } from '../selectors';
import { viewerLiveLocationCopy } from '../live';

interface CareLiveTrackingCardProps {
  seniorId: string | null | undefined;
}

export function CareLiveTrackingCard({ seniorId }: CareLiveTrackingCardProps) {
  const viewer = useSeniorViewerLocation(seniorId);
  const copy = viewerLiveLocationCopy(viewer.state);

  if (!seniorId) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Location unavailable</Text>
        <Text style={styles.subtitle}>Open an assigned visit to view that senior's live location.</Text>
      </View>
    );
  }

  if (viewer.state.kind === 'error' || viewer.state.kind === 'forbidden') {
    return (
      <ErrorState
        title="Location unavailable"
        message={viewer.state.message}
        onRetry={() => {
          void viewer.sessions.refetch();
          void viewer.latest.refetch();
        }}
      />
    );
  }

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(careTrackingHref(seniorId) as unknown as Href)}
      accessibilityRole="button"
      accessibilityLabel={`${copy.title}. ${copy.subtitle}`}
      accessibilityHint="Opens live location for this assigned senior"
    >
      <IconWell tone="accent" size={48} rounded="full">
        <Icon name="navigate" size={20} color={colors.accent} />
      </IconWell>
      <View style={styles.copy}>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
      </View>
      <Text style={styles.action}>{copy.action}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardSurface,
    backgroundColor: colors.accentSoft,
    padding: spacing.lg,
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  action: {
    ...typography.captionStrong,
    color: colors.accent,
  },
});
