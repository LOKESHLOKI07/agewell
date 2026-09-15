import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from '@/components/KeyboardAwareScrollView';
import { colors, spacing } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { useUnreadNotifications } from '@/features/notifications/hooks';

interface EmergencySubScreenProps {
  title: string;
  children: ReactNode;
}

export function EmergencySubScreen({ title, children }: EmergencySubScreenProps) {
  const unread = useUnreadNotifications();
  return (
    <View style={styles.container}>
      <AgeWellHeader
        title={title}
        showBack
        showProfile={false}
        unreadCount={unread.data?.total ?? 0}
      />
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
