import { useForegroundLocationWatch, useResumeSeniorLiveLocation } from './hooks';
import { useTrackingShareStore } from './shareStore';

export function TrackingShareHost() {
  const isSharing = useTrackingShareStore((state) => state.isSharing);
  const sessionId = useTrackingShareStore((state) => state.sessionId);
  useResumeSeniorLiveLocation();
  useForegroundLocationWatch(isSharing, sessionId);
  return null;
}
