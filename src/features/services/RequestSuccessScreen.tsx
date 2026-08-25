import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, Screen, SecondaryButton } from '@/components';
import { Icon, IconWell } from '@/components/ui';
import { colors, spacing, typography } from '@/constants/theme';

export function RequestSuccessScreen() {
  return (
    <Screen>
      <View style={styles.center}>
        <IconWell tone="safe" size={72} rounded="full">
          <Icon name="checkmark" size={32} color={colors.safe} />
        </IconWell>
        <Text style={styles.title}>Request Received</Text>
        <Text style={styles.subtitle}>AgeWell will contact you shortly.</Text>
      </View>
      <PrimaryButton label="Back to Home" onPress={() => router.replace('/(tabs)')} />
      <View style={styles.gap} />
      <SecondaryButton label="View requests" onPress={() => router.replace('/(tabs)/services')} />
      <View style={styles.gap} />
      <SecondaryButton label="Request another service" onPress={() => router.replace('/(tabs)/services')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    paddingTop: spacing.huge,
    paddingBottom: spacing.huge,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.safeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  gap: {
    height: spacing.md,
  },
});
