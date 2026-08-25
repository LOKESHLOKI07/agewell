import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { EmptyState } from '@/components';
import { colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { HealthInfoCard } from '@/features/health/components/HealthInfoCard';
import { isHttpUrl } from '@/features/health/selectors';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { FamilyQueryView } from './components/FamilyQueryView';
import { FamilySubScreen } from './components/FamilySubScreen';
import { useFamilyHealthDocuments, useFamilyScope } from './hooks';

export function FamilyDocumentsScreen() {
  const { selectedSeniorId } = useFamilyScope();
  const query = useFamilyHealthDocuments(selectedSeniorId);
  const [openError, setOpenError] = useState<string | null>(null);
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: (query.data?.items.length ?? 0) === 0,
  });

  const openDocument = async (url: string | null) => {
    setOpenError(null);
    if (!isHttpUrl(url)) {
      setOpenError('This document cannot be opened.');
      return;
    }
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        setOpenError('This document cannot be opened.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      setOpenError('This document cannot be opened.');
    }
  };

  if (!selectedSeniorId) {
    return (
      <FamilySubScreen title="Documents">
        <EmptyState icon="people-outline" title="No senior selected" message="Choose a senior from the Health tab first." />
      </FamilySubScreen>
    );
  }

  return (
    <FamilySubScreen title="Documents">
      <FamilyQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading documents..."
        emptyIcon="document-outline"
        emptyTitle="No documents"
        emptyMessage="Health documents will appear here when they are on file."
      >
        <View style={styles.list}>
          {query.data?.items.map((item) => (
            <View key={item.id} style={styles.item}>
              <HealthInfoCard title={item.documentType ?? 'Document'} lines={[]} />
              <Pressable
                style={styles.openButton}
                onPress={() => void openDocument(item.fileUrl)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.documentType ?? 'document'}`}
              >
                <Text style={styles.openLabel}>Open document</Text>
              </Pressable>
            </View>
          ))}
          {openError ? (
            <Text style={styles.error} accessibilityRole="alert">
              {openError}
            </Text>
          ) : null}
        </View>
      </FamilyQueryView>
    </FamilySubScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  item: {
    gap: spacing.sm,
  },
  openButton: {
    minHeight: minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  openLabel: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  error: {
    ...typography.body,
    color: colors.emergency,
    textAlign: 'center',
  },
});
