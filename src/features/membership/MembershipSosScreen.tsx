import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton, SecondaryButton } from '@/components';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { findActiveEmergency } from '@/features/emergency/mappers';
import { useCreateEmergency, useEmergencyCases } from '@/features/emergency/hooks';
import {
  emergencyDetailHref,
  emergencyStatusLabel,
  emergencyTypeLabel,
  getEmergencyCreateErrorMessage,
} from '@/features/emergency/selectors';
import { useTabScreenBottomPad } from '@/utils/safeBottom';

const NOTIFY_TARGETS = [
  { id: 'family', label: 'Family Members', icon: 'people-outline' as const },
  { id: 'care-manager', label: 'Care Manager', icon: 'account-circle' as const },
  { id: 'companion', label: 'Companion', icon: 'people' as const },
];

/**
 * Phase 1 SOS UI matching the AgeWell board.
 * Confirm still creates a MEDICAL emergency case via the existing API.
 */
export function MembershipSosScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const listQuery = useEmergencyCases();
  const createMutation = useCreateEmergency();
  const [confirming, setConfirming] = useState(false);
  const active = findActiveEmergency(listQuery.data?.items ?? []);
  const submitting = createMutation.isPending;

  const onConfirm = async () => {
    try {
      const created = await createMutation.mutateAsync('MEDICAL');
      setConfirming(false);
      router.push(emergencyDetailHref(created.id) as unknown as Href);
    } catch {
      return;
    }
  };

  if (confirming) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <AgeWellHeader title="Emergency SOS" showBack={false} showProfile={false} showBell={false} />
        <View style={[styles.confirmBody, { paddingBottom: bottomPad }]}>
          <Text style={styles.confirmTitle}>Alert your care circle?</Text>
          <Text style={styles.confirmBodyText}>
            This notifies Family Members, your Care Manager and Companion through AgeWell. It does not
            call an ambulance or public emergency services.
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
                setConfirming(false);
              }}
              disabled={submitting}
            />
            <PrimaryButton
              label={submitting ? 'Sending alert…' : 'Send SOS Alert'}
              loading={submitting}
              disabled={submitting}
              onPress={() => void onConfirm()}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Emergency Support" showBack={false} showProfile={false} showBell={false} />
      <View style={[styles.body, { paddingBottom: bottomPad }]}>
        <Text style={styles.sub}>
          Tap once to alert your Family Members, Care Manager and Companion at the same time.
        </Text>

        <View style={styles.sosWrap}>
          <Pressable
            onPress={() => setConfirming(true)}
            accessibilityRole="button"
            accessibilityLabel="SOS. Tap to alert family, Care Manager and companion"
            style={({ pressed }) => [styles.sos, pressed ? styles.pressed : null]}
          >
            <Text style={styles.sosText}>SOS</Text>
            <Text style={styles.sosTap}>Tap to Alert</Text>
          </Pressable>
        </View>

        <Text style={styles.notifyHeading}>Who will be notified</Text>
        <View style={styles.notifyList}>
          {NOTIFY_TARGETS.map((target) => (
            <View key={target.id} style={styles.notifyRow}>
              <View style={styles.notifyIcon}>
                <Icon name={target.icon} size={18} color={familyHome.red} />
              </View>
              <Text style={styles.notifyLabel}>{target.label}</Text>
              <Icon name="checkmark-circle-outline" size={18} color={familyHome.green} />
            </View>
          ))}
        </View>

        {active ? (
          <Pressable
            style={styles.activeCard}
            onPress={() => router.push(emergencyDetailHref(active.id) as unknown as Href)}
            accessibilityRole="button"
            accessibilityLabel={`Active emergency. Status ${emergencyStatusLabel(active.status)}`}
          >
            <Text style={styles.activeTitle}>SOS Active</Text>
            <Text style={styles.activeLine}>
              {emergencyTypeLabel(active.type)} · {emergencyStatusLabel(active.status)}
            </Text>
            <Text style={styles.activeLink}>View status</Text>
          </Pressable>
        ) : null}

        <View style={styles.videoHint}>
          <Icon name="help-circle-outline" size={18} color={familyHome.muted} />
          <Text style={styles.videoHintText}>
            Short explanation video for SOS will appear here in a later update.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: familyHome.white,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  sub: {
    ...typography.body,
    color: familyHome.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
    lineHeight: 22,
  },
  sosWrap: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  sos: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: familyHome.red,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 10,
    borderColor: '#FFD0D2',
  },
  sosText: {
    ...typography.display,
    color: familyHome.white,
    letterSpacing: 2,
  },
  sosTap: {
    ...typography.captionStrong,
    color: familyHome.white,
    marginTop: 4,
    opacity: 0.95,
  },
  notifyHeading: {
    ...typography.subtitle,
    color: familyHome.text,
    alignSelf: 'stretch',
    marginBottom: spacing.md,
  },
  notifyList: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  notifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  notifyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: familyHome.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyLabel: {
    ...typography.bodyStrong,
    color: familyHome.text,
    flex: 1,
  },
  activeCard: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: familyHome.redSoft,
    backgroundColor: familyHome.redSoft,
    padding: spacing.lg,
  },
  activeTitle: {
    ...typography.bodyStrong,
    color: familyHome.red,
  },
  activeLine: {
    ...typography.caption,
    color: familyHome.muted,
    marginTop: 4,
  },
  activeLink: {
    ...typography.bodyStrong,
    color: familyHome.green,
    marginTop: spacing.sm,
  },
  videoHint: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    alignItems: 'flex-start',
  },
  videoHintText: {
    ...typography.caption,
    color: familyHome.muted,
    flex: 1,
    lineHeight: 18,
  },
  confirmBody: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  confirmTitle: {
    ...typography.title,
    color: familyHome.text,
    marginBottom: spacing.md,
  },
  confirmBodyText: {
    ...typography.body,
    color: familyHome.muted,
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  error: {
    ...typography.body,
    color: familyHome.red,
    marginBottom: spacing.lg,
  },
  actions: {
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.92,
  },
});
