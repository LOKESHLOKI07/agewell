import { StyleSheet, Text, View } from 'react-native';
import { cardSurface, colors, minTouchSize, spacing, typography, type ColorTone, tones } from '@/constants/theme';
import { Icon, type IconName } from '@/components/ui';
import { IconWell } from '@/components/ui';

interface HealthInfoCardProps {
  title: string;
  lines: string[];
  icon?: IconName;
  tone?: ColorTone;
}

export function HealthInfoCard({ title, lines, icon = 'document-text-outline', tone = 'primary' }: HealthInfoCardProps) {
  const palette = tones[tone === 'default' ? 'primary' : tone];

  return (
    <View
      style={styles.card}
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${lines.join('. ')}`}
    >
      <IconWell tone={tone === 'default' ? 'primary' : tone} size={48}>
        <Icon name={icon} size={20} color={palette.fg} />
      </IconWell>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {lines.map((line) => (
          <Text key={line} style={styles.line}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardSurface,
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
  },
  body: {
    flex: 1,
    paddingTop: 2,
  },
  title: {
    ...typography.subtitle,
    color: colors.text,
  },
  line: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
