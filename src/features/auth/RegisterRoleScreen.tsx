import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { Icon, IconWell, type IconName } from '@/components/ui';
import { cardSurface, colors, minTouchSize, spacing, typography } from '@/constants/theme';

type RoleOption = {
  key: 'senior' | 'care';
  title: string;
  subtitle: string;
  icon: IconName;
  href: Href;
  tone: 'primary' | 'safe';
};

const OPTIONS: RoleOption[] = [
  {
    key: 'senior',
    title: 'Member signup',
    subtitle: 'Care for myself or my parent(s) — same senior home',
    icon: 'person-outline',
    href: '/(auth)/welcome' as Href,
    tone: 'primary',
  },
  {
    key: 'care',
    title: "I'm a Care Associate",
    subtitle: 'I want to provide care through AgeWell',
    icon: 'medkit-outline',
    href: '/(auth)/register/care' as Href,
    tone: 'safe',
  },
];

export function RegisterRoleScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + spacing.xl }]}>
      <AgeWellHeader title="Create Account" showBack showProfile={false} />
      <View style={styles.content}>
        <Text style={styles.heading}>How will you use AgeWell?</Text>
        <Text style={styles.sub}>Members use one signup for themselves or their parents. Care associates have a separate application.</Text>
        {OPTIONS.map((option) => (
          <Pressable
            key={option.key}
            style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
            onPress={() => router.push(option.href)}
            accessibilityRole="button"
            accessibilityLabel={`${option.title}. ${option.subtitle}`}
          >
            <IconWell tone={option.tone} size={56} rounded="full">
              <Icon name={option.icon} size={24} color={colors[option.tone === 'safe' ? 'safe' : 'primary']} />
            </IconWell>
            <View style={styles.textCol}>
              <Text style={styles.title}>{option.title}</Text>
              <Text style={styles.subtitle}>{option.subtitle}</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        ))}
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
