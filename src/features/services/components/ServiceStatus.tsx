import { StyleSheet, Text, View } from 'react-native';
import { StatusPill, statusToneFromLabel } from '@/components/premium';
import { colors, spacing, typography } from '@/constants/theme';
import { humanizeStatus } from '@/features/home/selectors/homeViewModel';
import type { ServiceRequestStatus } from '@/features/home/types/home';

type ServiceStatusProps = {
  status: ServiceRequestStatus | string;
  compact?: boolean;
};

export function ServiceStatus({ status, compact = false }: ServiceStatusProps) {
  const label = humanizeStatus(status);
  return (
    <View style={styles.wrap} accessibilityRole="text" accessibilityLabel={`Service status ${label}`}>
      <StatusPill label={label} tone={statusToneFromLabel(status)} iconLabel={compact ? undefined : '•'} />
      {!compact ? <Text style={styles.hint}>Status from AgeWell · not invented</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
