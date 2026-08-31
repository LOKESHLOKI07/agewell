import { useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useNavigation, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brandGreen } from '@/components/AgeWellLogo';
import { Icon } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import {
  hasOnboardingProfile,
  setOnboardingServiceFor,
  type ServiceFor,
} from './onboardingProfile';

const PARENTS_TINT = '#FDEFE4';
const MYSELF_TINT = '#E7F4E4';

const myselfImage = require('../../../assets/myself.png');
const parentsImage = require('../../../assets/parents.png');

export function ServiceForScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [choice, setChoice] = useState<ServiceFor>('myself');

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
        <Text style={styles.title}>Looking to avail service for?</Text>
        <Text style={styles.subtitle}>Please select one option to continue.</Text>

        <OptionCard
          selected={choice === 'myself'}
          tint={MYSELF_TINT}
          title="MYSELF"
          description="I am looking for AgeWell services for myself."
          illustration={
            <Image
              source={myselfImage}
              style={styles.myselfImage}
              resizeMode="contain"
            />
          }
          onPress={() => setChoice('myself')}
        />
        <OptionCard
          selected={choice === 'parents'}
          tint={PARENTS_TINT}
          title="PARENTS"
          description="I am looking for AgeWell services for my parent(s)."
          illustration={
            <Image source={parentsImage} style={styles.parentsImage} resizeMode="contain" />
          }
          onPress={() => setChoice('parents')}
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
      accessibilityLabel={`${title}. ${description}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: tint },
        selected ? styles.cardSelected : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
      <View style={styles.illustration}>{illustration}</View>
      {selected ? (
        <View style={styles.check}>
          <Icon name="checkmark" size={16} color="#FFFFFF" />
        </View>
      ) : null}
    </Pressable>
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
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: '#6B6B6B',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  card: {
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: brandGreen,
  },
  cardText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  cardTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  cardDescription: {
    ...typography.body,
    color: '#4A4A4A',
    marginTop: spacing.xs,
  },
  illustration: {
    width: 112,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myselfImage: {
    width: 92,
    height: 92,
    backgroundColor: 'transparent',
  },
  parentsImage: {
    width: 112,
    height: 92,
    backgroundColor: 'transparent',
  },
  check: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
  buttonLabel: {
    ...typography.bodyStrong,
    color: '#FFFFFF',
  },
});
