import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingState, PrimaryButton, SecondaryButton } from '@/components';
import type { IconName } from '@/components/ui';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { useServiceRequests } from '@/features/home/hooks/queries';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { useTabScreenBottomPad } from '@/utils/safeBottom';
import type { ServiceOffering } from './catalogTypes';
import { parseOfferingMeta } from './catalogTypes';
import { MEMBERSHIP_SERVICE_AREA_LINE } from './membershipServicePageVariant';
import { membershipPurchaseHref } from './planCatalog';
import { SERVICE_HERO_IMAGES } from './serviceHeroes';
import { filterRequestsBySlug, toLiveRequestViews } from './liveServiceRequests';
import { useMembershipServicePageVariant } from './useMembershipServicePageVariant';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useServiceOfferings } from './useCatalog';

const heroImage = SERVICE_HERO_IMAGES.pooja;

const SLUG = 'pooja';
const LEAD =
  'Choose from various pooja options on the app, with 1–2 helpers provided to assist you at home. (Extra charges apply)';
const LIVE_SUBTITLE = 'Spiritual care, with complete support.';
const LIVE_PROMO =
  'Pooja at your home, made simple. We take care of everything — materials, arrangements and 1–2 companions to assist with setup.';

const GATE_FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'sparkles',
    title: 'Various Pooja Options',
    body: 'Choose from different pooja services on the app',
  },
  {
    icon: 'people-outline',
    title: '1–2 Helpers at Home',
    body: 'Trained helpers to assist you',
  },
  {
    icon: 'clipboard-outline',
    title: 'Hassle-Free Arrangements',
    body: 'We coordinate the details',
  },
  {
    icon: 'home-outline',
    title: 'A More Peaceful Experience',
    body: 'Perform rituals comfortably at home',
  },
];

const WHAT_INCLUDED = [
  'Complete pooja arrangement',
  'All pooja material',
  'Guruji dakshina',
  'Food for Guruji',
  '1–2 companions',
];

const PLEASE_NOTE = [
  'Prices may vary by location and package',
  'Companion will call to confirm details',
  'Special / custom requests supported',
];

type CategoryTab = 'all' | 'festival' | 'special' | 'regular';

const CATEGORY_TABS: { key: CategoryTab; label: string }[] = [
  { key: 'all', label: 'All Pooja Services' },
  { key: 'festival', label: 'Festival Pooja' },
  { key: 'special', label: 'Special Pooja' },
  { key: 'regular', label: 'Regular Pooja' },
];

const CARD_SOFTS = [
  familyHome.purpleSoft,
  familyHome.orangeSoft,
  familyHome.blueSoft,
  familyHome.greenSoft,
  familyHome.yellowSoft,
];

