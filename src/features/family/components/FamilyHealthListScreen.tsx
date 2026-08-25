import { Fragment, type ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components';
import type { IconName } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import type { ListPage } from '@/features/home/types/home';
import { FamilyQueryView } from './FamilyQueryView';
import { FamilySubScreen } from './FamilySubScreen';
import { useFamilyScope } from '../hooks';

interface FamilyHealthListScreenProps<T> {
  title: string;
  query: UseQueryResult<ListPage<T>>;
  loadingMessage: string;
  emptyIcon: IconName;
  emptyTitle: string;
  emptyMessage: string;
  renderItem: (item: T) => ReactNode;
}

export function FamilyHealthListScreen<T extends { id?: string }>({
  title,
  query,
  loadingMessage,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  renderItem,
}: FamilyHealthListScreenProps<T>) {
  const { selectedSeniorId } = useFamilyScope();
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: (query.data?.items.length ?? 0) === 0,
  });

  if (!selectedSeniorId) {
    return (
      <FamilySubScreen title={title}>
        <EmptyState
          icon="people-outline"
          title="No senior selected"
          message="Choose a senior from the Health tab first."
        />
      </FamilySubScreen>
    );
  }

  return (
    <FamilySubScreen title={title}>
      <FamilyQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage={loadingMessage}
        emptyIcon={emptyIcon}
        emptyTitle={emptyTitle}
        emptyMessage={emptyMessage}
      >
        <View style={styles.list}>
          {query.data?.items.map((item, index) => (
            <Fragment key={item.id ?? `item-${index}`}>{renderItem(item)}</Fragment>
          ))}
        </View>
      </FamilyQueryView>
    </FamilySubScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
});
