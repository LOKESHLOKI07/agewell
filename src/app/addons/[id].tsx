import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams, useNavigation, type Href } from 'expo-router';
import { colors, typography, spacing, minTouchSize, cardSurface } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { EmptyState, LoadingState, PrimaryButton } from '@/components';
import { AddonBookNowScreen } from '@/features/addons/AddonBookNowScreen';
import { findAddonBookNow } from '@/features/addons/addonBookCatalog';
import { useService } from '@/features/services/hooks';
import { serviceRequestHref } from '@/features/services/selectors';
import { useI18n } from '@/i18n';
import { useAuthStore } from '@/features/auth/authStore';
import { safeGoBack } from '@/utils/navigation';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Known home add-ons open a dedicated Book Now card.
 * Other ids still use the generic catalogue request flow.
 */
export default function AddonDetailScreen() {
  const rawId = useLocalSearchParams<{ id: string | string[] }>().id;
  const id = firstParam(rawId);
  const bookNow = findAddonBookNow(id);

  if (bookNow) {
    return <AddonBookNowScreen addon={bookNow} />;
  }

  return <GenericAddonRequest id={id} />;
}

function GenericAddonRequest({ id }: { id: string | undefined }) {
  const { t } = useI18n();
  const navigation = useNavigation();
  const role = useAuthStore((state) => state.user?.role);
  const query = useService(id);
  const service = query.service;

  if (query.isPending) {
    return (
      <View style={styles.container}>
        <AgeWellHeader title={t('addons.title')} showBack />
        <LoadingState message="Loading…" />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.container}>
        <AgeWellHeader title="Not found" showBack />
        <EmptyState
          icon="cart-outline"
          title="Add-on not found"
          message="This item is not in your AgeWell service catalogue."
          actionLabel="Back to store"
          onAction={() => safeGoBack(navigation.canGoBack(), role)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AgeWellHeader title="Request add-on" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.title}>{service.name}</Text>
          <Text style={styles.description}>{service.description || 'No description on file.'}</Text>
          <View style={styles.divider} />
          <Text style={styles.note}>{t('addons.noPayment')}</Text>
        </View>

        <PrimaryButton
          label="Continue to request"
          onPress={() => router.push(serviceRequestHref(service.id) as unknown as Href)}
        />

        <Pressable
          style={styles.secondary}
          onPress={() => router.push('/account/help' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Contact AgeWell support"
        >
          <Text style={styles.secondaryText}>Prefer to talk to someone? Contact support</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, flexGrow: 1, gap: spacing.lg },
  summaryCard: {
    ...cardSurface,
    padding: spacing.lg,
  },
  title: { ...typography.title, color: colors.text, marginBottom: spacing.sm },
  description: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  note: { ...typography.caption, color: colors.textMuted },
  secondary: {
    minHeight: minTouchSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryText: { ...typography.captionStrong, color: colors.primary },
});
