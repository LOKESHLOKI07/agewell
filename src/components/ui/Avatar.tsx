import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '@/constants/theme';
import { Icon } from './Icon';

interface AvatarProps {
  name?: string | null;
  imageUri?: string | null;
  size?: number;
  showOnline?: boolean;
  showEditBadge?: boolean;
  onPress?: () => void;
}

export function Avatar({
  name,
  imageUri,
  size = 44,
  showOnline = false,
  showEditBadge = false,
  onPress,
}: AvatarProps) {
  const initials = initialsFromName(name);
  const dot = Math.max(10, Math.round(size * 0.22));
  const badge = Math.max(20, Math.round(size * 0.32));
  const content = (
    <View style={{ width: size, height: size }}>
      <View
        style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}
        accessibilityRole="image"
        accessibilityLabel={name ? `${name} avatar` : 'Profile avatar'}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Text style={[styles.initials, { fontSize: Math.round(size * 0.36) }]}>{initials}</Text>
        )}
      </View>
      {showEditBadge ? (
        <View
          style={[
            styles.editBadge,
            {
              width: badge,
              height: badge,
              borderRadius: badge / 2,
            },
          ]}
          accessibilityElementsHidden
        >
          <Icon name="camera-outline" size={Math.round(badge * 0.55)} color={colors.white} />
        </View>
      ) : null}
      {showOnline ? (
        <View
          style={[
            styles.online,
            {
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              right: 0,
              bottom: 0,
            },
          ]}
          accessibilityLabel="Online"
        />
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={imageUri ? 'Change profile photo' : 'Add a profile photo'}
    >
      {content}
    </Pressable>
  );
}

function initialsFromName(name?: string | null): string {
  if (!name?.trim()) {
    return 'A';
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? '';
  const secondPart = parts.find((part, index) => index > 0 && part.toLowerCase() !== parts[0]?.toLowerCase());
  const last = secondPart?.charAt(0) ?? '';
  return `${first}${last}`.toUpperCase() || 'A';
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  online: {
    position: 'absolute',
    backgroundColor: colors.safe,
    borderWidth: 2,
    borderColor: colors.white,
  },
});
