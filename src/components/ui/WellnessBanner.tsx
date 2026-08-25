import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, minTouchSize, radius, spacing, typography } from '@/constants/theme';

interface WellnessBannerProps {
  title: string;
  subtitle?: string;
  tone?: 'safe' | 'emergency';
  onPress?: () => void;
}

export function WellnessBanner({ title, subtitle, tone = 'safe', onPress }: WellnessBannerProps) {
  const isEmergency = tone === 'emergency';
  const content = (
    <>
      <Text style={[styles.title, isEmergency ? styles.emergencyTitle : null]}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </>
  );

  if (!onPress) {
    return <View style={[styles.banner, isEmergency ? styles.emergency : styles.safe]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle ?? ''}`}
      style={({ pressed }) => [
        styles.banner,
        isEmergency ? styles.emergency : styles.safe,
        pressed ? styles.pressed : null,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    minHeight: minTouchSize,
    justifyContent: 'center',
  },
  safe: {
    backgroundColor: colors.safeSoft,
  },
  emergency: {
    backgroundColor: colors.emergencySoft,
  },
  title: {
    ...typography.subtitle,
    color: colors.safe,
  },
  emergencyTitle: {
    color: colors.emergency,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  pressed: {
    opacity: 0.92,
  },
});
