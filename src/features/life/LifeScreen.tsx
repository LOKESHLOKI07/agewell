import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, minTouchSize, cardSurface } from '@/constants/theme';
import { Icon, IconWell, SectionTitle } from '@/components/ui';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { useI18n } from '@/i18n';
import { LIFE_CATEGORIES } from './categories';

export function LifeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title={t('life.title')} showBack showProfile={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Explore culture, learning, and leisure. Content appears here when AgeWell publishes it — nothing is invented
          for this demo.
        </Text>
        <SectionTitle title="Categories" />
        <View style={styles.grid}>
          {LIFE_CATEGORIES.map((category) => (
            <Pressable
              key={category.id}
              style={styles.card}
              onPress={() =>
                router.push({ pathname: '/life/[category]', params: { category: category.id } } as unknown as Href)
              }              accessibilityRole="button"
              accessibilityLabel={`${category.title}. ${category.description}`}
            >
              <IconWell tone="accent" size={48} rounded="full">
                <Icon name={category.icon} size={20} color={colors.accent} />
              </IconWell>
              <Text style={styles.title}>{category.title}</Text>
              <Text style={styles.subtitle}>{category.description}</Text>
              <Text style={styles.soon}>{t('life.comingSoon')}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
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
    paddingBottom: spacing.huge,
    gap: spacing.md,
  },
  intro: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  grid: {
    gap: spacing.md,
  },
  card: {
    ...cardSurface,
    padding: spacing.lg,
    minHeight: minTouchSize * 2,
    gap: spacing.sm,
  },
  title: {
    ...typography.subtitle,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  soon: {
    ...typography.label,
    color: colors.primary,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
  },
});
