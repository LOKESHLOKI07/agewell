import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { MembershipServiceHero } from './MembershipServiceHero';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useServiceOfferings } from './useCatalog';

export function PoojaHelperScreen() {
  const insets = useSafeAreaInsets();
  const [cart, setCart] = useState<Record<string, number>>({});
  const cartCount = Object.values(cart).reduce((sum, n) => sum + n, 0);
  const { submitting, submit } = useMembershipSubmit('pooja');
  const catalog = useServiceOfferings('pooja');
  const packages = catalog.data ?? [];

  const onOrder = () => {
    if (cartCount === 0) {
      Alert.alert('Pooja cart empty', 'Add a package before ordering.');
      return;
    }
    const lines = packages
      .filter((item) => cart[item.id])
      .map((item) => `${item.title} x${cart[item.id]} (${item.priceLabel})`);
    void submit(`Pooja cart: ${lines.join('; ')}`, 'Pooja request submitted').then((ok) => {
      if (ok) setCart({});
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Pooja Helper" showBack showProfile={false} showBell={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MembershipServiceHero slug="pooja" />
        <View style={styles.topRow}>
          <View style={styles.cartPill}>
            <Icon name="cart-outline" size={16} color={familyHome.greenDark} />
            <Text style={styles.cartPillText}>Cart · {cartCount}</Text>
          </View>
        </View>
        <Text style={styles.hint}>One or two helpers assist at home. Support calls after order.</Text>

        {catalog.isPending ? <Text style={styles.hint}>Loading packages…</Text> : null}
        {catalog.isError ? (
          <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
            <Text style={styles.retry}>Unable to load · Tap to retry</Text>
          </Pressable>
        ) : null}

        <View style={styles.list}>
          {packages.map((item) => (
            <View key={item.id} style={styles.card}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.image} accessibilityLabel={`${item.title} image`} />
              ) : (
                <View style={styles.iconWell}>
                  <Icon name="sparkles" size={22} color={familyHome.purple} />
                </View>
              )}
              <Text style={styles.name}>{item.title}</Text>
              <Text style={styles.desc}>{item.description}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>{item.badge || 'Helpers'}</Text>
                <Text style={styles.price}>{item.priceLabel || '—'}</Text>
              </View>
              <Pressable
                style={styles.addBtn}
                onPress={() => setCart((prev) => ({ ...prev, [item.id]: (prev[item.id] ?? 0) + 1 }))}
                accessibilityRole="button"
                accessibilityLabel={`Add ${item.title} to pooja cart`}
              >
                <Text style={styles.addLabel}>
                  {cart[item.id] ? `Added (${cart[item.id]})` : 'Add to Pooja Cart'}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>

        <Pressable
          style={[styles.primaryCta, submitting ? { opacity: 0.6 } : null]}
          onPress={onOrder}
          disabled={submitting}
          accessibilityRole="button"
        >
          <Text style={styles.primaryCtaText}>
            {submitting ? 'Sending…' : 'Order · Customer Support will call'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  cartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cartPillText: { ...typography.captionStrong, color: familyHome.greenDark },
  hint: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  retry: { ...typography.captionStrong, color: familyHome.green },
  list: { gap: spacing.md },
  card: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  image: { width: '100%', height: 140, borderRadius: 12, backgroundColor: familyHome.border },
  iconWell: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: familyHome.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { ...typography.subtitle, color: familyHome.text },
  desc: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { ...typography.caption, color: familyHome.text },
  price: { ...typography.bodyStrong, color: familyHome.greenDark },
  addBtn: {
    marginTop: spacing.xs,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addLabel: { ...typography.captionStrong, color: familyHome.greenDark },
  primaryCta: {
    marginTop: spacing.md,
    backgroundColor: familyHome.green,
    borderRadius: 14,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  primaryCtaText: { ...typography.bodyStrong, color: familyHome.white },
});
