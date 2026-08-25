import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';
import { Icon, IconWell } from '@/components/ui';
import { PremiumCard } from '@/components/premium';
import { useI18n } from '@/i18n';

export function WhyAgeWell() {
  const { t } = useI18n();
  return (
    <View style={styles.container}>
      <PremiumCard tone="soft">
        <View style={styles.row}>
          <IconWell tone="primary" size={52} rounded="full">
            <Icon name="heart-outline" size={22} color={colors.primary} />
          </IconWell>
          <View style={styles.copy}>
            <Text style={styles.eyebrow}>{t('brand.whyTitle')}</Text>
            <Text style={styles.headline}>{t('brand.whyHeadline')}</Text>
            <Text style={styles.body}>{t('brand.whyBody')}</Text>
          </View>
        </View>
      </PremiumCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    ...typography.label,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  headline: {
    ...typography.heading,
    color: colors.text,
  },
  body: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
