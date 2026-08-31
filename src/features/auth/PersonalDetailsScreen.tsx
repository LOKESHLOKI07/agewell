import { createElement, type ReactNode, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams, useNavigation, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brandGreen } from '@/components/AgeWellLogo';
import { Icon } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { useI18nStore } from '@/i18n';
import {
  DATE_OF_BIRTH_INPUT_LENGTH,
  ONBOARDING_LANGUAGES,
  formatDateOfBirthFromDate,
  formatDateOfBirthInput,
  getVerifiedEmail,
  getGoogleFullName,
  parseDateOfBirth,
  personalDetailsSchema,
  setOnboardingProfile,
  splitFullName,
  type PersonalDetailsValues,
} from './onboardingProfile';
import { setOnboardingAuthMethod, type OnboardingAuthMethod } from './onboardingLocation';

const METHODS = new Set<OnboardingAuthMethod>(['google', 'mobile', 'email']);

export function PersonalDetailsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ method?: string | string[] }>();
  const setLocale = useI18nStore((state) => state.setLocale);
  const [languageOpen, setLanguageOpen] = useState(false);
  const verifiedEmail = getVerifiedEmail();
  const googleName = splitFullName(getGoogleFullName());
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PersonalDetailsValues>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      firstName: googleName.firstName,
      lastName: googleName.lastName,
      phone: '',
      email: verifiedEmail,
      dateOfBirth: '',
      language: undefined,
      address: '',
    },
  });

  const method = normalizeMethod(params.method);

  useEffect(() => {
    if (method) {
      setOnboardingAuthMethod(method);
    }
  }, [method]);

  const language = watch('language');
  const languageLabel = ONBOARDING_LANGUAGES.find((item) => item.id === language)?.label;

  const goBack = () => {
    if (navigation.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(auth)/welcome' as Href);
  };

  const onSubmit = (values: PersonalDetailsValues) => {
    setOnboardingProfile(values);
    setLocale(values.language);
    router.push('/(auth)/service-for' as Href);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + spacing.sm }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
        <Icon name="arrow-back" size={22} color="#1A1A1A" />
      </Pressable>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <Text style={styles.title}>Let’s get to know you</Text>
        <Text style={styles.subtitle}>Please provide a few basic details to get started.</Text>

        <View style={styles.card}>
          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormRow label="First Name" error={errors.firstName?.message}>
                <TextInput
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Enter your first name"
                  placeholderTextColor="#9A9A9A"
                  autoCapitalize="words"
                  style={styles.input}
                  accessibilityLabel="First Name"
                />
              </FormRow>
            )}
          />
          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormRow label="Last Name" error={errors.lastName?.message}>
                <TextInput
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Enter your last name"
                  placeholderTextColor="#9A9A9A"
                  autoCapitalize="words"
                  style={styles.input}
                  accessibilityLabel="Last Name"
                />
              </FormRow>
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormRow label="Mobile Number" error={errors.phone?.message}>
                <TextInput
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Enter mobile number"
                  placeholderTextColor="#9A9A9A"
                  keyboardType="phone-pad"
                  style={styles.input}
                  accessibilityLabel="Mobile Number"
                />
              </FormRow>
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormRow label="Email Address" error={errors.email?.message}>
                <TextInput
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Enter email address"
                  placeholderTextColor="#9A9A9A"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!verifiedEmail}
                  style={[styles.input, verifiedEmail ? styles.inputLocked : null]}
                  accessibilityLabel="Email Address"
                  accessibilityState={{ disabled: Boolean(verifiedEmail) }}
                />
              </FormRow>
            )}
          />
          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field: { onChange, onBlur, value } }) => (
              <DateOfBirthField
                value={value}
                onBlur={onBlur}
                onChange={onChange}
                error={errors.dateOfBirth?.message}
              />
            )}
          />
          <FormRow
            label="Preferred Language"
            error={errors.language?.message}
            trailing={<Icon name="chevron-down" size={18} color="#8A8A8A" />}
          >
            <Pressable
              onPress={() => setLanguageOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Preferred Language"
            >
              <Text style={languageLabel ? styles.value : styles.placeholder}>
                {languageLabel ?? 'Select language'}
              </Text>
            </Pressable>
          </FormRow>
          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormRow label="Residential Address" error={errors.address?.message} last>
                <TextInput
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Enter your address"
                  placeholderTextColor="#9A9A9A"
                  style={styles.input}
                  accessibilityLabel="Residential Address"
                />
              </FormRow>
            )}
          />
        </View>

        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Continue"
          style={({ pressed }) => [
            styles.continue,
            pressed && !isSubmitting ? styles.pressed : null,
            isSubmitting ? styles.disabled : null,
          ]}
        >
          <Text style={styles.continueLabel}>Continue</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={languageOpen} transparent animationType="fade" onRequestClose={() => setLanguageOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setLanguageOpen(false)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.sheetTitle}>Select language</Text>
            {ONBOARDING_LANGUAGES.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  setValue('language', item.id, { shouldValidate: true });
                  setLanguageOpen(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                style={styles.sheetRow}
              >
                <Text style={styles.sheetLabel}>{item.label}</Text>
                {language === item.id ? <Icon name="checkmark" size={18} color={brandGreen} /> : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function DateOfBirthField({
  value,
  onChange,
  onBlur,
  error,
}: {
  value: string;
  onChange: (next: string) => void;
  onBlur: () => void;
  error?: string;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [draftDate, setDraftDate] = useState(fallbackDobDate);
  const { min, max } = dobRange();

  const openPicker = () => {
    Keyboard.dismiss();
    setDraftDate(parseDateOfBirth(value) ?? fallbackDobDate());
    setShowPicker(true);
  };

  const closePicker = () => setShowPicker(false);

  const onAndroidChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowPicker(false);
    if (event.type === 'set' && selected) {
      onChange(formatDateOfBirthFromDate(selected));
    }
  };

  return (
    <>
      <FormRow
        label="Date of Birth"
        error={error}
        trailing={
          <Pressable
            onPress={openPicker}
            accessibilityRole="button"
            accessibilityLabel="Open calendar"
            hitSlop={8}
            style={styles.calendarButton}
          >
            <Icon name="calendar-outline" size={18} color="#8A8A8A" />
          </Pressable>
        }
      >
        <TextInput
          value={value}
          onBlur={onBlur}
          onChangeText={(text) => onChange(formatDateOfBirthInput(text))}
          placeholder="DD-MM-YYYY"
          placeholderTextColor="#9A9A9A"
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={DATE_OF_BIRTH_INPUT_LENGTH}
          style={styles.input}
          accessibilityLabel="Date of Birth"
        />
      </FormRow>

      {showPicker && Platform.OS === 'android' ? (
        <DateTimePicker
          value={draftDate}
          mode="date"
          display="calendar"
          maximumDate={max}
          minimumDate={min}
          onChange={onAndroidChange}
        />
      ) : null}

      {Platform.OS !== 'android' ? (
        <Modal visible={showPicker} transparent animationType="fade" onRequestClose={closePicker}>
          <Pressable style={styles.modalBackdrop} onPress={closePicker}>
            <View style={styles.sheet} onStartShouldSetResponder={() => true}>
              <Text style={styles.sheetTitle}>Select date of birth</Text>
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={draftDate}
                  mode="date"
                  display="spinner"
                  themeVariant="light"
                  maximumDate={max}
                  minimumDate={min}
                  onChange={(_event, selected) => {
                    if (selected) {
                      setDraftDate(selected);
                    }
                  }}
                  style={styles.iosPicker}
                />
              ) : (
                <WebDateInput
                  value={toIsoInputValue(draftDate)}
                  min={toIsoInputValue(min)}
                  max={toIsoInputValue(max)}
                  onChangeIso={(iso) => {
                    const next = dateFromIsoInput(iso);
                    if (next) {
                      setDraftDate(next);
                    }
                  }}
                />
              )}
              <Pressable
                onPress={() => {
                  onChange(formatDateOfBirthFromDate(draftDate));
                  closePicker();
                }}
                accessibilityRole="button"
                accessibilityLabel="Use selected date"
                style={({ pressed }) => [styles.sheetDone, pressed ? styles.pressed : null]}
              >
                <Text style={styles.continueLabel}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      ) : null}
    </>
  );
}

function WebDateInput({
  value,
  min,
  max,
  onChangeIso,
}: {
  value: string;
  min: string;
  max: string;
  onChangeIso: (iso: string) => void;
}) {
  return createElement('input', {
    type: 'date',
    value,
    min,
    max,
    onChange: (event: { target: { value: string } }) => {
      if (event.target.value) {
        onChangeIso(event.target.value);
      }
    },
    style: {
      fontSize: 16,
      padding: 12,
      width: '100%',
      borderRadius: 8,
      border: '1px solid #E6E6E6',
      color: '#1A1A1A',
      marginBottom: 12,
    },
  });
}

function dobRange() {
  const max = new Date();
  return { min: new Date(max.getFullYear() - 120, 0, 1), max };
}

function fallbackDobDate() {
  const now = new Date();
  return new Date(now.getFullYear() - 65, now.getMonth(), now.getDate());
}

function toIsoInputValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function dateFromIsoInput(iso: string): Date | null {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function FormRow({
  label,
  children,
  trailing,
  error,
  last = false,
}: {
  label: string;
  children: ReactNode;
  trailing?: ReactNode;
  error?: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last ? null : styles.rowDivider]}>
      <View style={styles.diamond} />
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        <View style={styles.rowField}>
          <View style={styles.rowInput}>{children}</View>
          {trailing}
        </View>
        {error ? (
          <Text style={styles.rowError} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
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
    lineHeight: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: '#6B6B6B',
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EDEDED',
  },
  diamond: {
    width: 8,
    height: 8,
    marginTop: 6,
    backgroundColor: brandGreen,
    transform: [{ rotate: '45deg' }],
  },
  rowBody: {
    flex: 1,
  },
  rowLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  rowField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 28,
  },
  rowInput: {
    flex: 1,
  },
  input: {
    ...typography.body,
    color: '#1A1A1A',
    padding: 0,
    marginTop: 2,
  },
  inputLocked: {
    color: '#6B6B6B',
  },
  placeholder: {
    ...typography.body,
    color: '#9A9A9A',
    marginTop: 2,
  },
  value: {
    ...typography.body,
    color: '#1A1A1A',
    marginTop: 2,
  },
  rowError: {
    ...typography.caption,
    color: '#E5484D',
    marginTop: 4,
  },
  continue: {
    minHeight: 56,
    marginTop: spacing.xxxl,
    backgroundColor: brandGreen,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.6,
  },
  continueLabel: {
    ...typography.bodyStrong,
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  sheetTitle: {
    ...typography.subtitle,
    color: '#1A1A1A',
    marginBottom: spacing.md,
  },
  sheetRow: {
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetLabel: {
    ...typography.body,
    color: '#1A1A1A',
  },
  calendarButton: {
    minWidth: minTouchSize,
    minHeight: minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosPicker: {
    height: 216,
    alignSelf: 'stretch',
  },
  sheetDone: {
    minHeight: 56,
    marginTop: spacing.md,
    backgroundColor: brandGreen,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function normalizeMethod(value: string | string[] | undefined): OnboardingAuthMethod | null {
  const method = Array.isArray(value) ? value[0] : value;
  if (method && METHODS.has(method as OnboardingAuthMethod)) {
    return method as OnboardingAuthMethod;
  }
  return null;
}
