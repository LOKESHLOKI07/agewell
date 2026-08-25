import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  AppHeader,
  ErrorState,
  LoadingState,
  PrimaryButton,
  Screen,
} from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { getApiErrorMessage } from '@/api/errors';
import { useSeniorProfile } from '@/features/home/hooks/queries';
import { seniorDisplayName } from '@/features/home/api/mappers';
import { useCreateServiceRequest, useService } from './hooks';
import { SERVICE_CATEGORY_LABELS } from './selectors';

export function RequestServiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { service, isPending, isError, error, refetch, notFound } = useService(id);
  const seniorQuery = useSeniorProfile();
  const createRequest = useCreateServiceRequest();
  const [submitError, setSubmitError] = useState<unknown>(null);

  const onSubmit = async () => {
    if (!service || !seniorQuery.data) {
      return;
    }
    setSubmitError(null);
    try {
      await createRequest.mutateAsync({
        seniorId: seniorQuery.data.id,
        serviceId: service.id,
      });
      router.replace('/services/request-success');
    } catch (caught) {
      setSubmitError(caught);
    }
  };

  if (isPending || seniorQuery.isPending) {
    return (
      <Screen>
        <AppHeader title="Request a service" showBack />
        <LoadingState message="Loading service..." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <AppHeader title="Request a service" showBack />
        <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  if (seniorQuery.isError) {
    return (
      <Screen>
        <AppHeader title="Request a service" showBack />
        <ErrorState
          message={getApiErrorMessage(seniorQuery.error)}
          onRetry={() => void seniorQuery.refetch()}
        />
      </Screen>
    );
  }

  if (notFound || !service || !seniorQuery.data) {
    return (
      <Screen>
        <AppHeader title="Request a service" showBack />
        <ErrorState message="This service is not available." onRetry={() => void refetch()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Request a service" subtitle={service.name} showBack />
      <View style={[styles.summary, shadows.card]}>
        <Text style={styles.label}>Service</Text>
        <Text style={styles.value}>{service.name}</Text>
        <Text style={styles.label}>Category</Text>
        <Text style={styles.value}>{SERVICE_CATEGORY_LABELS[service.category]}</Text>
        <Text style={styles.label}>For</Text>
        <Text style={styles.value}>{seniorDisplayName(seniorQuery.data)}</Text>
      </View>

      {submitError ? (
        <View style={styles.submitError}>
          <ErrorState message={getApiErrorMessage(submitError)} onRetry={() => void onSubmit()} />
        </View>
      ) : null}

      <PrimaryButton
        label="Submit Request"
        onPress={() => void onSubmit()}
        loading={createRequest.isPending}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
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
  submitError: {
    marginBottom: spacing.lg,
  },
});
