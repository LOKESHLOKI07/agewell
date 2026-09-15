import { useEffect, useState, type ComponentType } from 'react';
import { canUseRemotePush } from './pushAvailability';

/**
 * Keep `expo-notifications` out of the root layout graph. Expo Go on Android
 * throws if that module is evaluated, which otherwise blanks the whole app.
 */
export function PushRegistrationHost() {
  const [Runtime, setRuntime] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (!canUseRemotePush()) {
      return;
    }
    let cancelled = false;
    void import('./PushRegistrationRuntime')
      .then((mod) => {
        if (!cancelled) {
          setRuntime(() => mod.PushRegistrationRuntime);
        }
      })
      .catch(() => {
        // Development in Expo Go can still reject if the chunk is evaluated.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Runtime) {
    return null;
  }
  return <Runtime />;
}
