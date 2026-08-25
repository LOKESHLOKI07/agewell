import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';
import type { ServiceCategoryGroup } from '../selectors';
import { ServiceCard } from '@/components';

type ServiceCategoryProps = {
  group: ServiceCategoryGroup;
  onOpen: (serviceId: string) => void;
  onRequest: (serviceId: string) => void;
};

export function ServiceCategorySection({ group, onOpen, onRequest }: ServiceCategoryProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{group.label}</Text>
      <Text style={styles.count}>
        {group.services.length} service{group.services.length === 1 ? '' : 's'}
      </Text>
      <View style={styles.list}>
        {group.services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onPress={() => onOpen(service.id)}
            onRequest={() => onRequest(service.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  count: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
});
