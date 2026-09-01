import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import type { MembershipCarePerson } from './mockStaff';
import { MembershipServiceHero } from './MembershipServiceHero';

type Props = {
  title: string;
  person: MembershipCarePerson;
  videoHint?: string;
  slug?: string;
};

export function CarePersonVisitScreen({ title, person, videoHint, slug }: Props) {
  const insets = useSafeAreaInsets();

  const onCall = () => {
    void Linking.openURL(`tel:${person.phone.replace(/\s/g, '')}`).catch(() => {
      Alert.alert('Unable to call', `Please dial ${person.phone} manually.`);
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title={title} showBack showProfile={false} showBell={false} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {slug ? <MembershipServiceHero slug={slug} /> : null}
        <View style={styles.profileCard}>
          <Avatar name={person.name} imageUri={person.photoUri} size={88} />
          <Text style={styles.role}>{person.roleLabel}</Text>
          <Text style={styles.name}>{person.name}</Text>
          <Text style={styles.phone}>{person.phone}</Text>
          <Pressable
            onPress={onCall}
            style={({ pressed }) => [styles.callBtn, pressed ? styles.pressed : null]}
            accessibilityRole="button"
            accessibilityLabel={`Call ${person.name}`}
          >
            <Icon name="call-outline" size={18} color={familyHome.white} />
            <Text style={styles.callLabel}>Call</Text>
          </Pressable>
        </View>

        {videoHint ? (
          <View style={styles.videoCard}>
            <View style={styles.videoIcon}>
              <Icon name="eye-outline" size={22} color={familyHome.green} />
            </View>
            <View style={styles.videoText}>
              <Text style={styles.sectionTitle}>About this service</Text>
              <Text style={styles.videoBody}>{videoHint}</Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionHeading}>Next Visit</Text>
        <View style={styles.visitCard}>
          <View style={styles.badgeUpcoming}>
            <Text style={styles.badgeUpcomingText}>{person.nextVisit.status}</Text>
          </View>
          <Text style={styles.visitLabel}>{person.nextVisit.label}</Text>
          <Text style={styles.visitWhen}>{person.nextVisit.when}</Text>
          {person.nextVisit.notes ? (
            <Text style={styles.visitNotes}>{person.nextVisit.notes}</Text>
          ) : null}
        </View>

        <Text style={styles.sectionHeading}>Visit History</Text>
        <View style={styles.historyList}>
          {person.history.map((visit) => (
            <View key={visit.id} style={styles.historyRow}>
              <View style={styles.historyDot} />
              <View style={styles.historyBody}>
                <Text style={styles.visitLabel}>{visit.label}</Text>
                <Text style={styles.visitWhen}>{visit.when}</Text>
                {visit.notes ? <Text style={styles.visitNotes}>{visit.notes}</Text> : null}
              </View>
              <Text style={styles.historyStatus}>{visit.status}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: familyHome.white,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  profileCard: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 20,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    backgroundColor: familyHome.white,
    gap: spacing.sm,
  },
  role: {
    ...typography.captionStrong,
    color: familyHome.green,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  name: {
    ...typography.title,
    color: familyHome.text,
  },
  phone: {
    ...typography.body,
    color: familyHome.muted,
  },
  callBtn: {
    marginTop: spacing.md,
    minHeight: 48,
    minWidth: 140,
    borderRadius: 12,
    backgroundColor: familyHome.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  callLabel: {
    ...typography.bodyStrong,
    color: familyHome.white,
  },
  videoCard: {
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: 16,
    backgroundColor: familyHome.greenSoft,
    padding: spacing.lg,
    alignItems: 'flex-start',
  },
  videoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoText: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    color: familyHome.text,
  },
  videoBody: {
    ...typography.caption,
    color: familyHome.muted,
    lineHeight: 18,
  },
  sectionHeading: {
    ...typography.subtitle,
    color: familyHome.text,
    marginTop: spacing.sm,
  },
  visitCard: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.xs,
    backgroundColor: familyHome.white,
  },
  badgeUpcoming: {
    alignSelf: 'flex-start',
    backgroundColor: familyHome.greenSoft,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginBottom: spacing.xs,
  },
  badgeUpcomingText: {
    ...typography.captionStrong,
    color: familyHome.greenDark,
  },
  visitLabel: {
    ...typography.bodyStrong,
    color: familyHome.text,
  },
  visitWhen: {
    ...typography.caption,
    color: familyHome.muted,
  },
  visitNotes: {
    ...typography.caption,
    color: familyHome.muted,
    marginTop: 4,
    lineHeight: 18,
  },
  historyList: {
    gap: spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.lg,
    alignItems: 'flex-start',
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: familyHome.green,
    marginTop: 6,
  },
  historyBody: {
    flex: 1,
    gap: 2,
  },
  historyStatus: {
    ...typography.captionStrong,
    color: familyHome.muted,
  },
  pressed: {
    opacity: 0.9,
  },
});
