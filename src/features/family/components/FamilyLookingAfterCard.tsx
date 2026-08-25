import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Avatar, Icon } from '@/components/ui';
import { cardSurface, colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { seniorDisplayName } from '@/features/home/api/mappers';
import type { SeniorProfile } from '@/features/home/types/home';
import { familyCarePlanLabel } from '../selectors';

interface FamilyLookingAfterCardProps {
  seniors: SeniorProfile[];
  selectedSenior: SeniorProfile | null;
  planName?: string | null;
  onSelect: (seniorId: string) => void;
  disabled?: boolean;
}

export function FamilyLookingAfterCard({
  seniors,
  selectedSenior,
  planName,
  onSelect,
  disabled = false,
}: FamilyLookingAfterCardProps) {
  const [open, setOpen] = useState(false);
  if (!selectedSenior) {
    return null;
  }

  const name = seniorDisplayName(selectedSenior);
  const canSwitch = seniors.length > 1;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Looking after</Text>
      <View style={styles.row}>
        <Avatar name={name} size={64} />
        <Pressable
          style={styles.identity}
          onPress={() => {
            if (canSwitch && !disabled) {
              setOpen((value) => !value);
            }
          }}
          disabled={!canSwitch || disabled}
          accessibilityRole="button"
          accessibilityLabel={canSwitch ? `${name}. Change senior` : name}
        >
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {canSwitch ? <Icon name="chevron-down" size={18} color={colors.textMuted} /> : null}
          </View>
          <View style={styles.planPill}>
            <Text style={styles.planText}>{familyCarePlanLabel(planName)}</Text>
          </View>
        </Pressable>
        <Pressable
          style={styles.manage}
          onPress={() => router.push('/account/family')}
          accessibilityRole="button"
          accessibilityLabel="Manage family members"
        >
          <Icon name="people-outline" size={16} color={colors.primary} />
          <Text style={styles.manageText}>Manage</Text>
        </Pressable>
      </View>
      {open
        ? seniors
            .filter((senior) => senior.id !== selectedSenior.id)
            .map((senior) => {
              const optionName = seniorDisplayName(senior);
              return (
                <Pressable
                  key={senior.id}
                  style={styles.option}
                  onPress={() => {
                    setOpen(false);
                    onSelect(senior.id);
                  }}
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityLabel={`Show information for ${optionName}`}
                >
                  <Avatar name={optionName} size={36} />
                  <Text style={styles.optionName}>{optionName}</Text>
                </Pressable>
              );
            })
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardSurface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  label: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  identity: {
    flex: 1,
    minHeight: minTouchSize,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    ...typography.heading,
    color: colors.text,
    flexShrink: 1,
  },
  planPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  planText: {
    ...typography.captionStrong,
    color: colors.primary,
  },
  manage: {
    minHeight: minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  manageText: {
    ...typography.captionStrong,
    color: colors.primary,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: minTouchSize,
    paddingTop: spacing.sm,
  },
  optionName: {
    ...typography.bodyStrong,
    color: colors.text,
  },
});
