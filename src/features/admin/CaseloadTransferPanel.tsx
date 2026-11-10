import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ConfirmDialog, PrimaryButton } from '@/components';
import { colors, minTouchSize, radius, spacing, typography } from '@/constants/theme';
import { parseStaffKind } from '@/features/care/staffKind';
import { AdminSearchPicker } from './components/AdminSearchPicker';
import {
  useAdminCareManagers,
  useAdminCaseloadPreview,
  useRestoreAdminCaseload,
  useTransferAdminCaseload,
} from './hooks';
import { adminCareManagerDisplay, adminStaffKindLabel, getAdminErrorMessage } from './selectors';
import type { AdminCareManager, CaseloadTransferMode } from './types';

type CaseloadTransferPanelProps = {
  staffId: string;
  staff: AdminCareManager;
  onSuccess: (message: string) => void;
};

export function CaseloadTransferPanel({ staffId, staff, onSuccess }: CaseloadTransferPanelProps) {
  const caseload = useAdminCaseloadPreview(staffId);
  const managers = useAdminCareManagers();
  const transfer = useTransferAdminCaseload(staffId);
  const restore = useRestoreAdminCaseload(staffId);

  const [mode, setMode] = useState<CaseloadTransferMode>('TEMPORARY');
  const [substituteId, setSubstituteId] = useState<string | null>(null);
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const [confirmPermanentFinal, setConfirmPermanentFinal] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const staffKind = parseStaffKind(staff.staffKind);
  const roleLabel = adminStaffKindLabel(staff.staffKind);
  const preview = caseload.data;
  const transferSupported = preview?.transferSupported ?? (staffKind === 'CARE_MANAGER' || staffKind === 'COMPANION');

  const substituteOptions = useMemo(
    () =>
      (managers.data ?? [])
        .filter((item) => {
          if (item.id === staffId) return false;
          if (parseStaffKind(item.staffKind) !== staffKind) return false;
          return !item.status || item.status.toUpperCase() === 'ACTIVE';
        })
        .map((item) => ({
          id: item.id,
          title: adminCareManagerDisplay(item),
          subtitle: item.employeeId ?? undefined,
        })),
    [managers.data, staffId, staffKind],
  );

  if (!transferSupported) {
    return (
      <View style={styles.panel}>
        <Text style={styles.title}>Caseload transfer</Text>
        <Text style={styles.hint}>
          Bulk transfer is available for Care Managers and Companions. Service companions are assigned per job.
        </Text>
      </View>
    );
  }

  const standingCount = preview?.standingSeniorCount ?? 0;
  const coveredCount = preview?.coveredSeniorCount ?? 0;
  const openVisits = preview?.openVisitCount ?? 0;
  const canRestore = Boolean(preview?.canRestore);
  const busy = transfer.isPending || restore.isPending;

  const runTransfer = () => {
    if (!substituteId) return;
    setError(null);
    transfer.mutate(
      { substituteId, mode, transferVisits: true },
      {
        onSuccess: (result) => {
          setConfirmTransfer(false);
          setConfirmPermanentFinal(false);
          setSubstituteId(null);
          onSuccess(
            mode === 'TEMPORARY'
              ? `Temporary cover set for ${result.seniorsMoved} senior${result.seniorsMoved === 1 ? '' : 's'} (${result.visitsMoved} open visit${result.visitsMoved === 1 ? '' : 's'} moved).`
              : `Permanently transferred ${result.seniorsMoved} senior${result.seniorsMoved === 1 ? '' : 's'} (${result.visitsMoved} open visit${result.visitsMoved === 1 ? '' : 's'} moved).`,
          );
        },
        onError: (err) => {
          setConfirmTransfer(false);
          setConfirmPermanentFinal(false);
          setError(getAdminErrorMessage(err, 'care'));
        },
      },
    );
  };

  const runRestore = () => {
    setError(null);
    restore.mutate(undefined, {
      onSuccess: (result) => {
        setConfirmRestore(false);
        onSuccess(
          `Restored ${result.seniorsRestored} senior${result.seniorsRestored === 1 ? '' : 's'} to ${adminCareManagerDisplay(staff)} (${result.visitsMoved} open visit${result.visitsMoved === 1 ? '' : 's'} moved back).`,
        );
      },
      onError: (err) => {
        setConfirmRestore(false);
        setError(getAdminErrorMessage(err, 'care'));
      },
    });
  };

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Bulk caseload transfer</Text>
      <Text style={styles.hint}>
        Move all standing {roleLabel.toLowerCase()} seniors in one step. Use temporary cover for leave so you can
        restore when they return.
      </Text>

      <View style={styles.statsRow}>
        <Stat label="Standing seniors" value={String(standingCount)} />
        <Stat label="Open visits" value={String(openVisits)} />
        <Stat label="Covered (restore)" value={String(coveredCount)} />
      </View>

      {canRestore ? (
        <View style={styles.restoreBox}>
          <Text style={styles.restoreTitle}>Temporary cover is active</Text>
          <Text style={styles.hint}>
            {coveredCount} senior{coveredCount === 1 ? '' : 's'} still list this person as the permanent{' '}
            {roleLabel.toLowerCase()}. Restore when they are back.
          </Text>
          <PrimaryButton
            label={busy ? 'Working…' : 'Restore original caseload'}
            fullWidth={false}
            disabled={busy}
            onPress={() => setConfirmRestore(true)}
          />
        </View>
      ) : null}

      <View style={styles.modeRow} accessibilityRole="radiogroup" accessibilityLabel="Transfer mode">
        <ModeChip
          label="Temporary substitute"
          selected={mode === 'TEMPORARY'}
          onPress={() => setMode('TEMPORARY')}
        />
        <ModeChip label="Permanent transfer" selected={mode === 'PERMANENT'} onPress={() => setMode('PERMANENT')} />
      </View>
      <Text style={styles.hint}>
        {mode === 'TEMPORARY'
          ? 'Marks this staff ON_LEAVE, keeps them as primary owner, and assigns a substitute you can reverse later.'
          : 'Permanently changes ownership. Auto-restore will not be available for these seniors.'}
      </Text>

      <AdminSearchPicker
        label={`Substitute ${roleLabel}`}
        options={substituteOptions}
        value={substituteId}
        loading={managers.isPending}
        emptyMessage={`No ACTIVE ${roleLabel.toLowerCase()}s available.`}
        confirmLabel="Select substitute"
        onChange={setSubstituteId}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <PrimaryButton
          label={busy ? 'Working…' : mode === 'TEMPORARY' ? 'Assign temporary cover' : 'Transfer permanently'}
          fullWidth={false}
          disabled={busy || !substituteId || standingCount === 0}
          onPress={() => setConfirmTransfer(true)}
        />
        {standingCount === 0 ? (
          <Text style={styles.hint}>No standing seniors to move for this {roleLabel.toLowerCase()}.</Text>
        ) : null}
      </View>

      <ConfirmDialog
        visible={confirmTransfer}
        title={mode === 'TEMPORARY' ? 'Assign temporary cover?' : 'Permanently transfer caseload?'}
        message={
          mode === 'TEMPORARY'
            ? `${standingCount} senior${standingCount === 1 ? '' : 's'} and ${openVisits} open visit${openVisits === 1 ? '' : 's'} will move to the substitute. You can restore later.`
            : `${standingCount} senior${standingCount === 1 ? '' : 's'} will permanently move. This cannot be auto-restored.`
        }
        confirmLabel={busy ? 'Working…' : mode === 'TEMPORARY' ? 'Assign cover' : 'Continue'}
        onCancel={() => setConfirmTransfer(false)}
        onConfirm={() => {
          if (mode === 'PERMANENT') {
            setConfirmTransfer(false);
            setConfirmPermanentFinal(true);
            return;
          }
          runTransfer();
        }}
      />
      <ConfirmDialog
        visible={confirmPermanentFinal}
        title="Do you really want to transfer permanently?"
        message="This permanently changes ownership. Restore will not bring these seniors back automatically. Only continue if you are sure."
        confirmLabel={busy ? 'Working…' : 'Yes, transfer permanently'}
        onCancel={() => setConfirmPermanentFinal(false)}
        onConfirm={runTransfer}
      />
      <ConfirmDialog
        visible={confirmRestore}
        title="Restore original caseload?"
        message={`${coveredCount} senior${coveredCount === 1 ? '' : 's'} will return to ${adminCareManagerDisplay(staff)} and open visits will move back.`}
        confirmLabel={busy ? 'Working…' : 'Restore caseload'}
        onCancel={() => setConfirmRestore(false)}
        onConfirm={runRestore}
      />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ModeChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.modeChip,
        selected ? styles.modeChipSelected : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text style={[styles.modeChipLabel, selected ? styles.modeChipLabelSelected : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stat: {
    flexGrow: 1,
    flexBasis: 100,
    minWidth: 90,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.adminCanvas,
    padding: spacing.md,
    gap: spacing.xs,
  },
  statValue: {
    ...typography.title,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  restoreBox: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.safeSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  restoreTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modeChip: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    justifyContent: 'center',
  },
  modeChipSelected: {
    borderColor: colors.sidebarActive,
    backgroundColor: colors.sidebarActive,
  },
  modeChipLabel: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  modeChipLabelSelected: {
    color: colors.white,
  },
  actions: {
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
  },
  pressed: {
    opacity: 0.88,
  },
});
