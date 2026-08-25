import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { PrimaryButton, SecondaryButton } from '@/components';
import { Icon, IconWell } from '@/components/ui';
import { cardSurface, colors, minTouchSize, shadows, spacing, typography } from '@/constants/theme';
import { EmergencySubScreen } from './components/EmergencySubScreen';
import { findActiveEmergency } from './mappers';
import { useCreateEmergency, useEmergencyCases } from './hooks';
import {
  EMERGENCY_TYPE_OPTIONS,
  canSubmitEmergency,
  emergencyDetailHref,
  emergencyStatusLabel,
  emergencyTypeLabel,
  getEmergencyCreateErrorMessage,
} from './selectors';
import type { EmergencyType } from './types/emergency';

const VALID_TYPES = new Set<EmergencyType>(['MEDICAL', 'HOSPITAL', 'CARE_MANAGER', 'AGEWELL_SUPPORT']);

function parseTypeParam(value: string | string[] | undefined): EmergencyType | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    return null;
  }
  const upper = raw.toUpperCase() as EmergencyType;
  return VALID_TYPES.has(upper) ? upper : null;
}

export function EmergencyHelpScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const listQuery = useEmergencyCases();
  const createMutation = useCreateEmergency();
  const [selectedType, setSelectedType] = useState<EmergencyType | null>(() => parseTypeParam(params.type));
  const active = findActiveEmergency(listQuery.data?.items ?? []);
  const submitting = createMutation.isPending;
  const canSubmit = canSubmitEmergency(submitting);

  useEffect(() => {
    const fromParams = parseTypeParam(params.type);
    if (fromParams) {
      setSelectedType(fromParams);
    }
  }, [params.type]);

  const onConfirm = async () => {
    if (!selectedType || !canSubmit) {
      return;
    }
    try {
      const created = await createMutation.mutateAsync(selectedType);
      router.replace(emergencyDetailHref(created.id) as unknown as Href);
    } catch {
      return;
    }
  };

  if (selectedType) {
    return (
      <EmergencySubScreen title="Emergency Assistance">
        <Text style={styles.subtitle}>You selected:</Text>
        <Text style={styles.selected}>{emergencyTypeLabel(selectedType)}</Text>
        <Text style={styles.body}>Are you sure you want to create an emergency request?</Text>
        <Text style={styles.note}>
          This creates an AgeWell emergency case. AgeWell does not send an ambulance or contact emergency
          services from this screen.
        </Text>
        {createMutation.isError ? (
          <Text style={styles.error} accessibilityRole="alert">
            {getEmergencyCreateErrorMessage(createMutation.error)}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <SecondaryButton
            label="Cancel"
            onPress={() => {
              if (submitting) {
                return;
              }
              createMutation.reset();
              setSelectedType(null);
            }}
            disabled={submitting}
            accessibilityHint="Returns to Emergency Help without creating a request"
          />
          <PrimaryButton
            label={submitting ? 'Creating emergency request...' : 'Confirm Emergency'}
            loading={submitting}
            disabled={!canSubmit}
            onPress={() => void onConfirm()}
            accessibilityHint="Creates an AgeWell emergency case"
          />
        </View>
      </EmergencySubScreen>
    );
  }

  return (
    <EmergencySubScreen title="Emergency Help">
      <View style={styles.sosWrap}>
        <Pressable
          onPress={() => setSelectedType('MEDICAL')}
          accessibilityRole="button"
          accessibilityLabel="SOS. Opens confirmation for a medical emergency request"
          accessibilityHint="Creates an AgeWell emergency case after confirmation. This does not call emergency services."
          style={({ pressed }) => [styles.sos, pressed ? styles.pressed : null]}
        >
          <Text style={styles.sosText}>SOS</Text>
        </Pressable>
        <Text style={styles.sosHint}>Tap to start an AgeWell emergency request</Text>
      </View>

      {active ? (
        <Pressable
          style={styles.activeCard}
          onPress={() => router.push(emergencyDetailHref(active.id) as unknown as Href)}
          accessibilityRole="button"
          accessibilityLabel={`Emergency Assistance Active. Status ${emergencyStatusLabel(active.status)}. View Emergency Status`}
        >
          <Text style={styles.activeTitle}>Emergency Assistance Active</Text>
          <Text style={styles.activeLine}>
            {emergencyTypeLabel(active.type)} · {emergencyStatusLabel(active.status)}
          </Text>
          <Text style={styles.activeLink}>View Emergency Status</Text>
        </Pressable>
      ) : null}

      <Text style={styles.lead}>Who AgeWell can notify</Text>
      <View style={styles.list}>
        {EMERGENCY_TYPE_OPTIONS.map((option) => (
          <Pressable
            key={option.type}
            style={styles.typeCard}
            onPress={() => setSelectedType(option.type)}
            accessibilityRole="button"
            accessibilityLabel={option.accessibilityLabel}
            accessibilityHint="Opens a confirmation before creating an AgeWell emergency case"
          >
            <IconWell tone="emergency" size={48}>
              <Icon name={option.icon} size={22} color={colors.emergency} />
            </IconWell>
            <Text style={styles.typeTitle}>{option.title}</Text>
            <Icon name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
      <Text style={styles.footnote}>
        AgeWell Support creates a support case. Calling support will be available soon.
      </Text>
    </EmergencySubScreen>
  );
}

const styles = StyleSheet.create({
  sosWrap: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
    sos: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: colors.emergency,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 10,
    borderColor: colors.white,
    ...shadows.float,
  },
  sosText: {
    ...typography.display,
    color: colors.white,
    letterSpacing: 2,
  },
  sosHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
  lead: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  selected: {
    ...typography.title,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  body: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md,
  },
  note: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },
  error: {
    ...typography.body,
    color: colors.emergency,
    marginBottom: spacing.xl,
  },
  actions: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  typeCard: {
    minHeight: minTouchSize,
    ...cardSurface,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  typeTitle: {
    ...typography.subtitle,
    color: colors.text,
    flex: 1,
  },
  activeCard: {
    ...cardSurface,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  activeTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  activeLine: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  activeLink: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginTop: spacing.md,
    minHeight: minTouchSize / 2,
  },
  footnote: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xxl,
  },
});
