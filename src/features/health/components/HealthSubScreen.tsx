import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from '@/components/KeyboardAwareScrollView';
import { colors, spacing } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';

interface HealthSubScreenProps {
  title: string;
  children: ReactNode;
}

export function HealthSubScreen({ title, children }: HealthSubScreenProps) {
  return (
    <View style={styles.container}>
      <AgeWellHeader title={title} showBack showProfile={false} />
      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
});
