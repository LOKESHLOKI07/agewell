import type { ComponentType, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView, LoadingState } from '@/components';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { MEMBERSHIP_SERVICE_AREA_LINE } from './membershipServicePageVariant';
import { servicePageType } from './servicePageType';
import { MembershipNoMembershipPreview } from './MembershipNoMembershipPreview';
import { MembershipServiceHero } from './MembershipServiceHero';
import { useMembershipServicePageVariant } from './useMembershipServicePageVariant';
import { useSystemBottomInset } from '@/utils/safeBottom';

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
  const bottomPad = useSystemBottomInset(12) + spacing.xxl;
  const variant = useMembershipServicePageVariant(requireMembership, slug);

  if (variant === 'serviceable_with_membership') {
    return <>{children}</>;
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ServicePageHeader />
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
  return <MembershipNoMembershipPreview slug={slug} title={title} />;
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
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  stack: {
    gap: spacing.md,
  },
  bannerCopy: {
    flex: 1,
    minWidth: 0,
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
    ...servicePageType.bannerTitle,
    color: familyHome.red,
  },
  soonBody: {
    ...servicePageType.bannerBody,
    color: familyHome.text,
    marginTop: 4,
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
    ...servicePageType.bannerTitle,
    color: familyHome.blueDark,
  },
  infoBody: {
    ...servicePageType.bannerBody,
    color: familyHome.text,
    marginTop: 4,
  },
  availableBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  availableTitle: {
    ...servicePageType.bannerTitle,
    color: familyHome.greenDark,
  },
  availableBody: {
    ...servicePageType.bannerBody,
    color: familyHome.text,
    marginTop: 4,
  },
  membershipBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.yellowSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  membershipTitle: {
    ...servicePageType.bannerTitle,
    color: '#B45309',
  },
  membershipBody: {
    ...servicePageType.bannerBody,
    color: familyHome.text,
    marginTop: 4,
  },
});