function parsePrice(label: string): number {
  const n = Number(String(label).replace(/[₹,\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function isQuoteOffering(item: ServiceOffering): boolean {
  const meta = parseOfferingMeta(item.metaJson);
  if (meta.quote === 'true') return true;
  const price = item.priceLabel?.trim() ?? '';
  if (!price || /^quote$/i.test(price)) return true;
  if (/custom/i.test(item.title)) return true;
  return false;
}

function offeringCategory(item: ServiceOffering): CategoryTab | null {
  const cat = parseOfferingMeta(item.metaJson).category?.toLowerCase();
  if (cat === 'festival' || cat === 'special' || cat === 'regular') return cat;
  return null;
}

export function PoojaHelperScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(true);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Home Pooja Assistance" showBack showProfile={false} showBell />

      {variant === 'serviceable_with_membership' ? (
        <MemberLiveBody />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.gateContent, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {variant === 'loading' ? <LoadingState message="Loading House Pooja Assistance..." /> : null}
          {variant === 'non_serviceable' ? <OutsideAreaBody /> : null}
          {variant === 'serviceable_no_membership' ? <NoMembershipBody /> : null}
        </ScrollView>
      )}
    </View>
  );
}

function TitleBlock() {
  return (
    <View style={styles.titleRow}>
      <View style={styles.titleIcon}>
        <Icon name="sparkles" size={22} color={familyHome.greenDark} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.title}>HOUSE POOJA ASSISTANCE</Text>
        <Text style={styles.lead}>{LEAD}</Text>
      </View>
    </View>
  );
}

function GateHero({ tone }: { tone: 'outside' | 'membership' }) {
  const headline = tone === 'outside' ? 'Spiritual' : 'Divine Moments';
  const accent = tone === 'outside' ? 'Support at Home' : 'at Home';
  const body =
    tone === 'outside'
      ? 'We help you perform poojas and religious rituals at home with ease and devotion.'
      : 'Experience peace of mind with guided spiritual support at home.';

  return (
    <View style={styles.heroFull} accessibilityLabel="House pooja assistance">
      <Image source={heroImage} style={styles.heroFullImage} resizeMode="cover" />
      <View style={styles.heroScrim} />
      <View style={styles.heroFullContent}>
        <View style={styles.heroFullCopy}>
          <Text style={styles.heroFullHeadline}>
            {headline}
            {'\n'}
            <Text style={styles.heroFullAccent}>{accent}</Text>
          </Text>
          <Text style={styles.heroFullBody}>{body}</Text>
        </View>
      </View>
    </View>
  );
}

function FeaturesGrid() {
  return (
    <View style={styles.featuresCard}>
      {GATE_FEATURES.map((item) => (
        <View key={item.title} style={styles.featureCol}>
          <View style={styles.featureIcon}>
            <Icon name={item.icon} size={16} color={familyHome.green} />
          </View>
          <Text style={styles.featureTitle}>{item.title}</Text>
          <Text style={styles.featureBody}>{item.body}</Text>
        </View>
      ))}
    </View>
  );
}

function OutsideAreaBody() {
  const { submitting, submit } = useMembershipSubmit(SLUG);

  const onNotify = () => {
    void submit(
      'Notify me when House Pooja Assistance is available in my area.',
      'We will notify you',
    );
  };

  return (
    <View style={styles.stack}>
      <TitleBlock />
      <GateHero tone="outside" />
      <FeaturesGrid />
      <View style={styles.soonBanner}>
        <View style={styles.soonIcon}>
          <Icon name="location" size={18} color={familyHome.red} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.soonTitle}>Service coming soon to your area</Text>
          <Text style={styles.soonBody}>
            {MEMBERSHIP_SERVICE_AREA_LINE} House Pooja Assistance will become available in your area as we
            expand our services.
          </Text>
        </View>
      </View>
      <View style={styles.notifyCard}>
        <View style={styles.notifyLeft}>
          <View style={styles.notifyIcon}>
            <Icon name="notifications-outline" size={16} color={familyHome.white} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.helpTitle}>Get Notified</Text>
            <Text style={styles.helpBody}>
              We’ll notify you as soon as this service is available in your area.
            </Text>
          </View>
        </View>
        <Pressable
          onPress={onNotify}
          disabled={submitting}
          style={[styles.notifyBtn, submitting ? styles.disabled : null]}
          accessibilityRole="button"
          accessibilityLabel="Notify Me"
        >
          <Text style={styles.notifyBtnText}>{submitting ? 'Saving…' : 'Notify Me'}</Text>
        </Pressable>
      </View>
      <Pressable
        onPress={() => router.push('/account/help' as Href)}
        style={({ pressed }) => [styles.helpBannerGreen, pressed ? styles.pressed : null]}
        accessibilityRole="button"
      >
        <View style={styles.helpIconGreen}>
          <Icon name="help-circle-outline" size={16} color={familyHome.white} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.helpTitleGreen}>Have Questions?</Text>
          <Text style={styles.helpBodyGreen}>Our team is here to help. Reach out to us anytime.</Text>
        </View>
        <Icon name="chevron-forward" size={16} color={familyHome.greenDark} />
      </Pressable>
    </View>
  );
}

