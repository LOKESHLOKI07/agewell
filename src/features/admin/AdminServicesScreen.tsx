import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { PrimaryButton, TextField } from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import type { ServiceCategory, ServiceRequest, ServiceRequestStatus } from '@/features/home/types/home';
import { OFFERING_SERVICE_SLUGS } from '@/features/membership/catalogTypes';
import { pickProfilePhoto } from '@/features/profile/profilePhoto';
import { AdminCollection } from './components/AdminCollection';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminPagination } from './components/AdminPagination';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { findMembershipOps, MEMBERSHIP_OPS_MAP } from './membershipOpsMap';
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

function sortServices(items: AdminService[]): AdminService[] {
  return [...items].sort((a, b) => {
    const aMem = a.slug ? 0 : 1;
    const bMem = b.slug ? 0 : 1;
    if (aMem !== bMem) {
      return aMem - bMem;
    }
    return a.name.localeCompare(b.name);
  });
}

export function AdminServicesScreen() {
  const query = useAdminServices();
  const items = useMemo(() => sortServices(query.data ?? []), [query.data]);
  const membershipCount = items.filter((item) => Boolean(item.slug)).length;
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: items.length === 0,
  });

  return (
    <AdminScreen
      title="Services"
      subtitle={`${membershipCount} membership services with ops inbox map. Active/inactive not supported yet.`}
      actions={<PrimaryButton label="Create service" onPress={() => router.push('/(admin)/services/new' as Href)} />}
    >
      <View style={styles.opsCard}>
        <Text style={styles.opsTitle}>How admin handles member services</Text>
        <Text style={styles.opsBody}>
          Catalogue rows below are what members see. Day-to-day work happens in the matching inbox. Grocery and food
          menus are under Grocery / Food catalog. Other services use Service items (add / edit / images).
        </Text>
        <View style={styles.opsChips}>
          {Array.from(new Set(MEMBERSHIP_OPS_MAP.map((item) => item.adminLabel))).map((label) => (
            <View key={label} style={styles.opsChip}>
              <Text style={styles.opsChipText}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading services..."
        emptyTitle="No services"
        emptyMessage="Run API seed to load the 19 membership services."
      >
        <AdminCollection
          items={items}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) =>
            `${item.name}, ${humanizeStatus(item.category)}${item.slug ? `, slug ${item.slug}` : ''}`
          }
          onPress={(item) => router.push(`/(admin)/services/${item.id}` as Href)}
          columns={[
            { key: 'name', label: 'Name', render: (item: AdminService) => <Text style={cell}>{item.name}</Text> },
            {
              key: 'slug',
              label: 'Slug',
              render: (item) => <Text style={cell}>{item.slug ?? '—'}</Text>,
            },
            { key: 'category', label: 'Category', render: (item) => <Text style={cell}>{humanizeStatus(item.category)}</Text> },
            {
              key: 'inbox',
              label: 'Admin inbox',
              flex: 1.2,
              render: (item) => {
                const ops = findMembershipOps(item.slug);
                return <Text style={cell}>{ops?.adminLabel ?? 'Custom / requests'}</Text>;
              },
            },
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
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const ops = findMembershipOps(service?.slug);
  const hasOfferings =
    Boolean(service?.slug) &&
    OFFERING_SERVICE_SLUGS.includes(service!.slug as (typeof OFFERING_SERVICE_SLUGS)[number]);

  useEffect(() => {
    if (service) {
      setName(service.name);
      setDescription(service.description);
      setCategory(service.category as ServiceCategory);
      setCoverImage(service.coverImage);
    }
  }, [service]);

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && !service,
  });

  const onPickCover = async () => {
    try {
      const dataUrl = await pickProfilePhoto('library');
      if (dataUrl) setCoverImage(dataUrl);
    } catch (error) {
      Alert.alert('Image', error instanceof Error ? error.message : 'Unable to pick image.');
    }
  };

  return (
    <AdminScreen title="Edit service" subtitle="Upload a cover image and edit copy. Slug is set by membership seed.">
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading service..."
        emptyTitle="Service not found"
        emptyMessage="This service is not in the catalogue."
      >
        <View style={[styles.card, shadows.card]}>
          {service?.slug ? (
            <View style={styles.slugBlock}>
              <Text style={styles.slugLabel}>Membership slug</Text>
              <Text style={styles.slugValue}>{service.slug}</Text>
              {ops ? (
                <>
                  <Text style={styles.slugLabel}>Admin handles in</Text>
                  {ops.adminHref ? (
                    <Pressable onPress={() => router.push(ops.adminHref!)} accessibilityRole="link">
                      <Text style={styles.inboxLink}>{ops.adminLabel} →</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.slugValue}>{ops.adminLabel}</Text>
                  )}
                  <Text style={styles.opsNote}>{ops.note}</Text>
                </>
              ) : null}
              {hasOfferings ? (
                <Pressable
                  onPress={() => router.push(`/(admin)/catalog/offerings/${service.slug}` as Href)}
                  accessibilityRole="link"
                  style={styles.itemsLinkWrap}
                >
                  <Text style={styles.inboxLink}>Manage catalogue items & images →</Text>
                </Pressable>
              ) : service?.slug === 'grocery' ? (
                <Pressable
                  onPress={() => router.push('/(admin)/catalog/grocery' as Href)}
                  accessibilityRole="link"
                  style={styles.itemsLinkWrap}
                >
                  <Text style={styles.inboxLink}>Manage grocery catalog →</Text>
                </Pressable>
              ) : service?.slug === 'food' ? (
                <Pressable
                  onPress={() => router.push('/(admin)/catalog/food' as Href)}
                  accessibilityRole="link"
                  style={styles.itemsLinkWrap}
                >
                  <Text style={styles.inboxLink}>Manage food catalog →</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          <TextField label="Name" value={name} onChangeText={setName} />
          <AdminFilterChips label="Category" value={category} options={CATEGORIES} onChange={(next) => next && setCategory(next)} allowAll={false} />
          <TextField label="Description" value={description} onChangeText={setDescription} multiline />
          <Text style={styles.slugLabel}>Cover image</Text>
          <View style={styles.coverRow}>
            {coverImage ? (
              <Image source={{ uri: coverImage }} style={styles.coverThumb} accessibilityLabel="Service cover" />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Text style={styles.coverPlaceholderText}>No image</Text>
              </View>
            )}
            <PrimaryButton label={coverImage ? 'Change image' : 'Upload image'} onPress={() => void onPickCover()} />
            {coverImage ? (
              <Pressable onPress={() => setCoverImage(null)} accessibilityRole="button">
                <Text style={styles.inboxLink}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
          {formError ? <Text style={styles.error}>{formError}</Text> : null}
          <PrimaryButton
            label="Save changes"
            loading={update.isPending}
            onPress={() => {
              setFormError(null);
              update.mutate(
                { name, category, description, coverImage },
                { onError: (error) => setFormError(getAdminErrorMessage(error)) },
              );
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
    <AdminScreen title="Service Requests" subtitle="Update status for membership requests. Notes come from the member app.">
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
            {
              key: 'notes',
              label: 'Notes',
              flex: 1.3,
              render: (item) => <Text style={cell} numberOfLines={2}>{item.notes ?? '—'}</Text>,
            },
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
  opsCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  opsTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  opsBody: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  opsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  opsChip: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  opsChipText: {
    ...typography.captionStrong,
    color: colors.text,
  },
  slugBlock: {
    marginBottom: spacing.lg,
    gap: 4,
  },
  slugLabel: {
    ...typography.captionStrong,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  slugValue: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  inboxLink: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  opsNote: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  itemsLinkWrap: {
    marginTop: spacing.md,
  },
  coverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  coverThumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  coverPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
