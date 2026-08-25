import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router, type Href } from 'expo-router';
import { cardSurface, colors, typography, spacing, minTouchSize } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { EmptyState, LoadingState, ErrorState } from '@/components';
import { Icon, SectionTitle } from '@/components/ui';
import { useServices } from '@/features/services/hooks';
import { SERVICE_CATEGORY_LABELS, serviceRequestHref } from '@/features/services/selectors';
import type { CatalogService, ServiceCategory } from '@/features/home/types/home';
import { useI18n } from '@/i18n';
import { getSectionState } from '@/features/home/selectors/homeViewModel';

/**
 * Consumer add-on catalogue.
 * Dedicated `/addons/` API is staff-only today, so we surface the real services
 * catalogue grouped into product categories and use service-request (not fake payment).
 */
const STORE_GROUPS: { id: string; title: string; categories: ServiceCategory[]; match?: RegExp }[] = [
  { id: 'care', title: 'Care', categories: ['CARE'], match: /companion|care|visit/i },
  { id: 'food', title: 'Food', categories: ['FOOD_HOME'], match: /food|meal|lunch|dinner/i },
  { id: 'daily', title: 'Daily Life', categories: ['FOOD_HOME', 'ADD_ON'], match: /grocery|shopping|home|daily|laundry|cleaning/i },
  { id: 'transport', title: 'Transport', categories: ['MOBILITY'], match: /transport|cab|ride|mobility/i },
  { id: 'healthcare', title: 'Healthcare', categories: ['HEALTH'], match: /physio|health|doctor|nurse|therapy/i },
  { id: 'home', title: 'Home', categories: ['ADD_ON', 'FOOD_HOME'], match: /home|safety|grab|install|repair/i },
];

function groupForStore(services: CatalogService[]) {
  const assigned = new Set<string>();
  return STORE_GROUPS.map((group) => {
    const items = services.filter((service) => {
      if (assigned.has(service.id)) {
        return false;
      }
      const inCategory = group.categories.includes(service.category);
      const nameHit = group.match ? group.match.test(service.name) || group.match.test(service.description) : false;
      if (inCategory || nameHit) {
        assigned.add(service.id);
        return true;
      }
      return false;
    });
    return { ...group, items };
  }).filter((group) => group.items.length > 0);
}

export function AddonsScreen() {
  const { t } = useI18n();
  const query = useServices();
  const services = query.data ?? [];
  const groups = groupForStore(services);
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: services.length === 0,
  });

  return (
    <View style={styles.container}>
      <AgeWellHeader title={t('addons.title')} showBack />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.description}>{t('addons.requestOnly')}</Text>
        <Text style={styles.paymentNote}>{t('addons.noPayment')}</Text>

        {state === 'loading' ? <LoadingState message="Loading catalogue…" /> : null}
        {state === 'error' ? (
          <ErrorState title="Unable to load add-ons" message="Please try again." onRetry={() => void query.refetch()} />
        ) : null}
        {state === 'empty' ? (
          <EmptyState
            icon="cart-outline"
            title="No add-ons available"
            message="When AgeWell publishes services or add-ons for your account, they will appear here."
          />
        ) : null}

        {groups.map((group) => (
          <View key={group.id} style={styles.categorySection}>
            <SectionTitle title={group.title} />
            {group.items.map((addon) => (
              <Pressable
                key={addon.id}
                style={styles.addonCard}
                onPress={() => router.push(serviceRequestHref(addon.id) as unknown as Href)}
                accessibilityRole="button"
                accessibilityLabel={`Request ${addon.name}`}
              >
                <View style={styles.addonContent}>
                  <Text style={styles.addonTitle}>{addon.name}</Text>
                  <Text style={styles.addonDesc}>{addon.description || 'No description on file.'}</Text>
                  <Text style={styles.meta}>
                    {SERVICE_CATEGORY_LABELS[addon.category]} · Request only — no in-app payment
                  </Text>
                </View>
                <View style={styles.cta}>
                  <Icon name="plus-circle" size={26} color={colors.primary} />
                  <Text style={styles.ctaLabel}>Request</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ))}

        {state === 'ready' && groups.length === 0 ? (
          <EmptyState
            icon="cart-outline"
            title="No matching add-ons"
            message="Your service catalogue does not include items for these categories yet."
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  description: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  paymentNote: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xl },
  categorySection: { marginBottom: spacing.xl },
  addonCard: {
    ...cardSurface,
    flexDirection: 'row',
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    minHeight: minTouchSize + 24,
  },
  addonContent: { flex: 1, paddingRight: spacing.md },
  addonTitle: { ...typography.subtitle, color: colors.text, marginBottom: 4 },
  addonDesc: { ...typography.caption, color: colors.textSecondary, marginBottom: 8 },
  meta: { ...typography.captionStrong, color: colors.primary },
  cta: { alignItems: 'center', gap: 4, minWidth: 64 },
  ctaLabel: { ...typography.captionStrong, color: colors.primary },
});
