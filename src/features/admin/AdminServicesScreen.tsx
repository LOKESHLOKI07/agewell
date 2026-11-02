import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { PrimaryButton, SecondaryButton, StatusPill, TextField } from '@/components';
import { Icon, IconWell, type IconName } from '@/components/ui';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import type { ServiceCategory, ServiceRequest, ServiceRequestStatus } from '@/features/home/types/home';
import { OFFERING_SERVICE_SLUGS } from '@/features/membership/catalogTypes';
import { pickProfilePhoto } from '@/features/profile/profilePhoto';
import { ADD_ON_SERVICES } from '@/features/services/addOnServiceCatalog';
import { ProofPhotoField } from '@/features/care/ProofPhotoField';
import { assignableCareAssociates } from '@/features/care/serviceCompanionServices';
import { isServiceCompanionKind } from '@/features/care/staffKind';
import { MARKETPLACE_SERVICES } from '@/features/services/serviceCatalog';
import {
  needsServiceCompanionDispatch,
  requestNeedsFieldAssign,
  requiresProofPhoto,
  roleCanFinish,
  SERVICE_POLICY_OPTIONS,
  shouldAutoAssignStanding,
  usesDeliveryJob,
} from '@/features/services/servicePolicy';
import { AdminCollection } from './components/AdminCollection';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminPagination } from './components/AdminPagination';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { findMembershipOps } from './membershipOpsMap';
import {
  useAdminCareManagers,
  useAdminSeniors,
  useAdminServiceRequests,
  useAdminServices,
  useAssignAdminServiceRequest,
  useAutoAssignAdminServiceRequest,
  useAdminUnassignedServiceRequestCounts,
  useCreateAdminService,
  useUpdateAdminService,
  useUpdateAdminServiceRequest,
} from './hooks';
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
import {
  adminCareManagerDisplay,
  adminSeniorDisplay,
  adminStaffKindLabel,
  adminStaffServiceLine,
  getAdminErrorMessage,
  getSectionState,
  humanizeStatus,
} from './selectors';
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
        subtitle="These five add-ons are not part of the 21 membership services. Tiffin Box has its own catalog."
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
  const [callHoursText, setCallHoursText] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
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
      setCallHoursText(service.callHoursText ?? '');
      setSupportPhone(service.supportPhone ?? '');
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
                  <Text style={styles.inboxLink}>
                    {service.slug === 'food'
                      ? 'Manage meal plans & prices →'
                      : 'Manage plans, prices & catalogue items →'}
                  </Text>
                </Pressable>
              ) : null}
              {service?.slug === 'grocery' ? (
                <Pressable
                  onPress={() => router.push('/(admin)/catalog/grocery' as Href)}
                  accessibilityRole="link"
                  style={styles.itemsLinkWrap}
                >
                  <Text style={styles.inboxLink}>Manage grocery catalog →</Text>
                </Pressable>
              ) : null}
              {service?.slug === 'food' ? (
                <Pressable
                  onPress={() => router.push('/(admin)/catalog/food' as Href)}
                  accessibilityRole="link"
                  style={styles.itemsLinkWrap}
                >
                  <Text style={styles.inboxLink}>Manage cuisine menu →</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          <TextField label="Name" value={name} onChangeText={setName} />
          <AdminFilterChips label="Category" value={category} options={CATEGORIES} onChange={(next) => next && setCategory(next)} allowAll={false} />
          <TextField label="Description / About this service" value={description} onChangeText={setDescription} multiline />
          <TextField
            label="Call hours (member app)"
            value={callHoursText}
            onChangeText={setCallHoursText}
            placeholder="e.g. 10:00 AM – 6:00 PM"
          />
          <TextField
            label="Support phone (optional)"
            value={supportPhone}
            onChangeText={setSupportPhone}
            placeholder="e.g. 9876543210"
            keyboardType="phone-pad"
          />
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
          {savedMessage ? (
            <Text style={styles.success} accessibilityLiveRegion="polite">
              {savedMessage}
            </Text>
          ) : null}
          <PrimaryButton
            label="Save changes"
            loading={update.isPending}
            onPress={() => {
              setFormError(null);
              setSavedMessage(null);
              update.mutate(
                {
                  name,
                  category,
                  description,
                  coverImage,
                  callHoursText: callHoursText.trim() || null,
                  supportPhone: supportPhone.trim() || null,
                },
                {
                  onSuccess: () => {
                    setSavedMessage('Saved successfully');
                    Alert.alert('Saved successfully', 'Your changes have been saved.');
                  },
                  onError: (error) => setFormError(getAdminErrorMessage(error)),
                },
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
  const [serviceSlug, setServiceSlug] = useState<string | undefined>();
  const query = useAdminServiceRequests({ limit: ADMIN_PAGE_SIZE, offset, status, serviceSlug });
  const unassignedCounts = useAdminUnassignedServiceRequestCounts();
  const update = useUpdateAdminServiceRequest();
  const assign = useAssignAdminServiceRequest();
  const autoAssign = useAutoAssignAdminServiceRequest();
  const seniors = useAdminSeniors({ limit: 100, offset: 0 });
  const managers = useAdminCareManagers();
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingComplete, setPendingComplete] = useState<ServiceRequest | null>(null);
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [pendingAssign, setPendingAssign] = useState<ServiceRequest | null>(null);
  const [autoAssigningId, setAutoAssigningId] = useState<string | null>(null);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: (query.data?.items.length ?? 0) === 0,
  });
  const seniorNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const senior of seniors.data?.items ?? []) {
      names.set(senior.id, adminSeniorDisplay(senior));
    }
    return names;
  }, [seniors.data?.items]);
  const scOnlyAssign = Boolean(
    pendingAssign &&
      needsServiceCompanionDispatch(pendingAssign.serviceSlug) &&
      (pendingAssign.awaitingDispatch || pendingAssign.dispatcherId),
  );
  const assignOptions = useMemo(() => {
    if (!pendingAssign) {
      return [];
    }
    let staff = assignableCareAssociates(managers.data ?? [], { serviceSlug: pendingAssign.serviceSlug });
    if (scOnlyAssign) {
      staff = staff.filter((item) => isServiceCompanionKind(item.staffKind));
    } else if (needsServiceCompanionDispatch(pendingAssign.serviceSlug)) {
      // No standing companion yet: Admin may soft-assign Companion or execute via SC.
      staff = staff.filter(
        (item) => isServiceCompanionKind(item.staffKind) || item.staffKind === 'COMPANION',
      );
    }
    return staff.map((item) => ({
      id: item.id,
      title: adminCareManagerDisplay(item),
      subtitle: [
        adminStaffKindLabel(item.staffKind),
        item.employeeId,
        isServiceCompanionKind(item.staffKind) ? adminStaffServiceLine(item) : null,
      ]
        .filter(Boolean)
        .join(' · '),
    }));
  }, [managers.data, pendingAssign, scOnlyAssign]);
  const filteredAssignOptions = useMemo(() => {
    const q = assigneeSearch.trim().toLowerCase();
    if (!q) return assignOptions;
    return assignOptions.filter((item) => {
      const haystack = `${item.title} ${item.subtitle ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [assignOptions, assigneeSearch]);
  const serviceCounts = unassignedCounts.data ?? {};
  const unassignedTotal = useMemo(
    () => Object.values(serviceCounts).reduce((sum, value) => sum + value, 0),
    [serviceCounts],
  );

  useEffect(() => {
    if (!pendingAssign || assigneeIds.length > 0 || assignOptions.length !== 1) {
      return;
    }
    setAssigneeIds([assignOptions[0].id]);
  }, [assigneeIds.length, assignOptions, pendingAssign]);

  const seniorLabel = (item: ServiceRequest) =>
    item.seniorName?.trim() || seniorNames.get(item.seniorId) || item.seniorId;

  const closeAssign = () => {
    setPendingAssign(null);
    setAssigneeIds([]);
    setAssigneeSearch('');
  };

  const toggleAssignee = (id: string) => {
    setFormError(null);
    setAssigneeIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const confirmAssign = () => {
    if (!pendingAssign) {
      return;
    }
    if (assigneeIds.length === 0) {
      setFormError('Select at least one person to assign.');
      return;
    }
    setFormError(null);
    assign.mutate(
      { id: pendingAssign.id, careManagerIds: assigneeIds },
      {
        onError: (error) => setFormError(getAdminErrorMessage(error)),
        onSuccess: () => {
          const names = assigneeIds
            .map((id) => assignOptions.find((item) => item.id === id)?.title)
            .filter(Boolean);
          const label =
            names.length === 0
              ? 'staff'
              : names.length === 1
                ? names[0]
                : `${names.length} people`;
          setSuccessMessage(`Assigned ${pendingAssign.serviceName} to ${label}.`);
          closeAssign();
        },
      },
    );
  };

  return (
    <AdminScreen title="Service Requests" subtitle="Find the request, then Assign a Care Manager, Companion, or Service Companion.">
      <AdminFilterChips
        label="Status"
        value={status}
        options={REQUEST_STATUSES}
        onChange={(next) => {
          setOffset(0);
          setStatus(next);
        }}
      />
      <AdminFilterChips
        label="Service"
        value={serviceSlug}
        options={SERVICE_POLICY_OPTIONS}
        counts={serviceCounts}
        allCount={unassignedTotal}
        onChange={(next) => {
          setOffset(0);
          setServiceSlug(next);
          if (next) {
            setStatus(undefined);
          }
        }}
      />
      {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}
      {formError && !pendingAssign ? <Text style={styles.error}>{formError}</Text> : null}
      {pendingComplete ? (
        <View style={styles.toolbarCard}>
          <Text style={styles.metricLabel}>Complete {pendingComplete.serviceName}</Text>
          <Text style={styles.metricHint}>This service needs a proof photo before it can be closed.</Text>
          <ProofPhotoField value={proofPhoto} onChange={setProofPhoto} required />
          <PrimaryButton
            label="Confirm complete"
            loading={update.isPending}
            onPress={() => {
              if (!proofPhoto) {
                setFormError('A proof photo is required to complete this service.');
                return;
              }
              setFormError(null);
              update.mutate(
                { id: pendingComplete.id, status: 'COMPLETED', proofPhoto },
                {
                  onError: (error) => setFormError(getAdminErrorMessage(error)),
                  onSuccess: () => {
                    setPendingComplete(null);
                    setProofPhoto(null);
                  },
                },
              );
            }}
          />
          <PrimaryButton
            label="Cancel"
            onPress={() => {
              setPendingComplete(null);
              setProofPhoto(null);
            }}
          />
        </View>
      ) : null}
      <Modal visible={Boolean(pendingAssign)} transparent animationType="fade" onRequestClose={closeAssign}>
        <View style={styles.assignOverlay}>
          <Pressable style={styles.assignBackdrop} onPress={closeAssign} accessibilityRole="button" accessibilityLabel="Close assign" />
          <View style={styles.assignSheet}>
            <Text style={styles.metricLabel}>
              Assign {pendingAssign?.serviceName} · {pendingAssign ? seniorLabel(pendingAssign) : ''}
            </Text>
            <Text style={styles.metricHint}>
              {scOnlyAssign
                ? 'Companion already has this request. Assign a Service Companion to execute.'
                : needsServiceCompanionDispatch(pendingAssign?.serviceSlug)
                  ? 'No standing Companion yet — assign a Companion to dispatch, or a Service Companion to execute now.'
                  : usesDeliveryJob(pendingAssign?.serviceSlug)
                    ? 'Creates a delivery for each selected Service Companion.'
                    : 'Creates a visit for each selected Care Associate. You can assign more than one role on the same request.'}
            </Text>
            <Text style={styles.metricLabel}>
              {scOnlyAssign ? 'Assign Service Companion' : 'Assign to (multi-select)'}
            </Text>
            {assignOptions.length > 0 ? (
              <TextField
                label="Search staff"
                value={assigneeSearch}
                onChangeText={(next) => {
                  setAssigneeSearch(next);
                  setFormError(null);
                }}
                placeholder="Name or employee ID"
                autoCapitalize="none"
                autoCorrect={false}
              />
            ) : null}
            {managers.isPending ? <Text style={styles.metricHint}>Loading staff…</Text> : null}
            {!managers.isPending && assignOptions.length === 0 ? (
              <Text style={styles.error}>No ACTIVE staff match this service.</Text>
            ) : null}
            {!managers.isPending && assignOptions.length > 0 && filteredAssignOptions.length === 0 ? (
              <Text style={styles.error}>No staff match “{assigneeSearch.trim()}”.</Text>
            ) : null}
            <ScrollView style={styles.assignList} keyboardShouldPersistTaps="handled">
              {filteredAssignOptions.map((item) => {
                const selected = assigneeIds.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleAssignee(item.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    style={[styles.assignOption, selected ? styles.assignOptionSelected : null]}
                  >
                    <View style={styles.assignOptionRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.assignOptionTitle}>{item.title}</Text>
                        {item.subtitle ? <Text style={styles.assignOptionSub}>{item.subtitle}</Text> : null}
                      </View>
                      {selected ? <Icon name="checkmark-circle" size={22} color={colors.primary} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            {formError ? <Text style={styles.error}>{formError}</Text> : null}
            <PrimaryButton
              label={
                assigneeIds.length > 1
                  ? `Confirm assign (${assigneeIds.length})`
                  : 'Confirm assign'
              }
              loading={assign.isPending}
              onPress={confirmAssign}
            />
            <SecondaryButton label="Cancel" onPress={closeAssign} />
          </View>
        </View>
      </Modal>
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
          actionsLabel="Assign"
          actions={(item) =>
            requestNeedsFieldAssign(item.serviceSlug) && item.status !== 'COMPLETED' && item.status !== 'CANCELLED' ? (
              <PrimaryButton
                label={
                  item.awaitingDispatch
                    ? 'Assign SC'
                    : item.status === 'ASSIGNED'
                      ? 'Reassign'
                      : shouldAutoAssignStanding(item.serviceSlug)
                        ? 'Auto-assign'
                        : 'Assign'
                }
                loading={autoAssigningId === item.id}
                onPress={() => {
                  setFormError(null);
                  setSuccessMessage(null);
                  setPendingComplete(null);
                  // Health-check style: route standing CM/Companion immediately — no Confirm modal.
                  if (
                    shouldAutoAssignStanding(item.serviceSlug) &&
                    item.status !== 'ASSIGNED' &&
                    !item.awaitingDispatch
                  ) {
                    setAutoAssigningId(item.id);
                    autoAssign.mutate(item.id, {
                      onSettled: () => setAutoAssigningId(null),
                      onError: (error) => {
                        setFormError(getAdminErrorMessage(error));
                        setPendingAssign(item);
                        setAssigneeIds([]);
                      },
                      onSuccess: (assigned) => {
                        setSuccessMessage(
                          `Auto-assigned ${assigned.serviceName} to standing staff for ${seniorLabel(assigned)}.`,
                        );
                      },
                    });
                    return;
                  }
                  setPendingAssign(item);
                  setAssigneeIds([]);
                }}
              />
            ) : (
              <Text style={cell}>Inbox</Text>
            )
          }
          columns={[
            { key: 'senior', label: 'Senior', render: (item: ServiceRequest) => <Text style={cell}>{seniorLabel(item)}</Text> },
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
                    if (next === 'COMPLETED' && !roleCanFinish(item.serviceSlug, 'ADMIN')) {
                      setFormError('Only the final finisher can close this service.');
                      return;
                    }
                    if (next === 'COMPLETED' && requiresProofPhoto(item.serviceSlug)) {
                      setPendingComplete(item);
                      setProofPhoto(null);
                      return;
                    }
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
  success: {
    ...typography.bodyStrong,
    color: colors.safe,
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
  assignOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  assignBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  assignSheet: {
    zIndex: 2,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  assignList: {
    maxHeight: 280,
  },
  assignOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  assignOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  assignOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  assignOptionTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  assignOptionSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
