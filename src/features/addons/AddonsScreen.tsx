import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '@/components/KeyboardAwareScrollView';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { ADD_ON_SERVICES } from '@/features/services/addOnServiceCatalog';
import type { HomeServiceTile } from '@/features/services/serviceCatalog';
import { useTabScreenBottomPad } from '@/utils/safeBottom';

const GRID_COLUMNS = 3;

function chunkItems<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

/** View All add-ons — only the dedicated AgeWell add-on catalogue (not Single Membership). */
export function AddonsScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const [query, setQuery] = useState('');

  const addons = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return ADD_ON_SERVICES;
    }
    return ADD_ON_SERVICES.filter((item) => item.title.toLowerCase().includes(term));
  }, [query]);

  const rows = chunkItems(addons, GRID_COLUMNS);

  const openAddon = (item: HomeServiceTile) => {
    router.push(item.href);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Add-on Services" showBack showProfile={false} showBell={false} />
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Optional add-ons beyond Single Membership — book on request (extra cost).
        </Text>

        <View style={styles.searchWrap}>
          <Icon name="search-outline" size={18} color={familyHome.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search add-ons"
            placeholderTextColor={familyHome.muted}
            style={styles.searchInput}
            accessibilityLabel="Search add-ons"
          />
        </View>

        <View style={styles.grid}>
          {rows.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.gridRow}>
              {row.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => openAddon(item)}
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                  style={({ pressed }) => [
                    styles.gridCard,
                    { backgroundColor: item.background },
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: familyHome.white }]}>
                    <Icon name={item.icon} size={22} color={item.color} />
                  </View>
                  <Text style={styles.gridLabel} numberOfLines={3}>
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

        {addons.length === 0 ? (
          <Text style={styles.empty}>No add-ons match your search.</Text>
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  gridCardSpacer: {
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
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
