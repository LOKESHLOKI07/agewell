import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Avatar, Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { FamilyHomeSectionHeader } from './FamilyHomePrimitives';
import { familyHome } from './familyHomeTheme';

export function FamilyMembersStatus({
  youName,
  youPhotoUri,
}: {
  youName: string;
  youPhotoUri?: string | null;
}) {
  return (
    <View style={styles.section}>
      <FamilyHomeSectionHeader
        title="Family Members Status"
        actionLabel="View All"
        onAction={() => router.push('/(tabs)/profile' as Href)}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <View style={styles.card} accessibilityLabel={`${youName}, Good`}>
          <Text style={styles.label}>You</Text>
          <Avatar name={youName} imageUri={youPhotoUri} size={56} />
          <Text style={styles.name} numberOfLines={1}>
            {youName}
          </Text>
          <Text style={styles.status}>Good</Text>
          <View style={styles.updated}>
            <Icon name="checkmark-circle-outline" size={12} color={familyHome.green} />
            <Text style={styles.updatedText}>Updated today</Text>
          </View>
        </View>
        <Pressable
          onPress={() =>
            Alert.alert('Add a family member', 'Family member invites will be available here soon.')
          }
          accessibilityRole="button"
          accessibilityLabel="Add member"
          style={({ pressed }) => [styles.addCard, pressed ? styles.pressed : null]}
        >
          <View style={styles.addIcon}>
            <Icon name="plus-circle" size={28} color={familyHome.green} />
          </View>
          <Text style={styles.addLabel}>Add Member</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.xl,
  },
  row: {
    gap: spacing.md,
    paddingRight: spacing.md,
  },
  card: {
    width: 124,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: familyHome.border,
    backgroundColor: familyHome.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  label: {
    ...typography.caption,
    color: familyHome.muted,
  },
  name: {
    ...typography.captionStrong,
    color: familyHome.text,
    textAlign: 'center',
  },
  status: {
    ...typography.captionStrong,
    color: familyHome.green,
  },
  updated: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  updatedText: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 10,
  },
  addCard: {
    width: 124,
    minHeight: 168,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C8E0C9',
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  addIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    ...typography.captionStrong,
    color: familyHome.greenDark,
  },
  pressed: {
    opacity: 0.9,
  },
});
