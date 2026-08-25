import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components';
import { colors, spacing } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { useI18n } from '@/i18n';
import { findLifeCategory } from './categories';

export function LifeCategoryScreen() {
  const insets = useSafeAreaInsets();
  const { category: categoryId } = useLocalSearchParams<{ category: string }>();
  const category = findLifeCategory(categoryId);
  const { t } = useI18n();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title={category?.title ?? t('life.title')} showBack showProfile={false} />
      <View style={styles.body}>
        <EmptyState
          icon={category?.icon ?? 'sparkles'}
          title={category ? `${category.title}` : 'Category not found'}
          message={
            category
              ? `${t('life.empty')} There is no AgeWell Life content API yet for ${category.title}.`
              : t('life.empty')
          }
        />
        <Text style={styles.note}>Backend required: entertainment / AgeWell Life content endpoints.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  note: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
  },
});
