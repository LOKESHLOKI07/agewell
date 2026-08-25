import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '@/components';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import type { CatalogService } from '@/features/home/types/home';
import { SERVICE_CATEGORY_ICONS, SERVICE_CATEGORY_LABELS } from '../selectors';
import { ServiceIcon } from './ServiceIcon';

type ServiceRequestSheetProps = {
  visible: boolean;
  service: CatalogService | null;
  seniorName: string | null;
  submitting?: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Confirm sheet before creating a service request.
 * Does not imply payment — only submits POST /services/requests.
 */
export function ServiceRequestSheet({
  visible,
  service,
  seniorName,
  submitting = false,
  errorMessage,
  onConfirm,
  onCancel,
}: ServiceRequestSheetProps) {
  if (!service) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel="Dismiss" />
      <View style={[styles.sheet, shadows.float]} accessibilityViewIsModal>
        <View style={styles.handle} />
        <ServiceIcon name={SERVICE_CATEGORY_ICONS[service.category] ?? 'grid'} size={56} />
        <Text style={styles.title}>Request {service.name}?</Text>
        <Text style={styles.body}>
          {SERVICE_CATEGORY_LABELS[service.category]}
          {seniorName ? ` · For ${seniorName}` : ''}
        </Text>
        <Text style={styles.note}>
          This sends a request to AgeWell. Payment is not available in the app yet — no charge is made here.
        </Text>
        {errorMessage ? (
          <Text style={styles.error} accessibilityRole="alert">
            {errorMessage}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <SecondaryButton label="Cancel" onPress={onCancel} disabled={submitting} />
          <PrimaryButton
            label={submitting ? 'Sending request…' : 'Confirm request'}
            onPress={onConfirm}
            loading={submitting}
            disabled={submitting}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.huge,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
  },
  note: {
    ...typography.caption,
    color: colors.textMuted,
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.md,
    minHeight: minTouchSize,
  },
});
