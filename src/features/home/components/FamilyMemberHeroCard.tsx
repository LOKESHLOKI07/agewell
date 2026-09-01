import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Avatar, Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { formatMembershipValidTill, membershipMemberId } from '@/features/home/memberHome';
import type { CurrentMembership, SeniorProfile } from '@/features/home/types/home';
import { familyHome } from './familyHomeTheme';

export function FamilyMemberHeroCard({
  greetingName,
  senior,
  membership,
}: {
  greetingName: string;
  senior: SeniorProfile | null;
  membership: CurrentMembership;
}) {
  const memberId = membershipMemberId(senior?.id);
  const validTill = formatMembershipValidTill(membership.endDate);

  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.hello} accessibilityRole="header">
            Hello, {greetingName} 👋
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.premium} accessibilityLabel="Premium Member">
              <Icon name="ribbon-outline" size={14} color={familyHome.white} />
              <Text style={styles.premiumLabel}>Premium Member</Text>
            </View>
            {memberId ? <Text style={styles.memberId}>Member ID: {memberId}</Text> : null}
          </View>
          {validTill ? <Text style={styles.valid}>Valid till {validTill}</Text> : null}
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/profile' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          style={styles.avatarWrap}
        >
          <Avatar name={greetingName} imageUri={senior?.photo} size={72} />
          <View style={styles.check}>
            <Icon name="checkmark" size={12} color={familyHome.white} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.sm,
  },
  hello: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: familyHome.text,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  premium: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: familyHome.green,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  premiumLabel: {
    ...typography.captionStrong,
    color: familyHome.white,
  },
  memberId: {
    ...typography.captionStrong,
    color: familyHome.muted,
  },
  valid: {
    ...typography.caption,
    color: familyHome.muted,
  },
  avatarWrap: {
    width: 72,
    height: 72,
  },
  check: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: familyHome.green,
    borderWidth: 2,
    borderColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
