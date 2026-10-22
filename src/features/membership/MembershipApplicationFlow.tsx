import { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getApiErrorMessage } from '@/api/errors';
import { queryClient } from '@/api/queryClient';
import { KeyboardAwareScrollView } from '@/components';
import { Icon, type IconName } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import {
  emptyMembershipApplicationDraft,
  toMembershipApplicationPurchaseBody,
  validateApplicationForm,
  type MembershipApplicationDraft,
} from './applicationForm';
import { createMembershipPurchaseRequest } from './membershipApi';
import {
  APPLY_NAVY,
  ApplyFieldLabel,
  ApplyFooterButtons,
  MembershipApplyHeader,
  MembershipApplyStepper,
} from './MembershipApplyChrome';
import { type MembershipPlanKey } from './planCatalog';

const coupleImage = require('../../../assets/grandparents.png');
const coupleMark = require('../../../assets/Joyful Elderly Couple Portrait.png');

const INTRO_BENEFITS: { icon: IconName; color: string; soft: string; label: string }[] = [
  {
    icon: 'shield-checkmark-outline',
    color: familyHome.greenDark,
    soft: familyHome.greenSoft,
    label: 'Personalised care and support',
  },
  {
    icon: 'stethoscope',
    color: familyHome.blue,
    soft: familyHome.blueSoft,
    label: 'Help with daily needs',
  },
  {
    icon: 'people-outline',
    color: familyHome.blue,
    soft: familyHome.blueSoft,
    label: 'Trained and verified team',
  },
  {
    icon: 'heart-outline',
    color: familyHome.purple,
    soft: familyHome.purpleSoft,
    label: 'Safety, comfort and companionship',
  },
];

type Phase = 'intro' | 'form';

export function MembershipApplicationFlow({
  planKey,
  skipIntro,
}: {
  planKey: MembershipPlanKey;
  skipIntro?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>(skipIntro ? 'form' : 'intro');
  const [draft, setDraft] = useState<MembershipApplicationDraft>(emptyMembershipApplicationDraft);
  const [errors, setErrors] = useState<Partial<Record<keyof MembershipApplicationDraft, string>>>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);

  const patch = (partial: Partial<MembershipApplicationDraft>) => {
    setDraft((current) => ({ ...current, ...partial }));
  };

  const onHeaderBack = () => {
    if (phase === 'form') {
      setErrors({});
      setPhase('intro');
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/account/purchase' as Href);
  };

  const onSubmit = async () => {
    const formErrors = validateApplicationForm(draft);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      await createMembershipPurchaseRequest(toMembershipApplicationPurchaseBody(planKey, draft));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['membership', 'requests'] }),
        queryClient.invalidateQueries({ queryKey: homeQueryKeys.membershipCurrent }),
        queryClient.invalidateQueries({ queryKey: homeQueryKeys.seniorMe }),
      ]);
      router.replace('/account/application-status' as Href);
    } catch (error) {
      Alert.alert('Unable to submit', getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <MembershipApplyHeader onBack={onHeaderBack} />
      {phase === 'form' ? <MembershipApplyStepper currentStep={1} /> : null}

      {phase === 'intro' ? (
        <IntroBody onStart={() => setPhase('form')} bottomInset={insets.bottom} />
      ) : (
        <KeyboardAwareScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
          showsVerticalScrollIndicator={false}
        >
          <ApplicationFormBody
            draft={draft}
            errors={errors}
            submitting={submitting}
            onPatch={(partial) => {
              patch(partial);
              const keys = Object.keys(partial) as (keyof MembershipApplicationDraft)[];
              setErrors((current) => {
                const next = { ...current };
                keys.forEach((key) => {
                  next[key] = undefined;
                });
                return next;
              });
            }}
            onSubmit={() => void onSubmit()}
          />
        </KeyboardAwareScrollView>
      )}
    </View>
  );
}

