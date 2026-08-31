import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { PrimaryButton, PremiumCard, SecondaryButton, StatusPill, TextField, statusToneFromLabel } from '@/components';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { AUTH_ROLES, type AuthRole } from '@/features/auth/authTypes';
import { formatLongDate, formatRelativeDay, formatTime, toDisplayDate } from '@/utils/date';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { AdminSearchPicker } from './components/AdminSearchPicker';
import {
  createAdminCareManager,
  createAdminSenior,
  createAdminVisit,
} from './api';
import {
  useAdminCareManagerByUserId,
  useAdminCareManagers,
  useAdminSeniorByUserId,
  useAdminSeniors,
  useAdminUser,
  useAdminVisits,
  useCreateAdminUser,
  useCreateAdminVisit,
  useUpdateAdminCareManager,
  useUpdateAdminSenior,
  useUpdateAdminUser,
} from './hooks';
import {
  adminCareManagerDisplay,
  adminRoleLabel,
  adminSeniorDisplay,
  getAdminErrorMessage,
  getSectionState,
  humanizeStatus,
  titleCaseName,
} from './selectors';

const ROLE_OPTIONS = AUTH_ROLES.map((role) => ({ value: role, label: adminRoleLabel(role) }));
const ACCOUNT_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'DISABLED', label: 'Disabled' },
];

function normalizeParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function AdminUserDetailScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = normalizeParam(params.id);
  const queryClient = useQueryClient();
  const query = useAdminUser(id);
  const update = useUpdateAdminUser(id ?? '');

  const role = query.data?.role;
  const isSenior = role === 'SENIOR';
  const isCare = role === 'CARE_MANAGER';
  const isStaffOnly = role === 'ADMIN' || role === 'OPERATIONS' || role === 'FAMILY';

  const seniorQuery = useAdminSeniorByUserId(isSenior ? id : undefined);
  const careQuery = useAdminCareManagerByUserId(isCare ? id : undefined);

  const linkedSenior = seniorQuery.data ?? null;
  const linkedCare = careQuery.data ?? null;

  const updateSenior = useUpdateAdminSenior(linkedSenior?.id ?? '');
  const updateCare = useUpdateAdminCareManager(linkedCare?.id ?? '');

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [accountStatus, setAccountStatus] = useState('ACTIVE');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [languages, setLanguages] = useState('');
  const [availability, setAvailability] = useState('');
  const [careStatus, setCareStatus] = useState('');
  const [pendingCareManagerId, setPendingCareManagerId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    setEmail('');
    setPhone('');
    setAccountStatus('ACTIVE');
    setFirstName('');
    setLastName('');
    setDateOfBirth('');
    setAddress('');
    setEmergencyContact('');
    setPreferredLanguage('');
    setEmployeeId('');
    setSkills('');
    setExperience('');
    setLanguages('');
    setAvailability('');
    setCareStatus('');
    setPendingCareManagerId(null);
    setFormError(null);
    setSavedMessage(null);
  }, [id]);

  useEffect(() => {
    if (query.data) {
      setEmail(query.data.email);
      setPhone(query.data.phone);
      setAccountStatus(query.data.accountStatus || 'ACTIVE');
    }
  }, [query.data]);

  useEffect(() => {
    if (linkedSenior) {
      setFirstName(linkedSenior.firstName ?? '');
      setLastName(linkedSenior.lastName ?? '');
      setDateOfBirth(toDisplayDate(linkedSenior.dateOfBirth));
      setAddress(linkedSenior.address ?? '');
      setEmergencyContact(linkedSenior.emergencyContact ?? '');
      setPreferredLanguage(linkedSenior.preferredLanguage ?? '');
    }
  }, [linkedSenior]);

  useEffect(() => {
    if (linkedCare) {
      setFirstName(linkedCare.firstName ?? '');
      setLastName(linkedCare.lastName ?? '');
      setEmployeeId(linkedCare.employeeId ?? '');
      setSkills(linkedCare.skills ?? '');
      setExperience(linkedCare.experience ?? '');
      setLanguages(linkedCare.languages ?? '');
      setAvailability(linkedCare.availability ?? '');
      setCareStatus(linkedCare.status ?? '');
    }
  }, [linkedCare]);

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && !query.data,
  });

  const invalidateByUser = async () => {
    if (!id) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'seniors', 'by-user', id] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'careManagers', 'by-user', id] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'seniors'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'careManagers'] }),
    ]);
  };

  const saveAll = async () => {
    if (!query.data || !id) return;
    setFormError(null);
    setSavedMessage(null);
    setSaving(true);
    try {
      await update.mutateAsync({ email, phone, accountStatus });

      if (isSenior) {
        let seniorId = linkedSenior?.id;
        if (linkedSenior) {
          await updateSenior.mutateAsync({
            firstName,
            lastName,
            dateOfBirth,
            address,
            emergencyContact,
            preferredLanguage: preferredLanguage || undefined,
            email,
            phone,
          });
        } else {
          const created = await createAdminSenior({
            userId: id,
            firstName,
            lastName,
            dateOfBirth,
            address,
            emergencyContact,
            preferredLanguage: preferredLanguage || undefined,
          });
          seniorId = created.id;
          await invalidateByUser();
        }

        if (pendingCareManagerId && seniorId) {
          await createAdminVisit({
            seniorId,
            careManagerId: pendingCareManagerId,
            status: 'SCHEDULED',
            notes: 'Assigned from Admin user detail',
          });
          setPendingCareManagerId(null);
          await queryClient.invalidateQueries({ queryKey: ['admin', 'visits'] });
        }
      } else if (isCare) {
        if (linkedCare) {
          await updateCare.mutateAsync({
            employeeId,
            firstName,
            lastName,
            skills,
            experience,
            languages,
            availability,
            status: careStatus,
          });
        } else {
          await createAdminCareManager({
            userId: id,
            employeeId: employeeId || `EMP-${id.slice(0, 8)}`,
            firstName,
            lastName,
            skills,
            experience,
            languages,
            availability,
            status: careStatus || 'PENDING',
          });
          await invalidateByUser();
        }
      }

      setSavedMessage('All changes saved.');
    } catch (error) {
      setFormError(getAdminErrorMessage(error, 'user'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminScreen
      title="User account"
      subtitle="Edit any registration details below. One Save updates everything on this page."
      backHref="/(admin)/users"
      actions={
        <PrimaryButton
          label={saving ? 'Saving…' : 'Save'}
          fullWidth={false}
          loading={saving || update.isPending}
          onPress={() => {
            void saveAll();
          }}
        />
      }
    >
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading user..."
        emptyTitle="User not found"
        emptyMessage="This user is not in AgeWell."
        errorKind="user"
      >
        {query.data ? (
          <>
            <PremiumCard style={styles.card}>
              <View style={styles.headerRow}>
                <View style={styles.flex}>
                  <Text style={styles.emailTitle}>{query.data.email}</Text>
                  <Text style={styles.meta}>Created {query.data.createdAt ? formatLongDate(query.data.createdAt) : '—'}</Text>
                </View>
                <StatusPill label={adminRoleLabel(query.data.role)} tone="primary" />
              </View>

              <Text style={styles.hint}>
                Same fields collected at registration (password is not shown). Role is locked to protect linked profiles.
                {(isSenior || isCare) && !(linkedSenior || linkedCare)
                  ? ' Fill the fields below and Save to create the linked profile.'
                  : null}
              </Text>

              <View style={styles.fieldGrid}>
                {(isSenior || isCare) && !isStaffOnly ? (
                  <>
                    <View style={styles.field}>
                      <TextField label="First name" value={firstName} onChangeText={setFirstName} />
                    </View>
                    <View style={styles.field}>
                      <TextField label="Last name" value={lastName} onChangeText={setLastName} />
                    </View>
                  </>
                ) : null}

                <View style={styles.field}>
                  <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                </View>
                <View style={styles.field}>
                  <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                </View>

                {isSenior ? (
                  <>
                    <View style={styles.field}>
                      <TextField label="Date of birth (DD-MM-YYYY)" value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="10-03-1952" />
                    </View>
                    <View style={styles.field}>
                      <TextField label="Address" value={address} onChangeText={setAddress} />
                    </View>
                    <View style={styles.field}>
                      <TextField label="Preferred language (en / hi / mr)" value={preferredLanguage} onChangeText={setPreferredLanguage} autoCapitalize="none" />
                    </View>
                    <View style={styles.field}>
                      <TextField label="Emergency contact" value={emergencyContact} onChangeText={setEmergencyContact} />
                    </View>
                  </>
                ) : null}

                {isCare ? (
                  <>
                    <View style={styles.field}>
                      <TextField label="Employee ID" value={employeeId} onChangeText={setEmployeeId} />
                    </View>
                    <View style={styles.field}>
                      <TextField label="Skills" value={skills} onChangeText={setSkills} />
                    </View>
                    <View style={styles.field}>
                      <TextField label="Experience" value={experience} onChangeText={setExperience} />
                    </View>
                    <View style={styles.field}>
                      <TextField label="Languages" value={languages} onChangeText={setLanguages} />
                    </View>
                    <View style={styles.field}>
                      <TextField label="Availability" value={availability} onChangeText={setAvailability} />
                    </View>
                    <View style={styles.field}>
                      <TextField label="Care status (PENDING / ACTIVE)" value={careStatus} onChangeText={setCareStatus} />
                    </View>
                  </>
                ) : null}
              </View>

              <AdminFilterChips
                label="Account status"
                value={accountStatus}
                options={ACCOUNT_STATUS_OPTIONS}
                onChange={(next) => next && setAccountStatus(next)}
                allowAll={false}
              />

              {formError ? (
                <Text style={styles.error} accessibilityLiveRegion="polite">
                  {formError}
                </Text>
              ) : null}
              {savedMessage ? (
                <Text style={styles.success} accessibilityLiveRegion="polite">
                  {savedMessage}
                </Text>
              ) : null}
            </PremiumCard>

            {isSenior && id ? (
              <SeniorUserAssignments
                seniorId={linkedSenior?.id}
                pendingCareManagerId={pendingCareManagerId}
                onPendingCareManagerIdChange={setPendingCareManagerId}
              />
            ) : null}

            {isCare ? <CareUserAssignments careManagerId={linkedCare?.id} /> : null}
          </>
        ) : null}
      </AdminQueryView>
    </AdminScreen>
  );
}

function SeniorUserAssignments({
  seniorId,
  pendingCareManagerId,
  onPendingCareManagerIdChange,
}: {
  seniorId: string | undefined;
  pendingCareManagerId: string | null;
  onPendingCareManagerIdChange: (id: string | null) => void;
}) {
  const careManagers = useAdminCareManagers();
  const visits = useAdminVisits({ seniorId, limit: 20, offset: 0 });
  const createVisit = useCreateAdminVisit();

  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  const careOptions = useMemo(
    () =>
      (careManagers.data ?? [])
        .filter((item) => !item.status || item.status.toUpperCase() === 'ACTIVE')
        .map((item) => ({
          id: item.id,
          title: adminCareManagerDisplay(item),
          subtitle: item.employeeId ?? undefined,
        })),
    [careManagers.data],
  );

  const assignCareNow = async () => {
    if (!seniorId) return;
    if (!pendingCareManagerId) {
      setAssignError('Select a care associate first.');
      return;
    }
    setAssignError(null);
    setAssignSuccess(null);
    try {
      const visit = await createVisit.mutateAsync({
        seniorId,
        careManagerId: pendingCareManagerId,
        status: 'SCHEDULED',
        notes: 'Assigned from Admin user detail',
      });
      onPendingCareManagerIdChange(null);
      setAssignSuccess('Care visit created.');
      await visits.refetch();
      router.replace(`/(admin)/visits/${visit.id}` as Href);
    } catch (error) {
      setAssignError(getAdminErrorMessage(error));
    }
  };

  if (!seniorId) {
    return (
      <PremiumCard style={styles.card}>
        <Text style={styles.sectionTitle}>Assignments</Text>
        <Text style={styles.hint}>
          Fill the senior registration fields above and press Save to create the linked profile. Then you can assign care
          visits here.
        </Text>
      </PremiumCard>
    );
  }

  return (
    <>
      <PremiumCard style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.flex}>
            <Text style={styles.sectionTitle}>Senior profile</Text>
            <Text style={styles.personName}>Linked profile ready for assignments</Text>
          </View>
          <SecondaryButton
            label="Open senior details"
            fullWidth={false}
            onPress={() => router.push(`/(admin)/seniors/${seniorId}` as Href)}
          />
        </View>
      </PremiumCard>

      <PremiumCard style={styles.card}>
        <Text style={styles.sectionTitle}>Assign care</Text>
        <Text style={styles.hint}>Select a care associate, then Assign care (or top Save).</Text>
        {(visits.data?.items ?? []).slice(0, 4).map((visit) => (
          <View key={visit.id} style={styles.rowCard}>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>
                {visit.careManagerName ? titleCaseName(visit.careManagerName) : 'Unassigned'}
              </Text>
              <Text style={styles.meta}>
                {visit.scheduledAt
                  ? `${formatRelativeDay(visit.scheduledAt)} · ${formatTime(visit.scheduledAt)}`
                  : 'Schedule not set'}{' '}
                · {humanizeStatus(visit.status)}
              </Text>
            </View>
            <SecondaryButton
              label="View"
              fullWidth={false}
              onPress={() => router.push(`/(admin)/visits/${visit.id}` as Href)}
            />
          </View>
        ))}
        {(visits.data?.items.length ?? 0) === 0 ? <Text style={styles.meta}>No visits yet.</Text> : null}
        <AdminSearchPicker
          label="Care associate"
          options={careOptions}
          value={pendingCareManagerId}
          loading={careManagers.isPending}
          emptyMessage="No ACTIVE care associates available."
          confirmLabel="Select"
          onChange={onPendingCareManagerIdChange}
        />
        <View style={styles.buttonRow}>
          <PrimaryButton
            label="Assign care"
            fullWidth={false}
            loading={createVisit.isPending}
            onPress={() => {
              void assignCareNow();
            }}
          />
          <SecondaryButton
            label="Visit details"
            fullWidth={false}
            onPress={() => router.push(`/(admin)/visits/new?seniorId=${seniorId}` as Href)}
          />
        </View>
      </PremiumCard>

      {assignError ? <Text style={styles.error}>{assignError}</Text> : null}
      {assignSuccess ? <Text style={styles.success}>{assignSuccess}</Text> : null}
    </>
  );
}

function CareUserAssignments({ careManagerId }: { careManagerId: string | undefined }) {
  const visits = useAdminVisits({ careManagerId, limit: 20, offset: 0 });
  const seniors = useAdminSeniors({ limit: 100, offset: 0 });

  const seniorName = (seniorId: string) => {
    const senior = seniors.data?.items.find((item) => item.id === seniorId);
    return senior ? adminSeniorDisplay(senior) : seniorId;
  };

  if (!careManagerId) {
    return (
      <PremiumCard style={styles.card}>
        <Text style={styles.sectionTitle}>Assigned visits</Text>
        <Text style={styles.hint}>
          Fill the care associate registration fields above and press Save to create the linked profile. Assigned visits
          will appear here afterward.
        </Text>
      </PremiumCard>
    );
  }

  return (
    <PremiumCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <Text style={styles.sectionTitle}>Assigned visits</Text>
          <Text style={styles.hint}>Recent visits for this care associate.</Text>
        </View>
        <SecondaryButton
          label="Open care profile"
          fullWidth={false}
          onPress={() => router.push(`/(admin)/care-managers/${careManagerId}` as Href)}
        />
      </View>
      {(visits.data?.items ?? []).slice(0, 8).map((visit) => (
        <View key={visit.id} style={styles.rowCard}>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{seniorName(visit.seniorId)}</Text>
            <Text style={styles.meta}>
              {visit.scheduledAt
                ? `${formatRelativeDay(visit.scheduledAt)} · ${formatTime(visit.scheduledAt)}`
                : 'Schedule not set'}{' '}
              · {humanizeStatus(visit.status)}
            </Text>
          </View>
          <StatusPill label={humanizeStatus(visit.status)} tone={statusToneFromLabel(visit.status)} />
          <SecondaryButton
            label="View"
            fullWidth={false}
            onPress={() => router.push(`/(admin)/visits/${visit.id}` as Href)}
          />
        </View>
      ))}
      {(visits.data?.items.length ?? 0) === 0 ? <Text style={styles.meta}>No visits assigned yet.</Text> : null}
      {visits.isPending ? <Text style={styles.meta}>Loading visits…</Text> : null}
    </PremiumCard>
  );
}

export function AdminUserCreateScreen() {
  const create = useCreateAdminUser();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AuthRole>('SENIOR');
  const [formError, setFormError] = useState<string | null>(null);

  return (
    <AdminScreen
      title="Create user"
      subtitle="Creates a login account. Then attach the matching Senior or Care profile."
      backHref="/(admin)/users"
    >
      <PremiumCard style={styles.card}>
        <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextField label="Temporary password" value={password} onChangeText={setPassword} secureTextEntry />
        <AdminFilterChips label="Role" value={role} options={ROLE_OPTIONS} onChange={(next) => next && setRole(next)} allowAll={false} />
        {formError ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {formError}
          </Text>
        ) : null}
        <View style={styles.buttonRow}>
          <PrimaryButton
            label="Create user"
            fullWidth={false}
            loading={create.isPending}
            onPress={() => {
              setFormError(null);
              create.mutate(
                { email, phone, role, password },
                {
                  onError: (error) => setFormError(getAdminErrorMessage(error, 'user')),
                  onSuccess: (user) => router.replace(`/(admin)/users/${user.id}` as Href),
                },
              );
            }}
          />
          <SecondaryButton label="Cancel" fullWidth={false} onPress={() => router.replace('/(admin)/users' as Href)} />
        </View>
      </PremiumCard>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
    width: '100%',
    alignSelf: 'stretch',
  },
  split: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  splitCard: {
    flexGrow: 1,
    flexBasis: 320,
    marginBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  flex: {
    flex: 1,
  },
  emailTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  personName: {
    ...typography.bodyStrong,
    color: colors.text,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  warn: {
    ...typography.caption,
    color: colors.warning,
    marginBottom: spacing.md,
  },
  fieldGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    width: '100%',
  },
  field: {
    flexGrow: 1,
    flexBasis: 280,
    maxWidth: '100%',
  },
  rowCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  rowTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
    marginBottom: spacing.sm,
  },
  success: {
    ...typography.caption,
    color: colors.safe,
    marginBottom: spacing.sm,
  },
});
