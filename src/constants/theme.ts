/**
 * AgeWell visual tokens.
 * Change colors, radius, type, and shadows here to restyle every screen.
 */
export const colors = {
  background: '#F7F8FC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F3F9',
  surfaceElevated: '#FFFFFF',
  primary: '#583FD3',
  primaryMuted: '#7B68E0',
  primarySoft: '#EFEAFE',
  primaryDark: '#2F1E6E',
  accent: '#4C6FFF',
  accentSoft: '#EAF0FF',
  text: '#1C1F33',
  textSecondary: '#6B728A',
  textMuted: '#9AA3B8',
  textOnPrimary: '#FFFFFF',
  border: '#ECEEF5',
  safe: '#22A06B',
  safeSoft: '#E7F7EF',
  warning: '#F59E0B',
  warningSoft: '#FFF6E5',
  emergency: '#E5484D',
  emergencySoft: '#FDECEC',
  info: '#4C6FFF',
  infoSoft: '#EAF0FF',
  sidebar: '#2B1B6B',
  sidebarText: '#F7F4FF',
  sidebarMuted: '#C9BFF2',
  sidebarActive: '#4A35B8',
  white: '#FFFFFF',
  overlay: 'rgba(28, 31, 51, 0.46)',
} as const;

export type ColorTone = 'default' | 'primary' | 'accent' | 'safe' | 'warning' | 'emergency' | 'info';

export const tones: Record<ColorTone, { fg: string; bg: string; border: string }> = {
  default: { fg: colors.text, bg: colors.surfaceElevated, border: colors.border },
  primary: { fg: colors.primary, bg: colors.primarySoft, border: colors.primarySoft },
  accent: { fg: colors.accent, bg: colors.accentSoft, border: colors.accentSoft },
  safe: { fg: colors.safe, bg: colors.safeSoft, border: colors.safeSoft },
  warning: { fg: colors.warning, bg: colors.warningSoft, border: colors.warningSoft },
  emergency: { fg: colors.emergency, bg: colors.emergencySoft, border: colors.emergencySoft },
  info: { fg: colors.info, bg: colors.infoSoft, border: colors.infoSoft },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  full: 999,
} as const;

const fontRegular = 'Poppins_400Regular';
const fontMedium = 'Poppins_500Medium';
const fontSemibold = 'Poppins_600SemiBold';
const fontBold = 'Poppins_700Bold';

export const typography = {
  display: {
    fontFamily: fontBold,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
  },
  title: {
    fontFamily: fontBold,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
  },
  heading: {
    fontFamily: fontSemibold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  subtitle: {
    fontFamily: fontSemibold,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  body: {
    fontFamily: fontRegular,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  bodyStrong: {
    fontFamily: fontSemibold,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  caption: {
    fontFamily: fontRegular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  captionStrong: {
    fontFamily: fontMedium,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
  label: {
    fontFamily: fontSemibold,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.6,
  },
} as const;

export const shadows = {
  card: {
    shadowColor: '#1C1F33',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 3,
    boxShadow: '0px 10px 24px rgba(28, 31, 51, 0.05)',
  },
  float: {
    shadowColor: '#1C1F33',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 8,
    boxShadow: '0px 16px 28px rgba(28, 31, 51, 0.1)',
  },
} as const;

export const minTouchSize = 48;
export const iconStroke = 1.75;

export const cardSurface = {
  backgroundColor: colors.surfaceElevated,
  borderRadius: radius.xl,
  ...shadows.card,
} as const;

export const layout = {
  screenPadding: spacing.xl,
  cardPadding: spacing.lg,
  sectionGap: spacing.xl,
  tabBarHeight: 72,
} as const;