function IntroBody({ onStart, bottomInset }: { onStart: () => void; bottomInset: number }) {
  const ctaPadBottom = Math.max(bottomInset, spacing.md) + spacing.md;

  return (
    <View style={styles.introWrap}>
      <View style={styles.introCopy}>
        <Text style={styles.introTitle}>{`Apply for\nAgeWell Membership`}</Text>
        <Text style={styles.introSubtitle}>
          Take the first step towards a safer, healthier and happier life.
        </Text>

        <View style={styles.benefitList}>
          {INTRO_BENEFITS.map((item) => (
            <View key={item.label} style={styles.benefitRow}>
              <View style={[styles.benefitIcon, { backgroundColor: item.soft }]}>
                <Icon name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={styles.benefitLabel} numberOfLines={2}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.introHeroWrap}>
        <Image
          source={coupleImage}
          style={[styles.introHero, Platform.OS === 'web' ? styles.introHeroCrop : null]}
          resizeMode="cover"
          accessibilityRole="image"
          accessibilityLabel="Elderly couple"
        />
        <View style={[styles.introCtaWrap, { paddingBottom: ctaPadBottom }]}>
          <Pressable
            onPress={onStart}
            accessibilityRole="button"
            accessibilityLabel="Start Application"
            style={({ pressed }) => [styles.startBtn, pressed ? styles.pressed : null]}
          >
            <Text style={styles.startBtnLabel}>Start Application</Text>
            <Icon name="arrow-forward" size={18} color={familyHome.white} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ApplicationFormBody({
  draft,
  errors,
  submitting,
  onPatch,
  onSubmit,
}: {
  draft: MembershipApplicationDraft;
  errors: Partial<Record<keyof MembershipApplicationDraft, string>>;
  submitting: boolean;
  onPatch: (partial: Partial<MembershipApplicationDraft>) => void;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.formWrap}>
      <View style={styles.formTitleRow}>
        <Text style={styles.formTitle}>Application form</Text>
        <Image source={coupleMark} style={styles.formHero} resizeMode="contain" />
      </View>

      <ContactCard
        title="Family member 1"
        icon="person-outline"
        tone="family"
        required
        name={draft.family1Name}
        phone={draft.family1Phone}
        nameError={errors.family1Name}
        phoneError={errors.family1Phone}
        onName={(family1Name) => onPatch({ family1Name })}
        onPhone={(family1Phone) => onPatch({ family1Phone })}
      />

      <ContactCard
        title="Family member 2"
        subtitle="Optional — add a second contact if you can."
        icon="person-outline"
        tone="family"
        name={draft.family2Name}
        phone={draft.family2Phone}
        nameError={errors.family2Name}
        phoneError={errors.family2Phone}
        onName={(family2Name) => onPatch({ family2Name })}
        onPhone={(family2Phone) => onPatch({ family2Phone })}
      />

      <ContactCard
        title="Emergency Contact (Relative)"
        icon="call-outline"
        tone="emergency"
        name={draft.emergencyName}
        phone={draft.emergencyPhone}
        nameError={errors.emergencyName}
        phoneError={errors.emergencyPhone}
        onName={(emergencyName) => onPatch({ emergencyName })}
        onPhone={(emergencyPhone) => onPatch({ emergencyPhone })}
      />

      <ApplyFooterButtons
        showBack={false}
        onNext={onSubmit}
        nextLabel="Submit Application →"
        nextLoading={submitting}
      />
    </View>
  );
}

function ContactCard({
  title,
  subtitle,
  icon,
  tone,
  required,
  name,
  phone,
  nameError,
  phoneError,
  onName,
  onPhone,
}: {
  title: string;
  subtitle?: string;
  icon: IconName;
  tone: 'family' | 'emergency';
  required?: boolean;
  name: string;
  phone: string;
  nameError?: string;
  phoneError?: string;
  onName: (value: string) => void;
  onPhone: (value: string) => void;
}) {
  const family = tone === 'family';
  return (
    <View style={[styles.card, family ? styles.familyCard : styles.emergencyCard]}>
      <View style={styles.cardHead}>
        <View style={[styles.cardIcon, family ? styles.familyIcon : styles.emergencyIcon]}>
          <Icon name={icon} size={18} color={family ? familyHome.green : familyHome.red} />
        </View>
        <View style={styles.cardHeadCopy}>
          <Text style={styles.cardTitle}>
            {title}
            {required ? <Text style={styles.requiredMark}> *</Text> : null}
          </Text>
          {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <ApplyFieldLabel label="Name" required={required} />
      <IconField
        icon="person-outline"
        value={name}
        placeholder="Enter name"
        error={nameError}
        onChange={onName}
        autoCapitalize="words"
      />

      <ApplyFieldLabel label="Phone number" required={required} />
      <IconField
        icon="call-outline"
        value={phone}
        placeholder="Enter phone number"
        error={phoneError}
        onChange={(value) => onPhone(value.replace(/\D/g, '').slice(0, 10))}
        keyboardType="phone-pad"
      />
    </View>
  );
}

function IconField({
  icon,
  value,
  placeholder,
  error,
  onChange,
  keyboardType,
  autoCapitalize,
}: {
  icon: IconName;
  value: string;
  placeholder: string;
  error?: string;
  onChange: (value: string) => void;
  keyboardType?: 'phone-pad' | 'default';
  autoCapitalize?: 'words' | 'none';
}) {
  return (
    <>
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={familyHome.muted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={styles.input}
        />
        <Icon name={icon} size={18} color="#8AA0A8" />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: familyHome.white,
  },
  content: {
    paddingHorizontal: spacing.xl,
  },
  introWrap: {
    flex: 1,
  },
  introCopy: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    flexShrink: 0,
    zIndex: 2,
    backgroundColor: familyHome.white,
  },
  introTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: APPLY_NAVY,
    textAlign: 'center',
  },
  introSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: familyHome.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  benefitList: {
    width: '100%',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    gap: 10,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    gap: spacing.md,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: APPLY_NAVY,
    flex: 1,
  },
  introHeroWrap: {
    flex: 1,
    minHeight: 220,
    position: 'relative',
    overflow: 'hidden',
  },
  introHero: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  introHeroCrop: {
    objectPosition: 'center 40%',
  },
  introCtaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  startBtn: {
    width: '100%',
    minHeight: 54,
    borderRadius: 28,
    backgroundColor: familyHome.greenDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startBtnLabel: {
    ...typography.bodyStrong,
    color: familyHome.white,
  },
  formWrap: {
    paddingBottom: spacing.md,
  },
  formTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  formTitle: {
    flex: 1,
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: APPLY_NAVY,
  },
  formHero: {
    width: 112,
    height: 88,
  },
  card: {
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  familyCard: {
    backgroundColor: '#F3FAF4',
  },
  emergencyCard: {
    backgroundColor: '#FEF4F4',
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyIcon: {
    backgroundColor: '#E2F3E4',
  },
  emergencyIcon: {
    backgroundColor: '#FDE8E8',
  },
  cardHeadCopy: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: APPLY_NAVY,
  },
  cardSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: familyHome.muted,
    marginTop: 2,
  },
  requiredMark: {
    color: familyHome.red,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
  },
  inputRow: {
    minHeight: 48,
    borderWidth: 0,
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
    backgroundColor: familyHome.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: APPLY_NAVY,
    paddingVertical: 12,
  },
  inputError: {
    borderWidth: 1,
    borderColor: familyHome.red,
    marginBottom: 4,
  },
  errorText: {
    ...typography.caption,
    color: familyHome.red,
    marginBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.92,
  },
});
