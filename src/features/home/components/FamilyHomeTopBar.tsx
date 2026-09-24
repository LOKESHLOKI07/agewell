import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Avatar, Icon } from '@/components/ui';
import { minTouchSize, spacing } from '@/constants/theme';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { familyHome } from './familyHomeTheme';

const logo = require('../../../../assets/logo_splash.png');

interface FamilyHomeTopBarProps {
  unreadCount: number;
  profileName: string | null;
  profilePhotoUri?: string | null;
  profileHref?: Href;
  /** Member home mockup: bell + chat instead of the profile avatar. */
  showChat?: boolean;
}

export function FamilyHomeTopBar({
  unreadCount,
  profileName,
  profilePhotoUri,
  profileHref = '/(tabs)/profile' as Href,
  showChat = false,
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
        {showChat ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ask AgeWell assistant"
            onPress={() => router.push('/concierge' as Href)}
            style={styles.avatarBtn}
          >
            <Icon name="chatbubble-outline" size={22} color={familyHome.text} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profile"
            onPress={() => router.push(profileHref)}
            style={styles.avatarBtn}
          >
            <Avatar name={profileName} imageUri={profilePhotoUri} size={36} />
          </Pressable>
        )}
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
  },
  left: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 0,
  },
  logo: {
    // Wordmark is ~3:2 — give it width so AgeWell + tagline stay readable.
    // Pull flush to the screen’s left edge (asset has transparent inset).
    width: 168,
    height: 72,
    marginLeft: -22,
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
