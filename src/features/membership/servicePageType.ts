import { typography } from '@/constants/theme';
import { familyHome } from '@/features/home/components/familyHomeTheme';

/**
 * Shared type scale for membership + add-on service pages.
 * Matches the compact sizes used on live member screens (caption body, 14px section titles).
 * Leave hero/banner images and YouTube cards alone — only text tokens live here.
 */
export const servicePageType = {
  pageTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    lineHeight: 22,
    color: familyHome.blueDark,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    fontSize: 14,
    lineHeight: 18,
  },
  bodyMuted: {
    ...typography.caption,
    color: familyHome.muted,
    lineHeight: 18,
  },
  bannerTitle: {
    ...typography.bodyStrong,
    fontSize: 14,
    lineHeight: 18,
  },
  bannerBody: {
    ...typography.caption,
    lineHeight: 18,
  },
  featureTitle: {
    ...typography.captionStrong,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center' as const,
  },
  featureBody: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center' as const,
  },
  optionTitle: {
    ...typography.captionStrong,
    fontSize: 12,
    lineHeight: 16,
    color: familyHome.text,
  },
  optionBody: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 15,
    color: familyHome.muted,
  },
  inArea: {
    ...typography.captionStrong,
    fontSize: 13,
    lineHeight: 18,
    color: familyHome.greenDark,
  },
  heroHeadline: {
    ...typography.subtitle,
    fontSize: 18,
    lineHeight: 24,
    color: familyHome.blueDark,
  },
} as const;
