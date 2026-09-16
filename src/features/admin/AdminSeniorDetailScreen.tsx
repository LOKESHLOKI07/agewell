import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import {
  ConfirmDialog,
  PrimaryButton,
  SecondaryButton,
  StatusPill,
  TextField,
  statusToneFromLabel,
} from '@/components';
import { KeyboardAwareScrollView } from '@/components/KeyboardAwareScrollView';
import { Avatar, Icon, IconWell } from '@/components/ui';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import { onboardingLanguageLabel } from '@/features/auth/onboardingProfile';
import { formatLongDate, formatRelativeDay, formatRelativeTimestamp, formatTime, toDisplayDate } from '@/utils/date';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminSearchPicker } from './components/AdminSearchPicker';
import { deleteAdminSenior, updateAdminUser } from './api';
import {
  useAdminAppointments,
  useAdminAuditLogs,
  useAdminCareActivities,
  useAdminCareManagers,
  useAdminCurrentMembership,
  useAdminEmergencies,
  useAdminMedicalRecords,
  useAdminMembershipUsage,
  useAdminSenior,
  useAdminUser,
  useAdminVisits,
  useUpdateAdminCareActivity,
  useUpdateAdminSenior,
} from './hooks';
import {
  adminCareManagerDisplay,
  adminSeniorDisplay,
  adminSeniorLocationLabel,
  adminContactLine,
  getAdminErrorMessage,
  getSectionState,
  humanizeStatus,
  seniorAgeYears,
  shortSeniorCode,
} from './selectors';
import { CARE_ACTIVITY_STATUSES, CARE_ACTIVITY_TYPES, type CareActivity } from '@/features/membership/careManagerTypes';
import { useAdminLayout } from './useAdminLayout';

type SeniorTab = 'overview' | 'personal' | 'contacts' | 'visits' | 'health' | 'membership' | 'notes' | 'activity';

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

const TABS: { key: SeniorTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'personal', label: 'Personal Info' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'visits', label: 'Care/Visits' },
  { key: 'health', label: 'Health' },
  { key: 'membership', label: 'Membership' },
  { key: 'notes', label: 'Notes' },
  { key: 'activity', label: 'Activity' },
];

