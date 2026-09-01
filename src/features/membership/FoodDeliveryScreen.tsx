import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import type { FoodCuisine } from './catalogTypes';
import { MembershipServiceHero } from './MembershipServiceHero';
import { useFoodCatalog } from './useCatalog';
import { useMembershipSubmit } from './useMembershipSubmit';

export function FoodDeliveryScreen() {
  const insets = useSafeAreaInsets();
  const catalog = useFoodCatalog(false);
  const cuisines = catalog.data?.cuisines ?? [];
  const allItems = catalog.data?.items ?? [];

  const [cuisine, setCuisine] = useState<FoodCuisine | null>(null);
  const [meal, setMeal] = useState<'Breakfast' | 'Lunch' | 'Dinner'>('Lunch');
  const [cart, setCart] = useState<Record<string, number>>({});
  const { submitting, submit } = useMembershipSubmit('food');

  const cartCount = Object.values(cart).reduce((sum, n) => sum + n, 0);
  const menu = useMemo(() => {
    if (!cuisine) {
      return [];
    }
    return allItems.filter((item) => item.cuisineId === cuisine.id && item.meal === meal);
  }, [allItems, cuisine, meal]);

  const onOrder = () => {
    if (cartCount === 0) {
      Alert.alert('Cart empty', 'Add meals before placing a next-day order.');
      return;
    }
    const lines = allItems
      .filter((item) => cart[item.id])
      .map((item) => `${item.name} (${item.meal}) x${cart[item.id]}`);
    void submit(
      `Next-day food order · ${cuisine?.name ?? 'Cuisine'}: ${lines.join('; ')}`,
      'Next-day food order placed',
    ).then((ok) => {
      if (ok) {
        setCart({});
      }
    });
  };

  if (catalog.isPending) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <AgeWellHeader title="Food Delivery" showBack showProfile={false} showBell={false} />
        <ActivityIndicator color={familyHome.green} style={{ marginTop: spacing.xxl }} />
      </View>
    );
  }

  if (catalog.isError) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <AgeWellHeader title="Food Delivery" showBack showProfile={false} showBell={false} />
        <View style={styles.emptyBox}>
          <Text style={styles.empty}>Unable to load food catalog.</Text>
          <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
            <Text style={styles.retry}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!cuisine) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <AgeWellHeader title="Food Delivery" showBack showProfile={false} showBell={false} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <MembershipServiceHero slug="food" />
          <Text style={styles.lead}>Choose a cuisine</Text>
          <Text style={styles.hint}>Next-day order · menus managed by AgeWell</Text>
          {cuisines.map((item) => (
            <Pressable
              key={item.id}
              style={styles.cuisineCard}
              onPress={() => setCuisine(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}. View menu and order`}
            >
              <View style={styles.cuisineIcon}>
                <Icon name="restaurant-outline" size={22} color={familyHome.orange} />
              </View>
              <View style={styles.cuisineBody}>
                <Text style={styles.cuisineName}>{item.name}</Text>
                <Text style={styles.cuisineDesc}>{item.description}</Text>
              </View>
              <Text style={styles.viewMenu}>View Menu & Order</Text>
            </Pressable>
          ))}
          {cuisines.length === 0 ? (
            <Text style={styles.empty}>No cuisines available yet.</Text>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title={cuisine.name} showBack showProfile={false} showBell={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MembershipServiceHero slug="food" />
        <Pressable onPress={() => setCuisine(null)} accessibilityRole="button">
          <Text style={styles.backCuisines}>← All cuisines</Text>
        </Pressable>

        <View style={styles.mealTabs}>
          {(['Breakfast', 'Lunch', 'Dinner'] as const).map((slot) => {
            const active = slot === meal;
            return (
              <Pressable
                key={slot}
                onPress={() => setMeal(slot)}
                style={[styles.mealTab, active ? styles.mealTabActive : null]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.mealTabLabel, active ? styles.mealTabLabelActive : null]}>
                  {slot}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.list}>
          {menu.map((item) => (
            <View key={item.id} style={styles.menuRow}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.menuImage} accessibilityLabel={`${item.name} image`} />
              ) : null}
              <View style={styles.menuBody}>
                <Text style={styles.menuName}>{item.name}</Text>
                <Text style={styles.menuMeta}>{item.priceLabel}</Text>
              </View>
              <Pressable
                style={styles.addBtn}
                onPress={() => setCart((prev) => ({ ...prev, [item.id]: (prev[item.id] ?? 0) + 1 }))}
                accessibilityRole="button"
                accessibilityLabel={`Add ${item.name}`}
              >
                <Text style={styles.addLabel}>{cart[item.id] ? `Add (${cart[item.id]})` : 'Add'}</Text>
              </Pressable>
            </View>
          ))}
          {menu.length === 0 ? <Text style={styles.empty}>No items for this meal yet.</Text> : null}
        </View>

        <Pressable
          style={[styles.primaryCta, submitting ? { opacity: 0.6 } : null]}
          onPress={onOrder}
          disabled={submitting}
          accessibilityRole="button"
        >
          <Text style={styles.primaryCtaText}>
            {submitting ? 'Sending…' : `Place Next-Day Order${cartCount ? ` · ${cartCount}` : ''}`}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
  lead: { ...typography.title, color: familyHome.text },
  hint: { ...typography.caption, color: familyHome.muted, marginBottom: spacing.sm },
  cuisineCard: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: familyHome.white,
  },
  cuisineIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: familyHome.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuisineBody: { gap: 4 },
  cuisineName: { ...typography.subtitle, color: familyHome.text },
  cuisineDesc: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  viewMenu: { ...typography.bodyStrong, color: familyHome.green, marginTop: spacing.xs },
  backCuisines: { ...typography.bodyStrong, color: familyHome.green },
  mealTabs: { flexDirection: 'row', gap: spacing.sm },
  mealTab: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: familyHome.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTabActive: { backgroundColor: familyHome.green, borderColor: familyHome.green },
  mealTabLabel: { ...typography.captionStrong, color: familyHome.text },
  mealTabLabelActive: { color: familyHome.white },
  list: { gap: spacing.sm },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.lg,
  },
  menuImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: familyHome.orangeSoft,
  },
  menuBody: { flex: 1, gap: 2 },
  menuName: { ...typography.bodyStrong, color: familyHome.text },
  menuMeta: { ...typography.caption, color: familyHome.muted },
  addBtn: {
    borderRadius: 10,
    backgroundColor: familyHome.greenSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addLabel: { ...typography.captionStrong, color: familyHome.greenDark },
  empty: { ...typography.body, color: familyHome.muted, textAlign: 'center', marginTop: spacing.lg },
  emptyBox: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xxl },
  retry: { ...typography.bodyStrong, color: familyHome.green },
  primaryCta: {
    marginTop: spacing.md,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: { ...typography.bodyStrong, color: familyHome.white },
});
