import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { ProgressBar } from '@/components/ui';
import { PremiumCard } from './PremiumCard';
import { StatusPill } from './StatusPill';

type UsageRow = {
  id: string;
  label: string;
  used: number;
  quota: number | null;
};

type ProgressCardProps = {
  planName: string;
  status?: string | null;
  validityLabel?: string | null;
  usage: UsageRow[];
  onPressPlan?: () => void;
  onAddMore?: (row: UsageRow) => void;
  /** Button label when quota is full. Default: Request more (not purchase). */
  addMoreLabel?: string;
};

function isQuotaFull(row: UsageRow): boolean {
  return typeof row.quota === 'number' && row.quota > 0 && row.used >= row.quota;
}

export function ProgressCard({
  planName,
  status,
  validityLabel,
  usage,
  onPressPlan,
  onAddMore,
  addMoreLabel = 'Request more',
}: ProgressCardProps) {
  return (
    <PremiumCard>
      <Pressable
        onPress={onPressPlan}
        disabled={!onPressPlan}
        accessibilityRole={onPressPlan ? 'button' : undefined}
        accessibilityLabel={`Membership plan ${planName}`}
        style={styles.header}
      >
        <View style={styles.planCopy}>
          <Text style={styles.planName}>{planName}</Text>
          {validityLabel ? <Text style={styles.validity}>{validityLabel}</Text> : null}
        </View>
        {status ? <StatusPill label={status} tone="safe" /> : null}
      </Pressable>

      <View style={styles.usage}>
        {usage.map((row) => {
          const full = isQuotaFull(row);
          return (
            <View key={row.id} style={styles.usageRow}>
              <ProgressBar label={row.label} used={row.used} total={row.quota} />
              {full ? (
                onAddMore ? (
                  <Pressable
                    onPress={() => onAddMore(row)}
                    accessibilityRole="button"
                    accessibilityLabel={`${addMoreLabel} for ${row.label}`}
                    style={styles.addMore}
                  >
                    <Text style={styles.addMoreText}>{addMoreLabel}</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.fullNote}>Quota used · Contact AgeWell to request more</Text>
                )
              ) : null}
            </View>
          );
        })}
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
    minHeight: minTouchSize / 2,
  },
  planCopy: {
    flex: 1,
  },
  planName: {
    ...typography.subtitle,
    color: colors.text,
  },
  validity: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  usage: {
    gap: spacing.md,
  },
  usageRow: {
    gap: spacing.sm,
  },
  addMore: {
    alignSelf: 'flex-start',
    minHeight: minTouchSize,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  addMoreText: {
    ...typography.captionStrong,
    color: colors.primary,
  },
  fullNote: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
