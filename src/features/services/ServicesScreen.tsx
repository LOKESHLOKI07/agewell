import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import {
  canAvailServices,
  SERVICE_AREA_LOCKED_MESSAGE,
  SERVICE_AREA_LOCKED_TITLE,
} from '@/features/auth/serviceAreaPreference';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { useTabScreenBottomPad } from '@/utils/safeBottom';
import { allMarketplaceServices, type MarketplaceService } from './serviceCatalog';

function openService(service: MarketplaceService) {
  if (service.bookable && !canAvailServices()) {
    Alert.alert(SERVICE_AREA_LOCKED_TITLE, SERVICE_AREA_LOCKED_MESSAGE);
    return;
  }
  router.push(service.href);
}

export function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const [query, setQuery] = useState('');
  const services = useMemo(() => {
    const term = query.trim().toLowerCase();
    const all = allMarketplaceServices();
    if (!term) {
      return all;
    }
    return all.filter(
      (item) =>
        item.title.toLowerCase().includes(term) || item.description.toLowerCase().includes(term),
    );
  }, [query]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Our Services" showBack={false} showProfile showBell={false} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>Browse AgeWell support for you and your loved ones.</Text>

        <View style={styles.searchWrap}>
          <Icon name="search-outline" size={18} color={familyHome.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search services"
            placeholderTextColor={familyHome.muted}
            style={styles.searchInput}
            accessibilityLabel="Search services"
          />
        </View>

        <View style={styles.list}>
          {services.map((service) => (
            <Pressable
              key={service.id}
              onPress={() => openService(service)}
              accessibilityRole="button"
              accessibilityLabel={`${service.title}. ${service.description}`}
              style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
            >
              <View style={[styles.iconCircle, { backgroundColor: service.background }]}>
                <Icon name={service.icon} size={22} color={service.color} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{service.title}</Text>
                <Text style={styles.cardDescription}>{service.description}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {services.length === 0 ? (
          <Text style={styles.empty}>No services match your search.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: familyHome.white,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: familyHome.muted,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    backgroundColor: '#FAFAFA',
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: familyHome.text,
    paddingVertical: spacing.sm,
  },
  list: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 16,
    backgroundColor: familyHome.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 84,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    ...typography.bodyStrong,
    color: familyHome.text,
  },
  cardDescription: {
    ...typography.caption,
    color: familyHome.muted,
    lineHeight: 18,
  },
  empty: {
    ...typography.body,
    color: familyHome.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  pressed: {
    opacity: 0.92,
  },
});
