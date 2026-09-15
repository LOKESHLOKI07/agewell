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
import { Avatar, Icon, IconWell, type IconName } from '@/components/ui';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import { parseStaffKind, STAFF_KIND_LABELS, STAFF_KINDS, type StaffKind } from '@/features/care/staffKind';
import { formatLongDate, formatRelativeDay, formatRelativeTimestamp, formatTime } from '@/utils/date';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminQueryView } from './components/AdminQueryView';
import { deleteAdminCareManager, updateAdminUser } from './api';
import {
  useAdminAuditLogs,
  useAdminCareManager,
  useAdminSeniors,
  useAdminUser,
  useAdminVisits,
  useUpdateAdminCareManager,
} from './hooks';
import {
  adminCareManagerDisplay,
  adminSeniorDisplay,
  adminStaffKindLabel,
  getAdminErrorMessage,
  getSectionState,
  humanizeStatus,
  monthsBetween,
  splitTagList,
} from './selectors';
import { useAdminLayout } from './useAdminLayout';

type CareTab =
  | 'overview'
  | 'personal'
  | 'professional'
  | 'skills'
  | 'assignments'
  | 'availability'
  | 'documents'
  | 'reviews'
  | 'activity';

const TABS: { key: CareTab; label: string; icon: IconName }[] = [
  { key: 'overview', label: 'Overview', icon: 'grid-outline' },
  { key: 'personal', label: 'Personal Info', icon: 'person-outline' },
  { key: 'professional', label: 'Professional', icon: 'business-outline' },
  { key: 'skills', label: 'Skills', icon: 'ribbon-outline' },
  { key: 'assignments', label: 'Assignments', icon: 'people-outline' },
  { key: 'availability', label: 'Availability', icon: 'time-outline' },
  { key: 'documents', label: 'Documents', icon: 'document-text-outline' },
  { key: 'reviews', label: 'Reviews', icon: 'sparkles' },
  { key: 'activity', label: 'Activity', icon: 'clipboard-outline' },
];

