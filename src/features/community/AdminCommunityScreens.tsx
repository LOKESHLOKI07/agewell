import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { ConfirmDialog, PrimaryButton, SecondaryButton, TextField } from '@/components';
import { DISPLAY_DATE_PLACEHOLDER } from '@/utils/date';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { AdminCollection } from '@/features/admin/components/AdminCollection';
import { AdminQueryView } from '@/features/admin/components/AdminQueryView';
import { AdminScreen } from '@/features/admin/components/AdminScreen';
import { getAdminErrorMessage, getSectionState } from '@/features/admin/selectors';
import {
  useCommunityEvent,
  useCommunityEvents,
  useCreateCommunityEvent,
  useDeleteCommunityEvent,
  useUpdateCommunityEvent,
} from './hooks';
import { communityEventFormSchema, type CommunityEventFormValues } from './schemas';
import { adminCommunityCreateHref, adminCommunityHref, capacityLabel, eventDateToForm, eventTitle, formatEventDate, formatEventTime, toEventDateIso } from './selectors';
import type { CommunityEvent } from './types';

export function AdminCommunityListScreen() {
  const query = useCommunityEvents();
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: (query.data?.items.length ?? 0) === 0,
  });

  return (
    <AdminScreen
      title="Community"
      subtitle="Create and manage community events."
      actions={<PrimaryButton label="Create event" onPress={() => router.push(adminCommunityCreateHref() as Href)} />}
    >
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading community events..."
        emptyTitle="No community events"
        emptyMessage="Create an event to get started."
      >
        <AdminCollection
          items={query.data?.items ?? []}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => eventTitle(item)}
          onPress={(item) => router.push(adminCommunityHref(item.id) as Href)}
          columns={[
            { key: 'title', label: 'Title', render: (item: CommunityEvent) => <Text style={cell}>{eventTitle(item)}</Text> },
            {
              key: 'when',
              label: 'Date',
              render: (item) => (
                <Text style={cell}>
                  {[formatEventDate(item.eventDate), formatEventTime(item.eventDate)].filter(Boolean).join(' · ') || 'Not scheduled'}
                </Text>
              ),
            },
            {
              key: 'capacity',
              label: 'Capacity',
              render: (item) => <Text style={cell}>{capacityLabel(item.capacity)}</Text>,
            },
          ]}
        />
      </AdminQueryView>
    </AdminScreen>
  );
}

function EventForm({
  submitLabel,
  defaultValues,
  loading,
  onSubmit,
  error,
}: {
  submitLabel: string;
  defaultValues: CommunityEventFormValues;
  loading: boolean;
  onSubmit: (values: CommunityEventFormValues) => void;
  error: string | null;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CommunityEventFormValues>({
    resolver: zodResolver(communityEventFormSchema),
    defaultValues,
  });

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Title"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.title?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Description"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.description?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="date"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Date"
            placeholder={DISPLAY_DATE_PLACEHOLDER}
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            autoCapitalize="none"
            error={errors.date?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="time"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Time"
            placeholder="HH:MM"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            autoCapitalize="none"
            error={errors.time?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="capacity"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Capacity"
            placeholder="Optional"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            keyboardType="number-pad"
            error={errors.capacity?.message}
          />
        )}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton
        label={submitLabel}
        loading={loading || isSubmitting}
        onPress={handleSubmit(onSubmit)}
      />
    </View>
  );
}

export function AdminCommunityCreateScreen() {
  const create = useCreateCommunityEvent();
  const [formError, setFormError] = useState<string | null>(null);

  return (
    <AdminScreen title="Create event" subtitle="Only title, description, date, and capacity are stored.">
      <EventForm
        submitLabel="Create event"
        defaultValues={{ title: '', description: '', date: '', time: '', capacity: '' }}
        loading={create.isPending}
        error={formError}
        onSubmit={(values) => {
          setFormError(null);
          create.mutate(
            {
              title: values.title,
              description: values.description || null,
              eventDate: toEventDateIso(values.date, values.time),
              capacity: values.capacity ? Number(values.capacity) : null,
            },
            {
              onError: (error) => setFormError(getAdminErrorMessage(error)),
              onSuccess: (event) => router.replace(adminCommunityHref(event.id) as Href),
            },
          );
        }}
      />
    </AdminScreen>
  );
}

export function AdminCommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useCommunityEvent(id);
  const update = useUpdateCommunityEvent(id ?? '');
  const remove = useDeleteCommunityEvent();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formValues, setFormValues] = useState<CommunityEventFormValues>({
    title: '',
    description: '',
    date: '',
    time: '',
    capacity: '',
  });

  useEffect(() => {
    if (query.data) {
      const parts = eventDateToForm(query.data.eventDate);
      setFormValues({
        title: query.data.title ?? '',
        description: query.data.description ?? '',
        date: parts.date,
        time: parts.time,
        capacity: query.data.capacity === null || query.data.capacity === undefined ? '' : String(query.data.capacity),
      });
    }
  }, [query.data]);

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && !query.data,
  });

  return (
    <AdminScreen title="Edit event" subtitle="Update the fields supported by the community API.">
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading event..."
        emptyTitle="Event not found"
        emptyMessage="This community event is not in AgeWell."
      >
        {query.data ? (
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.line}>{eventTitle(query.data)}</Text>
            <EventForm
              key={`${formValues.title}-${formValues.date}-${formValues.time}`}
              submitLabel="Save event"
              defaultValues={formValues}
              loading={update.isPending}
              error={formError}
              onSubmit={(values) => {
                setFormError(null);
                update.mutate(
                  {
                    title: values.title,
                    description: values.description || null,
                    eventDate: toEventDateIso(values.date, values.time),
                    capacity: values.capacity ? Number(values.capacity) : null,
                  },
                  { onError: (error) => setFormError(getAdminErrorMessage(error)) },
                );
              }}
            />
            <SecondaryButton label="Delete event" onPress={() => setConfirmDelete(true)} />
          </View>
        ) : null}
      </AdminQueryView>
      <ConfirmDialog
        visible={confirmDelete}
        title="Delete event"
        message="Delete this community event? Registrations for this event will also be removed."
        confirmLabel="Delete event"
        cancelLabel="Keep event"
        onConfirm={() => {
          if (!id) {
            return;
          }
          remove.mutate(id, {
            onSuccess: () => {
              setConfirmDelete(false);
              router.replace('/(admin)/community' as Href);
            },
            onError: (error) => {
              setConfirmDelete(false);
              setFormError(getAdminErrorMessage(error));
            },
          });
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </AdminScreen>
  );
}

const cell = { ...typography.body, color: colors.text };

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  line: {
    ...typography.heading,
    color: colors.text,
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
  },
});
