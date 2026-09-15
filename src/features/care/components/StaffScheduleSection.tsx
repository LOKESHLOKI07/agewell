import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBadge } from '@/components/StatusBadge';
import { cardSurface, colors, minTouchSize, spacing, tones, typography, type ColorTone } from '@/constants/theme';
import type { StatusPresentation } from '@/utils/status';
import type { StaffScheduleItem } from '../staffHomeModel';

export type { StaffScheduleItem };

interface StaffScheduleSectionProps {
  title: string;
  viewAllLabel?: string;
  onViewAll?: () => void;
  items: StaffScheduleItem[];
  onPressItem?: (item: StaffScheduleItem) => void;
}

function presentationFor(label: string, tone: ColorTone): StatusPresentation {
  const palette = tones[tone === 'default' ? 'primary' : tone];
  return {
    label,
    color: palette.fg,
    background: palette.bg,
  };
}

export function StaffScheduleSection({
  title,
  viewAllLabel = 'View All',
  onViewAll,
  items,
  onPressItem,
}: StaffScheduleSectionProps) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onViewAll ? (
          <Pressable
            onPress={onViewAll}
            accessibilityRole="button"
            accessibilityLabel={viewAllLabel}
            hitSlop={8}
            style={styles.viewAllPress}
          >
            <Text style={styles.viewAll}>{viewAllLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.list}>
        {items.map((item) => {
          const row = (
            <View style={styles.row}>
              <View style={styles.body}>
                <Text style={styles.time}>{item.timeLabel}</Text>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.location ? (
                  <Text style={styles.location} numberOfLines={1}>
                    {item.location}
                  </Text>
                ) : null}
              </View>
              <StatusBadge presentation={presentationFor(item.statusLabel, item.statusTone)} />
            </View>
          );

          if (!onPressItem) {
            return (
              <View key={item.id} style={styles.card}>
                {row}
              </View>
            );
          }

          return (
            <Pressable
              key={item.id}
              onPress={() => onPressItem(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.timeLabel}. ${item.title}. ${item.statusLabel}`}
              style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
            >
              {row}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
    minHeight: minTouchSize / 2,
  },
  title: {
    ...typography.subtitle,
    color: colors.text,
    flex: 1,
  },
  viewAllPress: {
    minHeight: minTouchSize / 2,
    justifyContent: 'center',
  },
  viewAll: {
    ...typography.captionStrong,
    color: colors.primary,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    ...cardSurface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  time: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  itemTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    marginTop: 2,
  },
  location: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.94,
  },
});
