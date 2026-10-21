import { useMemo, useState } from 'react';
import {
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
import { useServiceRequests } from '@/features/home/hooks/queries';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { MarketplaceServiceIcon } from '@/features/services/components/MarketplaceServiceIcon';
import {
  filterOfferingsByKind,
  type ServiceOffering,
} from './catalogTypes';
import {
  filterRequestsBySlug,
  liveRequestToneMeta,
  toLiveRequestViews,
  type LiveRequestTone,
  type LiveRequestView,
} from './liveServiceRequests';
import { membershipPurchaseHref } from './planCatalog';
import { SERVICE_HERO_IMAGES, tiffinMealImage } from './serviceHeroes';
import { servicePageType } from './servicePageType';
import { useHasActiveMembership } from './useHasActiveMembership';
import { useMembershipServicePageVariant } from './useMembershipServicePageVariant';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useServiceOfferings } from './useCatalog';
import { toDisplayDate } from '@/utils/date';
import { useTabScreenBottomPad } from '@/utils/safeBottom';

const SLUG = 'food';
const heroImage = SERVICE_HERO_IMAGES.food;
const VIDEO_URL =
  'https://www.youtube.com/results?search_query=Healthy+Home-style+Tiffin+Service+AgeWell';

const SERVICE_DETAILS =
  'Fresh, home-made, authentic meals for breakfast, lunch and/or dinner. Vegetarian and non-vegetarian options available as per your preference.';

const PLEASE_NOTE = [
  'This is a chargeable add-on service.',
  'You can choose any combination of breakfast, lunch and dinner.',
  'Once you raise a request, our Customer Care team will connect with you for menu preference and delivery details.',
] as const;

type MealLook = {
  icon: IconName;
  iconColor: string;
  soft: string;
  selectedBorder: string;
};

function mealLook(title: string, index: number): MealLook {
  const lower = title.toLowerCase();
  if (/dinner|night|evening/.test(lower)) {
    return {
      icon: 'moon',
      iconColor: familyHome.blue,
      soft: familyHome.blueSoft,
      selectedBorder: familyHome.blue,
    };
  }
  if (/lunch|afternoon/.test(lower) || index === 1) {
    return {
      icon: 'sun',
      iconColor: familyHome.orange,
      soft: familyHome.orangeSoft,
      selectedBorder: familyHome.orange,
    };
  }
  return {
    icon: 'sun',
    iconColor: '#D4A017',
    soft: familyHome.yellowSoft,
    selectedBorder: familyHome.green,
  };
}

function featureIcon(title: string): { icon: IconName; color: string } {
  const lower = title.toLowerCase();
  if (/fresh|prepar/.test(lower)) return { icon: 'restaurant-outline', color: familyHome.orange };
  if (/healthy|nutri/.test(lower)) return { icon: 'heart-outline', color: familyHome.red };
  if (/deliver|door/.test(lower)) return { icon: 'bike', color: familyHome.purple };
  return { icon: 'home-outline', color: familyHome.green };
}

