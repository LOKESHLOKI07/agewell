import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppHeader, Screen } from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';

interface SimpleInfoScreenProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function SimpleInfoScreen({ title, subtitle, children }: SimpleInfoScreenProps) {
  return (
    <Screen>
      <AppHeader title={title} subtitle={subtitle} showBack />
      <View style={[styles.card, shadows.card]}>{children}</View>
    </Screen>
  );
}

export function InfoParagraph({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
