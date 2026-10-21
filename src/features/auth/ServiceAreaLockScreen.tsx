import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { Icon } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { SERVICE_AREA_CITIES, SERVICE_AREA_STAY_TUNED } from './serviceArea';

const ORANGE = '#F57C23';

type Props = {
  onEnterLocation: () => void;
  onBack?: () => void;
};

export function ServiceAreaLockScreen({ onEnterLocation, onBack }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}>
      {onBack ? (
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
          <Icon name="arrow-back" size={22} color="#1A1A1A" />
        </Pressable>
      ) : (
        <View style={styles.back} />
      )}

      <View style={styles.body}>
        <ComingSoonHero />
        <Text style={styles.title}>{SERVICE_AREA_STAY_TUNED}</Text>
        <Text style={styles.subtitle}>We currently provide services in {SERVICE_AREA_CITIES}.</Text>
        <Text style={[styles.subtitle, styles.subtitleFollow]}>
          You can enter a supported area to continue. If that location is also unsupported, you will stay on this
          screen.
        </Text>
      </View>

      <Pressable
        onPress={onEnterLocation}
        accessibilityRole="button"
        accessibilityLabel="Enter another location"
        style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
      >
        <Text style={styles.buttonLabel}>Enter another location</Text>
      </Pressable>
    </View>
  );
}

function ComingSoonHero() {
  return (
    <View style={styles.hero} accessibilityRole="image" accessibilityLabel="Coming to your area">
      <Svg width={280} height={220} viewBox="0 0 280 220">
        <Ellipse cx="140" cy="196" rx="92" ry="11" fill="#E4F0E2" />
        <Rect x="28" y="132" width="30" height="56" rx="4" fill="#D2E2CE" />
        <Rect x="62" y="112" width="38" height="76" rx="4" fill="#DEEBDA" />
        <Rect x="104" y="124" width="26" height="64" rx="4" fill="#C9DCC4" />
        <Rect x="168" y="118" width="34" height="70" rx="4" fill="#D8E8D4" />
        <Rect x="206" y="130" width="28" height="58" rx="4" fill="#C9DCC4" />
        <Path d="M44 132c10-16 26-16 36 0v8H44v-8Z" fill="#B4CFAE" />
        <Path d="M214 130c10-18 28-18 36 0v10h-36v-10Z" fill="#B4CFAE" />
        <Path
          d="M140 22c-32 0-58 26-58 58 0 42 58 98 58 98s58-56 58-98c0-32-26-58-58-58Z"
          fill={ORANGE}
        />
        <Path
          d="M140 22c-18 0-40 14-48 38 12-8 28-10 48-10 20 0 36 2 48 10-8-24-30-38-48-38Z"
          fill="#FF9A4A"
        />
        <Circle cx="140" cy="80" r="22" fill="#FFFFFF" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
  },
  back: {
    width: minTouchSize,
    height: minTouchSize,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  subtitleFollow: {
    marginTop: spacing.sm,
  },
  button: {
    minHeight: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    backgroundColor: ORANGE,
  },
  pressed: {
    opacity: 0.9,
  },
  buttonLabel: {
    ...typography.bodyStrong,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