function NoMembershipBody() {
  return (
    <View style={styles.stack}>
      <TitleBlock />
      <GateHero tone="membership" />
      <FeaturesGrid />
      <View style={styles.membershipCard}>
        <View style={styles.membershipHead}>
          <View style={styles.lockWell}>
            <Icon name="lock-closed-outline" size={16} color="#B45309" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.membershipTitle}>Membership Required</Text>
            <Text style={styles.membershipBody}>
              House Pooja Assistance is available only for AgeWell members.
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push(membershipPurchaseHref())}
          style={({ pressed }) => [styles.joinPromo, pressed ? styles.pressed : null]}
          accessibilityRole="button"
        >
          <View style={styles.flex}>
            <Text style={styles.joinPromoTitle}>Join AgeWell Membership</Text>
            <Text style={styles.joinPromoBody}>
              Get access to House Pooja Assistance and many other services for a safer, healthier and happier
              life.
            </Text>
          </View>
          <Icon name="chevron-forward" size={16} color="#B45309" />
        </Pressable>
        <PrimaryButton label="Join Membership  →" onPress={() => router.push(membershipPurchaseHref())} />
        <SecondaryButton
          label="View Membership Plans"
          onPress={() => router.push(membershipPurchaseHref())}
        />
      </View>
      <Pressable
        onPress={() => router.push('/account/help' as Href)}
        style={({ pressed }) => [styles.helpBanner, pressed ? styles.pressed : null]}
        accessibilityRole="button"
      >
        <View style={styles.contactIcon}>
          <Icon name="help-circle-outline" size={16} color={familyHome.white} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.helpTitle}>Have Questions?</Text>
          <Text style={styles.helpBody}>Our team is here to help. Reach out to us anytime.</Text>
        </View>
        <Icon name="chevron-forward" size={16} color={familyHome.blue} />
      </Pressable>
    </View>
  );
}

