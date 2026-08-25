import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';
import { Icon } from '@/components/ui';
import { IconWell } from '@/components/ui';
import { SecondaryButton } from './SecondaryButton';

interface ErrorStateProps {
  title?: string;
  message?: string;
  variant?: 'error' | 'offline';
  onRetry?: () => void;
}

export function ErrorState({
  title,
  message,
  variant = 'error',
  onRetry,
}: ErrorStateProps) {
  const resolvedTitle =
    title ?? (variant === 'offline' ? 'Network unavailable' : 'Something went wrong');
  const resolvedMessage =
    message ??
    (variant === 'offline'
      ? 'Please check your connection. AgeWell will reload your care details when you are back online.'
      : 'We could not load this information. Please try again.');

  return (
    <View style={styles.wrap} accessibilityRole="alert" accessibilityLabel={`${resolvedTitle}. ${resolvedMessage}`}>
      <IconWell tone="emergency" size={56}>
        <Icon
          name={variant === 'offline' ? 'cloud-offline-outline' : 'warning-outline'}
          size={26}
          color={colors.emergency}
        />
      </IconWell>
      <Text style={styles.title}>{resolvedTitle}</Text>
      <Text style={styles.message}>{resolvedMessage}</Text>
      {onRetry ? (
        <View style={styles.action}>
          <SecondaryButton label="Try again" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  action: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
});
