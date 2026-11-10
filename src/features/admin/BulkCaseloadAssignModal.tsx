import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ConfirmDialog, PrimaryButton, SecondaryButton } from '@/components';
import { colors, minTouchSize, radius, spacing, typography } from '@/constants/theme';
import { parseStaffKind, type StaffKind } from '@/features/care/staffKind';
import { AdminSearchPicker } from './components/AdminSearchPicker';
import {
  useAdminCareManagers,
  useAdminCaseloadPreview,
  useBulkRestoreAdminCaseload,
  useBulkTransferAdminCaseload,
} from './hooks';
import { adminCareManagerDisplay, getAdminErrorMessage } from './selectors';
import type { CaseloadTransferMode } from './types';

type AssignRole = Extract<StaffKind, 'CARE_MANAGER' | 'COMPANION'>;
type BulkAction = 'ASSIGN' | 'RESTORE';

const ROLE_OPTIONS: { value: AssignRole; label: string }[] = [
  { value: 'CARE_MANAGER', label: 'Care Manager' },
  { value: 'COMPANION', label: 'Companion' },
];

type BulkCaseloadAssignModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
};

export function BulkCaseloadAssignModal({ visible, onClose, onSuccess }: BulkCaseloadAssignModalProps) {
  const managers = useAdminCareManagers();
  const transfer = useBulkTransferAdminCaseload();
  const restore = useBulkRestoreAdminCaseload();

  const [action, setAction] = useState<BulkAction>('ASSIGN');
  const [role, setRole] = useState<AssignRole>('CARE_MANAGER');
  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [restoreStaffId, setRestoreStaffId] = useState<string | null>(null);
  const [mode, setMode] = useState<CaseloadTransferMode>('TEMPORARY');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPermanentFinal, setConfirmPermanentFinal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewStaffId = action === 'RESTORE' ? restoreStaffId : fromId;
  const caseload = useAdminCaseloadPreview(previewStaffId ?? undefined);

  useEffect(() => {
    if (!visible) {
      setAction('ASSIGN');
      setRole('CARE_MANAGER');
      setFromId(null);
      setToId(null);
      setRestoreStaffId(null);
      setMode('TEMPORARY');
      setConfirmOpen(false);
      setConfirmPermanentFinal(false);
      setError(null);
    }
  }, [visible]);

  useEffect(() => {
    setFromId(null);
    setToId(null);
    setRestoreStaffId(null);
    setError(null);
  }, [role, action]);

  useEffect(() => {
    setToId(null);
    setError(null);
  }, [fromId]);

  const roleLabel = role === 'COMPANION' ? 'Companion' : 'Care Manager';
  const isRestore = action === 'RESTORE';

  const fromOptions = useMemo(
    () =>
      (managers.data ?? [])
        .filter((item) => parseStaffKind(item.staffKind) === role)
        .map((item) => ({
          id: item.id,
          title: adminCareManagerDisplay(item),
          subtitle: [item.employeeId, item.status ? item.status.replace(/_/g, ' ') : null]
            .filter(Boolean)
            .join(' · ') || undefined,
        })),
    [managers.data, role],
  );

  const toOptions = useMemo(
    () =>
      (managers.data ?? [])
        .filter((item) => {
          if (item.id === fromId) return false;
          if (parseStaffKind(item.staffKind) !== role) return false;
          return !item.status || item.status.toUpperCase() === 'ACTIVE';
        })
        .map((item) => ({
          id: item.id,
          title: adminCareManagerDisplay(item),
          subtitle: item.employeeId ?? undefined,
        })),
    [managers.data, role, fromId],
  );

  const restoreOptions = useMemo(() => {
    const rows = (managers.data ?? []).filter((item) => parseStaffKind(item.staffKind) === role);
    const onLeave = rows.filter((item) => (item.status ?? '').toUpperCase() === 'ON_LEAVE');
    const source = onLeave.length ? onLeave : rows;
    return source.map((item) => ({
      id: item.id,
      title: adminCareManagerDisplay(item),
      subtitle: [item.employeeId, item.status ? item.status.replace(/_/g, ' ') : null]
        .filter(Boolean)
        .join(' · ') || undefined,
    }));
  }, [managers.data, role]);

  const standingCount = caseload.data?.standingSeniorCount ?? 0;
  const coveredCount = caseload.data?.coveredSeniorCount ?? 0;
  const openVisits = caseload.data?.openVisitCount ?? 0;
  const canRestoreSelected = Boolean(caseload.data?.canRestore) || coveredCount > 0;
  const busy = transfer.isPending || restore.isPending;

  const canSubmitAssign = Boolean(fromId && toId && standingCount > 0 && !busy);
  const canSubmitRestore = Boolean(restoreStaffId && canRestoreSelected && !busy && !caseload.isPending);
  const canSubmit = isRestore ? canSubmitRestore : canSubmitAssign;

  const fromName = fromOptions.find((item) => item.id === fromId)?.title ?? 'selected staff';
  const toName = toOptions.find((item) => item.id === toId)?.title ?? 'substitute';
  const restoreName =
    restoreOptions.find((item) => item.id === restoreStaffId)?.title ?? 'selected staff';

  const runTransfer = () => {
    if (!fromId || !toId) return;
    setError(null);
    transfer.mutate(
      { fromStaffId: fromId, substituteId: toId, mode, transferVisits: true },
      {
        onSuccess: (result) => {
          setConfirmOpen(false);
          setConfirmPermanentFinal(false);
          onClose();
          onSuccess(
            mode === 'TEMPORARY'
              ? `Temporary cover: moved ${result.seniorsMoved} senior${result.seniorsMoved === 1 ? '' : 's'} from ${fromName} to ${toName} (${result.visitsMoved} open visit${result.visitsMoved === 1 ? '' : 's'}).`
              : `Permanent transfer: moved ${result.seniorsMoved} senior${result.seniorsMoved === 1 ? '' : 's'} from ${fromName} to ${toName} (${result.visitsMoved} open visit${result.visitsMoved === 1 ? '' : 's'}).`,
          );
        },
        onError: (err) => {
          setConfirmOpen(false);
          setConfirmPermanentFinal(false);
          setError(getAdminErrorMessage(err, 'care'));
        },
      },
    );
  };

  const runRestore = () => {
    if (!restoreStaffId) return;
    setError(null);
    restore.mutate(restoreStaffId, {
      onSuccess: (result) => {
        setConfirmOpen(false);
        onClose();
        onSuccess(
          `Restored ${result.seniorsRestored} senior${result.seniorsRestored === 1 ? '' : 's'} to ${restoreName} (${result.visitsMoved} open visit${result.visitsMoved === 1 ? '' : 's'} moved back).`,
        );
      },
      onError: (err) => {
        setConfirmOpen(false);
        setError(getAdminErrorMessage(err, 'care'));
      },
    });
  };

  return (
    <>
      <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Bulk Assign</Text>
            <Text style={styles.hint}>
              {isRestore
                ? `Return seniors to the original ${roleLabel.toLowerCase()} after temporary leave cover.`
                : `Move all standing seniors from one ${roleLabel.toLowerCase()} to another. Use temporary cover for leave so you can restore later.`}
            </Text>

            <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Action</Text>
              <View style={styles.chipRow} accessibilityRole="radiogroup" accessibilityLabel="Bulk action">
                <Pressable
                  onPress={() => setAction('ASSIGN')}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: action === 'ASSIGN' }}
                  style={({ pressed }) => [
                    styles.chip,
                    action === 'ASSIGN' ? styles.chipSelected : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text style={[styles.chipLabel, action === 'ASSIGN' ? styles.chipLabelSelected : null]}>
                    Assign cover
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setAction('RESTORE')}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: action === 'RESTORE' }}
                  style={({ pressed }) => [
                    styles.chip,
                    action === 'RESTORE' ? styles.chipSelected : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text style={[styles.chipLabel, action === 'RESTORE' ? styles.chipLabelSelected : null]}>
                    Restore
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.label}>Role</Text>
              <View style={styles.chipRow} accessibilityRole="radiogroup" accessibilityLabel="Staff role">
                {ROLE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setRole(option.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: role === option.value }}
                    style={({ pressed }) => [
                      styles.chip,
                      role === option.value ? styles.chipSelected : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={[styles.chipLabel, role === option.value ? styles.chipLabelSelected : null]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {isRestore ? (
                <>
                  <AdminSearchPicker
                    label="Staff to restore"
                    options={restoreOptions}
                    value={restoreStaffId}
                    loading={managers.isPending}
                    emptyMessage={`No ${roleLabel.toLowerCase()}s on temporary leave.`}
                    confirmLabel="Select staff"
                    onChange={setRestoreStaffId}
                  />
                  <Text style={styles.hint}>
                    Pick the original {roleLabel.toLowerCase()} who was covered. Seniors return to them and open visits
                    move back.
                  </Text>

                  {restoreStaffId ? (
                    <View style={styles.preview}>
                      {caseload.isPending ? (
                        <Text style={styles.hint}>Loading coverage…</Text>
                      ) : (
                        <Text style={styles.previewText}>
                          {coveredCount} senior{coveredCount === 1 ? '' : 's'} will return
                          {openVisits > 0
                            ? ` · ${openVisits} open visit${openVisits === 1 ? '' : 's'} on current cover`
                            : ''}
                        </Text>
                      )}
                      {!caseload.isPending && !canRestoreSelected ? (
                        <Text style={styles.hint}>
                          No temporary coverage found for this staff member. Restore only works after a Temporary
                          assign.
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </>
              ) : (
                <>
                  <AdminSearchPicker
                    label="From"
                    options={fromOptions}
                    value={fromId}
                    loading={managers.isPending}
                    emptyMessage={`No ${roleLabel.toLowerCase()}s on file.`}
                    confirmLabel="Select from"
                    onChange={setFromId}
                  />

                  <AdminSearchPicker
                    label="To"
                    options={toOptions}
                    value={toId}
                    loading={managers.isPending}
                    emptyMessage={`No ACTIVE ${roleLabel.toLowerCase()}s available.`}
                    confirmLabel="Select to"
                    onChange={setToId}
                  />

                  <Text style={styles.label}>Assignment type</Text>
                  <View style={styles.chipRow} accessibilityRole="radiogroup" accessibilityLabel="Assignment type">
                    <Pressable
                      onPress={() => setMode('TEMPORARY')}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: mode === 'TEMPORARY' }}
                      style={({ pressed }) => [
                        styles.chip,
                        mode === 'TEMPORARY' ? styles.chipSelected : null,
                        pressed ? styles.pressed : null,
                      ]}
                    >
                      <Text style={[styles.chipLabel, mode === 'TEMPORARY' ? styles.chipLabelSelected : null]}>
                        Temporary
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setMode('PERMANENT')}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: mode === 'PERMANENT' }}
                      style={({ pressed }) => [
                        styles.chip,
                        mode === 'PERMANENT' ? styles.chipSelected : null,
                        pressed ? styles.pressed : null,
                      ]}
                    >
                      <Text style={[styles.chipLabel, mode === 'PERMANENT' ? styles.chipLabelSelected : null]}>
                        Permanent
                      </Text>
                    </Pressable>
                  </View>
                  <Text style={styles.hint}>
                    {mode === 'TEMPORARY'
                      ? 'Marks From as ON_LEAVE and keeps them as primary owner for restore.'
                      : 'Permanently changes ownership. Auto-restore will not be available.'}
                  </Text>

                  {fromId ? (
                    <View style={styles.preview}>
                      {caseload.isPending ? (
                        <Text style={styles.hint}>Loading caseload…</Text>
                      ) : (
                        <Text style={styles.previewText}>
                          {standingCount} senior{standingCount === 1 ? '' : 's'} · {openVisits} open visit
                          {openVisits === 1 ? '' : 's'} will move
                        </Text>
                      )}
                      {standingCount === 0 && !caseload.isPending ? (
                        <Text style={styles.hint}>This staff member has no standing seniors to move.</Text>
                      ) : null}
                    </View>
                  ) : null}
                </>
              )}

              {error ? <Text style={styles.error}>{error}</Text> : null}
            </ScrollView>

            <View style={styles.actions}>
              <SecondaryButton label="Cancel" fullWidth={false} onPress={onClose} />
              <PrimaryButton
                label={
                  busy
                    ? 'Working…'
                    : isRestore
                      ? 'Restore caseload'
                      : mode === 'TEMPORARY'
                        ? 'Assign cover'
                        : 'Transfer permanently'
                }
                fullWidth={false}
                disabled={!canSubmit}
                onPress={() => setConfirmOpen(true)}
              />
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={confirmOpen && !isRestore}
        title={mode === 'TEMPORARY' ? 'Assign temporary cover?' : 'Permanently transfer caseload?'}
        message={
          mode === 'TEMPORARY'
            ? `Move ${standingCount} senior${standingCount === 1 ? '' : 's'} and ${openVisits} open visit${openVisits === 1 ? '' : 's'} from ${fromName} to ${toName}. You can restore later.`
            : `Permanently move ${standingCount} senior${standingCount === 1 ? '' : 's'} from ${fromName} to ${toName}. This cannot be auto-restored.`
        }
        confirmLabel={busy ? 'Working…' : mode === 'TEMPORARY' ? 'Assign cover' : 'Continue'}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (mode === 'PERMANENT') {
            setConfirmOpen(false);
            setConfirmPermanentFinal(true);
            return;
          }
          runTransfer();
        }}
      />
      <ConfirmDialog
        visible={confirmPermanentFinal && !isRestore}
        title="Do you really want to transfer permanently?"
        message={`This will permanently change ownership from ${fromName} to ${toName}. Restore will not bring these seniors back automatically. Only continue if you are sure.`}
        confirmLabel={busy ? 'Working…' : 'Yes, transfer permanently'}
        onCancel={() => setConfirmPermanentFinal(false)}
        onConfirm={runTransfer}
      />
      <ConfirmDialog
        visible={confirmOpen && isRestore}
        title="Restore original caseload?"
        message={`${coveredCount} senior${coveredCount === 1 ? '' : 's'} will return to ${restoreName} and open visits will move back.`}
        confirmLabel={busy ? 'Working…' : 'Restore caseload'}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={runRestore}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    maxHeight: '90%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  body: {
    maxHeight: 460,
  },
  label: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    justifyContent: 'center',
  },
  chipSelected: {
    borderColor: colors.sidebarActive,
    backgroundColor: colors.sidebarActive,
  },
  chipLabel: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  chipLabelSelected: {
    color: colors.white,
  },
  preview: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.adminCanvas,
    gap: spacing.xs,
  },
  previewText: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
    marginBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.88,
  },
});
