import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from '@/components/KeyboardAwareScrollView';
import { colors, spacing, typography } from '@/constants/theme';

interface CareScreenProps {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  children: ReactNode;
  refreshControl?: ComponentProps<typeof KeyboardAwareScrollView>['refreshControl'];
}

export function CareScreen({ title, subtitle, trailing, children, refreshControl }: CareScreenProps) {
  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {trailing}
        </View>
        {children}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    ...typography.title,
    color: colors.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
