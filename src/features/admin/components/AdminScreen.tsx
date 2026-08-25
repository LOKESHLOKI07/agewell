import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { router, type Href } from 'expo-router';
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
  const { isDesktop } = useAdminLayout();

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

      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {!backHref && actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>
      {children}
    </View>
  );

  if (!scroll) {
    return <View style={[styles.container, contentStyle]}>{body}</View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isDesktop ? styles.contentDesktop : null, contentStyle]}
      keyboardShouldPersistTaps="handled"
    >
      {body}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  titleBlock: {
    flex: 1,
    minWidth: 200,
  },
  title: {
    ...typography.title,
    color: colors.text,
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
  pressed: {
    opacity: 0.85,
  },
});
