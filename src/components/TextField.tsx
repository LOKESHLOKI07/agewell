import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, minTouchSize, radius, spacing, typography } from '@/constants/theme';
import { Icon } from '@/components/ui';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  showSecureToggle?: boolean;
}

export function TextField({
  label,
  error,
  showSecureToggle = false,
  secureTextEntry,
  style,
  ...inputProps
}: TextFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const useToggle = Boolean(showSecureToggle && secureTextEntry);
  const hidePassword = Boolean(secureTextEntry) && !(useToggle && passwordVisible);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <TextInput
          {...inputProps}
          secureTextEntry={hidePassword}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, useToggle ? styles.inputWithToggle : null, error ? styles.inputError : null, style]}
          accessibilityLabel={label}
          accessibilityHint={error}
        />
        {useToggle ? (
          <Pressable
            onPress={() => setPasswordVisible((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
            hitSlop={8}
            style={styles.toggle}
          >
            <Icon
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.captionStrong,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: minTouchSize,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  inputWithToggle: {
    paddingRight: minTouchSize,
  },
  inputError: {
    borderColor: colors.emergency,
  },
  toggle: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: minTouchSize,
    height: minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
    marginTop: spacing.xs,
  },
});
