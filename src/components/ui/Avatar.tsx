import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '@/constants/theme';

interface AvatarProps {
  name?: string | null;
  size?: number;
  showOnline?: boolean;
}

export function Avatar({ name, size = 44, showOnline = false }: AvatarProps) {
  const initials = initialsFromName(name);
  const dot = Math.max(10, Math.round(size * 0.22));
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}
        accessibilityRole="image"
        accessibilityLabel={name ? `${name} avatar` : 'Profile avatar'}
      >
        <Text style={[styles.initials, { fontSize: Math.round(size * 0.36) }]}>{initials}</Text>
      </View>
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
}

function initialsFromName(name?: string | null): string {
  if (!name?.trim()) {
    return 'A';
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) ?? '' : '';
  return `${first}${last}`.toUpperCase() || 'A';
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  online: {
    position: 'absolute',
    backgroundColor: colors.safe,
    borderWidth: 2,
    borderColor: colors.white,
  },
});
