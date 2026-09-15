import type { ReactNode } from 'react';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '@/components/KeyboardAwareScrollView';
import { colors, spacing } from '@/constants/theme';
import { StaffDutyBanner } from './StaffDutyBanner';
import { StaffHomeHeader } from './StaffHomeHeader';
import { StaffSummaryRow, type StaffSummaryStat } from './StaffSummaryRow';
import type { StaffHomeConfig } from '../staffHomeConfig';

interface StaffDutyHomeLayoutProps {
  config: StaffHomeConfig;
  name: string | null | undefined;
  unreadCount?: number;
  onDuty?: boolean;
  dutySinceLabel?: string | null;
  onDutyPress?: () => void;
  stats: StaffSummaryStat[];
  refreshControl?: ComponentProps<typeof KeyboardAwareScrollView>['refreshControl'];
  children: ReactNode;
}

export function StaffDutyHomeLayout({
  config,
  name,
  unreadCount = 0,
  onDuty = true,
  dutySinceLabel,
  onDutyPress,
  stats,
  refreshControl,
  children,
}: StaffDutyHomeLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        <StaffHomeHeader
          name={name}
          roleLabel={config.roleLabel}
          accent={config.accent}
          unreadCount={unreadCount}
          ringAvatar={config.kind === 'DELIVERY_EXECUTIVE'}
        />
        <StaffDutyBanner onDuty={onDuty} sinceLabel={dutySinceLabel} onPress={onDutyPress} />
        <StaffSummaryRow stats={stats} />
        {children}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
  },
});
