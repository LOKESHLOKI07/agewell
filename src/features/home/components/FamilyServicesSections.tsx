import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Icon, type IconName } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import {
  canAvailServices,
  SERVICE_AREA_LOCKED_MESSAGE,
  SERVICE_AREA_LOCKED_TITLE,
} from '@/features/auth/serviceAreaPreference';
import { homeMarketplaceServices } from '@/features/services/serviceCatalog';
import { FamilyHomeIconWell, FamilyHomeSectionHeader } from './FamilyHomePrimitives';
import { familyHome } from './familyHomeTheme';

function seniorRoutes() {
  return {
    servicesAll: '/(tabs)/services' as Href,
    doctor: '/health/appointments' as Href,
    meds: '/health/medications' as Href,
    companion: '/visits' as Href,
    food: '/addons' as Href,
    emergency: '/emergency' as Href,
    community: '/(tabs)/community' as Href,
    health: '/(tabs)/health' as Href,
    notifications: '/notifications' as Href,
    visits: '/visits' as Href,
    profile: '/(tabs)/profile' as Href,
  };
}

function openOrLock(href: Href, bookable: boolean) {
  if (bookable && !canAvailServices()) {
    Alert.alert(SERVICE_AREA_LOCKED_TITLE, SERVICE_AREA_LOCKED_MESSAGE);
    return;
  }
  router.push(href);
}

export function FamilyQuickServices() {
  const routes = seniorRoutes();
  const quick: {
    key: string;
    label: string;
    icon: IconName;
    color: string;
    background: string;
    href: Href;
    bookable: boolean;
  }[] = [
    {
      key: 'sos',
      label: 'Emergency\nButton',
      icon: 'siren',
      color: familyHome.red,
      background: familyHome.redSoft,
      href: routes.emergency,
      bookable: true,
    },
    {
      key: 'doctor',
      label: 'Book\nDoctor',
      icon: 'doctor',
      color: familyHome.green,
      background: familyHome.greenSoft,
      href: routes.doctor,
      bookable: true,
    },
    {
      key: 'meds',
      label: 'Medicines\nDelivery',
      icon: 'pill',
      color: familyHome.purple,
      background: familyHome.purpleSoft,
      href: routes.meds,
      bookable: true,
    },
    {
      key: 'companion',
      label: 'Companion\nVisit',
      icon: 'people-outline',
      color: familyHome.orange,
      background: familyHome.orangeSoft,
      href: routes.companion,
      bookable: true,
    },
    {
      key: 'food',
      label: 'Food\nOrder',
      icon: 'restaurant-outline',
      color: familyHome.yellow,
      background: familyHome.yellowSoft,
      href: routes.food,
      bookable: true,
    },
  ];

  return (
    <View style={styles.section}>
      <FamilyHomeSectionHeader
        title="Quick Services"
        actionLabel="View All"
        onAction={() => openOrLock(routes.servicesAll, false)}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {quick.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => openOrLock(item.href, item.bookable)}
            accessibilityRole="button"
            accessibilityLabel={item.label.replace('\n', ' ')}
            style={({ pressed }) => [styles.item, pressed ? styles.pressed : null]}
          >
            <FamilyHomeIconWell name={item.icon} color={item.color} background={item.background} size={24} />
            <Text style={styles.label}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export function FamilyOurServicesGrid() {
  const items = homeMarketplaceServices();

  return (
    <View style={styles.section}>
      <FamilyHomeSectionHeader
        title="Our Services"
        actionLabel="View All"
        onAction={() => openOrLock('/(tabs)/services' as Href, false)}
      />
      <View style={styles.grid}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => openOrLock(item.href, item.bookable)}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            style={({ pressed }) => [styles.gridItem, pressed ? styles.pressed : null]}
          >
            <View style={[styles.gridIcon, { backgroundColor: item.background }]}>
              <Icon name={item.icon} size={18} color={item.color} />
            </View>
            <Text style={styles.gridLabel} numberOfLines={2}>
              {item.title}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.xl,
  },
  row: {
    gap: spacing.lg,
    paddingRight: spacing.md,
  },
  item: {
    width: 76,
    alignItems: 'center',
    gap: 8,
  },
  label: {
    ...typography.captionStrong,
    color: familyHome.text,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridItem: {
    width: '31.5%',
    minHeight: 78,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: familyHome.border,
    backgroundColor: familyHome.white,
    paddingHorizontal: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  gridIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
