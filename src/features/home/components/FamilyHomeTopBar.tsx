import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Avatar } from '@/components/ui';
import { minTouchSize, spacing } from '@/constants/theme';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';

const logo = require('../../../../assets/splash/agewell_logo.png');

interface FamilyHomeTopBarProps {
  unreadCount: number;
  profileName: string | null;
  profilePhotoUri?: string | null;
  profileHref?: Href;
}

export function FamilyHomeTopBar({
  unreadCount,
  profileName,
  profilePhotoUri,
  profileHref = '/(tabs)/profile' as Href,
}: FamilyHomeTopBarProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Image
          source={logo}
          style={styles.logo}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="AgeWell. Your Parents. Our Care."
        />
      </View>

      <View style={styles.right}>
        <NotificationBell unreadCount={unreadCount} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profile"
          onPress={() => router.push(profileHref)}
          style={styles.avatarBtn}
        >
          <Avatar name={profileName} imageUri={profilePhotoUri} size={36} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 2,
    paddingRight: spacing.lg,
    paddingBottom: spacing.sm,
    minHeight: 56,
  },
  left: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 0,
  },
  logo: {
    width: 112,
    height: 46,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  avatarBtn: {
    minWidth: minTouchSize,
    minHeight: minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
