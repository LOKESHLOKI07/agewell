import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { PrimaryButton, StatusPill, TextField } from '@/components';
import { Icon, IconWell, type IconName } from '@/components/ui';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import type { ServiceCategory, ServiceRequest, ServiceRequestStatus } from '@/features/home/types/home';
import { OFFERING_SERVICE_SLUGS } from '@/features/membership/catalogTypes';
import { pickProfilePhoto } from '@/features/profile/profilePhoto';
import { ADD_ON_SERVICES } from '@/features/services/addOnServiceCatalog';
import { MARKETPLACE_SERVICES } from '@/features/services/serviceCatalog';
import { AdminCollection } from './components/AdminCollection';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminPagination } from './components/AdminPagination';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { findMembershipOps } from './membershipOpsMap';
import { useAdminServiceRequests, useAdminServices, useCreateAdminService, useUpdateAdminService, useUpdateAdminServiceRequest } from './hooks';
import {
  ADDON_SLUG_ORDER,
  MEMBERSHIP_SLUG_ORDER,
  SERVICE_TABLE_PAGE_SIZE,
  adminCatalogPath,
  adminServiceKind,
  filterAdminServices,
  requestCountsByName,
  topRequestedService,
  type AdminServiceListFilter,
} from './servicesAdminModel';
import { getAdminErrorMessage, getSectionState, humanizeStatus } from './selectors';
import type { AdminService } from './types';
import { ADMIN_PAGE_SIZE } from './types';
import { useAdminLayout } from './useAdminLayout';

const CATEGORIES: { value: ServiceCategory; label: string }[] = [
  { value: 'CARE', label: 'Care' },
  { value: 'FOOD_HOME', label: 'Food & Home' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'MOBILITY', label: 'Mobility' },
  { value: 'COMMUNITY', label: 'Community' },
  { value: 'ADD_ON', label: 'Extra' },
];

const MEMBERSHIP_FILTERS: { value: AdminServiceListFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'CARE', label: 'Care' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'MOBILITY', label: 'Mobility' },
  { value: 'FOOD_HOME', label: 'Food & Home' },
  { value: 'COMMUNITY', label: 'Community' },
  { value: 'ADD_ON', label: 'Extra' },
  { value: 'other', label: 'Other' },
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
  return <AdminServiceDirectory scope="membership" />;
}

export function AdminAddonServicesScreen() {
  return <AdminServiceDirectory scope="addons" />;
}

