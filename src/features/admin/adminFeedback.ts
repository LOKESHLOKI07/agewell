import { ConfirmDialog } from '@/components';

export type AdminSuccessNotice = {
  title: string;
  message: string;
  /** Optional route to open after the user confirms OK. */
  href?: string;
};

type AdminSuccessDialogProps = {
  notice: AdminSuccessNotice | null;
  onClose: (href?: string) => void;
};

/** In-app success dialog — use this on admin web instead of Alert.alert. */
export function AdminSuccessDialog({ notice, onClose }: AdminSuccessDialogProps) {
  return (
    <ConfirmDialog
      visible={Boolean(notice)}
      title={notice?.title ?? ''}
      message={notice?.message ?? ''}
      confirmLabel="OK"
      hideCancel
      onConfirm={() => onClose(notice?.href)}
      onCancel={() => onClose(notice?.href)}
    />
  );
}

export function registerSuccessNotice(message: string, href?: string): AdminSuccessNotice {
  return { title: 'Registered successfully', message, href };
}

export function updateSuccessNotice(message = 'Your changes have been saved.'): AdminSuccessNotice {
  return { title: 'Updated successfully', message };
}
