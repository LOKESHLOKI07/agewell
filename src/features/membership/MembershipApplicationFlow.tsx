import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getApiErrorMessage } from '@/api/errors';
import { queryClient } from '@/api/queryClient';
import { KeyboardAwareScrollView } from '@/components';
import { Icon, type IconName } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import {
  AREA_OPTIONS,
  GENDER_OPTIONS,
  LANGUAGE_OPTIONS,
  LIVING_WITH_OPTIONS,
  MEMBERSHIP_FOR_OPTIONS,
  RELATIONSHIP_OPTIONS,
  SUPPORT_NEED_OPTIONS,
  applicationIdFromRequestId,
  emptyMembershipApplicationDraft,
  formatDobFromDate,
  formatDobInput,
  toMembershipApplicationPurchaseBody,
  validateApplicationStep,
  type AreaId,
  type MembershipApplicationDraft,
  type MembershipApplyStepIndex,
  type MembershipForId,
  type SupportNeedId,
} from './applicationForm';
import { createMembershipPurchaseRequest } from './membershipApi';
import {
  APPLY_NAVY,
  ApplyFieldLabel,
  ApplyFooterButtons,
  MembershipApplyHeader,
  MembershipApplyStepper,
} from './MembershipApplyChrome';
import { MarketplaceServiceIcon } from '@/features/services/components/MarketplaceServiceIcon';
import { getMembershipPlanByKey, type MembershipPlanKey } from './planCatalog';

const coupleImage = require('../../../assets/grandparents.png');

const MEMBERSHIP_FOR_ICONS: Record<MembershipForId, ImageSourcePropType> = {
  myself: require('../../../assets/elderly-man-face-svgrepo-com.svg'),
  parent: require('../../../assets/elderly-woman-face-svgrepo-com.svg'),
  both_parents: require('../../../assets/elderly-couple-svgrepo-com.svg'),
  other: require('../../../assets/elderly-couple-svgrepo-com.svg'),
};

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
    color: familyHome.orange,
    soft: familyHome.orangeSoft,
    label: 'Trained and verified team',
  },
  {
    icon: 'heart-outline',
    color: familyHome.purple,
    soft: familyHome.purpleSoft,
    label: 'Safety, comfort and companionship',
  },
];

type Phase = 'intro' | 'form' | 'success';

export function MembershipApplicationFlow({
  planKey,
  initialStep,
}: {
  planKey: MembershipPlanKey;
  /** When set, skips intro and opens this form step (0–4). */
  initialStep?: MembershipApplyStepIndex;
}) {
  const insets = useSafeAreaInsets();
  const plan = getMembershipPlanByKey(planKey);
  const [phase, setPhase] = useState<Phase>(initialStep != null ? 'form' : 'intro');
  const [step, setStep] = useState<MembershipApplyStepIndex>(initialStep ?? 0);
  const [draft, setDraft] = useState<MembershipApplicationDraft>(emptyMembershipApplicationDraft);
  const [errors, setErrors] = useState<Partial<Record<keyof MembershipApplicationDraft, string>>>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);

  const patch = (partial: Partial<MembershipApplicationDraft>) => {
    setDraft((current) => ({ ...current, ...partial }));
  };

  const onHeaderBack = () => {
    if (phase === 'form' && step > 0) {
      setErrors({});
      setStep((current) => (current - 1) as MembershipApplyStepIndex);
      return;
    }
    if (phase === 'form') {
      setPhase('intro');
      return;
    }
    if (phase === 'success') {
      router.replace('/account/application-status' as Href);
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/account/purchase' as Href);
  };

  const onNext = () => {
    const stepErrors = validateApplicationStep(step, draft);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      return;
    }
    if (step < 4) {
      setStep((current) => (current + 1) as MembershipApplyStepIndex);
      return;
    }
    void onSubmit();
  };

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      const created = await createMembershipPurchaseRequest(
        toMembershipApplicationPurchaseBody(planKey, draft),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['membership', 'requests'] }),
        queryClient.invalidateQueries({ queryKey: homeQueryKeys.membershipCurrent }),
        queryClient.invalidateQueries({ queryKey: homeQueryKeys.seniorMe }),
      ]);
      setApplicationId(applicationIdFromRequestId(created.id));
      setSubmittedAt(new Date());
      setPhase('success');
    } catch (error) {
      Alert.alert('Unable to submit', getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <MembershipApplyHeader onBack={onHeaderBack} />
      {phase === 'form' ? <MembershipApplyStepper currentStep={step} /> : null}

      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxxl },
          phase === 'intro' ? styles.introContent : null,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {phase === 'intro' ? (
          <IntroBody
            planName={plan?.name ?? 'AgeWell Membership'}
            onStart={() => setPhase('form')}
          />
        ) : null}

        {phase === 'form' && step === 0 ? (
          <StepMembershipFor
            value={draft.membershipFor}
            error={errors.membershipFor}
            onChange={(membershipFor) => {
              patch({ membershipFor });
              setErrors((current) => ({ ...current, membershipFor: undefined }));
            }}
            onNext={onNext}
          />
        ) : null}

        {phase === 'form' && step === 1 ? (
          <StepSeniorDetails
            draft={draft}
            errors={errors}
            onPatch={patch}
            onBack={() => {
              setErrors({});
              setStep(0);
            }}
            onNext={onNext}
          />
        ) : null}

        {phase === 'form' && step === 2 ? (
          <StepLivingAddress
            draft={draft}
            errors={errors}
            onPatch={patch}
            onBack={() => {
              setErrors({});
              setStep(1);
            }}
            onNext={onNext}
          />
        ) : null}

        {phase === 'form' && step === 3 ? (
          <StepEmergencyContact
            draft={draft}
            errors={errors}
            onPatch={patch}
            onBack={() => {
              setErrors({});
              setStep(2);
            }}
            onNext={onNext}
          />
        ) : null}

        {phase === 'form' && step === 4 ? (
          <StepSupportNeeds
            draft={draft}
            errors={errors}
            onPatch={patch}
            submitting={submitting}
            onBack={() => {
              setErrors({});
              setStep(3);
            }}
            onNext={onNext}
          />
        ) : null}

        {phase === 'success' ? (
          <SuccessBody
            applicationId={applicationId ?? 'AW-PENDING'}
            submittedAt={submittedAt ?? new Date()}
            onViewStatus={() => router.replace('/account/application-status' as Href)}
          />
        ) : null}
      </KeyboardAwareScrollView>
    </View>
  );
}

