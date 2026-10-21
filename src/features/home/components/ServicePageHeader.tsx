import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { Icon } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { useI18n } from '@/i18n';
import { safeGoBack } from '@/utils/navigation';

const logo = require('../../../../assets/logo_splash.png');

type ServicePageHeaderProps = {
  unreadCount?: number;
  /** Override default navigation back (e.g. multi-step apply flow). */
  onBack?: () => void;
  showBell?: boolean;
};

/**
 * Uniform chrome for every service page (21 membership + add-ons):
 * AgeWell logo (left) · Back + notifications (right).
 */
export function ServicePageHeader({
  unreadCount = 0,
  onBack,
  showBell = true,
}: ServicePageHeaderProps) {
  const role = useAuthStore((state) => state.user?.role);
  const navigation = useNavigation();
  const { t } = useI18n();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    safeGoBack(navigation.canGoBack(), role);
  };

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Image
          source={logo}
          style={styles.logo}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="AgeWell. Your Comfort. Our Care."
        />
      </View>

      <View style={styles.right}>
        <Pressable
          onPress={handleBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Icon name="arrow-back" size={20} color={familyHome.text} />
          <Text style={styles.backLabel} numberOfLines={1}>
            {t('common.back')}
          </Text>
        </Pressable>
        {showBell ? <NotificationBell unreadCount={unreadCount} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 0,
    paddingRight: spacing.lg,
    paddingBottom: spacing.sm,
    minHeight: 72,
    backgroundColor: familyHome.white,
  },
  left: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  logo: {
    width: 168,
    height: 72,
    marginLeft: -22,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  backBtn: {
    minWidth: minTouchSize,
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
  },
  backLabel: {
    ...typography.body,
    color: familyHome.muted,
  },
});
