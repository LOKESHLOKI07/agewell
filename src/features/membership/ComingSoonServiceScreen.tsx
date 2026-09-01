import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';

type Props = {
  title: string;
  description: string;
  icon: IconName;
  color: string;
  background: string;
};

export function ComingSoonServiceScreen({ title, description, icon, color, background }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title={title} showBack showProfile={false} showBell={false} />
      <View style={styles.body}>
        <View style={[styles.iconWell, { backgroundColor: background }]}>
          <Icon name={icon} size={36} color={color} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Coming in the next build phase</Text>
        </View>
        <Text style={styles.note}>
          This membership service is listed on AgeWell Home and Services. The full UI from the product
          board will land after Care Manager, Companion and SOS.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: familyHome.white,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
  iconWell: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.title,
    color: familyHome.text,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: familyHome.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  badge: {
    marginTop: spacing.xl,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  badgeText: {
    ...typography.captionStrong,
    color: familyHome.greenDark,
  },
  note: {
    ...typography.caption,
    color: familyHome.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 18,
    maxWidth: 320,
  },
});
