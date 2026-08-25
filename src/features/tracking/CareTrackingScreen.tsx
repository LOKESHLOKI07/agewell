import { useLocalSearchParams } from 'expo-router';
import { EmptyState, ErrorState } from '@/components';
import { CareSubScreen } from '@/features/care/components/CareSubScreen';
import { GpsStatusCard } from './components/GpsStatusCard';
import { useSeniorViewerLocation } from './hooks';

export function CareTrackingScreen() {
  const { seniorId } = useLocalSearchParams<{ seniorId?: string }>();
  const scopedId = typeof seniorId === 'string' && seniorId.length > 0 ? seniorId : null;
  const viewer = useSeniorViewerLocation(scopedId);

  return (
    <CareSubScreen title="Live location">
      {!scopedId ? (
        <EmptyState
          icon="location"
          title="Location unavailable"
          message="Open an assigned visit to view that senior's live location."
        />
      ) : viewer.state.kind === 'error' || viewer.state.kind === 'forbidden' ? (
        <ErrorState
          title={viewer.state.title}
          message={viewer.state.message}
          onRetry={() => {
            void viewer.sessions.refetch();
            void viewer.latest.refetch();
          }}
        />
      ) : (
        <GpsStatusCard title={viewer.state.title} message={viewer.state.message} point={viewer.state.point} />
      )}
    </CareSubScreen>
  );
}
