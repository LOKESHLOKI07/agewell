import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { router, type Href } from 'expo-router';
import { KeyboardAwareScrollView } from '@/components/KeyboardAwareScrollView';
import { Icon } from '@/components/ui';
import { colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { useAdminLayout } from '../useAdminLayout';

interface AdminScreenProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** When set, shows a back control that never calls router.back() blindly. */
  backHref?: string;
}

export function AdminScreen({
  title,
  subtitle,
  actions,
  children,
  scroll = true,
  contentStyle,
  backHref,
}: AdminScreenProps) {
  const { isDesktop, isPhone } = useAdminLayout();

  const goBack = () => {
    if (backHref) {
      router.replace(backHref as Href);
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(admin)' as Href);
  };

  const body = (
    <View style={styles.panel}>
      {backHref ? (
        <View style={styles.topBar}>
          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [styles.backBtn, pressed ? styles.pressed : null]}
          >
            <Icon name="chevron-back" size={18} color={colors.primary} />
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
          {actions ? <View style={styles.actions}>{actions}</View> : null}
        </View>
      ) : null}

      <View style={[styles.titleRow, isPhone ? styles.titleRowPhone : null]}>
        <View style={[styles.titleBlock, isPhone ? styles.titleBlockPhone : null]}>
          <Text style={[styles.title, isPhone ? styles.titlePhone : null]} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {!backHref && actions ? (
          <View style={[styles.actions, isPhone ? styles.actionsPhone : null]}>{actions}</View>
        ) : null}
      </View>
      {children}
    </View>
  );

  if (!scroll) {
    return <View style={[styles.container, contentStyle]}>{body}</View>;
  }

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isDesktop ? styles.contentDesktop : null, contentStyle]}
    >
      {body}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.adminCanvas,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
    width: '100%',
    alignSelf: 'stretch',
  },
  contentDesktop: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  panel: {
    width: '100%',
    alignSelf: 'stretch',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
    width: '100%',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: minTouchSize,
    paddingRight: spacing.sm,
  },
  backLabel: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  titleRowPhone: {
    flexDirection: 'column',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  titleBlock: {
    flex: 1,
    minWidth: 200,
  },
  titleBlockPhone: {
    minWidth: 0,
    width: '100%',
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  titlePhone: {
    ...typography.heading,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  actionsPhone: {
    width: '100%',
  },
  pressed: {
    opacity: 0.85,
  },
});
