import type { ReactNode } from 'react';
import { EmptyState, ErrorState, LoadingState } from '@/components';
import type { IconName } from '@/components/ui';
import type { HomeSectionState } from '@/features/home/types/home';
import { getAdminErrorMessage } from '../selectors';

interface AdminQueryViewProps {
  state: HomeSectionState;
  error: unknown;
  onRetry: () => void;
  loadingMessage: string;
  emptyIcon?: IconName;
  emptyTitle: string;
  emptyMessage: string;
  errorKind?: 'default' | 'access' | 'care' | 'user';
  children: ReactNode;
}

export function AdminQueryView({
  state,
  error,
  onRetry,
  loadingMessage,
  emptyIcon = 'file-tray-outline',
  emptyTitle,
  emptyMessage,
  errorKind = 'default',
  children,
}: AdminQueryViewProps) {
  if (state === 'loading') {
    return <LoadingState message={loadingMessage} />;
  }
  if (state === 'error') {
    return <ErrorState message={getAdminErrorMessage(error, errorKind)} onRetry={onRetry} />;
  }
  if (state === 'empty') {
    return <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />;
  }
  return <>{children}</>;
}
