import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { PrimaryButton, TextField } from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import type { ServiceCategory, ServiceRequest, ServiceRequestStatus } from '@/features/home/types/home';
import { AdminCollection } from './components/AdminCollection';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminPagination } from './components/AdminPagination';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { useAdminServiceRequests, useAdminServices, useCreateAdminService, useUpdateAdminService, useUpdateAdminServiceRequest } from './hooks';
import { getAdminErrorMessage, getSectionState, humanizeStatus } from './selectors';
import type { AdminService } from './types';
import { ADMIN_PAGE_SIZE } from './types';

const CATEGORIES: { value: ServiceCategory; label: string }[] = [
  { value: 'CARE', label: 'Care' },
  { value: 'FOOD_HOME', label: 'Food & Home' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'MOBILITY', label: 'Mobility' },
  { value: 'COMMUNITY', label: 'Community' },
  { value: 'ADD_ON', label: 'Add-on' },
];

const REQUEST_STATUSES: { value: ServiceRequestStatus; label: string }[] = [
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function AdminServicesScreen() {
  const query = useAdminServices();
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: (query.data?.length ?? 0) === 0,
  });

  return (
    <AdminScreen
      title="Services"
      subtitle="Catalogue management. Active/inactive is not supported."
      actions={<PrimaryButton label="Create service" onPress={() => router.push('/(admin)/services/new' as Href)} />}
    >
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading services..."
        emptyTitle="No services"
        emptyMessage="No catalogue services are on file."
      >
        <AdminCollection
          items={query.data ?? []}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => `${item.name}, ${humanizeStatus(item.category)}`}
          onPress={(item) => router.push(`/(admin)/services/${item.id}` as Href)}
          columns={[
            { key: 'name', label: 'Name', render: (item: AdminService) => <Text style={cell}>{item.name}</Text> },
            { key: 'category', label: 'Category', render: (item) => <Text style={cell}>{humanizeStatus(item.category)}</Text> },
            { key: 'description', label: 'Description', flex: 1.4, render: (item) => <Text style={cell}>{item.description}</Text> },
          ]}
        />
      </AdminQueryView>
    </AdminScreen>
  );
}

export function AdminServiceEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useAdminServices();
  const service = query.data?.find((item) => item.id === id);
  const update = useUpdateAdminService(id ?? '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('CARE');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (service) {
      setName(service.name);
      setDescription(service.description);
      setCategory(service.category as ServiceCategory);
    }
  }, [service]);

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && !service,
  });

  return (
    <AdminScreen title="Edit service" subtitle="Category must match the existing enum.">
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading service..."
        emptyTitle="Service not found"
        emptyMessage="This service is not in the catalogue."
      >
        <View style={[styles.card, shadows.card]}>
          <TextField label="Name" value={name} onChangeText={setName} />
          <AdminFilterChips label="Category" value={category} options={CATEGORIES} onChange={(next) => next && setCategory(next)} allowAll={false} />
          <TextField label="Description" value={description} onChangeText={setDescription} multiline />
          {formError ? <Text style={styles.error}>{formError}</Text> : null}
          <PrimaryButton
            label="Save changes"
            loading={update.isPending}
            onPress={() => {
              setFormError(null);
              update.mutate({ name, category, description }, { onError: (error) => setFormError(getAdminErrorMessage(error)) });
            }}
          />
        </View>
      </AdminQueryView>
    </AdminScreen>
  );
}

export function AdminServiceCreateScreen() {
  const create = useCreateAdminService();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('CARE');
  const [formError, setFormError] = useState<string | null>(null);

  return (
    <AdminScreen title="Create service">
      <TextField label="Name" value={name} onChangeText={setName} />
      <AdminFilterChips label="Category" value={category} options={CATEGORIES} onChange={(next) => next && setCategory(next)} allowAll={false} />
      <TextField label="Description" value={description} onChangeText={setDescription} multiline />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <PrimaryButton
        label="Create service"
        loading={create.isPending}
        onPress={() => {
          setFormError(null);
          create.mutate(
            { name, category, description },
            {
              onError: (error) => setFormError(getAdminErrorMessage(error)),
              onSuccess: () => router.replace('/(admin)/services' as Href),
            },
          );
        }}
      />
    </AdminScreen>
  );
}

export function AdminServiceRequestsScreen() {
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<ServiceRequestStatus | undefined>();
  const query = useAdminServiceRequests({ limit: ADMIN_PAGE_SIZE, offset, status });
  const update = useUpdateAdminServiceRequest();
  const [formError, setFormError] = useState<string | null>(null);
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: (query.data?.items.length ?? 0) === 0,
  });

  return (
    <AdminScreen title="Service Requests" subtitle="Status only. Scheduling and pricing fields do not exist.">
      <AdminFilterChips
        label="Status"
        value={status}
        options={REQUEST_STATUSES}
        onChange={(next) => {
          setOffset(0);
          setStatus(next);
        }}
      />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading service requests..."
        emptyTitle="No service requests"
        emptyMessage="No service requests match this filter."
      >
        <AdminCollection
          items={query.data?.items ?? []}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => `${item.serviceName}, ${humanizeStatus(item.status)}`}
          columns={[
            { key: 'senior', label: 'Senior', render: (item: ServiceRequest) => <Text style={cell}>{item.seniorId}</Text> },
            { key: 'service', label: 'Service', render: (item) => <Text style={cell}>{item.serviceName}</Text> },
            { key: 'status', label: 'Status', render: (item) => <Text style={cell}>{humanizeStatus(item.status)}</Text> },
            {
              key: 'update',
              label: 'Update',
              flex: 1.4,
              render: (item) => (
                <AdminFilterChips
                  label="Set status"
                  value={item.status}
                  options={REQUEST_STATUSES}
                  allowAll={false}
                  onChange={(next) => {
                    if (!next || next === item.status) return;
                    setFormError(null);
                    update.mutate({ id: item.id, status: next }, { onError: (error) => setFormError(getAdminErrorMessage(error)) });
                  }}
                />
              ),
            },
          ]}
        />
        <AdminPagination
          total={query.data?.total ?? 0}
          limit={query.data?.limit ?? ADMIN_PAGE_SIZE}
          offset={query.data?.offset ?? offset}
          onOffsetChange={setOffset}
        />
      </AdminQueryView>
    </AdminScreen>
  );
}

const cell = { ...typography.body, color: colors.text };

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
    marginBottom: spacing.md,
  },
});
