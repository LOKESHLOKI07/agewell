import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Icon, IconWell } from '@/components/ui';
import { cardSurface, colors, minTouchSize, spacing, tones, typography } from '@/constants/theme';
import { familyDashboardStats } from '../selectors';

type Stat = ReturnType<typeof familyDashboardStats>[number];

interface FamilyTodaySummaryProps {
  stats: Stat[];
}

export function FamilyTodaySummary({ stats }: FamilyTodaySummaryProps) {
  return (
    <View style={styles.grid}>
      {stats.map((stat) => {
        const palette = tones[stat.tone];
        return (
          <Pressable
            key={stat.key}
            onPress={() => router.push(stat.href)}
            accessibilityRole="button"
            accessibilityLabel={`${stat.title}. ${stat.value}. ${stat.detail}`}
            style={({ pressed }) => [styles.tile, pressed ? styles.pressed : null]}
          >
            <View style={styles.tileTop}>
              <IconWell tone={stat.tone} size={36}>
                <Icon name={stat.icon} size={18} color={palette.fg} />
              </IconWell>
              <Icon name="chevron-forward" size={14} color={colors.textMuted} />
            </View>
            <Text style={styles.title}>{stat.title}</Text>
            <Text style={styles.value}>{stat.value}</Text>
            <Text style={[styles.detail, stat.tone === 'warning' ? { color: colors.warning } : null]}>{stat.detail}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tile: {
    ...cardSurface,
    width: '47%',
    flexGrow: 1,
    minHeight: minTouchSize + 64,
    padding: spacing.lg,
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  tileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  value: {
    ...typography.subtitle,
    color: colors.text,
  },
  detail: {
    ...typography.caption,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.94,
  },
});
