import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton, TextField } from '@/components';
import { Icon } from '@/components/ui';
import { colors, minTouchSize, radius, spacing, typography } from '@/constants/theme';

export type AdminSearchOption = {
  id: string;
  title: string;
  subtitle?: string;
};

type AdminSearchPickerProps = {
  label: string;
  placeholder?: string;
  options: AdminSearchOption[];
  value?: string | null;
  values?: string[];
  multiple?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  disabledIds?: string[];
  onChange?: (id: string | null) => void;
  onChangeMultiple?: (ids: string[]) => void;
  confirmLabel?: string;
};

export function AdminSearchPicker({
  label,
  placeholder = 'Search…',
  options,
  value,
  values = [],
  multiple = false,
  loading = false,
  emptyMessage = 'No matches.',
  disabledIds = [],
  onChange,
  onChangeMultiple,
  confirmLabel = 'Confirm selection',
}: AdminSearchPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<string[]>(multiple ? values : value ? [value] : []);

  const selectedLabel = useMemo(() => {
    if (multiple) {
      if (!values.length) return 'Select…';
      const titles = options.filter((item) => values.includes(item.id)).map((item) => item.title);
      return titles.length ? titles.join(', ') : `${values.length} selected`;
    }
    const match = options.find((item) => item.id === value);
    return match ? match.title : 'Select…';
  }, [multiple, options, value, values]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((item) =>
      `${item.title} ${item.subtitle ?? ''}`.toLowerCase().includes(needle),
    );
  }, [options, search]);

  const openModal = () => {
    setDraft(multiple ? [...values] : value ? [value] : []);
    setSearch('');
    setOpen(true);
  };

  const toggle = (id: string) => {
    if (disabledIds.includes(id)) return;
    if (multiple) {
      setDraft((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
      return;
    }
    setDraft([id]);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={openModal}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [styles.trigger, pressed ? styles.pressed : null]}
      >
        <Text style={[styles.triggerText, selectedLabel === 'Select…' ? styles.placeholder : null]} numberOfLines={1}>
          {selectedLabel}
        </Text>
        <Icon name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <TextField label="Search" value={search} onChangeText={setSearch} placeholder={placeholder} autoCapitalize="none" />
            {loading ? <Text style={styles.meta}>Loading…</Text> : null}
            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              {!loading && filtered.length === 0 ? <Text style={styles.meta}>{emptyMessage}</Text> : null}
              {filtered.map((item) => {
                const selected = draft.includes(item.id);
                const disabled = disabledIds.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggle(item.id)}
                    disabled={disabled}
                    accessibilityRole={multiple ? 'checkbox' : 'radio'}
                    accessibilityState={{ selected, disabled }}
                    style={({ pressed }) => [
                      styles.option,
                      selected ? styles.optionSelected : null,
                      disabled ? styles.optionDisabled : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <View style={styles.optionBody}>
                      <Text style={styles.optionTitle}>{item.title}</Text>
                      {item.subtitle ? <Text style={styles.optionSub}>{item.subtitle}</Text> : null}
                      {disabled ? <Text style={styles.optionSub}>Already linked</Text> : null}
                    </View>
                    {selected ? <Icon name="checkmark" size={18} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.actions}>
              <SecondaryButton label="Cancel" fullWidth={false} onPress={() => setOpen(false)} />
              <PrimaryButton
                label={confirmLabel}
                fullWidth={false}
                onPress={() => {
                  if (multiple) {
                    onChangeMultiple?.(draft);
                  } else {
                    onChange?.(draft[0] ?? null);
                  }
                  setOpen(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  trigger: {
    minHeight: minTouchSize,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  triggerText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  placeholder: {
    color: colors.textMuted,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    maxHeight: '80%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  sheetTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  list: {
    maxHeight: 280,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionBody: {
    flex: 1,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  optionDisabled: {
    opacity: 0.55,
  },
  optionTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  optionSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  meta: {
    ...typography.body,
    color: colors.textSecondary,
    marginVertical: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  pressed: {
    opacity: 0.92,
  },
});
