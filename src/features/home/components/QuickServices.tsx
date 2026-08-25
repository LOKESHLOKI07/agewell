import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { colors, typography, spacing, minTouchSize } from '@/constants/theme';
import { CircularAction, SectionTitle } from '@/components/ui';
import { router, type Href } from 'expo-router';
import { SERVICE_CATEGORY_ICONS, serviceDetailsHref } from '@/features/services/selectors';
import type { CatalogService, HomeSectionState } from '../types/home';
import { HomeInlineError, HomeSkeletonTile } from './HomeInlineStatus';
import { useI18n } from '@/i18n';

type QuickServicesProps = {
  services: CatalogService[];
  state: HomeSectionState;
  error: unknown;
  onRetry: () => void;
};

/** Fixed shortcuts that map to real routes (not invented services). */
const FIXED_ACTIONS = [
  {
    key: 'emergency',
    label: 'Emergency',
    icon: 'siren' as const,
    href: '/emergency' as Href,
  },
  {
    key: 'safety',
    label: 'Safety',
    icon: 'shield-checkmark-outline' as const,
    href: '/health/emergency-info' as Href,
  },
  {
    key: 'care',
    label: 'Customer Care',
    icon: 'call-outline' as const,
    href: '/account/help' as Href,
  },
];

export function QuickServices({ services, state, error, onRetry }: QuickServicesProps) {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <SectionTitle
        title={t('home.quickServices')}
        subtitle="Only services available in your AgeWell catalogue"
        actionLabel="Browse all"
        onAction={() => router.push('/(tabs)/services' as Href)}
      />
      {state === 'loading' ? (
        <View style={styles.row}>
          <HomeSkeletonTile />
          <HomeSkeletonTile />
          <HomeSkeletonTile />
          <HomeSkeletonTile />
        </View>
      ) : state === 'error' ? (
        <HomeInlineError error={error} onRetry={onRetry} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {services.map((service) => (
            <CircularAction
              key={service.id}
              label={service.name}
              icon={SERVICE_CATEGORY_ICONS[service.category] ?? 'grid'}
              onPress={() => router.push(serviceDetailsHref(service.id) as unknown as Href)}
            />
          ))}
          {FIXED_ACTIONS.map((action) => (
            <CircularAction
              key={action.key}
              label={action.label}
              icon={action.icon}
              onPress={() => router.push(action.href)}
            />
          ))}
          {state === 'empty' && services.length === 0 ? (
            <Text style={styles.empty}>Catalogue services will appear here when available</Text>
          ) : null}
        </ScrollView>
      )}
      <Pressable
        style={styles.addonsLink}
        onPress={() => router.push('/addons' as Href)}
        accessibilityRole="button"
        accessibilityLabel="Open add-on store"
      >
        <Text style={styles.addonsText}>Need more hours or extras? View add-ons</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'flex-start',
    paddingRight: spacing.xl,
  },
  empty: {
    ...typography.caption,
    color: colors.textSecondary,
    paddingVertical: spacing.sm,
    maxWidth: 180,
  },
  addonsLink: {
    marginTop: spacing.md,
    minHeight: minTouchSize,
    justifyContent: 'center',
  },
  addonsText: {
    ...typography.captionStrong,
    color: colors.primary,
  },
});
