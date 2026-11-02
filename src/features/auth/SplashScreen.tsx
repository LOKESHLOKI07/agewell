import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';

const splashVideo = require('../../../assets/splash/EldCare_Splash_Screen_Animated.mp4');

const splashBackgroundColor = '#FEF8E8';
const SPLASH_FALLBACK_MS = 12000;

export function SplashScreen(props: {
  onReady?: () => void;
  onFinished?: () => void;
}) {
  if (__DEV__) {
    return <StaticSplash {...props} />;
  }
  return <VideoSplash {...props} />;
}

function StaticSplash({
  onReady,
  onFinished,
}: {
  onReady?: () => void;
  onFinished?: () => void;
}) {
  const onReadyRef = useRef(onReady);
  const onFinishedRef = useRef(onFinished);
  onReadyRef.current = onReady;
  onFinishedRef.current = onFinished;

  useEffect(() => {
    onReadyRef.current?.();
    onFinishedRef.current?.();
  }, []);

  return (
    <View
      style={styles.screen}
      accessibilityLabel="EldCare. Your Parents. Our Care."
      onLayout={onReady}
    >
      <StatusBar style="dark" />
    </View>
  );
}

function VideoSplash({
  onReady,
  onFinished,
}: {
  onReady?: () => void;
  onFinished?: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const [hasFrame, setHasFrame] = useState(false);
  const finishedRef = useRef(false);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  const finish = useCallback(() => {
    if (finishedRef.current) {
      return;
    }
    finishedRef.current = true;
    onFinishedRef.current?.();
  }, []);

  const player = useVideoPlayer(splashVideo, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.muted = true;
    videoPlayer.play();
  });

  const holdLastFrameAndFinish = useCallback(() => {
    if (finishedRef.current) {
      return;
    }
    player.pause();
    finish();
  }, [finish, player]);

  useEventListener(player, 'playToEnd', holdLastFrameAndFinish);
  useEventListener(player, 'statusChange', ({ status, error }) => {
    if (status === 'error' || error) {
      finish();
    }
  });

  useEffect(() => {
    const timer = setTimeout(finish, SPLASH_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [finish]);

  return (
    <View
      style={[styles.screen, { width, height }]}
      accessibilityLabel="EldCare. Your Parents. Our Care."
      onLayout={onReady}
    >
      <StatusBar style="dark" />
      <VideoView
        player={player}
        style={{ width, height, opacity: hasFrame ? 1 : 0 }}
        contentFit="cover"
        nativeControls={false}
        playsInline
        fullscreenOptions={{ enable: false }}
        useExoShutter={false}
        onFirstFrameRender={() => {
          setHasFrame(true);
          onReady?.();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: splashBackgroundColor,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
