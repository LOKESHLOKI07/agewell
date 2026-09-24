import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { familyHome } from '@/features/home/components/familyHomeTheme';

type ServiceHelpBannerProps = {
  /** Blue (default) or green tint — same layout either way. */
  tone?: 'blue' | 'green';
};

/**
 * Uniform “Have Questions?” row on every service page.
 * Taps through to Contact Support (`/account/help`).
 */
export function ServiceHelpBanner({ tone = 'blue' }: ServiceHelpBannerProps) {
  const green = tone === 'green';

  return (
    <Pressable
      onPress={() => router.push('/account/help' as Href)}
      style={({ pressed }) => [
        green ? styles.bannerGreen : styles.banner,
        pressed ? styles.pressed : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Have questions? Contact support"
    >
      <View style={green ? styles.iconGreen : styles.icon}>
        <Icon name="help-circle-outline" size={16} color={familyHome.white} />
      </View>
      <View style={styles.copy}>
        <Text style={green ? styles.titleGreen : styles.title}>Have Questions?</Text>
        <Text style={green ? styles.bodyGreen : styles.body}>
          Our team is here to help. Reach out to us anytime.
        </Text>
      </View>
      <Icon
        name="chevron-forward"
        size={16}
        color={green ? familyHome.greenDark : familyHome.blue}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  bannerGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: familyHome.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
  title: { ...typography.bodyStrong, color: familyHome.blueDark },
  body: { ...typography.caption, color: familyHome.text, marginTop: 2, lineHeight: 18 },
  titleGreen: { ...typography.bodyStrong, color: familyHome.greenDark },
  bodyGreen: { ...typography.caption, color: familyHome.greenDark, marginTop: 2, lineHeight: 18 },
  pressed: { opacity: 0.92 },
});
