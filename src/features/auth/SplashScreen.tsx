import { StatusBar } from 'expo-status-bar';
import { Image, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

const splashImage = require('../../../assets/splash/full.png');

const splashBackgroundColor = '#FEF8E8';

export function SplashScreen({ onReady }: { onReady?: () => void }) {
  const { width, height } = useWindowDimensions();

  return (
    <View
      style={[styles.screen, { width, height }]}
      accessibilityLabel="AgeWell. Your Parents. Our Care."
      onLayout={onReady}
    >
      <StatusBar style="dark" />
      <Image
        source={splashImage}
        style={{ width, height }}
        resizeMode={Platform.OS === 'web' ? 'contain' : 'cover'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: splashBackgroundColor,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
