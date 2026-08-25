import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';

interface FamilySubScreenProps {
  title: string;
  showBack?: boolean;
  unreadCount?: number;
  children: ReactNode;
}

export function FamilySubScreen({ title, showBack = true, unreadCount = 0, children }: FamilySubScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AgeWellHeader title={title} showBack={showBack} showProfile={false} unreadCount={unreadCount} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
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
    paddingBottom: spacing.huge + 72,
  },
});
