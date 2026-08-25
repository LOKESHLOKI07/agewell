import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SecondaryButton } from '@/components';
import { colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { trackingHref } from '@/features/tracking/selectors';
import { useI18n, type AppLocale } from '@/i18n';
import { useState } from 'react';

const LOCALE_OPTIONS: { id: AppLocale; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिन्दी (Hindi)' },
  { id: 'mr', label: 'मराठी (Marathi)' },
];

export default function PrivacyScreen() {
  const role = useAuthStore((state) => state.user?.role);
  const { locale, setLocale, t } = useI18n();
  const [permissions, setPermissions] = useState({
    health: true,
    visit: true,
    emergency: true,
    familyAccess: false,
  });

  const toggleSwitch = (key: keyof typeof permissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={styles.container}>
      <AgeWellHeader title="Privacy & Permissions" showBack={true} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>Manage what information is shared and who can access it.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <Text style={styles.locationCopy}>
            Choose app language. API data (names, notes, event titles) is never auto-translated.
          </Text>
          {LOCALE_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              style={styles.localeRow}
              onPress={() => setLocale(option.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: locale === option.id }}
              accessibilityLabel={`Language ${option.label}`}
            >
              <Text style={styles.label}>{option.label}</Text>
              <Text style={styles.localeState}>{locale === option.id ? 'Selected' : 'Select'}</Text>
            </Pressable>
          ))}
          <Text style={styles.locationCopy}>
            Hindi and Marathi catalogs are ready for translation keys ({t('brand.name')} stays English until copy is
            finalized).
          </Text>
        </View>

        <View style={[styles.section, styles.sectionGap]}>
          <View style={styles.locationBlock}>
            <Text style={styles.label}>Location sharing</Text>
            <Text style={styles.locationCopy}>
              Live location is shared from Live Tracking using your current device location. AgeWell does not keep a
              Start/Stop status on the server.
            </Text>
            {role === 'SENIOR' ? (
              <SecondaryButton
                label="Open Live Tracking"
                onPress={() => router.push(trackingHref() as Href)}
                accessibilityHint="Opens live location sharing"
              />
            ) : (
              <Text style={styles.locationCopy}>
                If a senior has shared live location, authorized family and assigned care staff can view it from Live
                location.
              </Text>
            )}
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Health Information</Text>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary }}
              onValueChange={() => toggleSwitch('health')}
              value={permissions.health}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Visit Updates</Text>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary }}
              onValueChange={() => toggleSwitch('visit')}
              value={permissions.visit}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Emergency Alerts</Text>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary }}
              onValueChange={() => toggleSwitch('emergency')}
              value={permissions.emergency}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Family Access</Text>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary }}
              onValueChange={() => toggleSwitch('familyAccess')}
              value={permissions.familyAccess}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  description: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  section: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionGap: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  locationBlock: {
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: minTouchSize,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  localeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: minTouchSize,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  localeState: {
    ...typography.captionStrong,
    color: colors.primary,
  },
  label: { ...typography.bodyStrong, color: colors.text, flex: 1, paddingRight: spacing.md },
  locationCopy: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
});
