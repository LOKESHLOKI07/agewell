import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, tones, typography, type ColorTone } from '@/constants/theme';

type StatusPillProps = {
  label: string;
  tone?: ColorTone;
  /** Shown beside the label so status is not color-only. */
  iconLabel?: string;
};

export function StatusPill({ label, tone = 'default', iconLabel }: StatusPillProps) {
  const palette = tones[tone];
  return (
    <View
      style={[styles.pill, { backgroundColor: palette.bg, borderColor: palette.border }]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${label}`}
    >
      {iconLabel ? <Text style={[styles.icon, { color: palette.fg }]}>{iconLabel}</Text> : null}
      <Text style={[styles.label, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    minHeight: 28,
  },
  icon: {
    ...typography.captionStrong,
  },
  label: {
    ...typography.captionStrong,
    letterSpacing: 0.2,
  },
});

export function statusToneFromLabel(status: string): ColorTone {
  const key = status.toUpperCase().replace(/\s+/g, '_');
  if (key.includes('EMERGENCY') || key.includes('CANCEL') || key.includes('NO_SHOW')) {
    return 'emergency';
  }
  if (key.includes('COMPLETE') || key.includes('ACTIVE') || key.includes('LIVE') || key.includes('RESOLVED')) {
    return 'safe';
  }
  if (
    key.includes('PROGRESS') ||
    key.includes('CHECKED') ||
    key.includes('ASSIGNED') ||
    key.includes('CONFIRM') ||
    key.includes('UPCOMING')
  ) {
    return 'accent';
  }
  if (key.includes('REQUEST') || key.includes('SCHEDULE') || key.includes('IMPORTANT')) {
    return 'warning';
  }
  return 'primary';
}
