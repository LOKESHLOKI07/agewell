import { create } from 'zustand';

export type TrackingShareKind = 'senior' | 'care-associate';

const STORAGE_KEY = 'agewell.trackingShare';

interface PersistedShare {
  isSharing: boolean;
  sessionId: string | null;
  kind: TrackingShareKind | null;
  stoppedSessionId: string | null;
}

interface TrackingShareState extends PersistedShare {
  start: (sessionId: string, kind?: TrackingShareKind) => void;
  stop: () => void;
}

function readPersistedShare(): PersistedShare {
  const empty: PersistedShare = { isSharing: false, sessionId: null, kind: null, stoppedSessionId: null };
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) {
      return empty;
    }
    const parsed = JSON.parse(raw) as Partial<PersistedShare>;
    if (parsed.isSharing && typeof parsed.sessionId === 'string' && parsed.sessionId.length > 0) {
      return {
        isSharing: true,
        sessionId: parsed.sessionId,
        kind: parsed.kind === 'care-associate' ? 'care-associate' : 'senior',
        stoppedSessionId: null,
      };
    }
    return {
      ...empty,
      stoppedSessionId: typeof parsed.stoppedSessionId === 'string' ? parsed.stoppedSessionId : null,
    };
  } catch {
    return empty;
  }
}

function writePersistedShare(state: PersistedShare) {
  try {
    globalThis.localStorage?.setItem(
      STORAGE_KEY,
      JSON.stringify({
        isSharing: state.isSharing,
        sessionId: state.sessionId,
        kind: state.kind,
        stoppedSessionId: state.stoppedSessionId,
      }),
    );
  } catch {
    return;
  }
}

const initial = readPersistedShare();

export const useTrackingShareStore = create<TrackingShareState>((set, get) => ({
  isSharing: initial.isSharing,
  sessionId: initial.sessionId,
  kind: initial.kind,
  stoppedSessionId: initial.stoppedSessionId,
  start: (sessionId, kind = 'senior') => {
    const next: PersistedShare = { isSharing: true, sessionId, kind, stoppedSessionId: null };
    writePersistedShare(next);
    set(next);
  },
  stop: () => {
    const current = get();
    const next: PersistedShare = {
      isSharing: false,
      sessionId: null,
      kind: null,
      stoppedSessionId: current.sessionId,
    };
    writePersistedShare(next);
    set(next);
  },
}));
