import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '@/constants/theme';
import { MapUnavailable } from './MapUnavailable';
import type { LiveMapViewProps } from './liveMapProps';
import { LEAFLET_MAP_HTML } from './leafletMapPage';

export function LiveMapView({
  associate,
  associateName,
  live,
  heading = 0,
  senior,
  seniorLive = false,
  home,
  traveledPath,
  remainingPath,
  showDeviceLocation,
  followMode,
  onUserGesture,
  mapReady,
  onMapReady,
  fitToken = 0,
}: LiveMapViewProps) {
  const webRef = useRef<WebView>(null);
  const pageReady = useRef(false);
  const [failed, setFailed] = useState(false);
  const hasPins = Boolean(associate || senior || home || showDeviceLocation);

  const payload = useMemo(
    () => ({
      associate,
      associateName,
      live,
      heading,
      senior,
      seniorLive,
      home,
      traveledPath: traveledPath ?? [],
      remainingPath: remainingPath ?? [],
      followMode,
      fitToken,
    }),
    [associate, associateName, live, heading, senior, seniorLive, home, traveledPath, remainingPath, followMode, fitToken],
  );

  const payloadRef = useRef(payload);
  payloadRef.current = payload;

  const push = () => {
    if (!pageReady.current) {
      return;
    }
    webRef.current?.injectJavaScript(`window.applyAgeWellMap(${JSON.stringify(payloadRef.current)});true;`);
  };

  useEffect(() => {
    if (mapReady) {
      return undefined;
    }
    const timer = setTimeout(() => setFailed(true), 12000);
    return () => clearTimeout(timer);
  }, [mapReady]);

  useEffect(() => {
    push();
  }, [payload]);

  if (!hasPins || failed) {
    return <MapUnavailable />;
  }

  return (
    <View style={styles.fill} collapsable={false}>
      {!mapReady ? (
        <View style={styles.skeleton} pointerEvents="none" accessibilityLabel="Loading map">
          <View style={styles.skeletonBlock} />
        </View>
      ) : null}
      <WebView
        ref={webRef}
        style={styles.fill}
        originWhitelist={['*']}
        source={{ html: LEAFLET_MAP_HTML, baseUrl: 'https://a.basemaps.cartocdn.com' }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        androidLayerType="hardware"
        onMessage={(event) => {
          const data = event.nativeEvent.data;
          if (data === 'gesture') {
            onUserGesture();
            return;
          }
          if (data === 'error') {
            setFailed(true);
            return;
          }
          if (data === 'ready') {
            pageReady.current = true;
            onMapReady();
            push();
          }
        }}
      />
    </View>
  );
}

const fill = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const styles = StyleSheet.create({
  fill,
  skeleton: {
    ...fill,
    backgroundColor: colors.surfaceMuted,
    zIndex: 1,
  },
  skeletonBlock: {
    flex: 1,
    backgroundColor: colors.border,
  },
});
