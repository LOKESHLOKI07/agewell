import type { ReactNode } from 'react';
import { EmptyState, ErrorState, LoadingState } from '@/components';
import type { IconName } from '@/components/ui';
import type { HomeSectionState } from '@/features/home/types/home';
import { getEmergencyLoadErrorMessage } from '../selectors';

interface EmergencyQueryViewProps {
  state: HomeSectionState;
  error: unknown;
  onRetry: () => void;
  loadingMessage: string;
  emptyIcon: IconName;
  emptyTitle: string;
  emptyMessage: string;
  children: ReactNode;
}

export function EmergencyQueryView({
  state,
  error,
  onRetry,
  loadingMessage,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  children,
}: EmergencyQueryViewProps) {
  if (state === 'loading') {
    return <LoadingState message={loadingMessage} />;
  }
  if (state === 'error') {
    return <ErrorState message={getEmergencyLoadErrorMessage(error)} onRetry={onRetry} />;
  }
  if (state === 'empty') {
    return <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />;
  }
  return <>{children}</>;
}
