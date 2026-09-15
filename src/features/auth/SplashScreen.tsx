import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';

const splashVideo = require('../../../assets/splash/proper_splash_screen.mp4');

const splashBackgroundColor = '#FEF8E8';
const SPLASH_FALLBACK_MS = 12000;
/** The clip ends on a black frame — stop before that tail. */
const BLACK_TAIL_SECONDS = 0.8;

export function SplashScreen({
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
    videoPlayer.timeUpdateEventInterval = 0.05;
    videoPlayer.play();
  });

  const holdLastFrameAndFinish = useCallback(() => {
    if (finishedRef.current) {
      return;
    }
    const duration = player.duration;
    if (Number.isFinite(duration) && duration > BLACK_TAIL_SECONDS) {
      player.currentTime = duration - BLACK_TAIL_SECONDS;
    }
    player.pause();
    finish();
  }, [finish, player]);

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    const duration = player.duration;
    if (!Number.isFinite(duration) || duration <= BLACK_TAIL_SECONDS) {
      return;
    }
    if (currentTime >= duration - BLACK_TAIL_SECONDS) {
      holdLastFrameAndFinish();
    }
  });
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
      accessibilityLabel="AgeWell. Your Parents. Our Care."
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
    backgroundColor: splashBackgroundColor,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