export function AdminSeniorDetailScreen() {
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const { isDesktop } = useAdminLayout();
  const query = useAdminSenior(id);
  const user = useAdminUser(query.data?.userId);
  const visits = useAdminVisits({ seniorId: id, limit: 20, offset: 0 });
  const managers = useAdminCareManagers();
  const careActivities = useAdminCareActivities(id);
  const updateActivity = useUpdateAdminCareActivity(id ?? '');
  const appointments = useAdminAppointments({ seniorId: id, limit: 5, offset: 0 });
  const health = useAdminMedicalRecords(id);
  const membership = useAdminCurrentMembership(id);
  const usage = useAdminMembershipUsage(id);
  const emergencies = useAdminEmergencies({ seniorId: id, limit: 5, offset: 0 });
  const audit = useAdminAuditLogs({ limit: 40, offset: 0 });
  const update = useUpdateAdminSenior(id ?? '');

  const [tab, setTab] = useState<SeniorTab>(edit === '1' ? 'personal' : 'overview');
  const [editing, setEditing] = useState(edit === '1');
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [familyContact1Name, setFamilyContact1Name] = useState('');
  const [familyContact1Phone, setFamilyContact1Phone] = useState('');
  const [familyContact2Name, setFamilyContact2Name] = useState('');
  const [familyContact2Phone, setFamilyContact2Phone] = useState('');
  const [preferredHospital, setPreferredHospital] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [accountStatus, setAccountStatus] = useState('ACTIVE');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (edit === '1') {
      setEditing(true);
      setTab('personal');
    }
  }, [edit]);

  useEffect(() => {
    if (query.data) {
      setFirstName(query.data.firstName);
      setLastName(query.data.lastName);
      setDateOfBirth(toDisplayDate(query.data.dateOfBirth));
      setAddress(query.data.address);
      setEmergencyContact(query.data.emergencyContact);
      setFamilyContact1Name(query.data.familyContact1Name ?? '');
      setFamilyContact1Phone(query.data.familyContact1Phone ?? '');
      setFamilyContact2Name(query.data.familyContact2Name ?? '');
      setFamilyContact2Phone(query.data.familyContact2Phone ?? '');
      setPreferredHospital(query.data.preferredHospital ?? '');
      setPreferredLanguage(query.data.preferredLanguage ?? '');
      setEmail(query.data.email ?? '');
      setPhone(query.data.phone ?? '');
      setAccountStatus(query.data.accountStatus ?? user.data?.accountStatus ?? 'ACTIVE');
    }
  }, [query.data, user.data?.accountStatus]);

  const visitItems = visits.data?.items ?? [];
  const nextVisit = useMemo(() => {
    return [...visitItems]
      .filter((item) => item.status === 'SCHEDULED' || item.status === 'CHECKED_IN' || item.status === 'IN_PROGRESS')
      .sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''))[0] ?? null;
  }, [visitItems]);
  const assignedCare = useMemo(() => {
    const standing = (managers.data ?? []).find((item) => item.id === query.data?.careManagerId);
    if (standing) {
      return adminCareManagerDisplay(standing);
    }
    const fromVisit = visitItems.find((item) => {
      const staff = (managers.data ?? []).find((manager) => manager.id === item.careManagerId);
      return staff && (!staff.staffKind || staff.staffKind === 'CARE_MANAGER');
    });
    return fromVisit?.careManagerName ?? null;
  }, [managers.data, query.data?.careManagerId, visitItems]);
  const assignedCompanion = useMemo(() => {
    const standing = (managers.data ?? []).find((item) => item.id === query.data?.companionId);
    if (standing) {
      return adminCareManagerDisplay(standing);
    }
    const fromVisit = visitItems.find((item) => {
      const staff = (managers.data ?? []).find((manager) => manager.id === item.careManagerId);
      return staff?.staffKind === 'COMPANION';
    });
    return fromVisit?.careManagerName ?? null;
  }, [managers.data, query.data?.companionId, visitItems]);
  const careTeamAssigned = Boolean(assignedCare || assignedCompanion);
  const healthCount = health.data?.items.length ?? 0;
  const activity = useMemo(() => {
    const rows = (audit.data?.items ?? []).filter((item) => item.entityId === id);
    if (user.data?.createdAt) {
      rows.push({
        id: `created-${query.data?.userId ?? 'user'}`,
        entityName: 'User',
        entityId: query.data?.userId ?? null,
        action: 'Account created',
        changes: null,
        createdAt: user.data.createdAt,
      });
    }
    return rows.slice(0, 8);
  }, [audit.data?.items, id, query.data?.userId, user.data?.createdAt]);

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && !query.data,
  });
  const senior = query.data;
  const displayName = senior ? adminSeniorDisplay(senior) : 'Senior';
  const age = senior ? seniorAgeYears(senior.dateOfBirth) : null;
  const scheduleHref = `/(admin)/visits/new?seniorId=${id}` as Href;

  const fillForm = (next = senior) => {
    if (!next) {
      return;
    }
    setFirstName(next.firstName);
    setLastName(next.lastName);
    setDateOfBirth(toDisplayDate(next.dateOfBirth));
    setAddress(next.address);
    setEmergencyContact(next.emergencyContact);
    setFamilyContact1Name(next.familyContact1Name ?? '');
    setFamilyContact1Phone(next.familyContact1Phone ?? '');
    setFamilyContact2Name(next.familyContact2Name ?? '');
    setFamilyContact2Phone(next.familyContact2Phone ?? '');
    setPreferredHospital(next.preferredHospital ?? '');
    setPreferredLanguage(next.preferredLanguage ?? '');
    setEmail(next.email ?? '');
    setPhone(next.phone ?? '');
    setAccountStatus(next.accountStatus ?? user.data?.accountStatus ?? 'ACTIVE');
  };

  const startEdit = (nextTab: SeniorTab = 'personal') => {
    setEditing(true);
    setTab(nextTab);
    setMoreOpen(false);
  };

  const saveProfile = () => {
    if (!senior) {
      return;
    }
    setFormError(null);
    setSaving(true);
    update.mutate(
      {
        firstName,
        lastName,
        dateOfBirth,
        address,
        emergencyContact,
        preferredLanguage,
        familyContact1Name: blankToNull(familyContact1Name),
        familyContact1Phone: blankToNull(familyContact1Phone),
        familyContact2Name: blankToNull(familyContact2Name),
        familyContact2Phone: blankToNull(familyContact2Phone),
        preferredHospital: blankToNull(preferredHospital),
        email,
        phone,
      },
      {
        onError: (error) => {
          setSaving(false);
          setFormError(getAdminErrorMessage(error));
        },
        onSuccess: async () => {
          try {
            if (senior.userId && accountStatus.trim()) {
              await updateAdminUser(senior.userId, {
                accountStatus: accountStatus.trim().toUpperCase(),
              });
            }
            setEditing(false);
          } catch (error) {
            setFormError(getAdminErrorMessage(error, 'user'));
          } finally {
            setSaving(false);
          }
        },
      },
    );
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isDesktop ? styles.contentDesktop : null]}
    >
      <Pressable
        onPress={() => router.replace('/(admin)/seniors' as Href)}
        accessibilityRole="button"
        accessibilityLabel="Back to Seniors"
        style={({ pressed }) => [styles.back, pressed ? styles.pressed : null]}
      >
        <Icon name="chevron-back" size={16} color={colors.sidebarActive} />
        <Text style={styles.backLabel}>Back to Seniors</Text>
      </Pressable>

      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading senior..."
        emptyTitle="Senior not found"
        emptyMessage="This senior is not in AgeWell."
      >
        {senior ? (
          <>
            <View style={styles.profileHead}>
              <View style={styles.profileCopy}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} accessibilityRole="header">
                    {displayName}
                  </Text>
                  <StatusPill
                    label={senior.accountStatus ? humanizeStatus(senior.accountStatus) : 'Active'}
                    tone={statusToneFromLabel(senior.accountStatus ?? 'ACTIVE')}
                  />
                </View>
                <Text style={styles.meta}>
                  {[
                    shortSeniorCode(senior.id),
                    age != null ? `${age} years` : null,
                    senior.address || null,
                  ]
                    .filter(Boolean)
                    .join('  ·  ')}
                </Text>
              </View>
              <View style={styles.actions}>
                <PrimaryButton label="Edit Profile" fullWidth={false} onPress={() => startEdit('personal')} />
                <SecondaryButton
                  label="Schedule Visit"
                  fullWidth={false}
                  onPress={() => router.push(scheduleHref)}
                />
                <View>
                  <Pressable
                    onPress={() => setMoreOpen((open) => !open)}
                    accessibilityRole="button"
                    accessibilityLabel="More actions"
                    style={({ pressed }) => [styles.moreBtn, pressed ? styles.pressed : null]}
                  >
                    <Text style={styles.moreLabel}>More</Text>
                    <Icon name="chevron-down" size={14} color={colors.text} />
                  </Pressable>
                  {moreOpen ? (
                    <View style={styles.moreMenu}>
                      <Pressable
                        onPress={() => {
                          setMoreOpen(false);
                          setConfirmDelete(true);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Delete senior"
                        style={({ pressed }) => [styles.moreItem, pressed ? styles.pressed : null]}
                      >
                        <Text style={styles.moreDanger}>Delete</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            <View style={[styles.summaryRow, isDesktop ? styles.summaryDesktop : null]}>
              <View style={[styles.summaryCard, styles.snippetCard]}>
                <Avatar name={displayName} size={56} />
                <View style={styles.snippetCopy}>
                  <Text style={styles.snippetText}>
                    {onboardingLanguageLabel(senior.preferredLanguage)}
                    {senior.inServiceArea ? ' · In service area' : ' · Outside service area'}
                    {senior.hasMembership ? ' · Member' : ' · No membership'}
                  </Text>
                </View>
              </View>
              <SummaryStat
                label="Next visit"
                value={
                  nextVisit?.scheduledAt
                    ? `${formatRelativeDay(nextVisit.scheduledAt)} · ${formatTime(nextVisit.scheduledAt)}`
                    : 'Not scheduled'
                }
                action={nextVisit ? 'View visit' : 'Schedule now'}
                tone="info"
                onPress={() =>
                  nextVisit
                    ? router.push(`/(admin)/visits/${nextVisit.id}` as Href)
                    : router.push(scheduleHref)
                }
              />
              <SummaryStat
                label="Care manager"
                value={assignedCare ?? 'Not assigned'}
                action={assignedCare ? 'Edit' : 'Assign'}
                tone="safe"
                onPress={() => setTab('visits')}
              />
              <SummaryStat
                label="Companion"
                value={assignedCompanion ?? 'Not assigned'}
                action={assignedCompanion ? 'Edit' : 'Assign'}
                tone="safe"
                onPress={() => setTab('visits')}
              />
              <SummaryStat
                label="Health status"
                value={healthCount > 0 ? `${healthCount} records` : 'No records'}
                action={healthCount > 0 ? 'View health' : 'Add health info'}
                tone="warning"
                onPress={() => setTab('health')}
              />
              <SummaryStat
                label="Membership"
                value={membership.data?.planName ?? (senior.hasMembership ? 'Member' : 'Not available')}
                action="View plans"
                tone="accent"
                onPress={() => router.push('/(admin)/memberships' as Href)}
              />
            </View>

            <View style={styles.tabBar} accessibilityRole="tablist" accessibilityLabel="Senior sections">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
                {TABS.map((item) => {
                  const selected = tab === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => setTab(item.key)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected }}
                      accessibilityLabel={item.label}
                      style={({ pressed }) => [styles.tab, selected ? styles.tabActive : null, pressed ? styles.pressed : null]}
                    >
                      <Text style={[styles.tabLabel, selected ? styles.tabLabelActive : null]}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {tab === 'overview' ? (
              <View style={isDesktop ? styles.overviewGrid : styles.stack}>
                <View style={styles.mainCol}>
                  <Panel title="Personal information" action="Edit" onAction={() => startEdit('personal')}>
                    <View style={styles.fields}>
                      <InfoField label="Full name" value={displayName} />
                      <InfoField label="Date of birth" value={formatLongDate(senior.dateOfBirth)} />
                      <InfoField label="Preferred language" value={onboardingLanguageLabel(senior.preferredLanguage)} />
                      <InfoField label="Address" value={senior.address || 'Not on file'} />
                      <InfoField
                        label="Account status"
                        value={senior.accountStatus ? humanizeStatus(senior.accountStatus) : 'Active'}
                      />
                      <InfoField
                        label="Registration date"
                        value={user.data?.createdAt ? formatLongDate(user.data.createdAt) : 'Not on file'}
                      />
                    </View>
                  </Panel>
                  <Panel title="Emergency contacts" action="Edit" onAction={() => startEdit('contacts')}>
                    <InfoField label="Primary contact" value={senior.emergencyContact || 'Not on file'} />
                    <InfoField label="Phone" value={senior.phone ?? user.data?.phone ?? 'Not on file'} />
                    <InfoField label="Family member 1" value={adminContactLine(senior.familyContact1Name, senior.familyContact1Phone)} />
                    <InfoField label="Family member 2" value={adminContactLine(senior.familyContact2Name, senior.familyContact2Phone)} />
                    <InfoField label="Nearby hospital" value={senior.preferredHospital || 'Not on file'} />
                  </Panel>
                </View>
                <View style={styles.sideCol}>
                  <EmptyOrList
                    title="Care / Visits"
                    empty={!visitItems.length}
                    emptyTitle="No visits yet"
                    emptyIcon="calendar-outline"
                    action="+ Create Visit"
                    onAction={() => router.push(scheduleHref)}
                  >
                    {visitItems.slice(0, 3).map((visit) => (
                      <Pressable
                        key={visit.id}
                        onPress={() => router.push(`/(admin)/visits/${visit.id}` as Href)}
                        accessibilityRole="button"
                        accessibilityLabel="Open visit"
                        style={({ pressed }) => [styles.sideRow, pressed ? styles.pressed : null]}
                      >
                        <Text style={styles.sideTitle}>{visit.careManagerName ?? 'Unassigned'}</Text>
                        <Text style={styles.sideMeta}>
                          {visit.scheduledAt
                            ? `${formatRelativeDay(visit.scheduledAt)} · ${formatTime(visit.scheduledAt)}`
                            : 'Unscheduled'}{' '}
                          · {humanizeStatus(visit.status)}
                        </Text>
                      </Pressable>
                    ))}
                  </EmptyOrList>
                  <EmptyOrList
                    title="Health"
                    empty={!healthCount}
                    emptyTitle="No health information on file"
                    emptyIcon="heart-outline"
                    action={healthCount ? 'View' : undefined}
                    onAction={() => setTab('health')}
                  >
                    {(health.data?.items ?? []).slice(0, 3).map((item) => (
                      <Text key={item.id} style={styles.sideMeta}>
                        {item.providerName ?? 'Record'} · {item.notes ?? 'No notes'}
                      </Text>
                    ))}
                  </EmptyOrList>
                  <EmptyOrList
                    title="Care team"
                    empty={!careTeamAssigned}
                    emptyTitle="No care team assigned"
                    emptyIcon="medkit-outline"
                    action={careTeamAssigned ? 'Edit' : 'Assign Care Team'}
                    onAction={() => setTab('visits')}
                  >
                    {assignedCare ? <Text style={styles.sideTitle}>Care manager · {assignedCare}</Text> : null}
                    {assignedCompanion ? <Text style={styles.sideTitle}>Companion · {assignedCompanion}</Text> : null}
                    {!assignedCare ? <Text style={styles.sideMeta}>Care manager not assigned</Text> : null}
                    {!assignedCompanion ? <Text style={styles.sideMeta}>Companion not assigned</Text> : null}
                  </EmptyOrList>
                  <EmptyOrList
                    title="Membership"
                    empty={!membership.data && !senior.hasMembership}
                    emptyTitle="No active membership"
                    emptyIcon="card-outline"
                    action="Assign Membership"
                    onAction={() => router.push('/(admin)/memberships' as Href)}
                  >
                    {membership.data ? (
                      <Text style={styles.sideTitle}>
                        {membership.data.planName} · {humanizeStatus(membership.data.status)}
                      </Text>
                    ) : null}
                  </EmptyOrList>
                  <Panel title="Recent activity">
                    {activity.length ? (
                      activity.map((item) => (
                        <View key={item.id} style={styles.activityRow}>
                          <View style={styles.timelineDot} />
                          <View style={styles.flex}>
                            <Text style={styles.sideTitle}>{humanizeStatus(item.action ?? 'Updated')}</Text>
                            <Text style={styles.sideMeta}>
                              {item.createdAt ? formatRelativeTimestamp(item.createdAt) : 'No date'}
                            </Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.sideMeta}>No recent activity for this senior.</Text>
                    )}
                  </Panel>
                </View>
              </View>
            ) : null}

            {tab === 'personal' ? (
              <Panel title="Personal information">
                {editing ? (
                  <View>
                    <Text style={styles.formHint}>Same fields collected at senior registration (password is not shown).</Text>
                    <TextField label="First name" value={firstName} onChangeText={setFirstName} />
                    <TextField label="Last name" value={lastName} onChangeText={setLastName} />
                    <TextField
                      label="Date of birth (DD-MM-YYYY)"
                      value={dateOfBirth}
                      onChangeText={setDateOfBirth}
                      placeholder="10-03-1952"
                    />
                    <TextField label="Address" value={address} onChangeText={setAddress} />
                    <TextField
                      label="Preferred language (en / hi / mr)"
                      value={preferredLanguage}
                      onChangeText={setPreferredLanguage}
                      autoCapitalize="none"
                    />
                    <TextField
                      label="Account status (ACTIVE / DISABLED)"
                      value={accountStatus}
                      onChangeText={setAccountStatus}
                      autoCapitalize="characters"
                    />
                    {formError ? <Text style={styles.error}>{formError}</Text> : null}
                    <View style={styles.formActions}>
                      <PrimaryButton
                        label="Save registration details"
                        fullWidth={false}
                        loading={saving || update.isPending}
                        onPress={saveProfile}
                      />
                      <SecondaryButton
                        label="Cancel"
                        fullWidth={false}
                        onPress={() => {
                          setEditing(false);
                          setFormError(null);
                          fillForm(senior);
                        }}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.fields}>
                    <InfoField label="Full name" value={displayName} />
                    <InfoField label="Date of birth" value={formatLongDate(senior.dateOfBirth)} />
                    <InfoField label="Preferred language" value={onboardingLanguageLabel(senior.preferredLanguage)} />
                    <InfoField label="Address" value={senior.address || 'Not on file'} />
                    <InfoField label="Checked location" value={adminSeniorLocationLabel(senior)} />
                    <InfoField
                      label="Service area"
                      value={senior.inServiceArea ? 'In area (Kandivali / Borivali)' : 'Outside service area'}
                    />
                    <InfoField
                      label="Account status"
                      value={senior.accountStatus ? humanizeStatus(senior.accountStatus) : 'Active'}
                    />
                  </View>
                )}
              </Panel>
            ) : null}

            {tab === 'contacts' ? (
              <Panel title="Contacts" action="Edit" onAction={() => startEdit('contacts')}>
                {editing ? (
                  <>
                    <Text style={styles.formHint}>
                      Family members and the nearby hospital come from the membership form. Ops can update them here for SOS and admission.
                    </Text>
                    <TextField
                      label="Email"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                    <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                    <TextField label="Emergency contact" value={emergencyContact} onChangeText={setEmergencyContact} />
                    <TextField label="Family member 1 name" value={familyContact1Name} onChangeText={setFamilyContact1Name} />
                    <TextField
                      label="Family member 1 phone"
                      value={familyContact1Phone}
                      onChangeText={setFamilyContact1Phone}
                      keyboardType="phone-pad"
                    />
                    <TextField label="Family member 2 name" value={familyContact2Name} onChangeText={setFamilyContact2Name} />
                    <TextField
                      label="Family member 2 phone"
                      value={familyContact2Phone}
                      onChangeText={setFamilyContact2Phone}
                      keyboardType="phone-pad"
                    />
                    <TextField
                      label="Nearby hospital"
                      value={preferredHospital}
                      onChangeText={setPreferredHospital}
                      placeholder="Hospital for emergency admission"
                    />
                    {formError ? <Text style={styles.error}>{formError}</Text> : null}
                    <View style={styles.formActions}>
                      <PrimaryButton
                        label="Save contacts"
                        fullWidth={false}
                        loading={saving || update.isPending}
                        onPress={saveProfile}
                      />
                      <SecondaryButton
                        label="Cancel"
                        fullWidth={false}
                        onPress={() => {
                          setEditing(false);
                          setFormError(null);
                          fillForm(senior);
                        }}
                      />
                    </View>
                  </>
                ) : (
                  <View style={styles.fields}>
                    <InfoField label="Email" value={senior.email ?? 'Not on file'} />
                    <InfoField label="Phone" value={senior.phone ?? user.data?.phone ?? 'Not on file'} />
                    <InfoField label="Emergency contact" value={senior.emergencyContact || 'Not on file'} />
                    <InfoField label="Family member 1" value={adminContactLine(senior.familyContact1Name, senior.familyContact1Phone)} />
                    <InfoField label="Family member 2" value={adminContactLine(senior.familyContact2Name, senior.familyContact2Phone)} />
                    <InfoField label="Nearby hospital" value={senior.preferredHospital || 'Not on file'} />
                  </View>
                )}
              </Panel>
            ) : null}

            {tab === 'visits' ? (
              <Panel title="Care / Visits" action="+ Create Visit" onAction={() => router.push(scheduleHref)}>
                <Text style={styles.formHint}>Tap a field to change or clear the standing assignment.</Text>
                <AdminSearchPicker
                  label="Assigned Care Manager"
                  options={(managers.data ?? [])
                    .filter(
                      (item) =>
                        (!item.staffKind || item.staffKind === 'CARE_MANAGER') &&
                        ((!item.status || item.status.toUpperCase() === 'ACTIVE') ||
                          item.id === query.data?.careManagerId),
                    )
                    .map((item) => ({
                      id: item.id,
                      title: adminCareManagerDisplay(item),
                      subtitle: item.employeeId ?? undefined,
                    }))}
                  value={query.data?.careManagerId}
                  loading={managers.isPending}
                  emptyMessage="No ACTIVE care managers."
                  confirmLabel="Save care manager"
                  onChange={(next) => {
                    if (!id) return;
                    update.mutate(
                      { careManagerId: next },
                      { onError: (error) => setFormError(getAdminErrorMessage(error)) },
                    );
                  }}
                />
                <AdminSearchPicker
                  label="Assigned Companion"
                  options={(managers.data ?? [])
                    .filter(
                      (item) =>
                        item.staffKind === 'COMPANION' &&
                        ((!item.status || item.status.toUpperCase() === 'ACTIVE') ||
                          item.id === query.data?.companionId),
                    )
                    .map((item) => ({
                      id: item.id,
                      title: adminCareManagerDisplay(item),
                      subtitle: item.employeeId ?? undefined,
                    }))}
                  value={query.data?.companionId}
                  loading={managers.isPending}
                  emptyMessage="No ACTIVE companions."
                  confirmLabel="Save companion"
                  onChange={(next) => {
                    if (!id) return;
                    update.mutate(
                      { companionId: next },
                      { onError: (error) => setFormError(getAdminErrorMessage(error)) },
                    );
                  }}
                />
                {!visitItems.length ? (
                  <EmptyBlock icon="calendar-outline" title="No visits yet" />
                ) : (
                  visitItems.map((visit) => (
                    <View key={visit.id} style={styles.listCard}>
                      <Text style={styles.sideTitle}>{visit.careManagerName ?? 'Unassigned'}</Text>
                      <Text style={styles.sideMeta}>Employee ID: {visit.employeeId ?? 'Not on file'}</Text>
                      <Text style={styles.sideMeta}>
                        {visit.scheduledAt
                          ? `${formatRelativeDay(visit.scheduledAt)} · ${formatTime(visit.scheduledAt)}`
                          : 'Schedule not set'}{' '}
                        · {humanizeStatus(visit.status)}
                      </Text>
                      <PrimaryButton
                        label="View Visit"
                        fullWidth={false}
                        onPress={() => router.push(`/(admin)/visits/${visit.id}` as Href)}
                      />
                    </View>
                  ))
                )}
              </Panel>
            ) : null}

            {tab === 'visits' ? (
              <CareActivityAdminPanel
                activities={careActivities.data?.items ?? []}
                loading={careActivities.isPending}
                saving={updateActivity.isPending}
                onSave={(payload) =>
                  updateActivity.mutate(payload, { onError: (error) => setFormError(getAdminErrorMessage(error)) })
                }
              />
            ) : null}

            {tab === 'health' ? (
              <Panel title="Health">
                {health.isPending ? <Text style={styles.sideMeta}>Loading...</Text> : null}
                {health.isError ? <Text style={styles.error}>Health records unavailable.</Text> : null}
                {!health.isPending && !health.isError && !healthCount ? (
                  <EmptyBlock icon="heart-outline" title="No health information on file" />
                ) : (
                  (health.data?.items ?? []).map((item) => (
                    <Text key={item.id} style={styles.sideMeta}>
                      {item.providerName ?? 'Record'} · {item.notes ?? 'No notes'}
                    </Text>
                  ))
                )}
                {(appointments.data?.items ?? []).map((item) => (
                  <Text key={item.id} style={styles.sideMeta}>
                    Appointment · {item.doctorName ?? 'Doctor'} · {humanizeStatus(item.status)}
                  </Text>
                ))}
                {(emergencies.data?.items ?? []).map((item) => (
                  <Text key={item.id} style={styles.sideMeta}>
                    Emergency · {humanizeStatus(item.status)}
                    {item.createdAt ? ` · ${formatLongDate(item.createdAt)}` : ''}
                  </Text>
                ))}
              </Panel>
            ) : null}

            {tab === 'membership' ? (
              <Panel title="Membership" action="View plans" onAction={() => router.push('/(admin)/memberships' as Href)}>
                {membership.data ? (
                  <>
                    <InfoField label="Plan" value={membership.data.planName} />
                    <InfoField label="Status" value={humanizeStatus(membership.data.status)} />
                    {(usage.data ?? []).map((item) => (
                      <Text key={item.benefitId} style={styles.sideMeta}>
                        {item.benefitName}: used {item.used}
                        {item.quota != null ? ` of ${item.quota}` : ''}
                      </Text>
                    ))}
                  </>
                ) : (
                  <EmptyBlock icon="card-outline" title="No active membership" />
                )}
              </Panel>
            ) : null}

            {tab === 'notes' ? (
              <Panel title="Notes">
                <EmptyBlock icon="document-text-outline" title="No notes on file" />
              </Panel>
            ) : null}

            {tab === 'activity' ? (
              <Panel title="Activity">
                {activity.length ? (
                  activity.map((item) => (
                    <View key={item.id} style={styles.activityRow}>
                      <View style={styles.timelineDot} />
                      <View style={styles.flex}>
                        <Text style={styles.sideTitle}>{humanizeStatus(item.action ?? 'Updated')}</Text>
                        <Text style={styles.sideMeta}>
                          {[item.entityName, item.createdAt ? formatRelativeTimestamp(item.createdAt) : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.sideMeta}>No activity recorded for this senior.</Text>
                )}
              </Panel>
            ) : null}
          </>
        ) : null}
      </AdminQueryView>

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this senior?"
        message={`${displayName} and their login account will be permanently removed.`}
        confirmLabel={deleting ? 'Working…' : 'Delete record'}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!id) return;
          setDeleting(true);
          void deleteAdminSenior(id)
            .then(() => router.replace('/(admin)/seniors' as Href))
            .catch(() => setDeleting(false));
        }}
      />
    </KeyboardAwareScrollView>
  );
}

function SummaryStat({
  label,
  value,
  action,
  tone,
  onPress,
}: {
  label: string;
  value: string;
  action: string;
  tone: 'info' | 'safe' | 'warning' | 'accent';
  onPress: () => void;
}) {
  const bg =
    tone === 'info'
      ? colors.infoSoft
      : tone === 'safe'
        ? colors.safeSoft
        : tone === 'warning'
          ? colors.warningSoft
          : '#F3EEFF';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [styles.summaryCard, { backgroundColor: bg }, pressed ? styles.pressed : null]}
    >
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryAction}>{action}</Text>
    </Pressable>
  );
}

