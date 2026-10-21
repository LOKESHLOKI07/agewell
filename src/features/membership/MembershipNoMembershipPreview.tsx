import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { SERVICE_AREA_CITIES } from '@/features/auth/serviceArea';
import { SERVICE_HERO_IMAGES } from './serviceHeroes';
import { getMembershipPreviewCopy } from './membershipPreviewCatalog';
import { membershipPurchaseHref } from './planCatalog';
import { servicePageType } from './servicePageType';

type Props = {
  slug: string;
  title?: string;
};

export function MembershipNoMembershipPreview({ slug, title }: Props) {
  const copy = getMembershipPreviewCopy(slug, title);
  const videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(copy.videoSearch)}`;
  const hero = SERVICE_HERO_IMAGES[slug];

  return (
    <View style={styles.stack}>
      <Pressable
        onPress={() => void Linking.openURL(videoUrl)}
        accessibilityRole="button"
        accessibilityLabel={`Watch: ${copy.videoTitle}`}
        style={({ pressed }) => [styles.videoCard, pressed ? styles.pressed : null]}
      >
        <View style={styles.videoHero}>
          {hero ? <Image source={hero} style={styles.videoImage} resizeMode="cover" /> : null}
          <View style={styles.videoOverlay} pointerEvents="none">
            <Text style={styles.videoHeadline}>{copy.videoTitle}</Text>
          </View>
          <View style={styles.playWrap} pointerEvents="none">
            <View style={styles.playBtn}>
              <Icon name="play" size={22} color={familyHome.white} />
            </View>
          </View>
        </View>
        <View style={styles.videoCaption}>
          <Icon name="play" size={14} color={familyHome.red} />
          <Text style={styles.videoCaptionText}>Watch: {copy.videoTitle}</Text>
          <Icon name="chevron-forward" size={16} color={familyHome.muted} />
        </View>
      </Pressable>

      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.explainer}>{copy.description}</Text>

      <View style={styles.supportGrid}>
        {copy.benefits.map((item) => (
          <View key={item.title} style={[styles.supportCard, { backgroundColor: item.bg }]}>
            <Icon name={item.icon} size={18} color={item.color} />
            <Text style={styles.supportTitle}>{item.title}</Text>
            <Text style={styles.supportLine}>{item.line}</Text>
          </View>
        ))}
      </View>

      <View style={styles.memberBanner}>
        <Icon name="ribbon-outline" size={18} color={familyHome.greenDark} />
        <View style={styles.bannerCopy}>
          <Text style={styles.availableTitle}>Membership required</Text>
          <Text style={styles.availableBody}>{copy.membershipBody}</Text>
        </View>
        <Pressable
          onPress={() => router.push(membershipPurchaseHref())}
          accessibilityRole="button"
          accessibilityLabel="View plans"
          style={styles.viewPlans}
        >
          <Text style={styles.viewPlansLabel}>View Plans</Text>
          <Icon name="chevron-forward" size={14} color={familyHome.white} />
        </Pressable>
      </View>

      <View style={styles.availableBanner}>
        <Icon name="location" size={18} color={familyHome.greenDark} />
        <View style={styles.bannerCopy}>
          <Text style={styles.availableTitle}>You are in the service area</Text>
          <Text style={styles.availableBody}>({SERVICE_AREA_CITIES}).</Text>
        </View>
      </View>

      <Pressable
        onPress={() =>
          Alert.alert(
            'Talk to Expert',
            'AgeWell will reach you during service hours (10:00 AM–6:00 PM) to guide you on the best plan.',
          )
        }
        accessibilityRole="button"
        accessibilityLabel="Talk to Expert"
        style={styles.infoBanner}
      >
        <Icon name="help-circle-outline" size={18} color={familyHome.blue} />
        <View style={styles.bannerCopy}>
          <Text style={styles.infoTitle}>Need help or have questions?</Text>
          <Text style={styles.infoBody}>Talk to our team and we will guide you on the best plan for you.</Text>
        </View>
        <Text style={styles.talkLabel}>Talk to Expert</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  title: { ...servicePageType.pageTitle, color: '#123B7A' },
  explainer: { ...typography.body, color: familyHome.text, lineHeight: 22 },
  supportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  supportCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 14,
    padding: spacing.md,
    gap: 4,
    minHeight: 108,
  },
  supportTitle: { ...typography.bodyStrong, color: familyHome.text, fontSize: 13, marginTop: 4 },
  supportLine: { ...typography.caption, color: familyHome.muted, lineHeight: 15, fontSize: 11 },
  memberBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
  },
  availableBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  availableTitle: { ...typography.bodyStrong, color: familyHome.greenDark, fontSize: 14, lineHeight: 18 },
  availableBody: { ...typography.caption, color: familyHome.text, marginTop: 4, lineHeight: 18 },
  viewPlans: {
    backgroundColor: familyHome.green,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewPlansLabel: { ...typography.captionStrong, color: familyHome.white },
  infoBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
  },
  infoTitle: { ...servicePageType.bannerTitle, color: familyHome.blueDark },
  infoBody: { ...servicePageType.bannerBody, color: familyHome.text, marginTop: 4 },
  talkLabel: { ...typography.captionStrong, color: familyHome.blue },
  bannerCopy: { flex: 1 },
  videoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: familyHome.border,
    backgroundColor: familyHome.white,
  },
  videoHero: {
    height: 188,
    backgroundColor: '#123B7A',
    overflow: 'hidden',
  },
  videoImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,24,56,0.28)',
    justifyContent: 'flex-end',
    padding: spacing.lg,
    paddingRight: 88,
  },
  videoHeadline: { ...typography.subtitle, color: familyHome.white },
  playWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: familyHome.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoCaption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: minTouchSize,
    backgroundColor: familyHome.white,
  },
  videoCaptionText: { ...typography.captionStrong, color: familyHome.text, flex: 1 },
  pressed: { opacity: 0.85 },
});
