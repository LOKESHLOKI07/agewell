import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Marker, AnimatedRegion } from 'react-native-maps';
import { colors, shadows } from '@/constants/theme';
import { Icon } from '@/components/ui';
import type { MapCoordinate } from '../live';

interface CareAssociateMarkerProps {
  coordinate: MapCoordinate;
  animatedCoordinate?: AnimatedRegion | MapCoordinate;
  name: string;
  live: boolean;
  heading?: number;
}

export function CareAssociateMarker({
  coordinate,
  animatedCoordinate,
  name,
  live,
  heading = 0,
}: CareAssociateMarkerProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!live) {
      pulse.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [live, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.7] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  return (
    <Marker.Animated
      coordinate={(animatedCoordinate ?? coordinate) as never}
      anchor={{ x: 0.5, y: 0.5 }}
      rotation={heading}
      flat
      tracksViewChanges={live}
      accessibilityLabel="Care Associate location"
      title={name}
      description={live ? 'Live location' : 'Last known location'}
    >
      <View style={styles.wrap} pointerEvents="none">
        {live ? <Animated.View style={[styles.pulse, { opacity, transform: [{ scale }] }]} /> : null}
        <View style={[styles.vehicle, shadows.float]}>
          <View style={{ transform: [{ rotate: '-90deg' }] }}>
            <Icon name="bike" size={20} color={colors.white} />
          </View>
        </View>
      </View>
    </Marker.Animated>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  vehicle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
});
