import { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '@/components/KeyboardAwareScrollView';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { useHasActiveMembership } from '@/features/membership/useHasActiveMembership';
import { useTabScreenBottomPad } from '@/utils/safeBottom';
import { MarketplaceServiceIcon } from './components/MarketplaceServiceIcon';
import { allMarketplaceServices, type MarketplaceService } from './serviceCatalog';

const GRID_COLUMNS = 3;

function chunkItems<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

export function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const { hasMembership } = useHasActiveMembership();
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

  const rows = chunkItems(services, GRID_COLUMNS);

  const openService = (service: MarketplaceService) => {
    router.push(service.href);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Our Services" showBack={false} showProfile showBell={false} />
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {!hasMembership ? (
          <Text style={styles.subtitle}>
            Browse freely; membership is required to use a service.
          </Text>
        ) : null}

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

        <View style={styles.grid}>
          {rows.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.gridRow}>
              {row.map((service) => (
                <Pressable
                  key={service.id}
                  onPress={() => openService(service)}
                  accessibilityRole="button"
                  accessibilityLabel={`${service.title}. ${service.description}`}
                  style={({ pressed }) => [
                    styles.gridCard,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <MarketplaceServiceIcon
                    serviceId={service.id}
                    fallbackIcon={service.icon}
                    fallbackColor={service.color}
                    size={44}
                  />
                  <Text style={styles.gridLabel} numberOfLines={3}>
                    {service.title}
                  </Text>
                </Pressable>
              ))}
              {/* Keep last row aligned when it has fewer than GRID_COLUMNS items */}
              {row.length < GRID_COLUMNS
                ? Array.from({ length: GRID_COLUMNS - row.length }).map((_, index) => (
                    <View key={`pad-${rowIndex}-${index}`} style={styles.gridCardSpacer} />
                  ))
                : null}
            </View>
          ))}
        </View>

        {services.length === 0 ? (
          <Text style={styles.empty}>No services match your search.</Text>
        ) : null}
      </KeyboardAwareScrollView>
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
  grid: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gridCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: familyHome.border,
    backgroundColor: familyHome.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  gridCardSpacer: {
    flex: 1,
  },
  gridLabel: {
    ...typography.captionStrong,
    color: familyHome.text,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
  },
  empty: {
    ...typography.body,
    color: familyHome.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  pressed: {
    opacity: 0.9,
  },
});
