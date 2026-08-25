import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark, PrimaryButton, SecondaryButton } from '@/components';
import { Icon, IconWell } from '@/components/ui';
import { cardSurface, colors, minTouchSize, spacing, typography } from '@/constants/theme';

export function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
      <BrandMark size="large" />
      <Text style={styles.title}>AgeWell India</Text>
      <Text style={styles.subtitle}>Your parents. Our care. Stay connected with trusted support at home.</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <IconWell tone="primary" size={48} rounded="full">
            <Icon name="heart-outline" size={22} color={colors.primary} />
          </IconWell>
          <Text style={styles.cardText}>Care, health coordination, and peace of mind in one place.</Text>
        </View>
      </View>

      <PrimaryButton
        label="Sign In"
        onPress={() => router.push('/(auth)/login' as Href)}
        accessibilityHint="Opens the sign in form"
      />
      <SecondaryButton
        label="Create Account"
        onPress={() => router.push('/(auth)/register' as Href)}
        accessibilityHint="Choose how you will use AgeWell"
      />
      <Pressable
        onPress={() => router.push('/(auth)/login' as Href)}
        accessibilityRole="button"
        style={styles.linkWrap}
      >
        <Text style={styles.link}>Already enrolled by AgeWell staff? Sign in</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  card: {
    ...cardSurface,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  linkWrap: {
    minHeight: minTouchSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: {
    ...typography.captionStrong,
    color: colors.primary,
  },
});
