import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cardSurface, colors, spacing, typography } from '@/constants/theme';
import type { CatalogService } from '@/features/home/types/home';
import { SERVICE_CATEGORY_ICONS, SERVICE_CATEGORY_LABELS } from '@/features/services/selectors';
import { Icon, IconWell } from '@/components/ui';
import { PrimaryButton } from './PrimaryButton';

interface ServiceCardProps {
  service: CatalogService;
  onPress: () => void;
  onRequest: () => void;
}

export function ServiceCard({ service, onPress, onRequest }: ServiceCardProps) {
  const icon = SERVICE_CATEGORY_ICONS[service.category] ?? 'grid';

  return (
    <View style={styles.card} accessibilityLabel={`${service.name}. ${service.description}`}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={service.name}>
        <IconWell tone="primary" size={48}>
          <Icon name={icon} size={22} color={colors.primary} />
        </IconWell>
        <Text style={styles.title}>{service.name}</Text>
        <Text style={styles.category}>{SERVICE_CATEGORY_LABELS[service.category]}</Text>
        <Text style={styles.description}>{service.description}</Text>
      </Pressable>
      <PrimaryButton
        label="Request"
        onPress={onRequest}
        accessibilityHint={`Request ${service.name}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardSurface,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...typography.subtitle,
    color: colors.text,
  },
  category: {
    ...typography.captionStrong,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
});
