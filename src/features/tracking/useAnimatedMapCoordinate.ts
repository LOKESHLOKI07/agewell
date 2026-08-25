import { useEffect, useRef } from 'react';
import { AnimatedRegion } from 'react-native-maps';
import { MARKER_ANIMATION_MS, nextMarkerMotion, type MapCoordinate } from './live';

const DELTA = 0.001;

export function useAnimatedMapCoordinate(target: MapCoordinate | null) {
  const previousRef = useRef<MapCoordinate | null>(null);
  const regionRef = useRef<AnimatedRegion | null>(null);

  if (target && !regionRef.current) {
    regionRef.current = new AnimatedRegion({
      latitude: target.latitude,
      longitude: target.longitude,
      latitudeDelta: DELTA,
      longitudeDelta: DELTA,
    });
    previousRef.current = target;
  }

  useEffect(() => {
    const region = regionRef.current;
    if (!target || !region) {
      return;
    }
    const motion = nextMarkerMotion(previousRef.current, target);
    if (motion === 'ignore') {
      return;
    }
    if (motion === 'place') {
      region.setValue({
        latitude: target.latitude,
        longitude: target.longitude,
        latitudeDelta: DELTA,
        longitudeDelta: DELTA,
      });
      previousRef.current = target;
      return;
    }
    region
      .timing({
        latitude: target.latitude,
        longitude: target.longitude,
        latitudeDelta: DELTA,
        longitudeDelta: DELTA,
        duration: MARKER_ANIMATION_MS,
        useNativeDriver: false,
      } as never)
      .start();
    previousRef.current = target;
  }, [target]);

  return regionRef.current;
}
