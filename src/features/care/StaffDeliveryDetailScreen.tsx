import { useMemo, useState } from 'react';
import { Alert, Image, Linking, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { PrimaryButton, SecondaryButton, StatusBadge } from '@/components';
import { cardSurface, colors, radius, spacing, tones, typography } from '@/constants/theme';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { deliveryExecutiveShareHref, deliverySlugFromTitle, isDeliveryTrackable } from '@/features/deliveries/selectors';
import { mapsNavigationUrl, parseDeliveryDestination } from '@/features/profile/deliveryDestination';
import { requiresProofPhoto } from '@/features/services/servicePolicy';
import { ProofPhotoField } from './ProofPhotoField';
import { displayRequestNotes, requestNotesTitle } from './requestNotes';
import { formatLongDate, formatTime } from '@/utils/date';
import { ExpenseSubmitForm } from '@/features/credits/ExpenseSubmitForm';
import { CareQueryView } from './components/CareQueryView';
import { CareSubScreen } from './components/CareSubScreen';
import { useDeliveries, useDeliveryDetail, useUpdateDeliveryStatus } from './hooks';
import { asDeliveryList, staffDeliveryStatusPresentation } from './staffHomeModel';
import type { DeliveryStatus } from './types';

export function StaffDeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deliveries = useDeliveries();
  const detail = useDeliveryDetail(id);
  const updateStatus = useUpdateDeliveryStatus();
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const delivery = useMemo(
    () => detail.data ?? asDeliveryList(deliveries.data?.items).find((item) => item.id === id) ?? null,
    [deliveries.data?.items, detail.data, id],
  );
  const state = getSectionState({
    isPending: (detail.isPending || deliveries.isPending) && !delivery,
    isError: detail.isError && deliveries.isError,
    isEmpty: (detail.isSuccess || deliveries.isSuccess) && !delivery,
  });
  const shoppingNotes = displayRequestNotes(delivery?.requestNotes);
  const listTitle = requestNotesTitle(delivery?.serviceSlug ?? deliverySlugFromTitle(delivery?.title ?? ''));
  const status = delivery ? staffDeliveryStatusPresentation(delivery.status) : null;
  const palette = status ? tones[status.tone === 'default' ? 'primary' : status.tone] : tones.info;
  const destination = useMemo(() => parseDeliveryDestination(delivery?.location), [delivery?.location]);
  const locationLabel = destination.label ?? (destination.coordinate ? 'Pinned on map' : 'Not on file');
  const navigateUrl = mapsNavigationUrl(destination);

  const setStatus = async (next: DeliveryStatus) => {
    if (!delivery) {
      return;
    }
    const slug = delivery.serviceSlug ?? deliverySlugFromTitle(delivery.title);
    if (next === 'COMPLETED' && requiresProofPhoto(slug) && !proofPhoto) {
      Alert.alert('Photo required', 'Attach a proof photo before completing this delivery.');
      return;
    }
    try {
      await updateStatus.mutateAsync({
        deliveryId: delivery.id,
        status: next,
        proofPhoto: next === 'COMPLETED' ? proofPhoto : null,
      });
    } catch {
      Alert.alert('Update failed', 'Could not update this delivery. Please try again.');
    }
  };

  return (
    <CareSubScreen title="Delivery">
      <CareQueryView
        state={state}
        error={detail.error ?? deliveries.error}
        onRetry={() => void Promise.all([detail.refetch(), deliveries.refetch()])}
        loadingMessage="Loading delivery..."
        emptyIcon="bike"
        emptyTitle="Delivery not found"
        emptyMessage="This delivery is not available."
      >
        {delivery && status ? (
          <>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.title}>{delivery.title}</Text>
                <StatusBadge
                  presentation={{
                    label: status.label,
                    color: palette.fg,
                    background: palette.bg,
                  }}
                />
              </View>
              <Text style={styles.label}>Customer</Text>
              <Text style={styles.value}>{delivery.customerName ?? 'Not on file'}</Text>
              <Text style={styles.label}>Location</Text>
              <Text style={styles.value}>{locationLabel}</Text>
              {destination.coordinate ? (
                <Text style={styles.pinMeta}>
                  Pin {destination.coordinate.latitude.toFixed(5)}, {destination.coordinate.longitude.toFixed(5)}
                </Text>
              ) : null}
              <Text style={styles.label}>Scheduled</Text>
              <Text style={styles.value}>
                {delivery.scheduledAt
                  ? `${formatLongDate(delivery.scheduledAt)} · ${formatTime(delivery.scheduledAt)}`
                  : 'Time not set'}
              </Text>
              <Text style={styles.label}>{listTitle}</Text>
              {shoppingNotes ? <Text style={styles.list}>{shoppingNotes}</Text> : null}
              {delivery.listPhoto ? (
                <Image source={{ uri: delivery.listPhoto }} style={styles.listPhoto} resizeMode="contain" />
              ) : null}
              {!shoppingNotes && !delivery.listPhoto ? (
                <Text style={styles.value}>The senior did not attach a list or photo.</Text>
              ) : null}
            </View>
            <View style={styles.actions}>
              {navigateUrl ? (
                <SecondaryButton
                  label="Navigate to home pin"
                  onPress={() => void Linking.openURL(navigateUrl)}
                />
              ) : null}
              {delivery.status === 'PENDING' ? (
                <PrimaryButton
                  label="Mark En Route"
                  onPress={() => void setStatus('EN_ROUTE')}
                  loading={updateStatus.isPending}
                />
              ) : null}
              {delivery.status === 'EN_ROUTE' ? (
                <>
                  {isDeliveryTrackable({
                    ...delivery,
                    executiveName: null,
                  }) ? (
                  <PrimaryButton
                    label="Share Live Location"
                    onPress={() => router.push(deliveryExecutiveShareHref(delivery.id) as Href)}
                  />
                  ) : null}
                  {requiresProofPhoto(delivery.serviceSlug ?? deliverySlugFromTitle(delivery.title)) ? (
                    <ProofPhotoField value={proofPhoto} onChange={setProofPhoto} required />
                  ) : null}
                  <PrimaryButton
                    label="Mark Completed"
                    onPress={() => void setStatus('COMPLETED')}
                    loading={updateStatus.isPending}
                  />
                </>
              ) : null}
              {delivery.status !== 'FAILED' && delivery.status !== 'COMPLETED' ? (
                <SecondaryButton label="Mark Failed" onPress={() => void setStatus('FAILED')} />
              ) : null}
              {delivery.status === 'COMPLETED' && delivery.serviceRequestId ? (
                <ExpenseSubmitForm
                  serviceRequestId={delivery.serviceRequestId}
                  title={delivery.title || 'Service expense'}
                />
              ) : null}
            </View>
          </>
        ) : null}
      </CareQueryView>
    </CareSubScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardSurface,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    ...typography.subtitle,
    color: colors.text,
    flex: 1,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  value: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.xs,
  },
  pinMeta: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  list: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  listPhoto: {
    marginTop: spacing.md,
    width: '100%',
    height: 280,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  actions: {
    gap: spacing.md,
  },
});
