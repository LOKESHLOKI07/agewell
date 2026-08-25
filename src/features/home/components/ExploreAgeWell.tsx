import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router, type Href } from 'expo-router';
import { colors, typography, spacing, cardSurface, minTouchSize } from '@/constants/theme';
import { Icon, IconWell, SectionTitle, type IconName } from '@/components/ui';
import { useI18n } from '@/i18n';

type ExploreItemProps = {
  title: string;
  subtitle: string;
  icon: IconName;
  tone: 'primary' | 'accent' | 'safe' | 'warning';
  onPress: () => void;
};

function ExploreItem({ title, subtitle, icon, tone, onPress }: ExploreItemProps) {
  const fg =
    tone === 'safe'
      ? colors.safe
      : tone === 'accent'
        ? colors.accent
        : tone === 'warning'
          ? colors.warning
          : colors.primary;
  const bg =
    tone === 'safe'
      ? colors.safeSoft
      : tone === 'accent'
        ? colors.accentSoft
        : tone === 'warning'
          ? colors.warningSoft
          : colors.primarySoft;

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
    >
      <View style={[styles.imagePlaceholder, { backgroundColor: bg }]}>
        <IconWell tone={tone} size={56} rounded="full">
          <Icon name={icon} size={26} color={fg} />
        </IconWell>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

export function ExploreAgeWell() {
  const { t } = useI18n();
  return (
    <View style={styles.container}>
      <SectionTitle title={t('home.explore')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ExploreItem
          title={t('explore.events')}
          subtitle={t('explore.eventsSubtitle')}
          icon="calendar-outline"
          tone="warning"
          onPress={() => router.push('/(tabs)/community' as Href)}
        />
        <ExploreItem
          title={t('explore.health')}
          subtitle={t('explore.healthSubtitle')}
          icon="medkit-outline"
          tone="safe"
          onPress={() => router.push('/(tabs)/health' as Href)}
        />
        <ExploreItem
          title={t('life.title')}
          subtitle={t('explore.lifeSubtitle')}
          icon="sparkles"
          tone="accent"
          onPress={() => router.push('/life' as Href)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  scrollContent: {
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  card: {
    ...cardSurface,
    width: 188,
    overflow: 'hidden',
    minHeight: minTouchSize * 2,
  },
  imagePlaceholder: {
    height: 112,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    padding: spacing.md,
    gap: 4,
  },
  title: {
    ...typography.captionStrong,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
