import type { ReactNode } from 'react';
import { EmptyState, ErrorState, LoadingState } from '@/components';
import { getApiErrorMessage } from '@/api/errors';
import type { IconName } from '@/components/ui';
import type { HomeSectionState } from '@/features/home/types/home';

interface HealthQueryViewProps {
  state: HomeSectionState;
  error: unknown;
  onRetry: () => void;
  loadingMessage: string;
  emptyIcon: IconName;
  emptyTitle: string;
  emptyMessage: string;
  children: ReactNode;
}

export function HealthQueryView({
  state,
  error,
  onRetry,
  loadingMessage,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  children,
}: HealthQueryViewProps) {
  if (state === 'loading') {
    return <LoadingState message={loadingMessage} />;
  }
  if (state === 'error') {
    return <ErrorState message={getApiErrorMessage(error)} onRetry={onRetry} />;
  }
  if (state === 'empty') {
    return <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />;
  }
  return <>{children}</>;
}
