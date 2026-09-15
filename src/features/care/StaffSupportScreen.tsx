import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/ui';
import { cardSurface, colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { CareSubScreen } from './components/CareSubScreen';

const ROWS: { id: string; label: string; icon: IconName; onPress: () => void }[] = [
  {
    id: 'call',
    label: 'Call Support',
    icon: 'call-outline',
    onPress: () => void Linking.openURL('tel:+918000000000'),
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp Support',
    icon: 'chatbubble-outline',
    onPress: () => void Linking.openURL('https://wa.me/918000000000'),
  },
  {
    id: 'report',
    label: 'Report an Issue',
    icon: 'alert-circle-outline',
    onPress: () => Alert.alert('Report an Issue', 'Contact AgeWell operations to escalate a field issue.'),
  },
  {
    id: 'faq',
    label: 'FAQ',
    icon: 'help-circle-outline',
    onPress: () => Alert.alert('FAQ', 'Common staff questions and answers will appear here.'),
  },
];

export function StaffSupportScreen() {
  return (
    <CareSubScreen title="Support">
      <View style={styles.list}>
        {ROWS.map((row) => (
          <Pressable
            key={row.id}
            onPress={row.onPress}
            accessibilityRole="button"
            accessibilityLabel={row.label}
            style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
          >
            <Icon name={row.icon} size={22} color={colors.primary} />
            <Text style={styles.label}>{row.label}</Text>
            <Icon name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </CareSubScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  row: {
    ...cardSurface,
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.text,
    flex: 1,
  },
  pressed: {
    opacity: 0.92,
  },
});
