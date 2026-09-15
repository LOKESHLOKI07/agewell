import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { homeAddOnServices } from '@/features/services/addOnServiceCatalog';
import { homeBasicMembershipServices, type HomeServiceTile } from '@/features/services/serviceCatalog';
import { FamilyHomeSectionHeader } from './FamilyHomePrimitives';
import { familyHome } from './familyHomeTheme';

const GRID_COLUMNS = 3;

function chunkItems<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

function FamilyServiceGrid({
  items,
  onPressItem,
}: {
  items: HomeServiceTile[];
  onPressItem: (item: HomeServiceTile) => void;
}) {
  const rows = chunkItems(items, GRID_COLUMNS);

  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.gridRow}>
          {row.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => onPressItem(item)}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              style={({ pressed }) => [
                styles.gridCard,
                { backgroundColor: item.background },
                pressed ? styles.pressed : null,
              ]}
            >
              <Icon name={item.icon} size={24} color={item.color} />
              <Text style={styles.gridLabel} numberOfLines={2}>
                {item.title}
              </Text>
            </Pressable>
          ))}
          {row.length < GRID_COLUMNS
            ? Array.from({ length: GRID_COLUMNS - row.length }).map((_, index) => (
                <View key={`pad-${rowIndex}-${index}`} style={styles.gridCardSpacer} />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}

export function FamilyOurServicesGrid({
  title = 'Our Membership Services',
  showViewAll = false,
}: {
  title?: string;
  showViewAll?: boolean;
}) {
  const items = homeBasicMembershipServices();

  const onPressItem = (item: HomeServiceTile) => {
    router.push(item.href);
  };

  return (
    <View style={styles.section}>
      <FamilyHomeSectionHeader
        title={title}
        actionLabel={showViewAll ? 'View All' : undefined}
        onAction={showViewAll ? () => router.push('/(tabs)/services' as Href) : undefined}
      />
      <FamilyServiceGrid items={items} onPressItem={onPressItem} />
    </View>
  );
}

export function FamilyAddOnServices({ showViewAll = false }: { showViewAll?: boolean }) {
  const items = homeAddOnServices();

  const onPressItem = (item: HomeServiceTile) => {
    router.push(item.href);
  };

  return (
    <View style={styles.section}>
      <FamilyHomeSectionHeader
        title="Add-on Services"
        actionLabel={showViewAll ? 'View All' : undefined}
        onAction={showViewAll ? () => router.push('/addons' as Href) : undefined}
      />
      <FamilyServiceGrid items={items} onPressItem={onPressItem} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.xl,
  },
  grid: {
    gap: spacing.sm,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gridCard: {
    flex: 1,
    minHeight: 88,
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  gridCardSpacer: {
    flex: 1,
  },
  gridLabel: {
    ...typography.captionStrong,
    color: familyHome.text,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 14,
  },
  pressed: {
    opacity: 0.9,
  },
});