function CareActivityAdminPanel({
  activities,
  loading,
  saving,
  onSave,
}: {
  activities: CareActivity[];
  loading: boolean;
  saving: boolean;
  onSave: (input: {
    id: string;
    activityType?: (typeof CARE_ACTIVITY_TYPES)[number];
    status?: (typeof CARE_ACTIVITY_STATUSES)[number];
    reason?: string | null;
    discussion?: string | null;
    actionTaken?: string | null;
    servicesCoordinated?: string | null;
    followUpRequired?: boolean;
    followUpNotes?: string | null;
    notes?: string | null;
  }) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = activities.find((item) => item.id === selectedId) ?? activities[0] ?? null;
  const [reason, setReason] = useState('');
  const [discussion, setDiscussion] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [servicesCoordinated, setServicesCoordinated] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (selected) {
      setSelectedId(selected.id);
      setReason(selected.reason ?? '');
      setDiscussion(selected.discussion ?? '');
      setActionTaken(selected.actionTaken ?? '');
      setServicesCoordinated(selected.servicesCoordinated ?? '');
      setFollowUpNotes(selected.followUpNotes ?? '');
      setNotes(selected.notes ?? '');
    }
  }, [selected?.id]);

  return (
    <Panel title="Care Manager activity">
      {loading ? <Text style={styles.sideMeta}>Loading activity…</Text> : null}
      {!loading && !activities.length ? <EmptyBlock icon="clipboard-outline" title="No Care Manager requests yet" /> : null}
      {activities.slice(0, 8).map((item) => (
        <Pressable
          key={item.id}
          onPress={() => setSelectedId(item.id)}
          style={[styles.listCard, selectedId === item.id ? styles.listCardOn : null]}
        >
          <Text style={styles.sideTitle}>{item.title}</Text>
          <Text style={styles.sideMeta}>
            {humanizeStatus(item.status)} · {item.activityType}
          </Text>
        </Pressable>
      ))}
      {selected ? (
        <View style={styles.listCard}>
          <Text style={styles.sideTitle}>Update log</Text>
          <View style={styles.chipWrap}>
            {CARE_ACTIVITY_TYPES.map((type) => (
              <Pressable
                key={type}
                onPress={() => onSave({ id: selected.id, activityType: type })}
                style={[styles.miniChip, selected.activityType === type ? styles.miniChipOn : null]}
              >
                <Text style={styles.miniChipLabel}>{type.replaceAll('_', ' ')}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.chipWrap}>
            {CARE_ACTIVITY_STATUSES.map((status) => (
              <Pressable
                key={status}
                onPress={() => onSave({ id: selected.id, status })}
                style={[styles.miniChip, selected.status === status ? styles.miniChipOn : null]}
              >
                <Text style={styles.miniChipLabel}>{humanizeStatus(status)}</Text>
              </Pressable>
            ))}
          </View>
          <TextField label="Reason / topic" value={reason} onChangeText={setReason} />
          <TextField label="Discussion" value={discussion} onChangeText={setDiscussion} />
          <TextField label="Action taken" value={actionTaken} onChangeText={setActionTaken} />
          <TextField label="Services coordinated" value={servicesCoordinated} onChangeText={setServicesCoordinated} />
          <TextField label="Follow-up notes" value={followUpNotes} onChangeText={setFollowUpNotes} />
          <TextField label="Additional notes" value={notes} onChangeText={setNotes} />
          <PrimaryButton
            label="Save activity"
            loading={saving}
            onPress={() =>
              onSave({
                id: selected.id,
                reason: reason.trim() || null,
                discussion: discussion.trim() || null,
                actionTaken: actionTaken.trim() || null,
                servicesCoordinated: servicesCoordinated.trim() || null,
                followUpRequired: Boolean(followUpNotes.trim()),
                followUpNotes: followUpNotes.trim() || null,
                notes: notes.trim() || null,
              })
            }
          />
        </View>
      ) : null}
    </Panel>
  );
}

function Panel({
  title,
  action,
  onAction,
  children,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <View style={styles.panel}>
      <View style={styles.panelHead}>
        <Text style={styles.panelTitle}>{title}</Text>
        {action && onAction ? (
          <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={action}>
            <Text style={styles.panelAction}>{action}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function EmptyBlock({ icon, title }: { icon: 'calendar-outline' | 'heart-outline' | 'medkit-outline' | 'card-outline' | 'document-text-outline' | 'clipboard-outline'; title: string }) {
  return (
    <View style={styles.emptyBlock}>
      <IconWell tone="primary" size={44}>
        <Icon name={icon} size={20} color={colors.primary} />
      </IconWell>
      <Text style={styles.emptyTitle}>{title}</Text>
    </View>
  );
}

function EmptyOrList({
  title,
  empty,
  emptyTitle,
  emptyIcon,
  action,
  onAction,
  children,
}: {
  title: string;
  empty: boolean;
  emptyTitle: string;
  emptyIcon: 'calendar-outline' | 'heart-outline' | 'medkit-outline' | 'card-outline';
  action?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <Panel title={title} action={action} onAction={onAction}>
      {empty ? <EmptyBlock icon={emptyIcon} title={emptyTitle} /> : children}
    </Panel>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.adminCanvas,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
    gap: spacing.lg,
  },
  contentDesktop: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: minTouchSize,
    alignSelf: 'flex-start',
  },
  backLabel: {
    ...typography.bodyStrong,
    color: colors.sidebarActive,
  },
  profileHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  profileCopy: {
    flex: 1,
    minWidth: 220,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  name: {
    ...typography.display,
    color: colors.text,
  },
  meta: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  moreBtn: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  moreLabel: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  moreMenu: {
    position: 'absolute',
    right: 0,
    top: 48,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    ...shadows.card,
    minWidth: 140,
    zIndex: 4,
  },
  moreItem: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  moreDanger: {
    ...typography.bodyStrong,
    color: colors.emergency,
  },
  summaryRow: {
    gap: spacing.md,
  },
  summaryDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  summaryCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexGrow: 1,
    flexBasis: 160,
    minWidth: 150,
    ...shadows.card,
    backgroundColor: colors.white,
    gap: spacing.xs,
  },
  snippetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.safeSoft,
    flexBasis: 240,
  },
  snippetCopy: {
    flex: 1,
  },
  snippetText: {
    ...typography.body,
    color: colors.text,
  },
  summaryLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.subtitle,
    color: colors.text,
  },
  summaryAction: {
    ...typography.captionStrong,
    color: colors.sidebarActive,
    marginTop: spacing.xs,
  },
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabRow: {
    gap: spacing.lg,
  },
  tab: {
    minHeight: 44,
    justifyContent: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.sidebarActive,
  },
  tabLabel: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.sidebarActive,
  },
  overviewGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  stack: {
    gap: spacing.lg,
  },
  mainCol: {
    flex: 1.4,
    gap: spacing.lg,
    minWidth: 280,
  },
  sideCol: {
    flex: 1,
    gap: spacing.lg,
    minWidth: 260,
  },
  panel: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadows.card,
    gap: spacing.md,
  },
  panelHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitle: {
    ...typography.heading,
    color: colors.text,
  },
  panelAction: {
    ...typography.captionStrong,
    color: colors.sidebarActive,
  },
  fields: {
    gap: spacing.lg,
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  fieldValue: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  formHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  formActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  listCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  listCardOn: {
    borderColor: colors.sidebarActive,
    backgroundColor: '#EEF6FF',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  miniChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  miniChipOn: {
    borderColor: colors.sidebarActive,
    backgroundColor: '#EEF6FF',
  },
  miniChipLabel: {
    ...typography.caption,
    color: colors.text,
  },
  sideRow: {
    gap: 2,
    paddingVertical: spacing.sm,
  },
  sideTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  sideMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyBlock: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  emptyTitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  activityRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.sidebarActive,
    marginTop: 6,
  },
  flex: {
    flex: 1,
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
  },
  pressed: {
    opacity: 0.9,
  },
});
