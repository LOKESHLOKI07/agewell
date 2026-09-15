import { useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { PrimaryButton, SecondaryButton, StatusBadge } from '@/components';
import { cardSurface, colors, spacing, tones, typography } from '@/constants/theme';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { deliveryExecutiveShareHref } from '@/features/deliveries/selectors';
import { formatLongDate, formatTime } from '@/utils/date';
import { CareQueryView } from './components/CareQueryView';
import { CareSubScreen } from './components/CareSubScreen';
import { useDeliveries, useUpdateDeliveryStatus } from './hooks';
import { asDeliveryList, staffDeliveryStatusPresentation } from './staffHomeModel';
import type { DeliveryStatus } from './types';

export function StaffDeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deliveries = useDeliveries();
  const updateStatus = useUpdateDeliveryStatus();
  const delivery = useMemo(
    () => asDeliveryList(deliveries.data?.items).find((item) => item.id === id) ?? null,
    [deliveries.data?.items, id],
  );
  const state = getSectionState({
    isPending: deliveries.isPending,
    isError: deliveries.isError,
    isEmpty: deliveries.isSuccess && !delivery,
  });
  const status = delivery ? staffDeliveryStatusPresentation(delivery.status) : null;
  const palette = status ? tones[status.tone === 'default' ? 'primary' : status.tone] : tones.info;

  const setStatus = async (next: DeliveryStatus) => {
    if (!delivery) {
      return;
    }
    try {
      await updateStatus.mutateAsync({ deliveryId: delivery.id, status: next });
    } catch {
      Alert.alert('Update failed', 'Could not update this delivery. Please try again.');
    }
  };

  return (
    <CareSubScreen title="Delivery">
      <CareQueryView
        state={state}
        error={deliveries.error}
        onRetry={() => void deliveries.refetch()}
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
              <Text style={styles.value}>{delivery.location ?? 'Not on file'}</Text>
              <Text style={styles.label}>Scheduled</Text>
              <Text style={styles.value}>
                {delivery.scheduledAt
                  ? `${formatLongDate(delivery.scheduledAt)} · ${formatTime(delivery.scheduledAt)}`
                  : 'Time not set'}
              </Text>
            </View>
            <View style={styles.actions}>
              {delivery.status === 'PENDING' ? (
                <PrimaryButton
                  label="Mark En Route"
                  onPress={() => void setStatus('EN_ROUTE')}
                  loading={updateStatus.isPending}
                />
              ) : null}
              {delivery.status === 'EN_ROUTE' ? (
                <>
                  <PrimaryButton
                    label="Share Live Location"
                    onPress={() => router.push(deliveryExecutiveShareHref(delivery.id) as Href)}
                  />
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
  actions: {
    gap: spacing.md,
  },
});
