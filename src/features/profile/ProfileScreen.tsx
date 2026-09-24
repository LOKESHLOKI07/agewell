import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { queryClient } from '@/api/queryClient';
import { Avatar, ConfirmDialog, MenuRow, Screen } from '@/components';
import { minTouchSize, radius, spacing, typography } from '@/constants/theme';
import { AUTH_ROLE_LABELS } from '@/features/auth/authTypes';
import { useAuth } from '@/features/auth/useAuth';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { updateSeniorMePhoto } from '@/features/home/api/homeApi';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';
import { seniorDisplayName } from '@/features/home/api/mappers';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { useSeniorProfile } from '@/features/home/hooks/queries';
import { pickProfilePhoto } from './profilePhoto';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { user } = useCurrentUser();
  const seniorQuery = useSeniorProfile();
  const photoUri = seniorQuery.data?.photo ?? null;
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [updatingPhoto, setUpdatingPhoto] = useState(false);
  const roleLabel = user ? AUTH_ROLE_LABELS[user.role] : 'Account';
  const displayName = seniorQuery.data
    ? seniorDisplayName(seniorQuery.data)
    : user?.email ?? 'Signed in';

  const closePhotoSheet = () => setPhotoSheetVisible(false);

  const onChangePhoto = () => {
    if (updatingPhoto) {
      return;
    }
    setPhotoSheetVisible(true);
  };

  const applyPhoto = async (photo: string | null) => {
    setUpdatingPhoto(true);
    const previous = seniorQuery.data;
    if (previous) {
      queryClient.setQueryData(homeQueryKeys.seniorMe, { ...previous, photo });
    }
    try {
      const updated = await updateSeniorMePhoto(photo);
      queryClient.setQueryData(homeQueryKeys.seniorMe, updated);
    } catch (error) {
      if (previous) {
        queryClient.setQueryData(homeQueryKeys.seniorMe, previous);
      } else {
        await queryClient.invalidateQueries({ queryKey: homeQueryKeys.seniorMe });
      }
      throw error;
    } finally {
      setUpdatingPhoto(false);
    }
  };

  const pick = async (source: 'library' | 'camera') => {
    closePhotoSheet();
    try {
      const dataUrl = await pickProfilePhoto(source);
      if (!dataUrl) {
        return;
      }
      await applyPhoto(dataUrl);
    } catch (error) {
      Alert.alert(
        'Profile photo',
        error instanceof Error ? error.message : 'Unable to update photo right now.',
        [{ text: 'OK' }],
        { cancelable: true },
      );
    }
  };

  const onRemovePhoto = () => {
    closePhotoSheet();
    void applyPhoto(null).catch((error) => {
      Alert.alert(
        'Profile photo',
        error instanceof Error ? error.message : 'Unable to remove photo right now.',
        [{ text: 'OK' }],
        { cancelable: true },
      );
    });
  };

  const onLogout = async () => {
    setConfirmVisible(false);
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <Avatar
          name={displayName}
          imageUri={photoUri}
          size={72}
          showEditBadge
          onPress={onChangePhoto}
        />
        <Text style={styles.hint}>{updatingPhoto ? 'Saving photo…' : 'Tap to add a photo'}</Text>
        <Text style={styles.name} numberOfLines={2}>{displayName}</Text>
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>{roleLabel}</Text>
        </View>
        {user?.email ? <Text style={styles.meta} numberOfLines={2}>{user.email}</Text> : null}
        {user?.phone ? <Text style={styles.meta}>{user.phone}</Text> : null}
      </View>

      <View style={styles.menu}>
        <MenuRow
          icon="person-outline"
          title="Personal Info"
          subtitle="Your AgeWell account"
          onPress={() =>
            router.push({
              pathname: '/parent/[id]',
              params: { id: seniorQuery.data?.id ?? 'me' },
            })
          }
        />
        <MenuRow icon="medkit-outline" title="Health Info" onPress={() => router.push('/(tabs)/health')} />
        <MenuRow
          icon="call-outline"
          title="Emergency Contacts"
          onPress={() => router.push('/health/emergency-info')}
        />
        <MenuRow icon="ribbon-outline" title="Membership" onPress={() => router.push('/account/membership')} />
        <MenuRow
          icon="settings-outline"
          title="Settings"
          onPress={() => router.push('/account/notification-settings')}
        />
        <MenuRow icon="help-circle-outline" title="Help & Support" onPress={() => router.push('/account/help')} />
        <Pressable
          style={({ pressed }) => [styles.logout, pressed ? styles.logoutPressed : null]}
          onPress={() => setConfirmVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          <Text style={styles.logoutLabel}>{signingOut ? 'Signing out…' : 'Logout'}</Text>
        </Pressable>
      </View>

      <Modal
        visible={photoSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={closePhotoSheet}
      >
        <View style={styles.sheetOverlay}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={closePhotoSheet}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]} accessibilityRole="menu">
            <Text style={styles.sheetTitle}>Profile photo</Text>
            <Text style={styles.sheetMessage}>Choose a photo or go back to keep the current one.</Text>
            <Pressable
              onPress={() => void pick('camera')}
              accessibilityRole="button"
              accessibilityLabel="Take photo"
              style={({ pressed }) => [styles.sheetAction, pressed ? styles.sheetPressed : null]}
            >
              <Text style={styles.sheetActionLabel}>Take photo</Text>
            </Pressable>
            <Pressable
              onPress={() => void pick('library')}
              accessibilityRole="button"
              accessibilityLabel="Photo library"
              style={({ pressed }) => [styles.sheetAction, pressed ? styles.sheetPressed : null]}
            >
              <Text style={styles.sheetActionLabel}>Photo library</Text>
            </Pressable>
            {photoUri ? (
              <Pressable
                onPress={onRemovePhoto}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
                style={({ pressed }) => [styles.sheetAction, pressed ? styles.sheetPressed : null]}
              >
                <Text style={styles.sheetDestructive}>Remove photo</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={closePhotoSheet}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              style={({ pressed }) => [styles.sheetAction, pressed ? styles.sheetPressed : null]}
            >
              <Text style={styles.sheetCancel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={confirmVisible}
        title="Sign out?"
        message="You will need to sign in again to use AgeWell."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        destructive
        onConfirm={() => void onLogout()}
        onCancel={() => setConfirmVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: 20,
    backgroundColor: familyHome.greenSoft,
  },
  hint: {
    ...typography.caption,
    color: familyHome.muted,
  },
  name: {
    ...typography.heading,
    color: familyHome.text,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  rolePill: {
    marginTop: spacing.xs,
    borderRadius: 20,
    backgroundColor: familyHome.green,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  rolePillText: {
    ...typography.captionStrong,
    color: familyHome.white,
  },
  meta: {
    ...typography.body,
    color: familyHome.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  menu: {
    gap: spacing.sm,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  logout: {
    minHeight: minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  logoutPressed: {
    opacity: 0.85,
  },
  logoutLabel: {
    ...typography.bodyStrong,
    color: familyHome.red,
    textAlign: 'center',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.46)',
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    backgroundColor: familyHome.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xs,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  sheetTitle: {
    ...typography.heading,
    color: familyHome.text,
  },
  sheetMessage: {
    ...typography.body,
    color: familyHome.muted,
    marginBottom: spacing.md,
  },
  sheetAction: {
    minHeight: minTouchSize,
    justifyContent: 'center',
  },
  sheetPressed: {
    opacity: 0.85,
  },
  sheetActionLabel: {
    ...typography.bodyStrong,
    color: familyHome.green,
  },
  sheetDestructive: {
    ...typography.bodyStrong,
    color: familyHome.red,
  },
  sheetCancel: {
    ...typography.bodyStrong,
    color: familyHome.muted,
  },
});