function IntroBody({ planName, onStart }: { planName: string; onStart: () => void }) {
  return (
    <View style={styles.introWrap}>
      <Text style={styles.introTitle}>Apply for AgeWell Membership</Text>
      <Text style={styles.introSubtitle}>
        Take the first step towards a safer, healthier and happier life.
      </Text>
      <Text style={styles.introPlan}>{planName}</Text>

      <View style={styles.benefitList}>
        {INTRO_BENEFITS.map((item) => (
          <View key={item.label} style={styles.benefitRow}>
            <View style={[styles.benefitIcon, { backgroundColor: item.soft }]}>
              <Icon name={item.icon} size={20} color={item.color} />
            </View>
            <Text style={styles.benefitLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.introHeroWrap}>
        <Image source={coupleImage} style={styles.introHero} resizeMode="cover" />
      </View>

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
  );
}

function StepMembershipFor({
  value,
  error,
  onChange,
  onNext,
}: {
  value: MembershipForId | null;
  error?: string;
  onChange: (value: MembershipForId) => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>Who is this membership for?</Text>
      <View style={styles.optionsStack}>
        {MEMBERSHIP_FOR_OPTIONS.map((option) => {
          const selected = value === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => onChange(option.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[styles.forCard, selected ? styles.forCardSelected : null]}
            >
              <View style={[styles.radio, selected ? styles.radioSelected : null]}>
                {selected ? <Icon name="checkmark" size={12} color={familyHome.white} /> : null}
              </View>
              <View style={[styles.forAvatar, selected ? styles.forAvatarSelected : null]}>
                <Image
                  source={MEMBERSHIP_FOR_ICONS[option.id]}
                  style={styles.forAvatarImage}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              </View>
              <View style={styles.forCopy}>
                <Text style={styles.forTitle}>{option.title}</Text>
                <Text style={styles.forSubtitle}>{option.subtitle}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <View style={styles.infoBanner}>
        <Icon name="help-circle-outline" size={16} color={familyHome.greenDark} />
        <Text style={styles.infoBannerText}>This helps us understand your requirements better.</Text>
      </View>
      <ApplyFooterButtons showBack={false} onNext={onNext} nextLabel="Next →" />
    </View>
  );
}

function StepSeniorDetails({
  draft,
  errors,
  onPatch,
  onBack,
  onNext,
}: {
  draft: MembershipApplicationDraft;
  errors: Partial<Record<keyof MembershipApplicationDraft, string>>;
  onPatch: (partial: Partial<MembershipApplicationDraft>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [showDob, setShowDob] = useState(false);
  const dobDate = useMemo(() => {
    const match = draft.dateOfBirth.replace(/\s/g, '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      return new Date(1955, 0, 1);
    }
    return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  }, [draft.dateOfBirth]);

  const pickPhoto = async () => {
    const library = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!library.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      onPatch({ photoUri: result.assets[0].uri });
    }
  };

  const onDobChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDob(false);
    }
    if (event.type === 'dismissed') {
      return;
    }
    if (selected) {
      onPatch({ dateOfBirth: formatDobFromDate(selected) });
    }
  };

  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitleCompact}>{"Senior's Details"}</Text>
      <Text style={styles.stepSubtitleCompact} numberOfLines={1}>
        Please share basic information about the senior.
      </Text>

      <View style={styles.photoRow}>
        <View style={styles.photoCircle}>
          {draft.photoUri ? (
            <Image source={{ uri: draft.photoUri }} style={styles.photoImage} />
          ) : (
            <Icon name="person-outline" size={22} color={familyHome.muted} />
          )}
        </View>
        <Pressable
          onPress={() => void pickPhoto()}
          style={styles.uploadBtn}
          accessibilityRole="button"
          accessibilityLabel="Upload Photo"
        >
          <Icon name="camera-outline" size={15} color={familyHome.greenDark} />
          <Text style={styles.uploadLabel}>Upload Photo</Text>
        </Pressable>
      </View>

      <ApplyFieldLabel label="Full Name" required />
      <TextInput
        value={draft.fullName}
        onChangeText={(fullName) => onPatch({ fullName })}
        placeholder="Enter full name"
        placeholderTextColor={familyHome.muted}
        style={[styles.input, errors.fullName ? styles.inputError : null]}
      />
      {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}

      <ApplyFieldLabel label="Date of Birth" required />
      <Pressable
        onPress={() => setShowDob(true)}
        style={[styles.input, styles.inputRow, errors.dateOfBirth ? styles.inputError : null]}
      >
        <TextInput
          value={draft.dateOfBirth}
          onChangeText={(value) => onPatch({ dateOfBirth: formatDobInput(value) })}
          placeholder="DD / MM / YYYY"
          placeholderTextColor={familyHome.muted}
          keyboardType="number-pad"
          style={styles.inputFlex}
          maxLength={14}
        />
        <Icon name="calendar-outline" size={16} color={familyHome.muted} />
      </Pressable>
      {errors.dateOfBirth ? <Text style={styles.errorText}>{errors.dateOfBirth}</Text> : null}
      {showDob && Platform.OS === 'android' ? (
        <DateTimePicker
          value={dobDate}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={onDobChange}
        />
      ) : null}
      {showDob && Platform.OS === 'ios' ? (
        <Modal transparent animationType="slide">
          <View style={styles.dobModal}>
            <View style={styles.dobSheet}>
              <DateTimePicker
                value={dobDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={onDobChange}
              />
              <Pressable onPress={() => setShowDob(false)} style={styles.dobDone}>
                <Text style={styles.dobDoneLabel}>Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}

      <ApplyFieldLabel label="Gender" required />
      <View style={styles.genderRow}>
        {GENDER_OPTIONS.map((option) => {
          const selected = draft.gender === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => onPatch({ gender: option.id })}
              style={styles.genderItem}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <View style={[styles.radioOuter, selected ? styles.radioOuterSelected : null]}>
                {selected ? <View style={styles.radioInner} /> : null}
              </View>
              <Text style={styles.genderLabel}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}

      <ApplyFieldLabel label="Mobile Number" required />
      <View style={[styles.phoneRow, errors.mobile ? styles.inputError : null]}>
        <View style={styles.countryCode}>
          <Text style={styles.countryFlag}>🇮🇳</Text>
          <Text style={styles.countryText}>+91</Text>
        </View>
        <TextInput
          value={draft.mobile}
          onChangeText={(mobile) => onPatch({ mobile: mobile.replace(/\D/g, '').slice(0, 10) })}
          placeholder="Enter mobile number"
          placeholderTextColor={familyHome.muted}
          keyboardType="phone-pad"
          style={styles.phoneInput}
        />
      </View>
      {errors.mobile ? <Text style={styles.errorText}>{errors.mobile}</Text> : null}

      <ApplyFieldLabel label="Email ID" />
      <TextInput
        value={draft.email}
        onChangeText={(email) => onPatch({ email })}
        placeholder="Enter email address"
        placeholderTextColor={familyHome.muted}
        keyboardType="email-address"
        autoCapitalize="none"
        style={[styles.input, errors.email ? styles.inputError : null]}
      />
      {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

      <ApplyFieldLabel label="Preferred Language" required />
      <View style={styles.chipRow}>
        {LANGUAGE_OPTIONS.map((option) => {
          const selected = draft.language === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => onPatch({ language: option.id })}
              style={[styles.chip, selected ? styles.chipSelected : null]}
            >
              {selected ? <Icon name="checkmark" size={12} color={familyHome.greenDark} /> : null}
              <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {errors.language ? <Text style={styles.errorText}>{errors.language}</Text> : null}

      <ApplyFooterButtons onBack={onBack} onNext={onNext} nextLabel="Next →" />
    </View>
  );
}

function StepLivingAddress({
  draft,
  errors,
  onPatch,
  onBack,
  onNext,
}: {
  draft: MembershipApplicationDraft;
  errors: Partial<Record<keyof MembershipApplicationDraft, string>>;
  onPatch: (partial: Partial<MembershipApplicationDraft>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [areaOpen, setAreaOpen] = useState(false);

  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>Address & Living Arrangement</Text>

      <ApplyFieldLabel label="Current Residential Address" required />
      <TextInput
        value={draft.address}
        onChangeText={(address) => onPatch({ address })}
        placeholder="House / Flat No., Building Name, Street / Society"
        placeholderTextColor={familyHome.muted}
        multiline
        style={[styles.input, styles.textArea, errors.address ? styles.inputError : null]}
      />
      {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}

      <View style={styles.twoCol}>
        <View style={styles.col}>
          <ApplyFieldLabel label="Area" required />
          <Pressable
            onPress={() => setAreaOpen(true)}
            style={[styles.input, styles.inputRow, errors.area ? styles.inputError : null]}
          >
            <Text style={draft.area ? styles.inputValue : styles.placeholder}>
              {draft.area ?? 'Select area'}
            </Text>
            <Icon name="chevron-down" size={18} color={familyHome.muted} />
          </Pressable>
          {errors.area ? <Text style={styles.errorText}>{errors.area}</Text> : null}
        </View>
        <View style={styles.col}>
          <ApplyFieldLabel label="PIN Code" required />
          <TextInput
            value={draft.pinCode}
            onChangeText={(pinCode) => onPatch({ pinCode: pinCode.replace(/\D/g, '').slice(0, 6) })}
            placeholder="Enter PIN code"
            placeholderTextColor={familyHome.muted}
            keyboardType="number-pad"
            style={[styles.input, errors.pinCode ? styles.inputError : null]}
          />
          {errors.pinCode ? <Text style={styles.errorText}>{errors.pinCode}</Text> : null}
        </View>
      </View>

      <ApplyFieldLabel label="Do you currently live with?" required />
      <View style={styles.optionsStack}>
        {LIVING_WITH_OPTIONS.map((option) => {
          const selected = draft.livingWith === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => onPatch({ livingWith: option.id })}
              style={[styles.livingCard, selected ? styles.livingCardSelected : null]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <View style={[styles.radio, selected ? styles.radioSelected : null]}>
                {selected ? <Icon name="checkmark" size={12} color={familyHome.white} /> : null}
              </View>
              <Icon
                name={option.icon}
                size={18}
                color={selected ? familyHome.greenDark : familyHome.blue}
              />
              <Text style={styles.livingLabel}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {errors.livingWith ? <Text style={styles.errorText}>{errors.livingWith}</Text> : null}

      <ApplyFooterButtons onBack={onBack} onNext={onNext} nextLabel="Next →" />

      <Modal visible={areaOpen} transparent animationType="fade" onRequestClose={() => setAreaOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setAreaOpen(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select area</Text>
            {AREA_OPTIONS.map((area) => (
              <Pressable
                key={area}
                onPress={() => {
                  onPatch({ area: area as AreaId });
                  setAreaOpen(false);
                }}
                style={styles.modalOption}
              >
                <Text style={styles.modalOptionLabel}>{area}</Text>
                {draft.area === area ? (
                  <Icon name="checkmark" size={16} color={familyHome.greenDark} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function StepEmergencyContact({
  draft,
  errors,
  onPatch,
  onBack,
  onNext,
}: {
  draft: MembershipApplicationDraft;
  errors: Partial<Record<keyof MembershipApplicationDraft, string>>;
  onPatch: (partial: Partial<MembershipApplicationDraft>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [relationshipFor, setRelationshipFor] = useState<'primary' | 'secondary' | null>(null);

  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>Emergency Contact Information</Text>
      <Text style={styles.stepSubtitle}>Please provide at least one emergency contact</Text>

      <View style={styles.contactCard}>
        <View style={styles.contactHead}>
          <Icon name="shield-checkmark-outline" size={18} color={familyHome.greenDark} />
          <Text style={styles.contactHeadLabel}>
            Primary Emergency Contact <Text style={styles.required}>*</Text>
          </Text>
        </View>

        <ApplyFieldLabel label="Name" required />
        <TextInput
          value={draft.primaryName}
          onChangeText={(primaryName) => onPatch({ primaryName })}
          placeholder="Enter full name"
          placeholderTextColor={familyHome.muted}
          style={[styles.input, errors.primaryName ? styles.inputError : null]}
        />
        {errors.primaryName ? <Text style={styles.errorText}>{errors.primaryName}</Text> : null}

        <ApplyFieldLabel label="Relationship" required />
        <Pressable
          onPress={() => setRelationshipFor('primary')}
          style={[styles.input, styles.inputRow, errors.primaryRelationship ? styles.inputError : null]}
        >
          <Text style={draft.primaryRelationship ? styles.inputValue : styles.placeholder}>
            {draft.primaryRelationship || 'Select relationship'}
          </Text>
          <Icon name="chevron-down" size={18} color={familyHome.muted} />
        </Pressable>
        {errors.primaryRelationship ? (
          <Text style={styles.errorText}>{errors.primaryRelationship}</Text>
        ) : null}

        <ApplyFieldLabel label="Mobile Number" required />
        <PhoneField
          value={draft.primaryMobile}
          onChange={(primaryMobile) => onPatch({ primaryMobile })}
          error={errors.primaryMobile}
        />

        <ApplyFieldLabel label="WhatsApp Number" />
        <PhoneField
          value={draft.primaryWhatsapp}
          onChange={(primaryWhatsapp) => onPatch({ primaryWhatsapp })}
          error={errors.primaryWhatsapp}
          placeholder="Enter WhatsApp number"
        />

        <ApplyFieldLabel label="Email ID" />
        <TextInput
          value={draft.primaryEmail}
          onChangeText={(primaryEmail) => onPatch({ primaryEmail })}
          placeholder="Enter email address"
          placeholderTextColor={familyHome.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.input, errors.primaryEmail ? styles.inputError : null]}
        />
        {errors.primaryEmail ? <Text style={styles.errorText}>{errors.primaryEmail}</Text> : null}

        <ApplyFieldLabel label="Current City" required />
        <TextInput
          value={draft.primaryCity}
          onChangeText={(primaryCity) => onPatch({ primaryCity })}
          placeholder="Enter city"
          placeholderTextColor={familyHome.muted}
          style={[styles.input, errors.primaryCity ? styles.inputError : null]}
        />
        {errors.primaryCity ? <Text style={styles.errorText}>{errors.primaryCity}</Text> : null}
      </View>

      <View style={styles.contactCard}>
        <View style={styles.contactHead}>
          <Icon name="shield-checkmark-outline" size={18} color={familyHome.greenDark} />
          <Text style={styles.contactHeadLabel}>Secondary Emergency Contact</Text>
        </View>

        <ApplyFieldLabel label="Name" />
        <TextInput
          value={draft.secondaryName}
          onChangeText={(secondaryName) => onPatch({ secondaryName })}
          placeholder="Enter full name"
          placeholderTextColor={familyHome.muted}
          style={[styles.input, errors.secondaryName ? styles.inputError : null]}
        />
        {errors.secondaryName ? <Text style={styles.errorText}>{errors.secondaryName}</Text> : null}

        <ApplyFieldLabel label="Relationship" />
        <Pressable
          onPress={() => setRelationshipFor('secondary')}
          style={[
            styles.input,
            styles.inputRow,
            errors.secondaryRelationship ? styles.inputError : null,
          ]}
        >
          <Text style={draft.secondaryRelationship ? styles.inputValue : styles.placeholder}>
            {draft.secondaryRelationship || 'Select relationship'}
          </Text>
          <Icon name="chevron-down" size={18} color={familyHome.muted} />
        </Pressable>
        {errors.secondaryRelationship ? (
          <Text style={styles.errorText}>{errors.secondaryRelationship}</Text>
        ) : null}

        <ApplyFieldLabel label="Mobile Number" />
        <PhoneField
          value={draft.secondaryMobile}
          onChange={(secondaryMobile) => onPatch({ secondaryMobile })}
          error={errors.secondaryMobile}
        />
      </View>

      <ApplyFooterButtons onBack={onBack} onNext={onNext} nextLabel="Next →" />

      <Modal
        visible={relationshipFor != null}
        transparent
        animationType="fade"
        onRequestClose={() => setRelationshipFor(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setRelationshipFor(null)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select relationship</Text>
            {RELATIONSHIP_OPTIONS.map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  if (relationshipFor === 'primary') {
                    onPatch({ primaryRelationship: item });
                  } else {
                    onPatch({ secondaryRelationship: item });
                  }
                  setRelationshipFor(null);
                }}
                style={styles.modalOption}
              >
                <Text style={styles.modalOptionLabel}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function StepSupportNeeds({
  draft,
  errors,
  onPatch,
  submitting,
  onBack,
  onNext,
}: {
  draft: MembershipApplicationDraft;
  errors: Partial<Record<keyof MembershipApplicationDraft, string>>;
  onPatch: (partial: Partial<MembershipApplicationDraft>) => void;
  submitting: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const toggleNeed = (id: SupportNeedId) => {
    const exists = draft.supportNeeds.includes(id);
    onPatch({
      supportNeeds: exists
        ? draft.supportNeeds.filter((item) => item !== id)
        : [...draft.supportNeeds, id],
    });
  };

  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitleCompact}>What kind of support are you looking for?</Text>
      <Text style={styles.stepSubtitleCompact} numberOfLines={1}>
        You can select multiple options.
      </Text>

      <View style={styles.supportGrid}>
        {SUPPORT_NEED_OPTIONS.map((option) => {
          const selected = draft.supportNeeds.includes(option.id);
          const fullWidth = option.id === 'other';
          return (
            <Pressable
              key={option.id}
              onPress={() => toggleNeed(option.id)}
              style={[
                styles.supportCard,
                fullWidth ? styles.supportCardFull : null,
                selected ? styles.supportCardSelected : null,
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
            >
              <View style={[styles.supportCheck, selected ? styles.supportCheckSelected : null]}>
                {selected ? <Icon name="checkmark" size={10} color={familyHome.white} /> : null}
              </View>
              <MarketplaceServiceIcon
                serviceId={option.serviceId}
                fallbackIcon={option.icon}
                fallbackColor={option.id === 'emergency' ? familyHome.red : familyHome.blue}
                size={fullWidth ? 28 : 36}
              />
              <Text style={styles.supportLabel} numberOfLines={2}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {errors.supportNeeds ? <Text style={styles.errorText}>{String(errors.supportNeeds)}</Text> : null}

      <ApplyFieldLabel label="Other requirement (optional)" />
      <TextInput
        value={draft.otherRequirement}
        onChangeText={(otherRequirement) => onPatch({ otherRequirement })}
        placeholder="Please specify if any other support is required."
        placeholderTextColor={familyHome.muted}
        multiline
        style={[styles.input, styles.textAreaCompact]}
      />

      <Pressable
        onPress={() => onPatch({ confirmed: !draft.confirmed })}
        style={styles.confirmRow}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: draft.confirmed }}
      >
        <View style={[styles.supportCheck, draft.confirmed ? styles.supportCheckSelected : null]}>
          {draft.confirmed ? <Icon name="checkmark" size={10} color={familyHome.white} /> : null}
        </View>
        <Text style={styles.confirmText}>
          I confirm that the information provided by me is correct to the best of my knowledge and I
          agree to be contacted by AgeWell regarding membership and the next steps of enrollment.{' '}
          <Text style={styles.required}>*</Text>
        </Text>
      </Pressable>
      {errors.confirmed ? <Text style={styles.errorText}>{errors.confirmed}</Text> : null}

      <ApplyFooterButtons
        onBack={onBack}
        onNext={onNext}
        nextLabel="Submit Application →"
        nextLoading={submitting}
      />
    </View>
  );
}

function SuccessBody({
  applicationId,
  submittedAt,
  onViewStatus,
}: {
  applicationId: string;
  submittedAt: Date;
  onViewStatus: () => void;
}) {
  const when = submittedAt.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.successWrap}>
      <View style={styles.successIcon}>
        <Icon name="clipboard-check" size={36} color={familyHome.greenDark} />
      </View>
      <Text style={styles.successTitle}>Application Submitted Successfully!</Text>
      <Text style={styles.successBody}>
        Thank you for applying for AgeWell Membership. Our Customer Care team will review your
        application and get in touch with you shortly to plan the next steps.
      </Text>

      <View style={styles.successMeta}>
        <Text style={styles.successMetaLabel}>Application ID</Text>
        <Text style={styles.successMetaValue}>{applicationId}</Text>
        <Text style={styles.successMetaTime}>Submitted on {when}</Text>
      </View>

      <Text style={styles.nextHead}>What Happens Next?</Text>
      <View style={styles.nextList}>
        {[
          { icon: 'call-outline' as const, text: 'Our team will call you to understand your requirements.' },
          { icon: 'home-outline' as const, text: 'An AgeWell executive visit will be scheduled.' },
          {
            icon: 'document-text-outline' as const,
            text: 'After assessment, we will inform you about approval and payment.',
          },
        ].map((item) => (
          <View key={item.text} style={styles.nextRow}>
            <View style={styles.nextIcon}>
              <Icon name={item.icon} size={18} color={familyHome.greenDark} />
            </View>
            <Text style={styles.nextText}>{item.text}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={onViewStatus}
        accessibilityRole="button"
        accessibilityLabel="View Application Status"
        style={({ pressed }) => [styles.startBtn, pressed ? styles.pressed : null]}
      >
        <Text style={styles.startBtnLabel}>View Application Status</Text>
        <Icon name="arrow-forward" size={18} color={familyHome.white} />
      </Pressable>
    </View>
  );
}

function PhoneField({
  value,
  onChange,
  error,
  placeholder = 'Enter mobile number',
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <>
      <View style={[styles.phoneRow, error ? styles.inputError : null]}>
        <View style={styles.countryCode}>
          <Text style={styles.countryFlag}>🇮🇳</Text>
          <Text style={styles.countryText}>+91</Text>
        </View>
        <TextInput
          value={value}
          onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, 10))}
          placeholder={placeholder}
          placeholderTextColor={familyHome.muted}
          keyboardType="phone-pad"
          style={styles.phoneInput}
        />
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
  introContent: {
    flexGrow: 1,
  },
  introWrap: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  introTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: APPLY_NAVY,
    textAlign: 'center',
  },
  introSubtitle: {
    ...typography.body,
    color: familyHome.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  introPlan: {
    ...typography.captionStrong,
    color: familyHome.greenDark,
    marginTop: spacing.md,
  },
  benefitList: {
    width: '100%',
    marginTop: spacing.xxl,
    gap: spacing.lg,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitLabel: {
    ...typography.body,
    color: APPLY_NAVY,
    flex: 1,
  },
  introHeroWrap: {
    width: '100%',
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  introHero: {
    width: '100%',
    height: '100%',
  },
  startBtn: {
    width: '100%',
    minHeight: 54,
    borderRadius: 14,
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
  stepWrap: {
    gap: 6,
    paddingBottom: spacing.md,
  },
  stepTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: APPLY_NAVY,
  },
  stepTitleCompact: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: APPLY_NAVY,
    marginBottom: 2,
  },
  stepSubtitle: {
    ...typography.caption,
    color: familyHome.muted,
    marginBottom: spacing.sm,
  },
  stepSubtitleCompact: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: familyHome.muted,
    marginBottom: spacing.xs,
  },
  optionsStack: {
    gap: spacing.md,
  },
  forCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.md,
    backgroundColor: familyHome.white,
  },
  forCardSelected: {
    borderColor: familyHome.greenDark,
    backgroundColor: familyHome.greenSoft,
  },
  forAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  forAvatarSelected: {
    backgroundColor: '#E4F3E5',
  },
  forAvatarImage: {
    width: 40,
    height: 40,
  },
  forCopy: {
    flex: 1,
    gap: 2,
  },
  forTitle: {
    ...typography.bodyStrong,
    color: APPLY_NAVY,
  },
  forSubtitle: {
    ...typography.caption,
    color: familyHome.muted,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#C9C9C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: familyHome.greenDark,
    borderColor: familyHome.greenDark,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  infoBannerText: {
    ...typography.caption,
    color: familyHome.greenDark,
    flex: 1,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  photoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  uploadLabel: {
    ...typography.captionStrong,
    color: familyHome.greenDark,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...typography.body,
    color: APPLY_NAVY,
    backgroundColor: familyHome.white,
    marginBottom: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inputFlex: {
    flex: 1,
    ...typography.body,
    color: APPLY_NAVY,
    padding: 0,
  },
  inputError: {
    borderColor: familyHome.red,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textAreaCompact: {
    minHeight: 64,
    textAlignVertical: 'top',
    paddingVertical: 8,
  },
  inputValue: {
    ...typography.body,
    color: APPLY_NAVY,
    flex: 1,
  },
  placeholder: {
    ...typography.body,
    color: familyHome.muted,
    flex: 1,
  },
  errorText: {
    ...typography.caption,
    color: familyHome.red,
    marginBottom: 4,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: 4,
    marginTop: 2,
  },
  genderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#C9C9C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: familyHome.greenDark,
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: familyHome.greenDark,
  },
  genderLabel: {
    ...typography.body,
    color: APPLY_NAVY,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 10,
    marginBottom: 2,
    overflow: 'hidden',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: familyHome.border,
    backgroundColor: '#FAFAFA',
  },
  countryFlag: {
    fontSize: 14,
  },
  countryText: {
    ...typography.bodyStrong,
    color: APPLY_NAVY,
  },
  phoneInput: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: APPLY_NAVY,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  chipSelected: {
    borderColor: familyHome.greenDark,
    backgroundColor: familyHome.greenSoft,
  },
  chipLabel: {
    ...typography.captionStrong,
    color: familyHome.muted,
  },
  chipLabelSelected: {
    color: familyHome.greenDark,
  },
  twoCol: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  col: {
    flex: 1,
  },
  livingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: familyHome.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  livingCardSelected: {
    borderColor: familyHome.greenDark,
    backgroundColor: familyHome.greenSoft,
  },
  livingLabel: {
    ...typography.body,
    color: APPLY_NAVY,
    flex: 1,
  },
  contactCard: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  contactHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  contactHeadLabel: {
    ...typography.bodyStrong,
    color: APPLY_NAVY,
  },
  required: {
    color: familyHome.red,
  },
  supportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.sm,
    marginTop: 2,
  },
  supportCard: {
    width: '47%',
    flexGrow: 1,
    borderWidth: 1.5,
    borderColor: familyHome.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    minHeight: 72,
  },
  supportCardFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    gap: 10,
  },
  supportCardSelected: {
    borderColor: familyHome.greenDark,
    backgroundColor: familyHome.greenSoft,
  },
  supportCheck: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#C9C9C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportCheckSelected: {
    backgroundColor: familyHome.greenDark,
    borderColor: familyHome.greenDark,
  },
  supportLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: APPLY_NAVY,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  confirmText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: APPLY_NAVY,
    flex: 1,
  },
  successWrap: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    color: APPLY_NAVY,
    textAlign: 'center',
  },
  successBody: {
    ...typography.body,
    color: familyHome.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  successMeta: {
    width: '100%',
    backgroundColor: familyHome.blueSoft,
    borderRadius: 14,
    padding: spacing.lg,
    gap: 4,
  },
  successMetaLabel: {
    ...typography.caption,
    color: familyHome.muted,
  },
  successMetaValue: {
    ...typography.bodyStrong,
    color: APPLY_NAVY,
  },
  successMetaTime: {
    ...typography.caption,
    color: familyHome.muted,
    marginTop: 4,
  },
  nextHead: {
    alignSelf: 'flex-start',
    ...typography.bodyStrong,
    color: APPLY_NAVY,
    marginTop: spacing.md,
  },
  nextList: {
    width: '100%',
    gap: spacing.md,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  nextIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    ...typography.body,
    color: APPLY_NAVY,
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: familyHome.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  modalTitle: {
    ...typography.bodyStrong,
    color: APPLY_NAVY,
    marginBottom: spacing.sm,
  },
  modalOption: {
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  modalOptionLabel: {
    ...typography.body,
    color: APPLY_NAVY,
  },
  dobModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  dobSheet: {
    backgroundColor: familyHome.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: spacing.lg,
  },
  dobDone: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  dobDoneLabel: {
    ...typography.bodyStrong,
    color: familyHome.greenDark,
  },
  pressed: {
    opacity: 0.92,
  },
});
