import { useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useNavigation, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brandGreen } from '@/components/AgeWellLogo';
import { Icon } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { setMembershipKind } from './membershipPlanPreference';
import {
  hasOnboardingProfile,
  setOnboardingServiceFor,
  type ServiceFor,
} from './onboardingProfile';

const COUPLE_TINT = '#FDEFE4';
const SINGLE_TINT = '#E7F4E4';

const singleImage = require('../../../assets/myself.png');
const coupleImage = require('../../../assets/parents.png');

export function ServiceForScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [choice, setChoice] = useState<ServiceFor>('single');

  const goBack = () => {
    if (navigation.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(auth)/personal-details' as Href);
  };

  const onContinue = () => {
    if (!hasOnboardingProfile()) {
      router.replace('/(auth)/personal-details' as Href);
      return;
    }
    setOnboardingServiceFor(choice);
    void setMembershipKind(choice);
    router.push('/(auth)/location' as Href);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
        <Icon name="arrow-back" size={22} color="#1A1A1A" />
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      >
        <Text style={styles.title}>Which membership are you looking for?</Text>
        <Text style={styles.subtitle}>Please select one option to continue.</Text>

        <OptionCard
          selected={choice === 'single'}
          tint={SINGLE_TINT}
          title="SINGLE"
          description="Basic Membership for one senior."
          illustration={
            <Image source={singleImage} style={styles.singleImage} resizeMode="contain" />
          }
          onPress={() => setChoice('single')}
        />
        <OptionCard
          selected={choice === 'couple'}
          tint={COUPLE_TINT}
          title="COUPLE"
          description="Couple Membership for two seniors in one home."
          illustration={
            <Image source={coupleImage} style={styles.coupleImage} resizeMode="contain" />
          }
          onPress={() => setChoice('couple')}
        />
      </ScrollView>

      <Pressable
        onPress={onContinue}
        accessibilityRole="button"
        accessibilityLabel="Continue to AgeWell"
        style={({ pressed }) => [
          styles.button,
          { marginBottom: insets.bottom + spacing.lg },
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={styles.buttonLabel}>Continue</Text>
      </Pressable>
    </View>
  );
}

function OptionCard({
  selected,
  tint,
  title,
  description,
  illustration,
  onPress,
}: {
  selected: boolean;
  tint: string;
  title: string;
  description: string;
  illustration: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: tint },
        selected ? styles.cardSelected : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.cardCopy}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
      <View style={styles.illustration}>{illustration}</View>
      <View style={[styles.radio, selected ? styles.radioSelected : null]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.xl,
  },
  back: {
    width: minTouchSize,
    height: minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  title: {
    ...typography.title,
    color: '#1A1A1A',
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: '#6B7280',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  card: {
    borderRadius: 24,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    minHeight: 168,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: brandGreen,
  },
  cardCopy: {
    maxWidth: '58%',
    gap: spacing.sm,
    zIndex: 1,
  },
  cardTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    lineHeight: 28,
    color: '#1A1A1A',
    fontWeight: '700',
  },
  cardDescription: {
    ...typography.body,
    color: '#4B5563',
    lineHeight: 22,
  },
  illustration: {
    position: 'absolute',
    right: 12,
    bottom: 8,
    zIndex: 0,
  },
  singleImage: {
    width: 120,
    height: 130,
  },
  coupleImage: {
    width: 140,
    height: 120,
  },
  radio: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 2,
  },
  radioSelected: {
    borderColor: brandGreen,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: brandGreen,
  },
  button: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    ...typography.bodyStrong,
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.9,
  },
});
