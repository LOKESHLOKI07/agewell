import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { familyHome } from './familyHomeTheme';

const SERVICE_AREA_LABEL = 'Kandivali & Borivali, Mumbai';

export function FamilyServiceableAreaBanner() {
  return (
    <View style={styles.banner} accessibilityRole="summary">
      <View style={styles.iconWrap}>
        <Icon name="location" size={18} color={familyHome.greenDark} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>You are in our serviceable area</Text>
        <Text style={styles.subtitle}>Delivering care in {SERVICE_AREA_LABEL}.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 14,
    backgroundColor: familyHome.greenSoft,
    borderWidth: 1,
    borderColor: '#D7ECD8',
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
    color: familyHome.greenDark,
  },
  subtitle: {
    ...typography.caption,
    color: familyHome.muted,
  },
});
