import { Image, StyleSheet, View } from 'react-native';
import { Icon, type IconName } from '@/components/ui';
import { getService3dIcon } from '@/features/services/serviceIcons';

type Props = {
  serviceId: string;
  /** Lucide fallback when no 3D asset exists for this service. */
  fallbackIcon: IconName;
  fallbackColor?: string;
  size?: number;
};

/**
 * Prefer bundled 3D service art; fall back to Lucide for tiles without a match
 * (e.g. More Services).
 */
export function MarketplaceServiceIcon({
  serviceId,
  fallbackIcon,
  fallbackColor,
  size = 40,
}: Props) {
  const source = getService3dIcon(serviceId);

  if (source) {
    return (
      <Image
        source={source}
        style={{ width: size, height: size, borderRadius: Math.round(size * 0.22) }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Icon name={fallbackIcon} size={Math.round(size * 0.5)} color={fallbackColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
});
