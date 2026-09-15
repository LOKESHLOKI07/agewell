import { StyleSheet, Text, View } from 'react-native';
import { StatusBadge } from '@/components';
import { cardSurface, colors, spacing, tones, typography } from '@/constants/theme';
import { getSectionState, humanizeStatus } from '@/features/home/selectors/homeViewModel';
import { CareQueryView } from './components/CareQueryView';
import { CareSubScreen } from './components/CareSubScreen';
import { useTrainingHome } from './hooks';

export function StaffTrainingScreen() {
  const query = useTrainingHome();
  const modules = query.data?.modules ?? [];
  const documents = query.data?.documents ?? [];
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && modules.length === 0 && documents.length === 0,
  });

  return (
    <CareSubScreen title="Training & Documents">
      <CareQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading training..."
        emptyIcon="document-outline"
        emptyTitle="No training yet"
        emptyMessage="Assigned modules and documents will appear here."
      >
        <Text style={styles.section}>Modules</Text>
        <View style={styles.list}>
          {modules.map((module) => (
            <View key={module.id} style={styles.card}>
              <Text style={styles.title}>{module.title}</Text>
              <StatusBadge
                presentation={{
                  label: humanizeStatus(module.status),
                  color: module.status === 'COMPLETED' ? tones.safe.fg : tones.info.fg,
                  background: module.status === 'COMPLETED' ? tones.safe.bg : tones.info.bg,
                }}
              />
            </View>
          ))}
          {modules.length === 0 ? <Text style={styles.empty}>No modules assigned.</Text> : null}
        </View>

        <Text style={styles.section}>Documents</Text>
        <View style={styles.list}>
          {documents.map((doc) => (
            <View key={doc.id} style={styles.card}>
              <Text style={styles.title}>{doc.title}</Text>
              <Text style={styles.meta}>{doc.verified === 'true' || doc.verified === 'VERIFIED' ? 'Verified' : doc.verified}</Text>
            </View>
          ))}
          {documents.length === 0 ? <Text style={styles.empty}>No documents on file.</Text> : null}
        </View>
      </CareQueryView>
    </CareSubScreen>
  );
}

const styles = StyleSheet.create({
  section: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    ...cardSurface,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
    flex: 1,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
