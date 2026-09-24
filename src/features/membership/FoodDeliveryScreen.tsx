import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingState, PrimaryButton, SecondaryButton } from '@/components';
import type { IconName } from '@/components/ui';
import { Icon } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import type { FoodCuisine } from './catalogTypes';
import { MembershipServiceHero } from './MembershipServiceHero';
import { membershipPurchaseHref } from './planCatalog';
import { SERVICE_HERO_IMAGES } from './serviceHeroes';
import { useMembershipServicePageVariant } from './useMembershipServicePageVariant';
import { useFoodCatalog } from './useCatalog';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useTabScreenBottomPad } from '@/utils/safeBottom';

const SLUG = 'food';
const heroImage = SERVICE_HERO_IMAGES.food;
const VIDEO_URL =
  'https://www.youtube.com/results?search_query=Watch+Our+Tiffin+Service+AgeWell';

const SERVICE_DETAILS =
  'Fresh, home-made, authentic meals for breakfast, lunch and/or dinner. Vegetarian and non-vegetarian options available as per your preference.';

const FEATURE_CARDS: { title: string; icon: IconName; color: string }[] = [
  { title: 'Home-made & Authentic', icon: 'home-outline', color: familyHome.green },
  { title: 'Freshly Prepared', icon: 'restaurant-outline', color: familyHome.orange },
  { title: 'Healthy & Nutritious', icon: 'heart-outline', color: familyHome.red },
  { title: 'Delivered at Doorstep', icon: 'bike', color: familyHome.purple },
];

const MEAL_CARDS: {
  title: string;
  price: string;
  icon: IconName;
  color: string;
}[] = [
  { title: 'Breakfast', price: '₹2,000 per month', icon: 'sparkles', color: '#E6A817' },
  { title: 'Lunch', price: '₹3,200 per month', icon: 'restaurant-outline', color: familyHome.red },
  { title: 'Dinner', price: '₹3,200 per month', icon: 'time-outline', color: familyHome.blue },
];

export function FoodDeliveryScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(true);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ServicePageHeader />

      {variant === 'serviceable_with_membership' ? (
        <FoodDeliveryLive />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.gateContent, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {variant === 'loading' ? <LoadingState message="Loading Tiffin Box..." /> : null}
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
        <Icon name="restaurant-outline" size={22} color={familyHome.greenDark} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.title}>TIFFIN BOX</Text>
        <Text style={styles.subtitle}>Home-style meals. Healthier days.</Text>
      </View>
    </View>
  );
}

function WatchVideoCard() {
  return (
    <Pressable
      onPress={() => void Linking.openURL(VIDEO_URL)}
      accessibilityRole="button"
      accessibilityLabel="Watch Our Tiffin Service"
      style={({ pressed }) => [styles.videoCard, pressed ? styles.pressed : null]}
    >
      <View style={styles.videoThumb}>
        <Image source={heroImage} style={styles.videoThumbImage} resizeMode="cover" />
        <View style={styles.videoPlay}>
          <Icon name="play" size={18} color={familyHome.white} />
        </View>
        <Text style={styles.videoDuration}>2:30</Text>
      </View>
      <View style={styles.videoCopy}>
        <View style={styles.watchRow}>
          <Icon name="play" size={12} color={familyHome.red} />
          <Text style={styles.watchLabel}>Watch</Text>
        </View>
        <Text style={styles.videoTitle}>Watch Our Tiffin Service</Text>
        <Text style={styles.videoSub}>A short video about our home-style meals and quality.</Text>
      </View>
      <Icon name="chevron-forward" size={16} color={familyHome.muted} />
    </Pressable>
  );
}