export function AdminCareManagerDetailScreen() {
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const { isDesktop } = useAdminLayout();
  const query = useAdminCareManager(id);
  const user = useAdminUser(query.data?.userId ?? undefined);
  const visits = useAdminVisits({ careManagerId: id, limit: 50, offset: 0 });
  const seniors = useAdminSeniors({ limit: 100, offset: 0 });
  const audit = useAdminAuditLogs({ limit: 40, offset: 0 });
  const update = useUpdateAdminCareManager(id ?? '');

  const [tab, setTab] = useState<CareTab>(edit === '1' ? 'personal' : 'overview');
  const [editing, setEditing] = useState(edit === '1');
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [accountStatus, setAccountStatus] = useState('ACTIVE');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [languages, setLanguages] = useState('');
  const [availability, setAvailability] = useState('');
  const [status, setStatus] = useState('');
  const [staffKind, setStaffKind] = useState<StaffKind>('CARE_MANAGER');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (edit === '1') {
      setEditing(true);
      setTab('personal');
    }
  }, [edit]);

  useEffect(() => {
    if (query.data) {
      setEmployeeId(query.data.employeeId ?? '');
      setFirstName(query.data.firstName ?? '');
      setLastName(query.data.lastName ?? '');
      setSkills(query.data.skills ?? '');
      setExperience(query.data.experience ?? '');
      setLanguages(query.data.languages ?? '');
      setAvailability(query.data.availability ?? '');
      setStatus(query.data.status ?? '');
      setStaffKind(parseStaffKind(query.data.staffKind));
    }
  }, [query.data]);

  useEffect(() => {
    if (user.data) {
      setEmail(user.data.email ?? '');
      setPhone(user.data.phone ?? '');
      setAccountStatus(user.data.accountStatus ?? 'ACTIVE');
    }
  }, [user.data]);

  const visitItems = visits.data?.items ?? [];
  const now = new Date();
  const thisMonthVisits = visitItems.filter((item) => inSameMonth(item.scheduledAt ?? item.completedAt ?? null, now)).length;
  const completedVisits = visitItems.filter((item) => item.status === 'COMPLETED' || item.status === 'CHECKED_OUT').length;
  const seniorIds = new Set(visitItems.map((item) => item.seniorId));
  const upcoming = useMemo(
    () =>
      [...visitItems]
        .filter((item) => item.status === 'SCHEDULED' || item.status === 'CHECKED_IN' || item.status === 'IN_PROGRESS')
        .sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? '')),
    [visitItems],
  );
  const skillTags = splitTagList(query.data?.skills);
  const languageTags = splitTagList(query.data?.languages);
  const tenure = user.data?.createdAt ? monthsBetween(user.data.createdAt) : null;
  const activity = useMemo(() => {
    const rows = (audit.data?.items ?? []).filter((item) => item.entityId === id || item.entityId === query.data?.userId);
    if (user.data?.createdAt) {
      rows.push({
        id: `joined-${query.data?.userId ?? 'user'}`,
        entityName: 'User',
        entityId: query.data?.userId ?? null,
        action: 'Joined AgeWell',
        changes: null,
        createdAt: user.data.createdAt,
      });
    }
    return rows.slice(0, 8);
  }, [audit.data?.items, id, query.data?.userId, user.data?.createdAt]);

  const seniorName = (seniorId: string) => {
    const senior = (seniors.data?.items ?? []).find((item) => item.id === seniorId);
    return senior ? adminSeniorDisplay(senior) : 'Senior';
  };

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && !query.data,
  });
  const staff = query.data;
  const displayName = staff ? adminCareManagerDisplay(staff) : 'Care team';
  const roleLabel = staff ? adminStaffKindLabel(staff.staffKind) : 'Care Manager';
  const assignHref = `/(admin)/visits/new?careManagerId=${id}` as Href;

  const startEdit = () => {
    setEditing(true);
    setTab('personal');
    setMoreOpen(false);
  };

  const resetForm = () => {
    if (staff) {
      setEmployeeId(staff.employeeId ?? '');
      setFirstName(staff.firstName ?? '');
      setLastName(staff.lastName ?? '');
      setSkills(staff.skills ?? '');
      setExperience(staff.experience ?? '');
      setLanguages(staff.languages ?? '');
      setAvailability(staff.availability ?? '');
      setStatus(staff.status ?? '');
      setStaffKind(parseStaffKind(staff.staffKind));
    }
    if (user.data) {
      setEmail(user.data.email ?? '');
      setPhone(user.data.phone ?? '');
      setAccountStatus(user.data.accountStatus ?? 'ACTIVE');
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isDesktop ? styles.contentDesktop : null]}
    >
      <Pressable
        onPress={() => router.replace('/(admin)/care-managers' as Href)}
        accessibilityRole="button"
        accessibilityLabel="Back to Care Team"
        style={({ pressed }) => [styles.back, pressed ? styles.pressed : null]}
      >
        <Icon name="chevron-back" size={16} color={colors.sidebarActive} />
        <Text style={styles.backLabel}>Back to Care Team</Text>
      </Pressable>

      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading care team member..."
        emptyTitle="Care team member not found"
        emptyMessage="This staff record is not in AgeWell."
        errorKind="care"
      >
        {staff ? (
          <>
            <View style={styles.profileHead}>
              <View style={styles.profileCopy}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} accessibilityRole="header">
                    {displayName}
                  </Text>
                  <StatusPill
                    label={staff.status ? humanizeStatus(staff.status) : 'Unknown'}
                    tone={statusToneFromLabel(staff.status ?? '')}
                  />
                </View>
                <Text style={styles.meta}>
                  {[
                    `Employee ID: ${staff.employeeId ?? 'Not on file'}`,
                    roleLabel,
                    user.data?.phone ?? null,
                    user.data?.email ?? null,
                  ]
                    .filter(Boolean)
                    .join('  ·  ')}
                </Text>
              </View>
              <View style={styles.actions}>
                <PrimaryButton label="Edit Profile" fullWidth={false} onPress={startEdit} />
                <Pressable
                  onPress={() => router.push(assignHref)}
                  accessibilityRole="button"
                  accessibilityLabel="Assign Visit"
                  style={({ pressed }) => [styles.assignBtn, pressed ? styles.pressed : null]}
                >
                  <Icon name="calendar-outline" size={16} color={colors.sidebarActive} />
                  <Text style={styles.assignLabel}>Assign Visit</Text>
                </Pressable>
                <View>
                  <Pressable
                    onPress={() => setMoreOpen((open) => !open)}
                    accessibilityRole="button"
                    accessibilityLabel="More actions"
                    style={({ pressed }) => [styles.moreBtn, pressed ? styles.pressed : null]}
                  >
                    <Icon name="ellipsis-horizontal" size={16} color={colors.text} />
                    <Text style={styles.moreLabel}>More</Text>
                  </Pressable>
                  {moreOpen ? (
                    <View style={styles.moreMenu}>
                      <Pressable
                        onPress={() => {
                          setMoreOpen(false);
                          setConfirmDelete(true);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Delete staff"
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
                    {roleLabel}
                    {languageTags.length ? ` · ${languageTags.join(', ')}` : ''}
                    {staff.experience ? ` · ${staff.experience}` : ''}
                  </Text>
                </View>
              </View>
              <KpiCard
                label="Total visits"
                value={String(visits.data?.total ?? visitItems.length)}
                hint={`This month: ${thisMonthVisits}`}
                tone="info"
                icon="calendar-outline"
              />
              <KpiCard
                label="Seniors assigned"
                value={String(seniorIds.size)}
                hint="Through visits"
                tone="safe"
                icon="people-outline"
              />
              <KpiCard
                label="Completed"
                value={String(completedVisits)}
                hint="Completed or checked out"
                tone="warning"
                icon="checkmark-circle-outline"
              />
              <KpiCard
                label="Joined on"
                value={user.data?.createdAt ? formatLongDate(user.data.createdAt) : 'Not on file'}
                hint={tenure != null ? `${tenure} month${tenure === 1 ? '' : 's'}` : 'Account date'}
                tone="accent"
                icon="time-outline"
              />
            </View>

            <View style={styles.tabBar} accessibilityRole="tablist" accessibilityLabel="Care team sections">
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
                      <Icon
                        name={item.icon}
                        size={15}
                        color={selected ? colors.sidebarActive : colors.textMuted}
                      />
                      <Text style={[styles.tabLabel, selected ? styles.tabLabelActive : null]}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {tab === 'overview' ? (
              <View style={isDesktop ? styles.overviewGrid : styles.stack}>
                <View style={styles.mainCol}>
                  <Panel title="Personal information" action="Edit" onAction={startEdit}>
                    <View style={styles.fields}>
                      <InfoField label="Full name" value={displayName} />
                      <InfoField label="Phone" value={user.data?.phone ?? 'Not on file'} />
                      <InfoField label="Email" value={user.data?.email ?? 'Not on file'} />
                      <InfoField label="Languages" value={staff.languages ?? 'Not on file'} />
                    </View>
                  </Panel>
                  <Panel title="Emergency contact">
                    <EmptyBlock icon="call-outline" title="No emergency contact on file" />
                  </Panel>
                </View>
                <View style={styles.sideCol}>
                  <Panel title="Professional information" action="Edit" onAction={startEdit}>
                    <View style={styles.fields}>
                      <InfoField label="Employee ID" value={staff.employeeId ?? 'Not on file'} />
                      <InfoField label="Role" value={roleLabel} />
                      <InfoField label="Care status" value={staff.status ? humanizeStatus(staff.status) : 'Not on file'} />
                      <InfoField
                        label="Account status"
                        value={user.data?.accountStatus ? humanizeStatus(user.data.accountStatus) : 'Not on file'}
                      />
                      <InfoField
                        label="Joining date"
                        value={user.data?.createdAt ? formatLongDate(user.data.createdAt) : 'Not on file'}
                      />
                    </View>
                  </Panel>
                  <Panel title="Skills & certifications" action="Edit" onAction={startEdit}>
                    {skillTags.length || languageTags.length ? (
                      <>
                        {skillTags.length ? (
                          <>
                            <Text style={styles.tagHeading}>Skills</Text>
                            <View style={styles.tags}>
                              {skillTags.map((tag) => (
                                <View key={tag} style={styles.skillTag}>
                                  <Text style={styles.skillTagLabel}>{tag}</Text>
                                </View>
                              ))}
                            </View>
                          </>
                        ) : null}
                        {languageTags.length ? (
                          <>
                            <Text style={styles.tagHeading}>Languages</Text>
                            <View style={styles.tags}>
                              {languageTags.map((tag) => (
                                <View key={tag} style={styles.langTag}>
                                  <Text style={styles.langTagLabel}>{tag}</Text>
                                </View>
                              ))}
                            </View>
                          </>
                        ) : null}
                        <Text style={styles.tagHeading}>Certifications</Text>
                        <Text style={styles.sideMeta}>None on file</Text>
                      </>
                    ) : (
                      <EmptyBlock icon="ribbon-outline" title="No skills on file" />
                    )}
                  </Panel>
                  <Panel title="Upcoming assignments" action="+ Assign" onAction={() => router.push(assignHref)}>
                    {upcoming.length ? (
                      upcoming.slice(0, 4).map((visit) => (
                        <Pressable
                          key={visit.id}
                          onPress={() => router.push(`/(admin)/visits/${visit.id}` as Href)}
                          accessibilityRole="button"
                          accessibilityLabel={seniorName(visit.seniorId)}
                          style={({ pressed }) => [styles.assignRow, pressed ? styles.pressed : null]}
                        >
                          <Avatar name={seniorName(visit.seniorId)} size={36} />
                          <View style={styles.flex}>
                            <Text style={styles.sideTitle}>{seniorName(visit.seniorId)}</Text>
                            <Text style={styles.sideMeta}>
                              {visit.notes?.trim() || 'Home visit'}
                              {visit.scheduledAt
                                ? ` · ${formatRelativeDay(visit.scheduledAt)} ${formatTime(visit.scheduledAt)}`
                                : ''}
                            </Text>
                          </View>
                          <StatusPill label={humanizeStatus(visit.status)} tone={statusToneFromLabel(visit.status)} />
                        </Pressable>
                      ))
                    ) : (
                      <EmptyBlock icon="calendar-outline" title="No upcoming assignments" />
                    )}
                  </Panel>
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
                      <Text style={styles.sideMeta}>No recent activity for this staff member.</Text>
                    )}
                  </Panel>
                </View>
              </View>
            ) : null}

            {tab === 'personal' ? (
              <Panel title="Personal information">
                {editing ? (
                  <EditForm
                    firstName={firstName}
                    lastName={lastName}
                    email={email}
                    phone={phone}
                    employeeId={employeeId}
                    staffKind={staffKind}
                    skills={skills}
                    experience={experience}
                    languages={languages}
                    availability={availability}
                    status={status}
                    accountStatus={accountStatus}
                    formError={formError}
                    saving={saving || update.isPending}
                    showPersonal
                    onChange={{
                      firstName: setFirstName,
                      lastName: setLastName,
                      email: setEmail,
                      phone: setPhone,
                      employeeId: setEmployeeId,
                      staffKind: setStaffKind,
                      skills: setSkills,
                      experience: setExperience,
                      languages: setLanguages,
                      availability: setAvailability,
                      status: setStatus,
                      accountStatus: setAccountStatus,
                    }}
                    onSave={() => {
                      setFormError(null);
                      setSaving(true);
                      update.mutate(
                        { employeeId, firstName, lastName, skills, experience, languages, availability, status, staffKind },
                        {
                          onError: (error) => {
                            setSaving(false);
                            setFormError(getAdminErrorMessage(error, 'care'));
                          },
                          onSuccess: async () => {
                            try {
                              if (staff.userId) {
                                await updateAdminUser(staff.userId, {
                                  email: email.trim(),
                                  phone: phone.trim(),
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
                    }}
                    onCancel={() => {
                      setEditing(false);
                      setFormError(null);
                      resetForm();
                    }}
                  />
                ) : (
                  <View style={styles.fields}>
                    <InfoField label="Full name" value={displayName} />
                    <InfoField label="Phone" value={user.data?.phone ?? 'Not on file'} />
                    <InfoField label="Email" value={user.data?.email ?? 'Not on file'} />
                    <InfoField label="Languages" value={staff.languages ?? 'Not on file'} />
                  </View>
                )}
              </Panel>
            ) : null}

            {tab === 'professional' ? (
              <Panel title="Professional information" action="Edit" onAction={startEdit}>
                <View style={styles.fields}>
                  <InfoField label="Employee ID" value={staff.employeeId ?? 'Not on file'} />
                  <InfoField label="Role" value={roleLabel} />
                  <InfoField label="Experience" value={staff.experience ?? 'Not on file'} />
                  <InfoField label="Care status" value={staff.status ? humanizeStatus(staff.status) : 'Not on file'} />
                  <InfoField
                    label="Account status"
                    value={user.data?.accountStatus ? humanizeStatus(user.data.accountStatus) : 'Not on file'}
                  />
                </View>
              </Panel>
            ) : null}

            {tab === 'skills' ? (
              <Panel title="Skills & certifications" action="Edit" onAction={startEdit}>
                {skillTags.length ? (
                  <View style={styles.tags}>
                    {skillTags.map((tag) => (
                      <View key={tag} style={styles.skillTag}>
                        <Text style={styles.skillTagLabel}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <EmptyBlock icon="ribbon-outline" title="No skills on file" />
                )}
                {staff.experience ? <InfoField label="Experience" value={staff.experience} /> : null}
                <Text style={styles.tagHeading}>Certifications</Text>
                <Text style={styles.sideMeta}>None on file</Text>
              </Panel>
            ) : null}

            {tab === 'assignments' ? (
              <Panel title="Assignments" action="+ Assign Visit" onAction={() => router.push(assignHref)}>
                {!visitItems.length ? (
                  <EmptyBlock icon="calendar-outline" title="No assigned visits" />
                ) : (
                  visitItems.map((visit) => (
                    <View key={visit.id} style={styles.listCard}>
                      <Text style={styles.sideTitle}>{seniorName(visit.seniorId)}</Text>
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

            {tab === 'availability' ? (
              <Panel title="Availability" action="Edit" onAction={startEdit}>
                {staff.availability ? (
                  <Text style={styles.sideTitle}>{staff.availability}</Text>
                ) : (
                  <EmptyBlock icon="time-outline" title="No availability on file" />
                )}
              </Panel>
            ) : null}

            {tab === 'documents' ? (
              <Panel title="Documents">
                <EmptyBlock icon="document-text-outline" title="No documents on file" />
              </Panel>
            ) : null}

            {tab === 'reviews' ? (
              <Panel title="Reviews">
                <EmptyBlock icon="ribbon-outline" title="No reviews in AgeWell yet" />
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
                          {item.createdAt ? formatRelativeTimestamp(item.createdAt) : 'No date'}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.sideMeta}>No activity recorded for this staff member.</Text>
                )}
              </Panel>
            ) : null}
          </>
        ) : null}
      </AdminQueryView>

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this care team member?"
        message={`${displayName} and their login account will be permanently removed.`}
        confirmLabel={deleting ? 'Working…' : 'Delete record'}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!id) return;
          setDeleting(true);
          void deleteAdminCareManager(id)
            .then(() => router.replace('/(admin)/care-managers' as Href))
            .catch(() => setDeleting(false));
        }}
      />
    </KeyboardAwareScrollView>
  );
}

function inSameMonth(value: string | null, now: Date): boolean {
  if (!value) {
    return false;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function KpiCard({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  tone: 'info' | 'safe' | 'warning' | 'accent';
  icon: 'calendar-outline' | 'people-outline' | 'checkmark-circle-outline' | 'time-outline';
}) {
  const bg =
    tone === 'info' ? colors.infoSoft : tone === 'safe' ? colors.safeSoft : tone === 'warning' ? colors.warningSoft : '#F3EEFF';
  const fg =
    tone === 'info' ? colors.info : tone === 'safe' ? colors.safe : tone === 'warning' ? colors.warning : colors.sidebarActive;
  return (
    <View style={[styles.summaryCard, { backgroundColor: bg }]}>
      <IconWell tone={tone === 'accent' ? 'primary' : tone} size={36}>
        <Icon name={icon} size={16} color={fg} />
      </IconWell>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryHint}>{hint}</Text>
    </View>
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
          <Pressable
            onPress={onAction}
            accessibilityRole="button"
            accessibilityLabel={action}
            style={styles.panelActionBtn}
          >
            <Icon name="create-outline" size={13} color={colors.sidebarActive} />
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

function EmptyBlock({
  icon,
  title,
}: {
  icon: 'calendar-outline' | 'ribbon-outline' | 'time-outline' | 'document-text-outline' | 'call-outline';
  title: string;
}) {
  return (
    <View style={styles.emptyBlock}>
      <IconWell tone="primary" size={44}>
        <Icon name={icon} size={20} color={colors.primary} />
      </IconWell>
      <Text style={styles.emptyTitle}>{title}</Text>
    </View>
  );
}

function EditForm({
  firstName,
  lastName,
  email,
  phone,
  employeeId,
  staffKind,
  skills,
  experience,
  languages,
  availability,
  status,
  accountStatus,
  formError,
  saving,
  showPersonal,
  onChange,
  onSave,
  onCancel,
}: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeId: string;
  staffKind: StaffKind;
  skills: string;
  experience: string;
  languages: string;
  availability: string;
  status: string;
  accountStatus: string;
  formError: string | null;
  saving: boolean;
  showPersonal: boolean;
  onChange: {
    firstName: (value: string) => void;
    lastName: (value: string) => void;
    email: (value: string) => void;
    phone: (value: string) => void;
    employeeId: (value: string) => void;
    staffKind: (value: StaffKind) => void;
    skills: (value: string) => void;
    experience: (value: string) => void;
    languages: (value: string) => void;
    availability: (value: string) => void;
    status: (value: string) => void;
    accountStatus: (value: string) => void;
  };
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <View>
      <Text style={styles.formHint}>Update profile fields and role. Password is not shown here.</Text>
      {showPersonal ? (
        <>
          <TextField label="First name" value={firstName} onChangeText={onChange.firstName} />
          <TextField label="Last name" value={lastName} onChangeText={onChange.lastName} />
          <TextField
            label="Email"
            value={email}
            onChangeText={onChange.email}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextField label="Phone" value={phone} onChangeText={onChange.phone} keyboardType="phone-pad" />
        </>
      ) : null}
      <TextField label="Employee ID" value={employeeId} onChangeText={onChange.employeeId} />
      <AdminFilterChips
        label="Staff role"
        value={staffKind}
        options={STAFF_KINDS.map((kind) => ({ value: kind, label: STAFF_KIND_LABELS[kind] }))}
        onChange={(next) => next && onChange.staffKind(next)}
        allowAll={false}
      />
      <TextField label="Skills" value={skills} onChangeText={onChange.skills} />
      <TextField label="Experience" value={experience} onChangeText={onChange.experience} />
      <TextField label="Languages" value={languages} onChangeText={onChange.languages} />
      <TextField label="Availability" value={availability} onChangeText={onChange.availability} />
      <TextField label="Care status (PENDING / ACTIVE / …)" value={status} onChangeText={onChange.status} />
      <TextField
        label="Account status (ACTIVE / DISABLED)"
        value={accountStatus}
        onChangeText={onChange.accountStatus}
        autoCapitalize="characters"
      />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <View style={styles.formActions}>
        <PrimaryButton label="Save registration details" fullWidth={false} loading={saving} onPress={onSave} />
        <SecondaryButton label="Cancel" fullWidth={false} onPress={onCancel} />
      </View>
    </View>
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
  assignBtn: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.sidebarActive,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  assignLabel: {
    ...typography.bodyStrong,
    color: colors.sidebarActive,
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
    flexBasis: 150,
    minWidth: 140,
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
  summaryHint: {
    ...typography.caption,
    color: colors.textSecondary,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
    flex: 1.2,
    gap: spacing.lg,
    minWidth: 260,
  },
  sideCol: {
    flex: 1.4,
    gap: spacing.lg,
    minWidth: 280,
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
  panelActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
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
  tagHeading: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  skillTag: {
    backgroundColor: colors.infoSoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  skillTagLabel: {
    ...typography.captionStrong,
    color: colors.info,
  },
  langTag: {
    backgroundColor: '#F3EEFF',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  langTagLabel: {
    ...typography.captionStrong,
    color: colors.sidebarActive,
  },
  assignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  listCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
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
  error: {
    ...typography.caption,
    color: colors.emergency,
  },
  pressed: {
    opacity: 0.9,
  },
});