function MemberLiveBody() {
  const catalog = useServiceOfferings(SLUG);
  const requestsQuery = useServiceRequests();
  const { submitting, submit } = useMembershipSubmit(SLUG);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [category, setCategory] = useState<CategoryTab>('all');

  const offerings = catalog.data ?? [];

  const filtered = useMemo(() => {
    if (category === 'all') return offerings;
    return offerings.filter((item) => offeringCategory(item) === category);
  }, [category, offerings]);

  const cartLines = useMemo(
    () => offerings.filter((item) => (cart[item.id] ?? 0) > 0),
    [cart, offerings],
  );

  const cartCount = useMemo(
    () => Object.values(cart).reduce((sum, n) => sum + n, 0),
    [cart],
  );

  const totalAmount = useMemo(() => {
    return cartLines.reduce((sum, item) => {
      const qty = cart[item.id] ?? 0;
      return sum + parsePrice(item.priceLabel) * qty;
    }, 0);
  }, [cart, cartLines]);

  const onMyBookings = () => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    const lines = toLiveRequestViews(mine, { fallbackTitle: 'Pooja booking', limit: 20 })
      .map((item) => `• ${item.title} — ${item.statusLabel} (${item.dateLabel})`)
      .join('\n');
    Alert.alert('My Bookings', lines || 'No bookings yet.');
  };

  const onViewCart = () => {
    const lines = cartLines
      .map((item) => `• ${item.title} ×${cart[item.id]} (${item.priceLabel || '—'})`)
      .join('\n');
    Alert.alert(`Your Cart (${cartCount} items)`, lines || 'Cart is empty.');
  };

  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const setQty = (id: string, next: number) => {
    setCart((prev) => {
      const copy = { ...prev };
      if (next <= 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  };

  const onRequestQuote = (item: ServiceOffering) => {
    void submit(
      `Quote request: ${item.title}. ${item.description || ''}`.trim(),
      'Quote request submitted',
    );
  };

  const onCheckout = () => {
    if (cartCount === 0) {
      Alert.alert('Pooja cart empty', 'Add a package before checking out.');
      return;
    }
    const lines = cartLines.map((item) => `${item.title} x${cart[item.id]} (${item.priceLabel})`);
    void submit(`Pooja cart: ${lines.join('; ')}`, 'Pooja request submitted').then((ok) => {
      if (ok) setCart({});
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.liveContent} showsVerticalScrollIndicator={false}>
      <View style={styles.liveTitleRow}>
        <View style={styles.liveTitleIcon}>
          <Icon name="sparkles" size={22} color={familyHome.white} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.liveTitle}>Home Pooja Assistance</Text>
          <Text style={styles.subtitle}>{LIVE_SUBTITLE}</Text>
        </View>
        <View style={styles.headerActions}>
          {cartCount > 0 ? (
            <Pressable
              onPress={onViewCart}
              style={styles.cartPill}
              accessibilityRole="button"
              accessibilityLabel={`Cart ${cartCount} items`}
            >
              <Icon name="cart-outline" size={14} color={familyHome.greenDark} />
              <Text style={styles.cartPillText}>{cartCount}</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onMyBookings}
            style={styles.viewRequestsBtn}
            accessibilityRole="button"
            accessibilityLabel="My Bookings"
          >
            <Icon name="calendar-outline" size={14} color={familyHome.green} />
            <Text style={styles.viewRequestsText}>My{'\n'}Bookings</Text>
            <Icon name="chevron-forward" size={14} color={familyHome.green} />
          </Pressable>
        </View>
      </View>

      <View style={styles.promoBanner}>
        <View style={styles.promoIcon}>
          <Icon name="sparkles" size={18} color={familyHome.purple} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.promoBody}>{LIVE_PROMO}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {CATEGORY_TABS.map((tab) => {
          const active = tab.key === category;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setCategory(tab.key)}
              style={[styles.tabChip, active ? styles.tabChipActive : null]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tab.label}
            >
              <Text style={[styles.tabChipText, active ? styles.tabChipTextActive : null]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {catalog.isPending ? <Text style={styles.empty}>Loading pooja services…</Text> : null}
      {catalog.isError ? (
        <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
          <Text style={styles.viewAll}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}

      <View style={styles.offerGrid}>
        {filtered.map((item, index) => {
          const quote = isQuoteOffering(item);
          const soft = CARD_SOFTS[index % CARD_SOFTS.length];
          return (
            <View key={item.id} style={styles.offerCard}>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.offerImage}
                  accessibilityLabel={`${item.title} image`}
                />
              ) : (
                <View style={[styles.offerPlaceholder, { backgroundColor: soft }]}>
                  <Icon name="sparkles" size={28} color={familyHome.purple} />
                </View>
              )}
              <Text style={styles.offerTitle} numberOfLines={2}>
                {item.title}
              </Text>
              {item.description ? (
                <Text style={styles.offerDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <Text style={styles.offerPrice}>
                {quote ? item.priceLabel?.trim() || 'Quote' : item.priceLabel || '—'}
              </Text>
              {quote ? (
                <Pressable
                  onPress={() => onRequestQuote(item)}
                  disabled={submitting}
                  style={[styles.quoteBtn, submitting ? styles.disabled : null]}
                  accessibilityRole="button"
                  accessibilityLabel={`Request quote for ${item.title}`}
                >
                  <Text style={styles.quoteBtnText}>Request Quote</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => addToCart(item.id)}
                  style={[styles.addBtn, (cart[item.id] ?? 0) > 0 ? styles.addBtnAdded : null]}
                  accessibilityRole="button"
                  accessibilityLabel={
                    (cart[item.id] ?? 0) > 0
                      ? `${item.title} in cart, quantity ${cart[item.id]}`
                      : `Add ${item.title} to cart`
                  }
                >
                  <Icon
                    name="cart-outline"
                    size={14}
                    color={(cart[item.id] ?? 0) > 0 ? familyHome.greenDark : familyHome.white}
                  />
                  <Text
                    style={[
                      styles.addBtnText,
                      (cart[item.id] ?? 0) > 0 ? styles.addBtnTextAdded : null,
                    ]}
                  >
                    {(cart[item.id] ?? 0) > 0 ? `Added (${cart[item.id]})` : 'Add to Cart'}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>

      {!catalog.isPending && filtered.length === 0 ? (
        <Text style={styles.empty}>No pooja services in this category yet.</Text>
      ) : null}

      {cartCount > 0 ? (
        <View style={styles.cartSection}>
          <View style={styles.cartHead}>
            <Text style={styles.sectionTitle}>Your Cart ({cartCount} items)</Text>
            <Pressable onPress={onViewCart} accessibilityRole="button">
              <Text style={styles.viewAll}>View Cart</Text>
            </Pressable>
          </View>

          {cartLines.map((item) => {
            const qty = cart[item.id] ?? 0;
            return (
              <View key={item.id} style={styles.cartLine}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.cartThumb} />
                ) : (
                  <View style={[styles.cartThumb, styles.cartThumbPlaceholder]}>
                    <Icon name="sparkles" size={16} color={familyHome.purple} />
                  </View>
                )}
                <View style={styles.flex}>
                  <Text style={styles.cartLineTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cartLinePrice}>{item.priceLabel || '—'}</Text>
                </View>
                <View style={styles.qtyRow}>
                  <Pressable
                    onPress={() => setQty(item.id, qty - 1)}
                    style={styles.qtyBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Decrease ${item.title}`}
                  >
                    <Text style={styles.qtyBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.qtyValue}>{qty}</Text>
                  <Pressable
                    onPress={() => setQty(item.id, qty + 1)}
                    style={styles.qtyBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Increase ${item.title}`}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => setQty(item.id, 0)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.title}`}
                >
                  <Icon name="trash-outline" size={18} color={familyHome.red} />
                </Pressable>
              </View>
            );
          })}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatRupees(totalAmount)}</Text>
          </View>

          <Pressable
            style={[styles.checkoutBtn, submitting ? styles.disabled : null]}
            onPress={onCheckout}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Proceed to Checkout"
          >
            <Text style={styles.checkoutBtnText}>
              {submitting ? 'Sending…' : 'Proceed to Checkout'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>What’s Included</Text>
        {WHAT_INCLUDED.map((line) => (
          <View key={line} style={styles.infoRow}>
            <Icon name="checkmark-circle-outline" size={16} color={familyHome.green} />
            <Text style={styles.infoText}>{line}</Text>
          </View>
        ))}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Please Note</Text>
        {PLEASE_NOTE.map((line) => (
          <View key={line} style={styles.infoRow}>
            <Icon name="help-circle-outline" size={16} color={familyHome.blue} />
            <Text style={styles.infoText}>{line}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  flex: { flex: 1 },
  stack: { gap: spacing.md },
  gateContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  titleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.title, color: familyHome.text },
  liveTitle: { ...typography.title, color: familyHome.text, fontSize: 22 },
  lead: { ...typography.body, color: familyHome.muted, lineHeight: 22, marginTop: 4 },
  subtitle: { ...typography.body, color: familyHome.muted },
  heroFull: {
    height: 188,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: familyHome.border,
    position: 'relative',
  },
  heroFullImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  heroFullContent: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: spacing.lg,
    gap: spacing.md,
  },
  heroFullCopy: { flex: 1, gap: 6, paddingBottom: 2 },
  heroFullHeadline: {
    ...typography.subtitle,
    color: familyHome.text,
    lineHeight: 28,
    fontSize: 22,
  },
  heroFullAccent: { color: familyHome.greenDark },
  heroFullBody: {
    ...typography.caption,
    color: familyHome.text,
    lineHeight: 18,
    maxWidth: 260,
  },
  featuresCard: {
    flexDirection: 'row',
    backgroundColor: '#EAF6F4',
    borderRadius: 18,
    paddingVertical: spacing.md,
    paddingHorizontal: 2,
  },
  featureCol: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: 2 },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    ...typography.captionStrong,
    color: familyHome.text,
    textAlign: 'center',
    fontSize: 9,
    lineHeight: 12,
  },
  featureBody: {
    ...typography.caption,
    color: familyHome.muted,
    textAlign: 'center',
    fontSize: 8,
    lineHeight: 11,
  },
  soonBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.redSoft,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#F5C2C4',
    alignItems: 'flex-start',
  },
  soonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soonTitle: { ...typography.bodyStrong, color: familyHome.red },
  soonBody: { ...typography.caption, color: familyHome.text, marginTop: 4, lineHeight: 18 },
  notifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  notifyLeft: { flex: 1, flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  notifyIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: familyHome.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyBtn: {
    borderWidth: 1,
    borderColor: familyHome.blue,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: familyHome.white,
  },
  notifyBtnText: { ...typography.captionStrong, color: familyHome.blue },
  helpTitle: { ...typography.bodyStrong, color: familyHome.text },
  helpBody: { ...typography.caption, color: familyHome.muted, marginTop: 2, lineHeight: 18 },
  helpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  helpBannerGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  helpIconGreen: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpTitleGreen: { ...typography.bodyStrong, color: familyHome.greenDark },
  helpBodyGreen: { ...typography.caption, color: familyHome.greenDark, marginTop: 2, lineHeight: 18 },
  contactIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: familyHome.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  membershipCard: {
    backgroundColor: familyHome.yellowSoft,
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.md,
  },
  membershipHead: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  lockWell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  membershipTitle: { ...typography.bodyStrong, color: familyHome.text },
  membershipBody: { ...typography.caption, color: familyHome.muted, marginTop: 2, lineHeight: 18 },
  joinPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: spacing.lg,
  },
  joinPromoTitle: { ...typography.bodyStrong, color: familyHome.text },
  joinPromoBody: { ...typography.caption, color: familyHome.muted, marginTop: 4, lineHeight: 18 },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.6 },
  liveContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
    paddingTop: spacing.sm,
  },
  liveTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: familyHome.green,
  },
  cartPillText: { ...typography.captionStrong, color: familyHome.greenDark },
  liveTitleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: familyHome.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewRequestsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: familyHome.green,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    maxWidth: 108,
  },
  viewRequestsText: {
    ...typography.captionStrong,
    color: familyHome.green,
    fontSize: 10,
    lineHeight: 13,
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: familyHome.purpleSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  promoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoBody: { ...typography.caption, color: familyHome.text, lineHeight: 18 },
  tabsRow: { gap: spacing.sm, paddingVertical: 2 },
  tabChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: familyHome.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: familyHome.white,
  },
  tabChipActive: {
    backgroundColor: familyHome.purple,
    borderColor: familyHome.purple,
  },
  tabChipText: { ...typography.captionStrong, color: familyHome.text, fontSize: 12 },
  tabChipTextActive: { color: familyHome.white },
  sectionTitle: { ...typography.subtitle, color: familyHome.text },
  viewAll: { ...typography.captionStrong, color: familyHome.blue },
  empty: { ...typography.caption, color: familyHome.muted },
  offerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  offerCard: {
    width: '47.5%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: familyHome.border,
    padding: spacing.sm,
    gap: 6,
    backgroundColor: familyHome.white,
  },
  offerImage: {
    width: '100%',
    height: 96,
    borderRadius: 12,
    backgroundColor: familyHome.border,
  },
  offerPlaceholder: {
    width: '100%',
    height: 96,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerTitle: { ...typography.captionStrong, color: familyHome.text, fontSize: 13, lineHeight: 16 },
  offerDesc: { ...typography.caption, color: familyHome.muted, fontSize: 11, lineHeight: 15 },
  offerPrice: { ...typography.bodyStrong, color: familyHome.greenDark, fontSize: 14 },
  addBtn: {
    marginTop: 2,
    minHeight: 36,
    borderRadius: 10,
    backgroundColor: familyHome.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addBtnAdded: {
    backgroundColor: familyHome.greenSoft,
    borderWidth: 1,
    borderColor: familyHome.green,
  },
  addBtnText: { ...typography.captionStrong, color: familyHome.white },
  addBtnTextAdded: { color: familyHome.greenDark },
  quoteBtn: {
    marginTop: 2,
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: familyHome.purple,
    backgroundColor: familyHome.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteBtnText: { ...typography.captionStrong, color: familyHome.purpleDark },
  cartSection: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: familyHome.border,
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: familyHome.white,
  },
  cartHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cartThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: familyHome.border,
  },
  cartThumbPlaceholder: {
    backgroundColor: familyHome.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartLineTitle: { ...typography.bodyStrong, color: familyHome.text, fontSize: 13 },
  cartLinePrice: { ...typography.caption, color: familyHome.muted, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: familyHome.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: familyHome.white,
  },
  qtyBtnText: { ...typography.bodyStrong, color: familyHome.text, fontSize: 16, lineHeight: 18 },
  qtyValue: { ...typography.bodyStrong, color: familyHome.text, minWidth: 16, textAlign: 'center' },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: familyHome.border,
  },
  totalLabel: { ...typography.bodyStrong, color: familyHome.text },
  totalValue: { ...typography.subtitle, color: familyHome.greenDark },
  checkoutBtn: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: { ...typography.bodyStrong, color: familyHome.white },
  infoCard: {
    borderRadius: 16,
    backgroundColor: familyHome.blueSoft,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  infoTitle: { ...typography.subtitle, color: familyHome.text, marginBottom: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  infoText: { ...typography.caption, color: familyHome.text, flex: 1, lineHeight: 18 },
});