function membershipValidDate(endDate: string | null | undefined): string | null {
  if (!endDate) {
    return null;
  }
  const parsed = new Date(endDate);
  if (Number.isNaN(parsed.getTime())) {
    return toDisplayDate(endDate) || null;
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parsed.getDate()} ${months[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

function formatRequestDateTime(iso: string | null | undefined): string {
  if (!iso) return 'Recently';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Recently';
  const datePart = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart} • ${timePart}`;
}

function mealsFromNotes(
  notes: string | null | undefined,
  options: ServiceOffering[],
): { title: string; price: string; icon: IconName; soft: string; color: string } {
  const text = notes?.trim() || '';
  const picked = options.filter((meal) => new RegExp(meal.title, 'i').test(text));
  if (picked.length === 1) {
    const meal = picked[0];
    const look = mealLook(meal.title, 0);
    return {
      title: `Tiffin Box - ${meal.title}`,
      price: meal.priceLabel || 'Monthly plan',
      icon: look.icon,
      soft: look.soft,
      color: look.iconColor,
    };
  }
  if (picked.length > 1) {
    return {
      title: `Tiffin Box - ${picked.map((m) => m.title).join(' + ')}`,
      price: picked.map((m) => m.priceLabel || m.title).join(' + '),
      icon: 'restaurant-outline',
      soft: familyHome.greenSoft,
      color: familyHome.greenDark,
    };
  }
  return {
    title: 'Tiffin Box',
    price: 'Monthly plan',
    icon: 'restaurant-outline',
    soft: familyHome.greenSoft,
    color: familyHome.greenDark,
  };
}

function statusToneForLog(tone: LiveRequestTone): { color: string; soft: string } {
  if (tone === 'completed') {
    return { color: familyHome.blueDark, soft: familyHome.blueSoft };
  }
  if (tone === 'scheduled' || tone === 'progress' || tone === 'placed') {
    return { color: familyHome.greenDark, soft: familyHome.greenSoft };
  }
  return liveRequestToneMeta(tone);
}

function useFoodCatalogCopy() {
  const catalog = useServiceOfferings(SLUG);
  const features = useMemo(
    () => filterOfferingsByKind(catalog.data ?? [], 'feature'),
    [catalog.data],
  );
  const options = useMemo(
    () => filterOfferingsByKind(catalog.data ?? [], 'option'),
    [catalog.data],
  );
  return { catalog, features, options };
}

export function FoodDeliveryScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(true, SLUG);

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
      <MarketplaceServiceIcon
        serviceId={SLUG}
        fallbackIcon="restaurant-outline"
        fallbackColor={familyHome.greenDark}
        size={48}
      />
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
      accessibilityLabel="Watch on YouTube: Healthy Home-style Tiffin Service"
      style={({ pressed }) => [styles.videoCard, pressed ? styles.pressed : null]}
    >
      <View style={styles.videoThumb}>
        <Image source={heroImage} style={styles.videoThumbImage} resizeMode="cover" />
        <View style={styles.videoPlay}>
          <Icon name="play" size={14} color={familyHome.white} />
        </View>
        <Text style={styles.videoDuration}>2:30</Text>
      </View>
      <View style={styles.videoCopy}>
        <View style={styles.watchRow}>
          <Icon name="play" size={12} color={familyHome.red} />
          <Text style={styles.watchLabel}>Watch on YouTube</Text>
        </View>
        <Text style={styles.videoTitle}>Healthy Home-style Tiffin Service</Text>
        <Text style={styles.videoSub}>Watch this short video to know more.</Text>
      </View>
      <Icon name="chevron-forward" size={16} color={familyHome.muted} />
    </Pressable>
  );
}

function ServiceDetailsCard({
  features,
  loading,
}: {
  features: ServiceOffering[];
  loading?: boolean;
}) {
  return (
    <View style={styles.detailsCard}>
      <View style={styles.detailsHead}>
        <Icon name="document-text-outline" size={18} color={familyHome.blue} />
        <Text style={styles.detailsTitle}>Service Details</Text>
      </View>
      <Text style={styles.detailsBody}>{SERVICE_DETAILS}</Text>
      {loading ? <Text style={styles.empty}>Loading features…</Text> : null}
      {features.length > 0 ? (
        <View style={styles.featureGrid}>
          {features.map((item) => {
            const look = featureIcon(item.title);
            return (
              <View key={item.id} style={styles.featureCard}>
                <Icon name={look.icon} size={20} color={look.color} />
                <Text style={styles.featureTitle}>{item.title}</Text>
              </View>
            );
          })}
        </View>
      ) : !loading ? (
        <Text style={styles.empty}>Features will appear once configured in the catalog.</Text>
      ) : null}
    </View>
  );
}

function ChooseMealsCard({
  options,
  loading,
  error,
  onRetry,
}: {
  options: ServiceOffering[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.mealsSection}>
      <Text style={styles.mealsTitle}>Choose Your Meals</Text>
      {loading ? <Text style={styles.empty}>Loading meals…</Text> : null}
      {error ? (
        <Pressable onPress={onRetry} accessibilityRole="button">
          <Text style={styles.link}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}
      {!loading && !error && options.length === 0 ? (
        <Text style={styles.empty}>No meals configured yet.</Text>
      ) : null}
      {options.length > 0 ? (
        <View style={styles.mealList}>
          {options.map((item, index) => {
            const imageSource = item.image
              ? { uri: item.image }
              : tiffinMealImage(item.title, index);
            return (
              <View key={item.id} style={styles.mealCard}>
                <Image source={imageSource} style={styles.mealThumb} resizeMode="cover" />
                <View style={styles.flex}>
                  <Text style={styles.mealName}>{item.title}</Text>
                  <Text style={styles.mealPrice}>{item.priceLabel || 'Charges apply'}</Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
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
  const { catalog, features, options } = useFoodCatalogCopy();

  return (
    <View style={styles.stack}>
      <TitleBlock />
      <WatchVideoCard />
      <ServiceDetailsCard features={features} loading={catalog.isPending} />
      <ChooseMealsCard
        options={options}
        loading={catalog.isPending}
        error={catalog.isError}
        onRetry={() => void catalog.refetch()}
      />
      <AddonNoteBanner />
      <View style={styles.soonBanner}>
        <Icon name="location" size={18} color={familyHome.red} />
        <View style={styles.flex}>
          <Text style={styles.soonTitle}>Service coming soon to your area</Text>
          <Text style={styles.soonBody}>
            Tiffin Box will become available in your area as we expand our services.
          </Text>
        </View>
      </View>
      <MembershipRequiredBanner />
      <PrimaryButton label="Get Membership  →" onPress={() => router.push(membershipPurchaseHref())} />
      <SecondaryButton label="View Membership Plans" onPress={() => router.push(membershipPurchaseHref())} />
    </View>
  );
}

/** In serviceable area, membership not purchased — matches Tiffin Box gate mockup. */
function NoMembershipBody() {
  const { catalog, features, options } = useFoodCatalogCopy();

  return (
    <View style={styles.stack}>
      <TitleBlock />
      <WatchVideoCard />
      <ServiceDetailsCard features={features} loading={catalog.isPending} />
      <ChooseMealsCard
        options={options}
        loading={catalog.isPending}
        error={catalog.isError}
        onRetry={() => void catalog.refetch()}
      />
      <AddonNoteBanner />
      <InAreaBanner />
      <MembershipRequiredBanner />
      <PrimaryButton label="Get Membership  →" onPress={() => router.push(membershipPurchaseHref())} />
      <SecondaryButton label="View Membership Plans" onPress={() => router.push(membershipPurchaseHref())} />
    </View>
  );
}

function FoodDeliveryLive() {
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const { catalog, options } = useFoodCatalogCopy();
  const requestsQuery = useServiceRequests();
  const membership = useHasActiveMembership();
  const { submitting, submit } = useMembershipSubmit(SLUG);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const validTill = membershipValidDate(membership.query.data?.endDate);

  // Keep selection in sync with live options (default first meal when options load).
  const effectiveSelectedIds = useMemo(() => {
    if (options.length === 0) return [];
    const valid = selectedIds.filter((id) => options.some((item) => item.id === id));
    if (valid.length > 0) return valid;
    return [options[0].id];
  }, [options, selectedIds]);

  const selectedMeals = useMemo(
    () => options.filter((meal) => effectiveSelectedIds.includes(meal.id)),
    [options, effectiveSelectedIds],
  );

  const recentRaw = useMemo(() => {
    return filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
  }, [requestsQuery.data?.items]);

  const recent = useMemo(() => {
    return toLiveRequestViews(recentRaw, { fallbackTitle: 'Tiffin Box', limit: 3 }).map(
      (view, index) => {
        const source = recentRaw[index];
        const mealMeta = mealsFromNotes(source?.notes ?? view.detail, options);
        return {
          ...view,
          title: mealMeta.title,
          detail: mealMeta.price,
          dateLabel: formatRequestDateTime(source?.createdAt ?? null),
        } satisfies LiveRequestView & { detail: string };
      },
    );
  }, [recentRaw, options]);

  const allCount = recentRaw.length;

  const toggleMeal = (id: string) => {
    setSelectedIds((prev) => {
      const base = prev.length > 0 ? prev : effectiveSelectedIds;
      if (base.includes(id)) {
        if (base.length === 1) return base;
        return base.filter((item) => item !== id);
      }
      return [...base, id];
    });
  };

  const onRaiseRequest = () => {
    if (selectedMeals.length === 0) {
      Alert.alert('Select meals', 'Please choose at least one meal before raising a request.');
      return;
    }
    const summary = selectedMeals
      .map((meal) => `${meal.title} (${meal.priceLabel || 'Charges apply'})`)
      .join(', ');
    void submit(
      `Tiffin Box request · ${summary}. Combination of breakfast, lunch and/or dinner as selected.`,
      'Tiffin request submitted',
    );
  };

  const onViewAllRequests = () => {
    const lines = toLiveRequestViews(recentRaw, { fallbackTitle: 'Tiffin Box', limit: 20 })
      .map((item, index) => {
        const source = recentRaw[index];
        const mealMeta = mealsFromNotes(source?.notes ?? item.detail, options);
        const when = formatRequestDateTime(source?.createdAt ?? null);
        return `• ${mealMeta.title} — ${item.statusLabel} (${when})`;
      })
      .join('\n');
    Alert.alert('Request Logs', lines || 'No requests yet.');
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.liveContent, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.liveTitleRow}>
        <MarketplaceServiceIcon
          serviceId={SLUG}
          fallbackIcon="restaurant-outline"
          fallbackColor={familyHome.greenDark}
          size={48}
        />
        <Text style={styles.liveTitle}>TIFFIN BOX</Text>
      </View>

      {validTill ? (
        <View style={styles.memberBadge} accessibilityRole="summary">
          <Icon name="crown" size={16} color={familyHome.green} />
          <Text style={styles.memberBadgeText}>
            Your membership is valid upto <Text style={styles.memberBadgeDate}>{validTill}</Text>.
          </Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Select Your Meals</Text>
      <Text style={styles.sectionHint}>
        Choose breakfast, lunch and/or dinner as per your need.
      </Text>

      {catalog.isPending && options.length === 0 ? (
        <Text style={styles.empty}>Loading meals…</Text>
      ) : null}
      {catalog.isError && options.length === 0 ? (
        <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
          <Text style={styles.link}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}
      {!catalog.isPending && !catalog.isError && options.length === 0 ? (
        <Text style={styles.empty}>No meals configured yet.</Text>
      ) : null}

      {options.length > 0 ? (
        <View style={styles.selectGrid}>
          {options.map((meal, index) => {
            const active = effectiveSelectedIds.includes(meal.id);
            const look = mealLook(meal.title, index);
            const imageSource = meal.image
              ? { uri: meal.image }
              : tiffinMealImage(meal.title, index);
            return (
              <Pressable
                key={meal.id}
                onPress={() => toggleMeal(meal.id)}
                disabled={submitting}
                style={[
                  styles.selectCard,
                  { backgroundColor: look.soft },
                  active
                    ? [styles.selectCardActive, { borderColor: look.selectedBorder }]
                    : styles.selectCardIdle,
                  submitting ? styles.disabled : null,
                ]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
                accessibilityLabel={`${meal.title}, ${meal.priceLabel || 'Charges apply'}`}
              >
                <View style={styles.selectCheck}>
                  {active ? (
                    <Icon name="checkbox-outline" size={16} color={look.selectedBorder} />
                  ) : (
                    <View style={styles.unchecked} />
                  )}
                </View>
                <Icon name={look.icon} size={18} color={look.iconColor} />
                <Text style={styles.selectTitle}>{meal.title}</Text>
                <Text style={styles.selectPrice}>{meal.priceLabel || 'Charges apply'}</Text>
                <Image source={imageSource} style={styles.selectImage} resizeMode="cover" />
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.comboNote}>
        <Icon name="restaurant-outline" size={16} color={familyHome.greenDark} />
        <Text style={styles.comboNoteText}>
          You can choose any combination of breakfast, lunch and dinner as per your requirement.
        </Text>
      </View>

      <View style={styles.pleaseNote} accessibilityRole="summary">
        <View style={styles.pleaseNoteHead}>
          <Icon name="help-circle-outline" size={18} color={familyHome.blueDark} />
          <Text style={styles.pleaseNoteTitle}>Please Note</Text>
        </View>
        {PLEASE_NOTE.map((line) => (
          <View key={line} style={styles.pleaseNoteLine}>
            <Text style={styles.pleaseNoteBullet}>•</Text>
            <Text style={styles.pleaseNoteText}>{line}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={onRaiseRequest}
        disabled={submitting || selectedMeals.length === 0}
        style={({ pressed }) => [
          styles.raiseCta,
          submitting || selectedMeals.length === 0 ? styles.disabled : null,
          pressed ? styles.pressed : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Raise a Request"
      >
        <Icon name="calendar-outline" size={18} color={familyHome.white} />
        <Text style={styles.raiseCtaText}>{submitting ? 'Sending…' : 'Raise a Request'}</Text>
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitleFlush}>Request Logs</Text>
        {allCount > 0 ? (
          <Pressable onPress={onViewAllRequests} accessibilityRole="button">
            <Text style={styles.viewAll}>View All &gt;</Text>
          </Pressable>
        ) : null}
      </View>

      {requestsQuery.isPending ? <Text style={styles.empty}>Loading requests…</Text> : null}
      {!requestsQuery.isPending && recent.length === 0 ? (
        <Text style={styles.empty}>No requests yet. Select meals and raise a request.</Text>
      ) : null}

      {recent.length > 0 ? (
        <View style={styles.requestList}>
          {recent.map((item, index) => {
            const source = recentRaw[index];
            const mealMeta = mealsFromNotes(source?.notes ?? item.detail, options);
            const tone = statusToneForLog(item.tone);
            return (
              <Pressable
                key={item.id}
                onPress={onViewAllRequests}
                style={({ pressed }) => [styles.requestRow, pressed ? styles.pressed : null]}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${item.statusLabel}`}
              >
                <View style={[styles.requestIcon, { backgroundColor: mealMeta.soft }]}>
                  <Icon name={mealMeta.icon} size={16} color={mealMeta.color} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.requestTitle}>{item.title}</Text>
                  <Text style={styles.requestDetail}>{mealMeta.price}</Text>
                  <Text style={styles.requestDate}>{item.dateLabel}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: tone.soft }]}>
                  <Text style={[styles.statusPillText, { color: tone.color }]}>
                    {item.tone === 'completed'
                      ? 'Completed'
                      : item.tone === 'cancelled'
                        ? item.statusLabel
                        : 'Active'}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={14} color={familyHome.muted} />
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Know More About This Service</Text>
      <WatchVideoCard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  flex: { flex: 1, minWidth: 0 },
  stack: { gap: spacing.md },
  gateContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.md },
  liveContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.md },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: {
    ...servicePageType.pageTitle,
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
    width: 78,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: familyHome.border,
  },
  videoThumbImage: { width: '100%', height: '100%' },
  videoPlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  videoDuration: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    ...typography.caption,
    fontSize: 9,
    lineHeight: 12,
    color: familyHome.white,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  videoCopy: { flex: 1, gap: 1, minWidth: 0 },
  watchRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  watchLabel: { ...typography.captionStrong, color: familyHome.muted, fontSize: 10 },
  videoTitle: { ...typography.captionStrong, color: familyHome.text, fontSize: 13 },
  videoSub: { ...typography.caption, color: familyHome.muted, lineHeight: 14, fontSize: 10 },

  detailsCard: {
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
  },
  detailsHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailsTitle: { ...servicePageType.sectionTitle, color: familyHome.blueDark },
  detailsBody: { ...servicePageType.bodyMuted },
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
    ...servicePageType.featureTitle,
    color: familyHome.text,
  },

  mealsSection: { gap: spacing.md },
  mealsTitle: { ...typography.subtitle, color: familyHome.text },
  mealList: { gap: spacing.sm },
  mealThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: familyHome.border,
  },
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
  addonTitle: { ...servicePageType.bannerTitle, color: familyHome.orange },
  addonBody: { ...servicePageType.bannerBody, color: familyHome.muted, marginTop: 2 },

  inAreaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  inAreaText: { ...servicePageType.inArea },

  membershipRequired: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: familyHome.orangeSoft,
    borderRadius: 14,
    padding: spacing.lg,
  },
  membershipRequiredTitle: { ...servicePageType.bannerTitle, color: '#B45309' },
  membershipRequiredBody: {
    ...servicePageType.bannerBody,
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
  soonTitle: { ...servicePageType.bannerTitle, color: familyHome.red },
  soonBody: { ...servicePageType.bannerBody, color: familyHome.text, marginTop: 2 },

  liveTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  liveTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    lineHeight: 24,
    color: familyHome.greenDark,
    fontWeight: '700',
    flex: 1,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  memberBadgeText: { ...typography.caption, color: familyHome.text, flex: 1, lineHeight: 18 },
  memberBadgeDate: { ...typography.captionStrong, color: familyHome.greenDark },
  sectionTitle: {
    ...typography.subtitle,
    color: familyHome.blueDark,
    marginTop: spacing.sm,
  },
  sectionTitleFlush: { ...typography.subtitle, color: familyHome.blueDark },
  sectionHint: { ...typography.caption, color: familyHome.muted, marginTop: -4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  viewAll: { ...typography.captionStrong, color: familyHome.blue },
  selectGrid: { flexDirection: 'row', gap: 8 },
  selectCard: {
    flex: 1,
    borderRadius: 14,
    padding: spacing.sm,
    gap: 4,
    minHeight: 168,
    alignItems: 'center',
    position: 'relative',
  },
  selectCardIdle: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectCardActive: {
    borderWidth: 1.5,
    backgroundColor: familyHome.white,
  },
  selectCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  unchecked: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#C5CDD8',
    backgroundColor: familyHome.white,
  },
  selectTitle: { ...typography.captionStrong, color: familyHome.text, fontSize: 13 },
  selectPrice: {
    ...typography.captionStrong,
    color: familyHome.greenDark,
    fontSize: 11,
    textAlign: 'center',
  },
  selectImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginTop: 6,
    backgroundColor: familyHome.border,
  },
  pleaseNote: {
    backgroundColor: familyHome.blueSoft,
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  pleaseNoteHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pleaseNoteTitle: { ...typography.bodyStrong, color: familyHome.blueDark },
  pleaseNoteLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  pleaseNoteBullet: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  pleaseNoteText: { ...typography.caption, color: familyHome.muted, lineHeight: 18, flex: 1 },
  raiseCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: familyHome.green,
    borderRadius: 14,
    paddingVertical: spacing.md + 2,
    minHeight: minTouchSize,
  },
  raiseCtaText: { ...typography.bodyStrong, color: familyHome.white, fontSize: 16 },
  requestList: { gap: spacing.sm },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.md,
    backgroundColor: familyHome.white,
  },
  requestIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestTitle: { ...typography.bodyStrong, color: familyHome.text, fontSize: 13 },
  requestDetail: { ...typography.caption, color: familyHome.muted, marginTop: 1 },
  requestDate: { ...typography.caption, color: familyHome.muted, marginTop: 2, fontSize: 11 },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: { ...typography.captionStrong, fontSize: 10 },
  empty: { ...typography.caption, color: familyHome.muted },
  link: { ...typography.captionStrong, color: familyHome.blue },
  pressed: { opacity: 0.92 },
  disabled: { opacity: 0.6 },
});
