import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { Icon, IconWell } from '@/components/ui';
import { cardSurface, colors, minTouchSize, spacing, typography } from '@/constants/theme';

export function RegisterRoleScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + spacing.xl }]}>
      <AgeWellHeader title="Create Account" showBack showProfile={false} />
      <View style={styles.content}>
        <Text style={styles.heading}>How will you use AgeWell?</Text>
        <Text style={styles.sub}>
          This app is for members. Care managers, companions, and delivery executives use the AgeWell Care app.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
          onPress={() => router.push('/(auth)/welcome' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Member signup"
        >
          <IconWell tone="primary" size={56} rounded="full">
            <Icon name="person-outline" size={24} color={colors.primary} />
          </IconWell>
          <View style={styles.textCol}>
            <Text style={styles.title}>Member signup</Text>
            <Text style={styles.subtitle}>Create an account, then choose Single or Couple membership</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  heading: {
    ...typography.heading,
    color: colors.text,
  },
  sub: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  card: {
    ...cardSurface,
    minHeight: minTouchSize * 2,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.94,
  },
  textCol: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.subtitle,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
