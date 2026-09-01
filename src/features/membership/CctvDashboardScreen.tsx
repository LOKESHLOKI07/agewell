import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { MembershipServiceHero } from './MembershipServiceHero';
import { CCTV_ACTIVITY } from './mockLifestyle';

export function CctvDashboardScreen() {
  const insets = useSafeAreaInsets();

  const onControl = (action: string) => {
    Alert.alert(
      action,
      'Live camera, cloud storage and two-way talk will connect when CCTV hardware is integrated. This is the membership UI shell.',
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="CCTV Dashboard" showBack showProfile={false} showBell={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MembershipServiceHero slug="cctv" imageOnly />

        <View style={styles.liveCard}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE · Entrance</Text>
          </View>
          <View style={styles.viewport}>
            <Icon name="eye-outline" size={36} color={familyHome.white} />
            <Text style={styles.viewportText}>Live entrance footage</Text>
            <Text style={styles.viewportSub}>Camera feed placeholder</Text>
          </View>

          <View style={styles.controls}>
            <Pressable
              style={styles.controlBtn}
              onPress={() => onControl('Screenshot')}
              accessibilityRole="button"
              accessibilityLabel="Screenshot"
            >
              <Icon name="camera-outline" size={18} color={familyHome.greenDark} />
              <Text style={styles.controlLabel}>Screenshot</Text>
            </Pressable>
            <Pressable
              style={styles.controlBtn}
              onPress={() => onControl('Record')}
              accessibilityRole="button"
              accessibilityLabel="Record"
            >
              <Icon name="create-outline" size={18} color={familyHome.greenDark} />
              <Text style={styles.controlLabel}>Record</Text>
            </Pressable>
            <Pressable
              style={styles.controlBtn}
              onPress={() => onControl('Two-way talk')}
              accessibilityRole="button"
              accessibilityLabel="Two-way talk"
            >
              <Icon name="call-outline" size={18} color={familyHome.greenDark} />
              <Text style={styles.controlLabel}>Talk</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.section}>Recent activity</Text>
        <View style={styles.list}>
          {CCTV_ACTIVITY.map((item) => (
            <View key={item.id} style={styles.activityRow}>
              <View style={styles.activityIcon}>
                <Icon name="warning-outline" size={16} color={familyHome.orange} />
              </View>
              <View style={styles.activityBody}>
                <Text style={styles.activityLabel}>{item.label}</Text>
                <Text style={styles.activityWhen}>{item.when}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
  liveCard: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: familyHome.white,
  },
  liveBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: familyHome.red,
  },
  liveBadgeText: { ...typography.captionStrong, color: familyHome.white },
  viewport: {
    height: 220,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  viewportText: { ...typography.bodyStrong, color: familyHome.white },
  viewportSub: { ...typography.caption, color: '#B0B0B0' },
  controls: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  controlBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  controlLabel: { ...typography.captionStrong, color: familyHome.greenDark },
  section: { ...typography.subtitle, color: familyHome.text, marginTop: spacing.sm },
  list: { gap: spacing.sm },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.lg,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: familyHome.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityBody: { flex: 1, gap: 2 },
  activityLabel: { ...typography.bodyStrong, color: familyHome.text },
  activityWhen: { ...typography.caption, color: familyHome.muted },
});
