import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { familyHome } from './familyHomeTheme';

const SERVICE_AREA_LABEL = 'Kandivali & Borivali, Mumbai';

export function FamilyUnserviceableAreaBanner() {
  return (
    <View style={styles.banner} accessibilityRole="summary">
      <View style={styles.iconWrap}>
        <Icon name="location" size={18} color={familyHome.red} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>You are outside our serviceable area</Text>
        <Text style={styles.subtitle}>Currently we serve in {SERVICE_AREA_LABEL}.</Text>
      </View>
      <Pressable
        onPress={() => router.push('/account/location' as Href)}
        accessibilityRole="button"
        accessibilityLabel="Change location"
        style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
      >
        <Text style={styles.buttonLabel}>Change Location</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 14,
    backgroundColor: familyHome.redSoft,
    borderWidth: 1,
    borderColor: '#F5C2C5',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
    color: familyHome.red,
  },
  subtitle: {
    ...typography.caption,
    color: familyHome.muted,
  },
  button: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: familyHome.red,
    backgroundColor: familyHome.white,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxWidth: 92,
  },
  buttonLabel: {
    ...typography.captionStrong,
    color: familyHome.red,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
});
