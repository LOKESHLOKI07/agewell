import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { Icon } from '@/components/ui';
import { useAuthStore } from '@/features/auth/authStore';
import { safeGoBack } from '@/utils/navigation';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

export function AppHeader({ title, subtitle, showBack = false }: AppHeaderProps) {
  const navigation = useNavigation();
  const role = useAuthStore((state) => state.user?.role);

  return (
    <View style={styles.header}>
      {showBack ? (
        <Pressable
          onPress={() => safeGoBack(navigation.canGoBack(), role)}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={styles.backButton}
        >
          <Icon name="chevron-back" size={22} color={colors.text} />
        </Pressable>
      ) : null}
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  backButton: {
    width: minTouchSize,
    height: minTouchSize,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  textBlock: {
    flex: 1,
    paddingTop: 8,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
