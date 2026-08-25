import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { HealthInfoCard } from './components/HealthInfoCard';
import { HealthQueryView } from './components/HealthQueryView';
import { HealthSubScreen } from './components/HealthSubScreen';
import { useHealthDocuments } from './hooks';
import { isHttpUrl } from './selectors';

export function HealthDocumentsScreen() {
  const query = useHealthDocuments();
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

  return (
    <HealthSubScreen title="Health Documents">
      <HealthQueryView
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
              <HealthInfoCard title={item.documentType ?? 'Document'} icon="file-document-outline" lines={[]} />
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
      </HealthQueryView>
    </HealthSubScreen>
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
