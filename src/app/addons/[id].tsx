import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams, useNavigation, type Href } from 'expo-router';
import { colors, typography, spacing, minTouchSize, cardSurface } from '@/constants/theme';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { EmptyState, LoadingState, PrimaryButton } from '@/components';
import { AyurvedicMassageScreen } from '@/features/addons/AyurvedicMassageScreen';
import { EmergencyCompanionScreen } from '@/features/addons/EmergencyCompanionScreen';
import { HouseCleaningScreen } from '@/features/addons/HouseCleaningScreen';
import { StoolCleaningScreen } from '@/features/addons/StoolCleaningScreen';
import { MembershipServiceGate } from '@/features/membership/MembershipServiceGate';
import { useService } from '@/features/services/hooks';
import { serviceRequestHref } from '@/features/services/selectors';
import { useI18n } from '@/i18n';
import { useAuthStore } from '@/features/auth/authStore';
import { safeGoBack } from '@/utils/navigation';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Dedicated mockup screens for home add-ons; other ids use the generic catalogue request flow.
 */
export default function AddonDetailScreen() {
  const rawId = useLocalSearchParams<{ id: string | string[] }>().id;
  const id = firstParam(rawId);

  if (id === 'emergency-companion') {
    return <EmergencyCompanionScreen />;
  }
  if (id === 'stool-cleaning') {
    return <StoolCleaningScreen />;
  }
  if (id === 'maid-assistance') {
    return <HouseCleaningScreen />;
  }
  if (id === 'ayurvedic-massage') {
    return <AyurvedicMassageScreen />;
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
        <ServicePageHeader />
        <LoadingState message="Loading…" />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.container}>
        <ServicePageHeader />
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
    <MembershipServiceGate slug={service.slug ?? id ?? 'addon'} title={service.name} requireMembership={false}>
      <GenericAddonRequestLive
        name={service.name}
        description={service.description}
        serviceId={service.id}
        noPayment={t('addons.noPayment')}
      />
    </MembershipServiceGate>
  );
}

function GenericAddonRequestLive({
  name,
  description,
  serviceId,
  noPayment,
}: {
  name: string;
  description: string | null;
  serviceId: string;
  noPayment: string;
}) {
  return (
    <View style={styles.container}>
      <ServicePageHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.description}>{description || 'No description on file.'}</Text>
          <View style={styles.divider} />
          <Text style={styles.note}>{noPayment}</Text>
        </View>

        <PrimaryButton
          label="Continue to request"
          onPress={() => router.push(serviceRequestHref(serviceId) as unknown as Href)}
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
