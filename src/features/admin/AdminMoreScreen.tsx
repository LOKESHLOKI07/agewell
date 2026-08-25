import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, minTouchSize, radius, spacing, typography } from '@/constants/theme';
import { Icon, IconWell } from '@/components/ui';
import { AdminScreen } from './components/AdminScreen';
import { adminOverflowNav } from './selectors';

export function AdminMoreScreen() {
  return (
    <AdminScreen title="More" subtitle="Additional operations screens.">
      <View style={styles.list}>
        {adminOverflowNav().map((item) => (
          <Pressable
            key={item.key}
            onPress={() => router.push(item.href as Href)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
          >
            <IconWell tone="primary" size={40}>
              <Icon name={item.icon} size={20} color={colors.primary} />
            </IconWell>
            <Text style={styles.label}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  pressed: {
    backgroundColor: colors.primarySoft,
  },
});
