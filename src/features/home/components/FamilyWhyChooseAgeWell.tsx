import { StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { FamilyHomeSectionHeader } from './FamilyHomePrimitives';
import { familyHome } from './familyHomeTheme';

const REASONS: {
  key: string;
  label: string;
  icon: IconName;
  color: string;
  background: string;
}[] = [
  {
    key: 'verified',
    label: 'Verified Professionals',
    icon: 'shield-checkmark-outline',
    color: familyHome.purple,
    background: familyHome.purpleSoft,
  },
  {
    key: 'support',
    label: '24x7 Support',
    icon: 'call-outline',
    color: familyHome.green,
    background: familyHome.greenSoft,
  },
  {
    key: 'safe',
    label: 'Safe & Reliable',
    icon: 'shield-checkmark-outline',
    color: '#1F8A70',
    background: '#E6F6F1',
  },
  {
    key: 'trusted',
    label: 'Trusted by Families',
    icon: 'heart-outline',
    color: '#D81B60',
    background: '#FDE8F0',
  },
];

export function FamilyWhyChooseAgeWell() {
  return (
    <View style={styles.section}>
      <FamilyHomeSectionHeader title="Why Choose AgeWell?" />
      <View style={styles.gridRow}>
        {REASONS.map((item) => (
          <View
            key={item.key}
            style={[styles.gridCard, { backgroundColor: item.background }]}
            accessibilityRole="text"
            accessibilityLabel={item.label}
          >
            <Icon name={item.icon} size={24} color={item.color} />
            <Text style={styles.gridLabel} numberOfLines={2}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.xl,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gridCard: {
    flex: 1,
    minHeight: 88,
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  gridLabel: {
    ...typography.captionStrong,
    color: familyHome.text,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 14,
  },
});
