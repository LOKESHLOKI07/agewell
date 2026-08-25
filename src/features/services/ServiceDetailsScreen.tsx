import { router, useLocalSearchParams, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AppHeader, ErrorState, LoadingState, PrimaryButton, Screen } from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { getApiErrorMessage } from '@/api/errors';
import { useService } from './hooks';
import { SERVICE_CATEGORY_LABELS, serviceRequestHref } from './selectors';

export function ServiceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { service, isPending, isError, error, refetch, notFound } = useService(id);

  if (isPending) {
    return (
      <Screen>
        <AppHeader title="Service" showBack />
        <LoadingState message="Loading service..." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <AppHeader title="Service" showBack />
        <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  if (notFound || !service) {
    return (
      <Screen>
        <AppHeader title="Service" showBack />
        <ErrorState message="This service is not available." onRetry={() => void refetch()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title={service.name} showBack />
      <View style={[styles.card, shadows.card]}>
        <Text style={styles.label}>Service</Text>
        <Text style={styles.value}>{service.name}</Text>
        <Text style={styles.label}>Category</Text>
        <Text style={styles.value}>{SERVICE_CATEGORY_LABELS[service.category]}</Text>
        <Text style={styles.label}>Description</Text>
        <Text style={styles.description}>{service.description}</Text>
      </View>
      <PrimaryButton
        label="Request this service"
        onPress={() => router.push(serviceRequestHref(service.id) as Href)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  description: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.xs,
  },
});