function ServiceDetailsCard() {
  return (
    <View style={styles.detailsCard}>
      <View style={styles.detailsHead}>
        <Icon name="document-text-outline" size={18} color={familyHome.blue} />
        <Text style={styles.detailsTitle}>Service Details</Text>
      </View>
      <Text style={styles.detailsBody}>{SERVICE_DETAILS}</Text>
      <View style={styles.featureGrid}>
        {FEATURE_CARDS.map((item) => (
          <View key={item.title} style={styles.featureCard}>
            <Icon name={item.icon} size={20} color={item.color} />
            <Text style={styles.featureTitle}>{item.title}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ChooseMealsCard() {
  return (
    <View style={styles.mealsSection}>
      <View style={styles.mealsHead}>
        <Text style={styles.mealsTitle}>Choose Your Meals</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: familyHome.green }]} />
            <Text style={styles.legendLabel}>Vegetarian</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: '#8B5A2B' }]} />
            <Text style={styles.legendLabel}>Non-Vegetarian</Text>
          </View>
        </View>
      </View>
      <View style={styles.mealList}>
        {MEAL_CARDS.map((item) => (
          <View key={item.title} style={styles.mealCard}>
            <View style={[styles.mealIcon, { backgroundColor: `${item.color}22` }]}>
              <Icon name={item.icon} size={18} color={item.color} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.mealName}>{item.title}</Text>
              <Text style={styles.mealPrice}>{item.price}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.comboNote}>
        <Icon name="restaurant-outline" size={16} color={familyHome.greenDark} />
        <Text style={styles.comboNoteText}>
          You can choose any combination of breakfast, lunch and dinner as per your requirement.
        </Text>
      </View>
    </View>
  );
}

function AddonNoteBanner() {
  return (
    <View style={styles.addonBanner} accessibilityRole="summary">
      <Icon name="card-outline" size={20} color={familyHome.orange} />
      <View style={styles.flex}>
        <Text style={styles.addonTitle}>Add-on Service</Text>
        <Text style={styles.addonBody}>
          This is an add-on service. For actual costing & to avail this service, please connect with us.
        </Text>
      </View>
    </View>
  );
}

function InAreaBanner() {
  return (
    <View style={styles.inAreaBanner} accessibilityRole="summary">
      <Icon name="location" size={16} color={familyHome.greenDark} />
      <Text style={styles.inAreaText}>You are in serviceable area</Text>
    </View>
  );
}

function MembershipRequiredBanner() {
  return (
    <View style={styles.membershipRequired} accessibilityRole="summary">
      <Icon name="lock-closed-outline" size={18} color="#B45309" />
      <View style={styles.flex}>
        <Text style={styles.membershipRequiredTitle}>Membership Required</Text>
        <Text style={styles.membershipRequiredBody}>
          This service is available to active members only.
        </Text>
      </View>
    </View>
  );
}

function OutsideAreaBody() {
  return (
    <View style={styles.stack}>
      <TitleBlock />
      <MembershipServiceHero slug={SLUG} />
      <View style={styles.soonBanner}>
        <Icon name="location" size={18} color={familyHome.red} />
        <View style={styles.flex}>
          <Text style={styles.soonTitle}>Service coming soon to your area</Text>
          <Text style={styles.soonBody}>
            Tiffin Box will become available in your area as we expand our services.
          </Text>
        </View>
      </View>
    </View>
  );
}

/** In serviceable area, membership not purchased — matches Tiffin Box gate mockup. */
function NoMembershipBody() {
  return (
    <View style={styles.stack}>
      <TitleBlock />
      <WatchVideoCard />
      <ServiceDetailsCard />
      <ChooseMealsCard />
      <AddonNoteBanner />
      <InAreaBanner />
      <MembershipRequiredBanner />
      <PrimaryButton label="Get Membership  →" onPress={() => router.push(membershipPurchaseHref())} />
      <SecondaryButton label="View Membership Plans" onPress={() => router.push(membershipPurchaseHref())} />
    </View>
  );
}

