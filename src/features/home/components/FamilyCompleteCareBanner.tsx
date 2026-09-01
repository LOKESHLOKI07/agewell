import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { spacing, typography } from '@/constants/theme';
import { familyHome } from './familyHomeTheme';

const coupleImage = require('../../../../assets/parents.png');
const NAVY = '#1B2A4A';

export function FamilyCompleteCareBanner() {
  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <View style={styles.copy}>
          <Text style={styles.title}>Complete Care For Your Loved Ones</Text>
          <Text style={styles.subtitle}>We are here for their health, safety & happiness.</Text>
          <Pressable
            onPress={() => router.push('/(tabs)/services' as Href)}
            accessibilityRole="button"
            accessibilityLabel="Know more about AgeWell services"
            style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
          >
            <Text style={styles.buttonLabel}>Know More</Text>
          </Pressable>
        </View>
        <Image source={coupleImage} style={styles.illustration} resizeMode="contain" accessibilityIgnoresInvertColors />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#F4F0EA',
    overflow: 'hidden',
    paddingLeft: spacing.lg,
    minHeight: 148,
  },
  copy: {
    flex: 1,
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingRight: spacing.sm,
    zIndex: 1,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: NAVY,
  },
  subtitle: {
    ...typography.caption,
    color: NAVY,
    lineHeight: 18,
  },
  button: {
    alignSelf: 'flex-start',
    marginTop: 4,
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: NAVY,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  buttonLabel: {
    ...typography.captionStrong,
    color: familyHome.white,
  },
  illustration: {
    width: 128,
    height: 140,
    marginRight: -4,
  },
  pressed: {
    opacity: 0.92,
  },
});
