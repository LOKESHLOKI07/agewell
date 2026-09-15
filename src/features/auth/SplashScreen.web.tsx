import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AgeWellLogo } from '@/components/AgeWellLogo';

const splashBackgroundColor = '#FEF8E8';

export function SplashScreen({
  onReady,
  onFinished,
}: {
  onReady?: () => void;
  onFinished?: () => void;
}) {
  const finishedRef = useRef(false);
  const onReadyRef = useRef(onReady);
  const onFinishedRef = useRef(onFinished);
  onReadyRef.current = onReady;
  onFinishedRef.current = onFinished;

  useEffect(() => {
    onReadyRef.current?.();
    if (finishedRef.current) {
      return;
    }
    finishedRef.current = true;
    onFinishedRef.current?.();
  }, []);

  return (
    <View
      style={styles.screen}
      accessibilityLabel="AgeWell. Your Parents. Our Care."
      onLayout={onReady}
    >
      <StatusBar style="dark" />
      <AgeWellLogo />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: splashBackgroundColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
