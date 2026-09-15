import type { ComponentType, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView, LoadingState, PrimaryButton, SecondaryButton } from '@/components';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { MEMBERSHIP_SERVICE_AREA_LINE } from './membershipServicePageVariant';
import { MembershipServiceHero } from './MembershipServiceHero';
import { membershipPurchaseHref } from './planCatalog';
import { useMembershipServicePageVariant } from './useMembershipServicePageVariant';
import { useTabScreenBottomPad } from '@/utils/safeBottom';

type GateProps = {
  slug: string;
  title: string;
  requireMembership?: boolean;
  children: ReactNode;
};

export function MembershipServiceGate({
  slug,
  title,
  requireMembership = true,
  children,
}: GateProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(requireMembership);

  if (variant === 'serviceable_with_membership') {
    return <>{children}</>;
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title={title} showBack showProfile={false} showBell={false} />
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {variant === 'loading' ? <LoadingState message={`Loading ${title}...`} /> : null}
        {variant === 'non_serviceable' ? <ComingSoonBody slug={slug} title={title} /> : null}
        {variant === 'serviceable_no_membership' ? (
          <MembershipRequiredBody slug={slug} title={title} />
        ) : null}
      </KeyboardAwareScrollView>
    </View>
  );
}

export function gatedMembershipScreen(
  slug: string,
  title: string,
  Live: ComponentType,
  options?: { requireMembership?: boolean },
) {
  function GatedMembershipScreen() {
    return (
      <MembershipServiceGate
        slug={slug}
        title={title}
        requireMembership={options?.requireMembership ?? true}
      >
        <Live />
      </MembershipServiceGate>
    );
  }
  GatedMembershipScreen.displayName = `Gated(${slug})`;
  return GatedMembershipScreen;
}

function ComingSoonBody({ slug, title }: { slug: string; title: string }) {
  return (
    <View style={styles.stack}>
      <MembershipServiceHero slug={slug} />
      <View style={styles.soonBanner}>
        <Icon name="location" size={18} color={familyHome.red} />
        <View style={styles.bannerCopy}>
          <Text style={styles.soonTitle}>Service coming soon to your area</Text>
          <Text style={styles.soonBody}>
            {MEMBERSHIP_SERVICE_AREA_LINE} {title} will become available in your area as we expand our
            services.
          </Text>
        </View>
      </View>
      <View style={styles.infoBanner}>
        <Icon name="help-circle-outline" size={18} color={familyHome.blue} />
        <View style={styles.bannerCopy}>
          <Text style={styles.infoTitle}>Stay Connected</Text>
          <Text style={styles.infoBody}>
            Follow us for updates as we bring AgeWell to more locations soon.
          </Text>
        </View>
      </View>
    </View>
  );
}

function MembershipRequiredBody({ slug, title }: { slug: string; title: string }) {
  return (
    <View style={styles.stack}>
      <MembershipServiceHero slug={slug} />
      <View style={styles.availableBanner}>
        <Icon name="location" size={18} color={familyHome.greenDark} />
        <View style={styles.bannerCopy}>
          <Text style={styles.availableTitle}>{title} is available in your area</Text>
          <Text style={styles.availableBody}>
            AgeWell currently provides this service in Kandivali & Borivali, Mumbai.
          </Text>
        </View>
      </View>
      <View style={styles.membershipBanner}>
        <Icon name="lock-closed-outline" size={18} color="#B45309" />
        <View style={styles.bannerCopy}>
          <Text style={styles.membershipTitle}>Membership Required</Text>
          <Text style={styles.membershipBody}>
            {title} is available to active AgeWell members.
          </Text>
        </View>
      </View>
      <PrimaryButton label="Get Membership  →" onPress={() => router.push(membershipPurchaseHref())} />
      <SecondaryButton
        label="View Membership Plans"
        onPress={() => router.push(membershipPurchaseHref())}
      />
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
  stack: {
    gap: spacing.md,
  },
  bannerCopy: {
    flex: 1,
  },
  soonBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.redSoft,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#F5C2C4',
  },
  soonTitle: {
    ...typography.bodyStrong,
    color: familyHome.red,
  },
  soonBody: {
    ...typography.caption,
    color: familyHome.text,
    marginTop: 4,
    lineHeight: 18,
  },
  infoBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'flex-start',
  },
  infoTitle: {
    ...typography.bodyStrong,
    color: familyHome.blueDark,
  },
  infoBody: {
    ...typography.caption,
    color: familyHome.text,
    marginTop: 4,
    lineHeight: 18,
  },
  availableBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  availableTitle: {
    ...typography.bodyStrong,
    color: familyHome.greenDark,
  },
  availableBody: {
    ...typography.caption,
    color: familyHome.text,
    marginTop: 4,
    lineHeight: 18,
  },
  membershipBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.yellowSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  membershipTitle: {
    ...typography.bodyStrong,
    color: '#B45309',
  },
  membershipBody: {
    ...typography.caption,
    color: familyHome.text,
    marginTop: 4,
    lineHeight: 18,
  },
});
