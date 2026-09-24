import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Avatar, Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { formatMembershipValidTill, membershipMemberId } from '@/features/home/memberHome';
import type { CurrentMembership, SeniorProfile } from '@/features/home/types/home';
import { familyHome } from './familyHomeTheme';

export function FamilyMemberHeroCard({
  greetingName,
  senior,
  membership,
}: {
  greetingName: string;
  senior: SeniorProfile | null;
  membership: CurrentMembership;
}) {
  const memberId = membershipMemberId(senior?.id);
  const validTill = formatMembershipValidTill(membership.endDate);

  const waveRotate = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0.94)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const ripple = useRef(new Animated.Value(0)).current;
  const shineX = useRef(new Animated.Value(-48)).current;

  useEffect(() => {
    // Staggered welcome sequence on mount.
    // 0.0s avatar → 0.3s wave (×2) → 0.8s ✓/ripple (×2) → 1.2s badge shine (×2)

    const profile = Animated.sequence([
      Animated.timing(avatarScale, {
        toValue: 1.02,
        duration: 620,
        easing: Easing.out(Easing.back(1.35)),
        useNativeDriver: true,
      }),
      Animated.timing(avatarScale, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const waveOnce = Animated.sequence([
      Animated.timing(waveRotate, {
        toValue: -8,
        duration: 280,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(waveRotate, {
        toValue: 8,
        duration: 320,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(waveRotate, {
        toValue: -6,
        duration: 280,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(waveRotate, {
        toValue: 5,
        duration: 260,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(waveRotate, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    const wave = Animated.sequence([
      Animated.delay(300),
      waveOnce,
      Animated.delay(180),
      waveOnce,
    ]);

    const checkOnce = Animated.sequence([
      Animated.timing(checkScale, {
        toValue: 1.15,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(checkScale, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    const checkPop = Animated.sequence([
      Animated.delay(800),
      checkOnce,
      Animated.timing(checkScale, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.delay(180),
      checkOnce,
    ]);

    const rippleOnce = Animated.sequence([
      Animated.timing(ripple, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(ripple, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]);

    const ripplePulse = Animated.sequence([
      Animated.delay(800),
      rippleOnce,
      Animated.delay(180),
      rippleOnce,
    ]);

    const shineOnce = Animated.sequence([
      Animated.timing(shineX, {
        toValue: 160,
        duration: 1400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(shineX, {
        toValue: -48,
        duration: 0,
        useNativeDriver: true,
      }),
    ]);

    const badgeShine = Animated.sequence([
      Animated.delay(1200),
      shineOnce,
      Animated.delay(220),
      shineOnce,
    ]);

    Animated.parallel([profile, wave, checkPop, ripplePulse, badgeShine]).start();
  }, [avatarScale, checkScale, ripple, shineX, waveRotate]);

  const waveTransform = {
    transform: [
      {
        rotate: waveRotate.interpolate({
          inputRange: [-8, 0, 8],
          outputRange: ['-8deg', '0deg', '8deg'],
        }),
      },
    ],
  };

  const rippleStyle = {
    opacity: ripple.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.4, 0.22, 0] }),
    transform: [
      {
        scale: ripple.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1.7] }),
      },
    ],
  };

  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <View
            style={styles.helloRow}
            accessibilityRole="header"
            accessibilityLabel={`Hello, ${greetingName}`}
          >
            <Text style={styles.hello} accessible={false}>
              Hello, {greetingName}{' '}
            </Text>
            <Animated.Text style={[styles.hello, waveTransform]} accessible={false}>
              👋
            </Animated.Text>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.premium} accessibilityLabel="Premium Member">
              <Icon name="ribbon-outline" size={14} color={familyHome.white} />
              <Text style={styles.premiumLabel}>Premium Member</Text>
              <Animated.View
                pointerEvents="none"
                style={[styles.shine, { transform: [{ translateX: shineX }, { rotate: '20deg' }] }]}
              />
            </View>
            {memberId ? <Text style={styles.memberId}>Member ID: {memberId}</Text> : null}
          </View>
          {validTill ? <Text style={styles.valid}>Valid till {validTill}</Text> : null}
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/profile' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          style={styles.avatarWrap}
        >
          <Animated.View style={{ transform: [{ scale: avatarScale }] }}>
            <Avatar name={greetingName} imageUri={senior?.photo} size={72} />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.ripple, rippleStyle]} />
          <Animated.View style={[styles.check, { transform: [{ scale: checkScale }] }]}>
            <Icon name="checkmark" size={12} color={familyHome.white} />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.sm,
  },
  helloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  hello: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: familyHome.text,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  premium: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: familyHome.green,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  premiumLabel: {
    ...typography.captionStrong,
    color: familyHome.white,
  },
  shine: {
    position: 'absolute',
    top: -6,
    bottom: -6,
    width: 28,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  memberId: {
    ...typography.captionStrong,
    color: familyHome.muted,
  },
  valid: {
    ...typography.caption,
    color: familyHome.muted,
  },
  avatarWrap: {
    width: 72,
    height: 72,
  },
  ripple: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: familyHome.green,
  },
  check: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: familyHome.green,
    borderWidth: 2,
    borderColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
