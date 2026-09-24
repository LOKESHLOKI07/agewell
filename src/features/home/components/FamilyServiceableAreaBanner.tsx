import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { familyHome } from './familyHomeTheme';

const SERVICE_AREA_LABEL = 'Kandivali & Borivali, Mumbai';

export function FamilyServiceableAreaBanner({ flush = false }: { flush?: boolean }) {
  return (
    <View style={[styles.banner, flush ? styles.flush : null]} accessibilityRole="summary">
      <View style={styles.iconWrap}>
        <Icon name="location" size={16} color={familyHome.greenDark} />
      </View>
      <View style={styles.copy}>
        <Text
          style={styles.title}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          You are in our serviceable area
        </Text>
        <Text
          style={styles.subtitle}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          Delivering care in {SERVICE_AREA_LABEL}.
        </Text>
      </View>
      <View style={styles.checkWrap}>
        <Icon name="checkmark" size={12} color={familyHome.greenDark} />
      </View>
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
    backgroundColor: familyHome.greenSoft,
    borderWidth: 1,
    borderColor: '#D7ECD8',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  flush: {
    marginHorizontal: 0,
    borderRadius: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 13,
    lineHeight: 16,
    color: familyHome.greenDark,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
    color: familyHome.muted,
  },
  checkWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D7ECD8',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