function FoodDeliveryLive() {
  const catalog = useFoodCatalog(false);
  const cuisines = catalog.data?.cuisines ?? [];
  const allItems = catalog.data?.items ?? [];

  const [cuisine, setCuisine] = useState<FoodCuisine | null>(null);
  const [meal, setMeal] = useState<'Breakfast' | 'Lunch' | 'Dinner'>('Lunch');
  const [cart, setCart] = useState<Record<string, number>>({});
  const { submitting, submit } = useMembershipSubmit(SLUG);

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
    return <ActivityIndicator color={familyHome.green} style={{ marginTop: spacing.xxl }} />;
  }

  if (catalog.isError) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.empty}>Unable to load food catalog.</Text>
        <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
          <Text style={styles.retry}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (!cuisine) {
    return (
      <ScrollView contentContainerStyle={styles.liveContent} showsVerticalScrollIndicator={false}>
        <MembershipServiceHero slug={SLUG} />
        <Text style={styles.liveLead}>Choose a cuisine</Text>
        <Text style={styles.hint}>
          Breakfast, lunch and dinner · monthly or daily home-made tiffin · next-day orders
        </Text>
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
        {cuisines.length === 0 ? <Text style={styles.empty}>No cuisines available yet.</Text> : null}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.liveContent} showsVerticalScrollIndicator={false}>
      <MembershipServiceHero slug={SLUG} />
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
              <Image
                source={{ uri: item.image }}
                style={styles.menuImage}
                accessibilityLabel={`${item.name} image`}
              />
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
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  flex: { flex: 1, minWidth: 0 },
  stack: { gap: spacing.md },
  gateContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.md },
  liveContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  titleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    lineHeight: 24,
    color: familyHome.blueDark,
    fontWeight: '700',
  },
  subtitle: { ...typography.caption, color: familyHome.muted, marginTop: 2 },

  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: familyHome.border,
    backgroundColor: familyHome.white,
    padding: spacing.sm,
    minHeight: minTouchSize,
  },
  videoThumb: {
    width: 112,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: familyHome.border,
  },
  videoThumbImage: { width: '100%', height: '100%' },
  videoPlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  videoDuration: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    ...typography.caption,
    fontSize: 10,
    lineHeight: 12,
    color: familyHome.white,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  videoCopy: { flex: 1, gap: 2, minWidth: 0 },
  watchRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  watchLabel: { ...typography.caption, color: familyHome.muted },
  videoTitle: { ...typography.bodyStrong, color: familyHome.text },
  videoSub: { ...typography.caption, color: familyHome.muted, lineHeight: 16 },

  detailsCard: {
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
  },
  detailsHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailsTitle: { ...typography.bodyStrong, color: familyHome.blueDark },
  detailsBody: { ...typography.body, color: familyHome.muted, lineHeight: 22 },
  featureGrid: { flexDirection: 'row', gap: spacing.sm },
  featureCard: {
    flex: 1,
    backgroundColor: familyHome.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: familyHome.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: 4,
    minHeight: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    ...typography.captionStrong,
    color: familyHome.text,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 13,
  },

  mealsSection: { gap: spacing.md },
  mealsHead: { gap: spacing.sm },
  mealsTitle: { ...typography.subtitle, color: familyHome.text },
  legend: { flexDirection: 'row', gap: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 12, height: 12, borderRadius: 2 },
  legendLabel: { ...typography.caption, color: familyHome.muted },
  mealList: { gap: spacing.sm },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.md,
    backgroundColor: familyHome.white,
  },
  mealIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealName: { ...typography.bodyStrong, color: familyHome.text },
  mealPrice: { ...typography.caption, color: familyHome.muted, marginTop: 2 },
  comboNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 12,
    padding: spacing.md,
  },
  comboNoteText: {
    ...typography.caption,
    color: familyHome.greenDark,
    lineHeight: 18,
    flex: 1,
  },

  addonBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: familyHome.orangeSoft,
    borderRadius: 14,
    padding: spacing.lg,
  },
  addonTitle: { ...typography.bodyStrong, color: familyHome.orange },
  addonBody: { ...typography.caption, color: familyHome.muted, lineHeight: 18, marginTop: 2 },

  inAreaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  inAreaText: { ...typography.bodyStrong, color: familyHome.greenDark },

  membershipRequired: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: familyHome.orangeSoft,
    borderRadius: 14,
    padding: spacing.lg,
  },
  membershipRequiredTitle: { ...typography.bodyStrong, color: '#B45309' },
  membershipRequiredBody: {
    ...typography.caption,
    color: familyHome.muted,
    lineHeight: 18,
    marginTop: 2,
  },

  soonBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.redSoft,
    borderRadius: 14,
    padding: spacing.lg,
  },
  soonTitle: { ...typography.bodyStrong, color: familyHome.red },
  soonBody: { ...typography.caption, color: familyHome.text, lineHeight: 18, marginTop: 2 },

  liveLead: { ...typography.title, color: familyHome.text },
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
  pressed: { opacity: 0.92 },
});