function AdminServiceDirectory({ scope }: { scope: 'membership' | 'addons' }) {
  const { isDesktop } = useAdminLayout();
  const query = useAdminServices();
  const requests = useAdminServiceRequests({ limit: 100, offset: 0 });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<AdminServiceListFilter>('all');
  const [offset, setOffset] = useState(0);
  const listFilter = scope === 'addons' ? 'addons' : filter;

  const allItems = query.data ?? [];
  const membershipCount = allItems.filter((item) => adminServiceKind(item.slug) === 'membership').length;
  const addonCount = allItems.filter((item) => adminServiceKind(item.slug) === 'addon').length;
  const otherCount = allItems.filter((item) => {
    const kind = adminServiceKind(item.slug);
    return kind === 'custom' || kind === 'extra';
  }).length;
  const requestCounts = useMemo(
    () => requestCountsByName((requests.data?.items ?? []).map((item) => ({ serviceName: item.serviceName }))),
    [requests.data?.items],
  );
  const mostRequested = topRequestedService(allItems, requestCounts);
  const filtered = useMemo(
    () => filterAdminServices(allItems, listFilter, search),
    [allItems, listFilter, search],
  );
  const page = filtered.slice(offset, offset + SERVICE_TABLE_PAGE_SIZE);
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: filtered.length === 0,
  });

  useEffect(() => {
    setOffset(0);
  }, [filter, search, scope]);

  if (scope === 'addons') {
    return (
      <AdminScreen
        title="Add-on Services"
        subtitle="These five add-ons are not part of the 21 membership services. Food Delivery has its own catalog."
      >
        <View style={[styles.metrics, isDesktop ? styles.metricsDesktop : null]}>
          <MetricCard
            label="Add-on services"
            value={String(addonCount)}
            hint={`Of ${ADDON_SLUG_ORDER.length} home add-ons`}
            icon="sparkles"
            tone="safe"
          />
          <MetricCard
            label="Membership"
            value={String(MEMBERSHIP_SLUG_ORDER.length)}
            hint="Managed under Services"
            icon="grid-outline"
            tone="accent"
          />
        </View>
        <View style={styles.toolbarCard}>
          <TextField label="Search add-on services" value={search} onChangeText={setSearch} />
        </View>
        <AdminQueryView
          state={state}
          error={query.error}
          onRetry={() => void query.refetch()}
          loadingMessage="Loading add-on services..."
          emptyTitle="No add-ons on file"
          emptyMessage="Add-on booking services are seeded separately from the 21 membership services."
        >
          <ServiceRows isDesktop={isDesktop} page={page} requestCounts={requestCounts} />
        </AdminQueryView>
      </AdminScreen>
    );
  }

  return (
    <AdminScreen
      title="Services"
      subtitle="The 21 Single Membership services, in brochure order. Add-ons have their own sidebar page."
      actions={
        <PrimaryButton label="Add Service" fullWidth={false} onPress={() => router.push('/(admin)/services/new' as Href)} />
      }
    >
      <View style={[styles.metrics, isDesktop ? styles.metricsDesktop : null]}>
        <MetricCard
          label="Total membership"
          value={String(membershipCount)}
          hint={`Of ${MEMBERSHIP_SLUG_ORDER.length} brochure services`}
          icon="grid-outline"
          tone="accent"
        />
        <MetricCard
          label="Other / custom"
          value={String(otherCount)}
          hint="Not in the 21 membership list"
          icon="time-outline"
          tone="warning"
        />
        <MetricCard
          label="Most requested"
          value={mostRequested ? mostRequested.name : 'No requests yet'}
          hint={mostRequested ? `${mostRequested.count} on file` : 'From live service requests'}
          icon="people-outline"
          tone="emergency"
        />
      </View>

      <View style={styles.toolbarCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {MEMBERSHIP_FILTERS.map((item) => {
            const selected = filter === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => setFilter(item.value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={item.label}
                style={({ pressed }) => [styles.filterChip, selected ? styles.filterChipOn : null, pressed ? styles.pressed : null]}
              >
                <Text style={[styles.filterLabel, selected ? styles.filterLabelOn : null]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <TextField label="Search services" value={search} onChangeText={setSearch} />
      </View>

      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading services..."
        emptyTitle="No services"
        emptyMessage="Run API seed to load the 21 membership services."
      >
        <ServiceRows isDesktop={isDesktop} page={page} requestCounts={requestCounts} />
        <AdminPagination
          total={filtered.length}
          limit={SERVICE_TABLE_PAGE_SIZE}
          offset={offset}
          onOffsetChange={setOffset}
        />
      </AdminQueryView>
    </AdminScreen>
  );
}

function ServiceRows({
  isDesktop,
  page,
  requestCounts,
}: {
  isDesktop: boolean;
  page: AdminService[];
  requestCounts: Map<string, number>;
}) {
  if (!isDesktop) {
    return (
      <View style={styles.mobileList}>
        {page.map((item) => (
          <ServiceMobileCard
            key={item.id}
            service={item}
            requestCount={requestCounts.get(item.name.trim().toLowerCase()) ?? 0}
          />
        ))}
      </View>
    );
  }
  return (
    <View style={styles.table}>
      <View style={styles.tableHead}>
        <Text style={[styles.th, styles.colService]}>Service</Text>
        <Text style={[styles.th, styles.colCat]}>Category</Text>
        <Text style={[styles.th, styles.colPrice]}>Price / slot</Text>
        <Text style={[styles.th, styles.colDur]}>Duration</Text>
        <Text style={[styles.th, styles.colStatus]}>Kind</Text>
        <Text style={[styles.th, styles.colBook]}>Requests</Text>
        <Text style={[styles.th, styles.colActions]}>Actions</Text>
      </View>
      {page.map((item) => (
        <ServiceTableRow
          key={item.id}
          service={item}
          requestCount={requestCounts.get(item.name.trim().toLowerCase()) ?? 0}
        />
      ))}
    </View>
  );
}

function ServiceTableRow({ service, requestCount }: { service: AdminService; requestCount: number }) {
  const look = serviceLook(service);
  const kind = adminServiceKind(service.slug);
  return (
    <View style={styles.tableRow}>
      <Pressable
        onPress={() => router.push(`/(admin)/services/${service.id}` as Href)}
        accessibilityRole="button"
        accessibilityLabel={service.name}
        style={styles.colService}
      >
        <View style={styles.serviceCell}>
          <View style={[styles.serviceIcon, { backgroundColor: look.background }]}>
            <Icon name={look.icon} size={16} color={look.color} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceDesc} numberOfLines={1}>
              {service.description}
            </Text>
          </View>
        </View>
      </Pressable>
      <View style={styles.colCat}>
        <View style={[styles.catPill, { backgroundColor: look.background }]}>
          <Text style={[styles.catPillLabel, { color: look.color }]}>{humanizeStatus(service.category)}</Text>
        </View>
      </View>
      <Text style={[styles.td, styles.colPrice]}>—</Text>
      <Text style={[styles.td, styles.colDur]}>—</Text>
      <View style={styles.colStatus}>
        <StatusPill label={kindLabel(kind)} tone={kind === 'addon' ? 'warning' : kind === 'membership' ? 'safe' : 'default'} />
      </View>
      <Text style={[styles.td, styles.colBook]}>{requestCount}</Text>
      <View style={[styles.colActions, styles.rowActions]}>
        <IconBtn icon="create-outline" label={`Edit ${service.name}`} onPress={() => router.push(`/(admin)/services/${service.id}?edit=1` as Href)} />
        <IconBtn icon="eye-outline" label={`View ${service.name}`} onPress={() => router.push(`/(admin)/services/${service.id}` as Href)} />
        {service.slug ? (
          <IconBtn
            icon="cart-outline"
            label={`Catalog for ${service.name}`}
            onPress={() => router.push(adminCatalogPath(service.slug!) as Href)}
          />
        ) : null}
      </View>
    </View>
  );
}

function ServiceMobileCard({ service, requestCount }: { service: AdminService; requestCount: number }) {
  const look = serviceLook(service);
  const kind = adminServiceKind(service.slug);
  return (
    <Pressable
      onPress={() => router.push(`/(admin)/services/${service.id}` as Href)}
      accessibilityRole="button"
      accessibilityLabel={service.name}
      style={({ pressed }) => [styles.mobileCard, pressed ? styles.pressed : null]}
    >
      <View style={styles.serviceCell}>
        <View style={[styles.serviceIcon, { backgroundColor: look.background }]}>
          <Icon name={look.icon} size={16} color={look.color} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.serviceDesc} numberOfLines={2}>
            {service.description}
          </Text>
          <Text style={styles.serviceMeta}>
            {humanizeStatus(service.category)} · {kindLabel(kind)} · {requestCount} requests
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: IconName;
  tone: 'accent' | 'safe' | 'warning' | 'emergency';
}) {
  const bg =
    tone === 'accent' ? '#F3EEFF' : tone === 'safe' ? colors.safeSoft : tone === 'warning' ? colors.warningSoft : colors.emergencySoft;
  const fg =
    tone === 'accent' ? colors.sidebarActive : tone === 'safe' ? colors.safe : tone === 'warning' ? colors.warning : colors.emergency;
  return (
    <View style={[styles.metric, { backgroundColor: bg }]}>
      <IconWell tone={tone === 'accent' ? 'primary' : tone} size={36}>
        <Icon name={icon} size={16} color={fg} />
      </IconWell>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={2}>
        {value}
      </Text>
      <Text style={styles.metricHint}>{hint}</Text>
    </View>
  );
}

function IconBtn({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.iconBtn, pressed ? styles.pressed : null]}
    >
      <Icon name={icon} size={16} color={colors.sidebarActive} />
    </Pressable>
  );
}

function kindLabel(kind: ReturnType<typeof adminServiceKind>): string {
  if (kind === 'membership') {
    return 'Membership';
  }
  if (kind === 'addon') {
    return 'Add-on';
  }
  if (kind === 'extra') {
    return 'Other';
  }
  return 'Custom';
}

function serviceLook(service: AdminService): { icon: IconName; color: string; background: string } {
  const fromMembership = MARKETPLACE_SERVICES.find((item) => item.id === service.slug);
  if (fromMembership) {
    return { icon: fromMembership.icon, color: fromMembership.color, background: fromMembership.background };
  }
  const fromAddon = ADD_ON_SERVICES.find((item) => item.id === service.slug);
  if (fromAddon) {
    return { icon: fromAddon.icon, color: fromAddon.color, background: fromAddon.background };
  }
  return { icon: 'grid-outline', color: colors.sidebarActive, background: '#F3EEFF' };
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

  const kind = adminServiceKind(service?.slug);

  return (
    <AdminScreen
      title="Edit service"
      subtitle="Upload a cover image and edit copy. Slug is set by membership seed."
      backHref="/(admin)/services"
    >
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
              <Text style={styles.slugLabel}>Kind</Text>
              <Text style={styles.slugValue}>{kindLabel(kind)}</Text>
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
    <AdminScreen title="Create service" subtitle="Adds a custom catalogue row. The 21 membership services come from seed." backHref="/(admin)/services">
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
  metrics: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metricsDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metric: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
    flexGrow: 1,
    flexBasis: 170,
    minWidth: 160,
    gap: spacing.xs,
  },
  metricLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  metricValue: {
    ...typography.subtitle,
    color: colors.text,
  },
  metricHint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  toolbarCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  filterRow: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  filterChip: {
    minHeight: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipOn: {
    borderColor: colors.sidebarActive,
    backgroundColor: '#F3EEFF',
  },
  filterLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  filterLabelOn: {
    color: colors.sidebarActive,
  },
  table: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    ...shadows.card,
    overflow: 'hidden',
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.adminCanvas,
    gap: spacing.sm,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  th: {
    ...typography.captionStrong,
    color: colors.textMuted,
  },
  td: {
    ...typography.body,
    color: colors.text,
  },
  colService: { flex: 2.2, minWidth: 180 },
  colCat: { flex: 0.9, minWidth: 90 },
  colPrice: { flex: 0.7, minWidth: 70 },
  colDur: { flex: 0.7, minWidth: 70 },
  colStatus: { flex: 0.9, minWidth: 90 },
  colBook: { flex: 0.6, minWidth: 60 },
  colActions: { flex: 0.9, minWidth: 96 },
  serviceCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  serviceIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceName: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  serviceDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  serviceMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  catPill: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  catPillLabel: {
    ...typography.captionStrong,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: minTouchSize,
    height: minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileList: {
    gap: spacing.md,
  },
  mobileCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.85,
  },
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
