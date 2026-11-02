import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton, TextField } from '@/components';
import { Icon } from '@/components/ui';
import { getApiErrorMessage } from '@/api/errors';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { assignableCareAssociates } from './serviceCompanionServices';
import { useAssignableCareStaff } from './hooks';
import { isServiceCompanionKind, STAFF_KIND_LABELS, parseStaffKind } from './staffKind';

type Props = {
  visible: boolean;
  serviceSlug?: string | null;
  serviceLabel?: string | null;
  hint?: string | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (serviceCompanionId: string) => void;
};

export function AssignServiceCompanionSheet({
  visible,
  serviceSlug,
  serviceLabel,
  hint,
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  const staff = useAssignableCareStaff(visible);
  const [scId, setScId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(true);

  useEffect(() => {
    if (!visible) {
      setScId(null);
      setSearch('');
      setError(null);
      setMenuOpen(true);
    }
  }, [visible]);

  const options = useMemo(() => {
    const list = assignableCareAssociates(staff.data ?? [], { serviceSlug }).filter((item) =>
      isServiceCompanionKind(item.staffKind),
    );
    return list.map((item) => ({
      id: item.id,
      title: item.name?.trim() || item.employeeId || 'Service Companion',
      subtitle: [STAFF_KIND_LABELS[parseStaffKind(item.staffKind)], item.employeeId]
        .filter(Boolean)
        .join(' · '),
    }));
  }, [serviceSlug, staff.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((item) => `${item.title} ${item.subtitle}`.toLowerCase().includes(q));
  }, [options, search]);

  useEffect(() => {
    if (!visible || scId || options.length !== 1) {
      return;
    }
    setScId(options[0].id);
  }, [options, scId, visible]);

  const selected = options.find((item) => item.id === scId) ?? null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
        <View style={styles.sheet}>
          <Text style={styles.title}>Assign Service Companion</Text>
          <Text style={styles.hint}>
            {hint?.trim() ||
              (serviceLabel
                ? `Hand ${serviceLabel} to a Service Companion.`
                : 'Hand this job to a Service Companion.')}
          </Text>

          <Text style={styles.label}>Service Companion</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Service Companion list"
            onPress={() => setMenuOpen((open) => !open)}
            style={styles.dropdown}
          >
            <View style={{ flex: 1 }}>
              <Text style={selected ? styles.dropdownValue : styles.dropdownPlaceholder}>
                {selected ? selected.title : 'Select available Service Companion'}
              </Text>
              {selected?.subtitle ? <Text style={styles.meta}>{selected.subtitle}</Text> : null}
            </View>
            <Icon name="chevron-down" size={20} color={colors.textSecondary} />
          </Pressable>

          {menuOpen ? (
            <View style={styles.menu}>
              {options.length > 0 ? (
                <TextField
                  label="Search"
                  value={search}
                  onChangeText={(next) => {
                    setSearch(next);
                    setError(null);
                  }}
                  placeholder="Name or employee ID"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              ) : null}
              {staff.isPending ? <Text style={styles.hint}>Loading Service Companions…</Text> : null}
              {staff.isError ? (
                <Text style={styles.error}>{getApiErrorMessage(staff.error)}</Text>
              ) : null}
              {!staff.isPending && !staff.isError && options.length === 0 ? (
                <Text style={styles.error}>
                  {serviceSlug
                    ? `No ACTIVE Service Companion covers “${serviceLabel?.trim() || serviceSlug}”. Edit an SC profile and enable this service under their covered services.`
                    : 'No available Service Companion for this service. Add an ACTIVE Service Companion who covers it.'}
                </Text>
              ) : null}
              {!staff.isPending && options.length > 0 && filtered.length === 0 ? (
                <Text style={styles.error}>No Service Companion matches “{search.trim()}”.</Text>
              ) : null}
              <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
                {filtered.map((option) => {
                  const isSelected = option.id === scId;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => {
                        setScId(option.id);
                        setError(null);
                        setMenuOpen(false);
                      }}
                      style={[styles.option, isSelected ? styles.optionSelected : null]}
                    >
                      <View style={styles.optionRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.optionTitle}>{option.title}</Text>
                          <Text style={styles.meta}>{option.subtitle}</Text>
                        </View>
                        {isSelected ? <Icon name="checkmark-circle" size={22} color={colors.primary} /> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton
            label="Confirm"
            loading={loading}
            onPress={() => {
              if (!scId) {
                setError('Select a Service Companion.');
                setMenuOpen(true);
                return;
              }
              onConfirm(scId);
            }}
          />
          <SecondaryButton label="Cancel" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xxl,
    gap: spacing.md,
    maxHeight: '88%',
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  hint: {
    ...typography.body,
    color: colors.textSecondary,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dropdownValue: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  dropdownPlaceholder: {
    ...typography.body,
    color: colors.textMuted,
  },
  menu: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  list: {
    maxHeight: 220,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceElevated,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  error: {
    ...typography.body,
    color: colors.emergency,
  },
});
