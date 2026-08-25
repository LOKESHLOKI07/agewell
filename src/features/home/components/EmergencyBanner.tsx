import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router, type Href } from 'expo-router';
import { colors, typography, spacing, radius, shadows, minTouchSize } from '@/constants/theme';
import { Icon, IconWell } from '@/components/ui';
import { findActiveEmergency } from '@/features/emergency/mappers';
import { useEmergencyCases } from '@/features/emergency/hooks';
import {
  EMERGENCY_TYPE_OPTIONS,
  emergencyBannerHref,
  emergencyDetailHref,
  emergencyStatusLabel,
  emergencyTypeLabel,
} from '@/features/emergency/selectors';
import { useI18n } from '@/i18n';
import type { EmergencyType } from '@/features/emergency/types/emergency';

export function EmergencyBanner() {
  const listQuery = useEmergencyCases();
  const active = findActiveEmergency(listQuery.data?.items ?? []);
  const { t } = useI18n();

  const openType = (type: EmergencyType) => {
    router.push({ pathname: '/emergency', params: { type } } as unknown as Href);
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        style={[styles.hero, shadows.float]}
        accessibilityRole="button"
        accessibilityLabel={active ? t('emergency.active') : t('emergency.help')}
        accessibilityHint="Opens Emergency Help"
        onPress={() => router.push(emergencyBannerHref(active) as Href)}
      >
        <View style={styles.iconContainer}>
          <Icon name="siren" size={22} color={colors.emergency} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{active ? t('emergency.active') : t('emergency.help')}</Text>
          <Text style={styles.subtitle}>
            {active
              ? `${emergencyTypeLabel(active.type)} · ${emergencyStatusLabel(active.status)}`
              : t('emergency.heroSubtitle')}
          </Text>
        </View>
        <Text style={styles.ctaText}>{active ? t('common.viewAll') : t('common.open')}</Text>
      </Pressable>

      {active ? (
        <Pressable
          style={styles.activeLink}
          onPress={() => router.push(emergencyDetailHref(active.id) as unknown as Href)}
          accessibilityRole="button"
          accessibilityLabel="View emergency status"
        >
          <Text style={styles.activeLinkText}>{t('emergency.viewStatus')}</Text>
        </Pressable>
      ) : (
        <View style={styles.typeGrid}>
          {EMERGENCY_TYPE_OPTIONS.map((option) => (
            <Pressable
              key={option.type}
              style={styles.typeCard}
              onPress={() => openType(option.type)}
              accessibilityRole="button"
              accessibilityLabel={option.accessibilityLabel}
              accessibilityHint="Opens confirmation before creating an AgeWell emergency case"
            >
              <IconWell tone="emergency" size={40} rounded="full">
                <Icon name={option.icon} size={18} color={colors.emergency} />
              </IconWell>
              <Text style={styles.typeLabel} numberOfLines={2}>
                {option.title}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.disclaimer} accessibilityRole="text">
        {t('emergency.disclaimer')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.xl,
    marginVertical: spacing.md,
    gap: spacing.md,
  },
  hero: {
    backgroundColor: colors.emergency,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    minHeight: minTouchSize + 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: colors.white,
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.subtitle,
    color: colors.white,
  },
  subtitle: {
    ...typography.caption,
    color: colors.white,
    marginTop: 2,
    opacity: 0.92,
  },
  ctaText: {
    ...typography.captionStrong,
    color: colors.white,
    marginLeft: spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeCard: {
    width: '48%',
    flexGrow: 1,
    minHeight: minTouchSize + 28,
    backgroundColor: colors.emergencySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.emergency,
  },
  typeLabel: {
    ...typography.captionStrong,
    color: colors.text,
  },
  activeLink: {
    minHeight: minTouchSize,
    justifyContent: 'center',
  },
  activeLinkText: {
    ...typography.captionStrong,
    color: colors.emergency,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textSecondary,
    paddingHorizontal: spacing.xs,
  },
});
