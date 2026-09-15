import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  error?: string | null;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  busy = false,
  error = null,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={busy ? undefined : onCancel}>
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={busy ? undefined : onCancel}
          accessibilityRole="button"
          accessibilityLabel="Close dialog"
          disabled={busy}
        />
        <View style={styles.cardWrap}>
          <View style={styles.card} accessibilityRole="alert">
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.actions}>
              <SecondaryButton label={cancelLabel} onPress={onCancel} disabled={busy} />
              <PrimaryButton label={confirmLabel} onPress={onConfirm} loading={busy} disabled={busy} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  cardWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    padding: spacing.xxl,
    zIndex: 2,
    pointerEvents: 'box-none',
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    padding: spacing.xxl,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
    marginBottom: spacing.lg,
  },
  actions: {
    gap: spacing.md,
  },
});
