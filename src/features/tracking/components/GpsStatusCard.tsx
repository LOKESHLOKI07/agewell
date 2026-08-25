import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '@/components';
import { colors, spacing, typography } from '@/constants/theme';
import { formatCoordinate, formatPointTimestamp } from '../selectors';
import type { TrackingPoint } from '../types';

interface GpsStatusCardProps {
  title?: string;
  message?: string;
  point?: TrackingPoint | null;
  sharing?: boolean;
  variant?: 'status' | 'coords';
}

export function GpsStatusCard({
  title,
  message,
  point = null,
  sharing = false,
  variant = 'status',
}: GpsStatusCardProps) {
  const latitude = formatCoordinate(point?.latitude);
  const longitude = formatCoordinate(point?.longitude);
  const timestamp = formatPointTimestamp(point?.timestamp);
  const status = sharing ? 'Live location sharing is active' : title ?? 'Live location';
  const coordsLabel = latitude && longitude
    ? `Latitude ${latitude}. Longitude ${longitude}${timestamp ? `. Last timestamp ${timestamp}` : ''}.`
    : 'Coordinates are not available yet.';

  const coords = (
    <View accessibilityRole="text" accessibilityLabel={coordsLabel}>
      {latitude && longitude ? (
        <View style={styles.coords}>
          <View style={styles.row}>
            <Text style={styles.label}>Latitude</Text>
            <Text style={styles.value}>{latitude}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Longitude</Text>
            <Text style={styles.value}>{longitude}</Text>
          </View>
          {timestamp ? (
            <View style={styles.row}>
              <Text style={styles.label}>Last timestamp</Text>
              <Text style={styles.value}>{timestamp}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <Text style={styles.empty}>{message ?? 'Coordinates appear once a location is shared.'}</Text>
      )}
    </View>
  );

  if (variant === 'coords') {
    return coords;
  }

  return (
    <AppCard>
      <View accessibilityRole="text" accessibilityLabel={`${status}. ${message ?? ''}`}>
        <Text style={styles.kicker}>{sharing ? 'Sharing' : 'Live location'}</Text>
        <Text style={styles.title}>{status}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {latitude && longitude ? <View style={styles.statusCoords}>{coords}</View> : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  kicker: {
    ...typography.label,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  title: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  statusCoords: {
    marginTop: spacing.lg,
  },
  coords: {
    gap: spacing.md,
  },
  row: {
    gap: 2,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
