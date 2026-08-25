import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cardSurface, colors, spacing, typography } from '@/constants/theme';
import type { Senior } from '@/types';
import { fullName } from '@/utils/greeting';
import { careStatusPresentation } from '@/utils/status';
import { Icon } from '@/components/ui';
import { StatusBadge } from './StatusBadge';

interface ParentCardProps {
  senior: Senior;
  onPress?: () => void;
  showStatus?: boolean;
}

export function ParentCard({ senior, onPress, showStatus = true }: ParentCardProps) {
  const name = fullName(senior.firstName, senior.lastName);
  const location = `${senior.address.area}, ${senior.address.city}`;
  const content = (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {senior.firstName.charAt(0)}
          {senior.lastName.charAt(0)}
        </Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.meta}>
          {senior.age} years · {location}
        </Text>
        {showStatus ? (
          <View style={styles.badge}>
            <StatusBadge presentation={careStatusPresentation(senior.careStatus)} />
          </View>
        ) : null}
      </View>
      {onPress ? <Icon name="chevron-forward" size={18} color={colors.textMuted} /> : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${senior.age} years, ${location}. View parent profile.`}
      style={({ pressed }) => [pressed ? styles.pressed : null]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardSurface,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  pressed: {
    opacity: 0.94,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.subtitle,
    color: colors.primary,
  },
  body: {
    flex: 1,
  },
  name: {
    ...typography.subtitle,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    marginTop: spacing.md,
  },
});
