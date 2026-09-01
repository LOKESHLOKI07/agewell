import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '@/constants/theme';
import { openMembershipPurchase } from '@/features/membership/openMembershipPurchase';
import { familyHome } from './familyHomeTheme';

const coupleImage = require('../../../../assets/parents.png');

export function FamilyMembershipCtaCard() {
  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <View style={styles.copy}>
          <Text style={styles.title}>Get Membership to access all services</Text>
          <Text style={styles.subtitle}>Join AgeWell membership and enjoy complete care.</Text>
          <Pressable
            onPress={() => openMembershipPurchase()}
            accessibilityRole="button"
            accessibilityLabel="View membership plans"
            style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
          >
            <Text style={styles.buttonLabel}>View Membership Plans</Text>
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
    gap: spacing.sm,
    borderRadius: 18,
    backgroundColor: familyHome.purpleSoft,
    borderWidth: 1,
    borderColor: '#E5DBF0',
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingVertical: spacing.lg,
    overflow: 'hidden',
  },
  copy: {
    flex: 1,
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
    color: familyHome.text,
  },
  subtitle: {
    ...typography.caption,
    color: familyHome.muted,
    lineHeight: 18,
  },
  button: {
    alignSelf: 'flex-start',
    marginTop: 2,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: familyHome.purpleDark,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  buttonLabel: {
    ...typography.captionStrong,
    color: familyHome.white,
  },
  illustration: {
    width: 108,
    height: 112,
  },
  pressed: {
    opacity: 0.92,
  },
});
