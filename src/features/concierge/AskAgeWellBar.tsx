import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { familyHome } from '@/features/home/components/familyHomeTheme';

export function AskAgeWellBar() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ask AgeWell. Say or type anything."
      onPress={() => router.push('/concierge' as Href)}
      style={styles.bar}
    >
      <View style={styles.iconWrap}>
        <Icon name="mic" size={22} color={familyHome.white} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Ask AgeWell Bot</Text>
        <Text style={styles.subtitle}>Tap to talk or type</Text>
      </View>
      <Icon name="chevron-forward" size={20} color={familyHome.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    marginHorizontal: spacing.lg,
    backgroundColor: familyHome.green,
    borderRadius: 18,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  title: { ...typography.bodyStrong, color: familyHome.white, fontSize: 17 },
  subtitle: { ...typography.caption, color: 'rgba(255,255,255,0.88)', marginTop: 2 },
});
