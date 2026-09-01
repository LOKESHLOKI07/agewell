import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { useGroceryCatalog } from './useCatalog';
import { MembershipServiceHero } from './MembershipServiceHero';
import { useMembershipSubmit } from './useMembershipSubmit';

export function GroceryDeliveryScreen() {
  const insets = useSafeAreaInsets();
  const catalog = useGroceryCatalog(false);
  const categories = catalog.data?.categories ?? [];
  const allProducts = catalog.data?.products ?? [];

  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [listNote, setListNote] = useState<string | null>(null);
  const { submitting, submit } = useMembershipSubmit('grocery');

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const cartCount = Object.values(cart).reduce((sum, n) => sum + n, 0);

  const products = useMemo(() => {
    const term = query.trim().toLowerCase();
    return allProducts.filter((item) => {
      const inCategory = !categoryId || item.categoryId === categoryId;
      if (!inCategory) {
        return false;
      }
      if (!term) {
        return true;
      }
      return item.name.toLowerCase().includes(term);
    });
  }, [allProducts, categoryId, query]);

  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const onUploadList = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to upload a shopping list.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setListNote(result.assets[0].fileName ?? 'Handwritten list photo');
      Alert.alert(
        'List uploaded',
        'Your photo/note is attached. Place a next-day order from the cart when ready.',
      );
    }
  };

  const onPlaceOrder = () => {
    if (cartCount === 0 && !listNote) {
      Alert.alert('Cart empty', 'Add items or upload a list/photo first.');
      return;
    }
    const lines = allProducts
      .filter((item) => cart[item.id])
      .map((item) => `${item.name} x${cart[item.id]} (${item.priceLabel})`);
    const notes = [
      'Next-day grocery order',
      lines.length ? `Items: ${lines.join('; ')}` : null,
      listNote ? `Uploaded list/photo: ${listNote}` : null,
    ]
      .filter(Boolean)
      .join('. ');
    void submit(notes, 'Next-day order placed').then((ok) => {
      if (ok) {
        setCart({});
      }
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Grocery Delivery" showBack showProfile={false} showBell={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MembershipServiceHero slug="grocery" />
        <Text style={styles.hint}>Handpicked basics · usually order one day prior</Text>

        {catalog.isPending ? (
          <ActivityIndicator color={familyHome.green} style={{ marginTop: spacing.xl }} />
        ) : catalog.isError ? (
          <View style={styles.emptyBox}>
            <Text style={styles.empty}>Unable to load grocery catalog.</Text>
            <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
              <Text style={styles.retry}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.searchRow}>
              <View style={styles.searchWrap}>
                <Icon name="search-outline" size={18} color={familyHome.muted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search groceries"
                  placeholderTextColor={familyHome.muted}
                  style={styles.searchInput}
                  accessibilityLabel="Search groceries"
                />
              </View>
              <Pressable
                style={styles.cartBtn}
                onPress={onPlaceOrder}
                accessibilityRole="button"
                accessibilityLabel={`Cart with ${cartCount} items`}
              >
                <Icon name="cart-outline" size={20} color={familyHome.white} />
                {cartCount > 0 ? (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartCount}</Text>
                  </View>
                ) : null}
              </Pressable>
            </View>

            <Pressable
              style={styles.uploadCard}
              onPress={() => void onUploadList()}
              accessibilityRole="button"
              accessibilityLabel="Upload list or photo"
            >
              <View style={styles.uploadIcon}>
                <Icon name="camera-outline" size={22} color={familyHome.green} />
              </View>
              <View style={styles.uploadText}>
                <Text style={styles.uploadTitle}>Upload List / Photo</Text>
                <Text style={styles.uploadSub}>
                  {listNote ?? 'Handwritten note or vegetable list for extra items'}
                </Text>
              </View>
              <Icon name="chevron-forward" size={18} color={familyHome.muted} />
            </Pressable>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats}>
              {categories.map((cat) => {
                const active = cat.id === categoryId;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategoryId(cat.id)}
                    style={[styles.catChip, active ? styles.catChipActive : null]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={cat.name}
                  >
                    <Text style={[styles.catLabel, active ? styles.catLabelActive : null]}>{cat.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.list}>
              {products.map((item) => (
                <View key={item.id} style={styles.productRow}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.productImage} accessibilityLabel={`${item.name} image`} />
                  ) : (
                    <View style={styles.productIcon}>
                      <Icon name="cart-outline" size={18} color={familyHome.green} />
                    </View>
                  )}
                  <View style={styles.productBody}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productMeta}>
                      {item.unit} · {item.priceLabel}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.addBtn}
                    onPress={() => addToCart(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${item.name} to cart`}
                  >
                    <Text style={styles.addLabel}>{cart[item.id] ? `Add (${cart[item.id]})` : 'Add'}</Text>
                  </Pressable>
                </View>
              ))}
              {products.length === 0 ? (
                <Text style={styles.empty}>No items in this category yet.</Text>
              ) : null}
            </View>

            <Pressable
              style={[styles.primaryCta, submitting ? { opacity: 0.6 } : null]}
              onPress={onPlaceOrder}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel="Place next-day order"
            >
              <Text style={styles.primaryCtaText}>{submitting ? 'Sending…' : 'Place Next-Day Order'}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
  hint: { ...typography.caption, color: familyHome.muted },
  searchRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  searchWrap: {
    flex: 1,
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
  searchInput: { flex: 1, ...typography.body, color: familyHome.text, paddingVertical: spacing.sm },
  cartBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: familyHome.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: { ...typography.captionStrong, color: familyHome.white, fontSize: 10 },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.green,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: spacing.lg,
    backgroundColor: familyHome.greenSoft,
  },
  uploadIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: { flex: 1, gap: 2 },
  uploadTitle: { ...typography.bodyStrong, color: familyHome.text },
  uploadSub: { ...typography.caption, color: familyHome.muted },
  cats: { gap: spacing.sm, paddingVertical: spacing.xs },
  catChip: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: familyHome.white,
  },
  catChipActive: { backgroundColor: familyHome.green, borderColor: familyHome.green },
  catLabel: { ...typography.captionStrong, color: familyHome.text },
  catLabelActive: { color: familyHome.white },
  list: { gap: spacing.sm },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.md,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: familyHome.greenSoft,
  },
  productBody: { flex: 1, gap: 2 },
  productName: { ...typography.bodyStrong, color: familyHome.text },
  productMeta: { ...typography.caption, color: familyHome.muted },
  addBtn: {
    borderRadius: 10,
    backgroundColor: familyHome.greenSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  addLabel: { ...typography.captionStrong, color: familyHome.greenDark },
  empty: { ...typography.body, color: familyHome.muted, textAlign: 'center', marginTop: spacing.lg },
  emptyBox: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
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
