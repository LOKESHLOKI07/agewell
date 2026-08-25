import { useMemo, useState } from 'react';
import { router, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PrimaryButton,
  Screen,
  SectionTitle,
  TextField,
  AppCard,
} from '@/components';
import { colors, spacing, typography } from '@/constants/theme';
import { getApiErrorMessage } from '@/api/errors';
import { useSeniorProfile } from '@/features/home/hooks/queries';
import { seniorDisplayName } from '@/features/home/api/mappers';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import type { CatalogService } from '@/features/home/types/home';
import { useCreateServiceRequest, useServiceRequests, useServices } from './hooks';
import { groupServicesByCategory, serviceDetailsHref } from './selectors';
import { ServiceCategorySection, ServiceRequestSheet, ServiceStatus } from './components';

export function ServicesScreen() {
  const senior = useSeniorProfile();
  const servicesQuery = useServices();
  const requestsQuery = useServiceRequests();
  const createRequest = useCreateServiceRequest();
  const [query, setQuery] = useState('');
  const [sheetService, setSheetService] = useState<CatalogService | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const all = servicesQuery.data ?? [];
    if (!term) {
      return all;
    }
    return all.filter(
      (service) =>
        service.name.toLowerCase().includes(term) || service.description.toLowerCase().includes(term),
    );
  }, [query, servicesQuery.data]);
  const groups = groupServicesByCategory(filtered);
  const servicesState = getSectionState({
    isPending: servicesQuery.isPending,
    isError: servicesQuery.isError,
    isEmpty: (servicesQuery.data?.length ?? 0) === 0,
  });
  const requestsState = getSectionState({
    isPending: requestsQuery.isPending,
    isError: requestsQuery.isError,
    isEmpty: (requestsQuery.data?.items.length ?? 0) === 0,
  });
  const firstName = senior.data?.firstName;
  const firstService = filtered[0] ?? servicesQuery.data?.[0];

  const onConfirmRequest = async () => {
    if (!sheetService || !senior.data) {
      return;
    }
    setSheetError(null);
    try {
      await createRequest.mutateAsync({
        seniorId: senior.data.id,
        serviceId: sheetService.id,
      });
      setSheetService(null);
      router.replace('/services/request-success');
    } catch (caught) {
      setSheetError(getApiErrorMessage(caught));
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Our Services</Text>
      <Text style={styles.subtitle}>
        {firstName ? `Request support for ${firstName}.` : 'Request support, one service at a time.'}
      </Text>
      <TextField label="Search" placeholder="Search services" value={query} onChangeText={setQuery} />

      {servicesState === 'loading' ? <LoadingState message="Loading services..." /> : null}
      {servicesState === 'error' ? (
        <ErrorState message={getApiErrorMessage(servicesQuery.error)} onRetry={() => void servicesQuery.refetch()} />
      ) : null}
      {servicesState === 'empty' ? (
        <EmptyState
          icon="grid-outline"
          title="No services available"
          message="The AgeWell service catalogue will appear here."
        />
      ) : null}

      {servicesState === 'ready'
        ? groups.map((group) => (
            <ServiceCategorySection
              key={group.category}
              group={group}
              onOpen={(id) => router.push(serviceDetailsHref(id) as unknown as Href)}
              onRequest={(id) => {
                const service = filtered.find((item) => item.id === id) ?? null;
                setSheetError(null);
                setSheetService(service);
              }}
            />
          ))
        : null}

      {firstService ? (
        <View style={styles.cta}>
          <PrimaryButton
            label="Request a Service"
            onPress={() => {
              setSheetError(null);
              setSheetService(firstService);
            }}
            accessibilityHint="Opens a service request confirmation"
          />
        </View>
      ) : null}

      <SectionTitle title="Your requests" />
      {requestsState === 'loading' ? <LoadingState message="Loading requests..." /> : null}
      {requestsState === 'error' ? (
        <ErrorState message={getApiErrorMessage(requestsQuery.error)} onRetry={() => void requestsQuery.refetch()} />
      ) : null}
      {requestsState === 'empty' ? (
        <EmptyState icon="file-tray-outline" title="No requests yet" message="When you request a service, it will appear here." />
      ) : null}
      {requestsState === 'ready' ? (
        <View style={styles.list}>
          {requestsQuery.data?.items.map((request) => (
            <AppCard key={request.id}>
              <Text style={styles.requestName}>{request.serviceName}</Text>
              <ServiceStatus status={request.status} compact />
            </AppCard>
          ))}
        </View>
      ) : null}

      <ServiceRequestSheet
        visible={Boolean(sheetService)}
        service={sheetService}
        seniorName={senior.data ? seniorDisplayName(senior.data) : null}
        submitting={createRequest.isPending}
        errorMessage={sheetError}
        onConfirm={() => void onConfirmRequest()}
        onCancel={() => {
          if (createRequest.isPending) {
            return;
          }
          setSheetService(null);
          setSheetError(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  cta: {
    marginBottom: spacing.xxl,
  },
  requestName: {
    ...typography.bodyStrong,
    color: colors.text,
    marginBottom: spacing.sm,
  },
});
