import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { colors, shadows } from '@/constants/theme';
import type { MapCoordinate } from '../live';

export type MapPlaceKind = 'home' | 'senior' | 'associate';

interface MapPlaceMarkerProps {
  coordinate: MapCoordinate;
  kind: MapPlaceKind;
  live?: boolean;
}

const PLACES: Record<MapPlaceKind, { emoji: string; label: string; color: string }> = {
  home: { emoji: '🏠', label: 'Home', color: colors.accent },
  senior: { emoji: '📍', label: 'Senior', color: colors.safe },
  associate: { emoji: '🚗', label: 'Care Associate', color: colors.primary },
};

export function MapPlaceMarker({ coordinate, kind, live = false }: MapPlaceMarkerProps) {
  const place = PLACES[kind];
  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={false}
      accessibilityLabel={place.label}
      title={place.label}
      description={live ? 'Live location' : kind === 'home' ? 'Saved home' : 'Last known location'}
    >
      <View style={styles.wrap} pointerEvents="none">
        <View style={[styles.bubble, shadows.float, { backgroundColor: place.color }]}>
          <Text style={styles.emoji}>{place.emoji}</Text>
        </View>
        <View style={[styles.pointer, { borderTopColor: place.color }]} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  bubble: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    paddingHorizontal: 6,
  },
  emoji: {
    fontSize: 16,
    lineHeight: 20,
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
