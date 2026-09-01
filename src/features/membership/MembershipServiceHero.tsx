import { Image, StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '@/constants/theme';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { findMembershipService } from '@/features/services/serviceCatalog';
import { SERVICE_HERO_COPY, SERVICE_HERO_IMAGES } from './serviceHeroes';

type Props = {
  slug: string;
  headline?: string;
  subtitle?: string;
  /** Hide the text block when the screen already has its own lead copy. */
  imageOnly?: boolean;
};

export function MembershipServiceHero({ slug, headline, subtitle, imageOnly = false }: Props) {
  const service = findMembershipService(slug);
  const source = SERVICE_HERO_IMAGES[slug];
  const copy = SERVICE_HERO_COPY[slug];
  const title = headline ?? copy?.headline ?? service?.title;
  const line = subtitle ?? copy?.subtitle ?? service?.description;

  if (!source && !title) {
    return null;
  }

  return (
    <View style={styles.root} accessibilityRole="summary">
      {source ? (
        <Image source={source} style={styles.image} resizeMode="contain" accessibilityLabel={`${title ?? slug} illustration`} />
      ) : null}
      {!imageOnly && title ? <Text style={styles.headline}>{title}</Text> : null}
      {!imageOnly && line ? <Text style={styles.subtitle}>{line}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    backgroundColor: familyHome.white,
  },
  headline: {
    ...typography.title,
    color: familyHome.text,
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: familyHome.muted,
    lineHeight: 22,
  },
});
