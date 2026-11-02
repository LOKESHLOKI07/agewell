import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/authStore';
import { useForegroundLocationWatch, useResumeSeniorLiveLocation } from './hooks';
import { canWatchSharedLocation } from './selectors';
import { useTrackingShareStore } from './shareStore';

export function TrackingShareHost() {
  const role = useAuthStore((state) => state.user?.role);
  const isSharing = useTrackingShareStore((state) => state.isSharing);
  const sessionId = useTrackingShareStore((state) => state.sessionId);
  const kind = useTrackingShareStore((state) => state.kind);
  const stopShare = useTrackingShareStore((state) => state.stop);
  const allowed = canWatchSharedLocation(role, kind);

  useEffect(() => {
    if (isSharing && !allowed) {
      stopShare();
    }
  }, [allowed, isSharing, stopShare]);

  useResumeSeniorLiveLocation();
  useForegroundLocationWatch(Boolean(isSharing && allowed), sessionId);
  return null;
}
