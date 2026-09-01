import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import {
  canAvailServices,
  SERVICE_AREA_LOCKED_MESSAGE,
  SERVICE_AREA_LOCKED_TITLE,
} from '@/features/auth/serviceAreaPreference';
import { homeAddOnServices } from '@/features/services/addOnServiceCatalog';
import { homeBasicMembershipServices, type HomeServiceTile } from '@/features/services/serviceCatalog';
import { FamilyHomeSectionHeader } from './FamilyHomePrimitives';
import { familyHome } from './familyHomeTheme';

function openOrLock(href: Href, bookable: boolean) {
  if (bookable && !canAvailServices()) {
    Alert.alert(SERVICE_AREA_LOCKED_TITLE, SERVICE_AREA_LOCKED_MESSAGE);
    return;
  }
  router.push(href);
}

const GRID_COLUMNS = 4;

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
        </View>
      ))}
    </View>
  );
}

export function FamilyOurServicesGrid() {
  const items = homeBasicMembershipServices();

  return (
    <View style={styles.section}>
      <FamilyHomeSectionHeader title="Our Basic Membership Services" />
      <FamilyServiceGrid items={items} onPressItem={(item) => openOrLock(item.href, item.bookable)} />
    </View>
  );
}

export function FamilyAddOnServices() {
  const items = homeAddOnServices();

  return (
    <View style={styles.section}>
      <FamilyHomeSectionHeader title="Add-on Services" />
      <FamilyServiceGrid
        items={items}
        onPressItem={(item) => openOrLock(item.href, false)}
      />
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
