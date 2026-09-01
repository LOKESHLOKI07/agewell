import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { ConfirmDialog, PrimaryButton, SecondaryButton, TextField } from '@/components';
import { colors, radius, spacing, typography } from '@/constants/theme';
import {
  OFFERING_SERVICE_SLUGS,
  type ServiceOffering,
} from '@/features/membership/catalogTypes';
import {
  useCreateServiceOffering,
  useDeleteServiceOffering,
  useServiceOfferings,
  useUpdateServiceOffering,
} from '@/features/membership/useCatalog';
import { pickProfilePhoto } from '@/features/profile/profilePhoto';
import { MARKETPLACE_SERVICES } from '@/features/services/serviceCatalog';
import { AdminCollection } from './components/AdminCollection';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { getAdminErrorMessage, getSectionState } from './selectors';

const DEDICATED_CATALOGS: { label: string; slug: string; href: Href; hint: string }[] = [
  {
    label: 'Grocery Delivery',
    slug: 'grocery',
    href: '/(admin)/catalog/grocery' as Href,
    hint: 'Categories, products and product images',
  },
  {
    label: 'Food Delivery',
    slug: 'food',
    href: '/(admin)/catalog/food' as Href,
    hint: 'Cuisines, menu items and dish images',
  },
];

const SLUG_OPTIONS = OFFERING_SERVICE_SLUGS.map((slug) => {
  const service = MARKETPLACE_SERVICES.find((item) => item.id === slug);
  return { value: slug, label: service?.title ?? slug };
});

export function AdminServiceOfferingsHubScreen() {
  return (
    <AdminScreen
      title="Service items"
      subtitle="Catalogues for every membership service — add, edit and upload images."
    >
      <Text style={styles.hubSection}>Delivery catalogs</Text>
      <View style={styles.hubList}>
        {DEDICATED_CATALOGS.map((item) => (
          <Pressable
            key={item.slug}
            style={styles.hubRow}
            onPress={() => router.push(item.href)}
            accessibilityRole="button"
            accessibilityLabel={`Manage ${item.label}`}
          >
            <Text style={styles.hubTitle}>{item.label}</Text>
            <Text style={styles.hubSlug}>{item.hint}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.hubSection}>Other services</Text>
      <View style={styles.hubList}>
        {SLUG_OPTIONS.map((item) => (
          <Pressable
            key={item.value}
            style={styles.hubRow}
            onPress={() => router.push(`/(admin)/catalog/offerings/${item.value}` as Href)}
            accessibilityRole="button"
            accessibilityLabel={`Manage ${item.label}`}
          >
            <Text style={styles.hubTitle}>{item.label}</Text>
            <Text style={styles.hubSlug}>{item.value}</Text>
          </Pressable>
        ))}
      </View>
    </AdminScreen>
  );
}

export function AdminServiceOfferingsScreen() {
  const { slug: slugParam } = useLocalSearchParams<{ slug?: string }>();
  const initialSlug =
    typeof slugParam === 'string' && OFFERING_SERVICE_SLUGS.includes(slugParam as (typeof OFFERING_SERVICE_SLUGS)[number])
      ? slugParam
      : OFFERING_SERVICE_SLUGS[0];

  const [serviceSlug, setServiceSlug] = useState(initialSlug);
  const query = useServiceOfferings(serviceSlug, true);
  const createItem = useCreateServiceOffering();
  const updateItem = useUpdateServiceOffering();
  const deleteItem = useDeleteServiceOffering();

  const items = query.data ?? [];
  const serviceLabel = useMemo(
    () => SLUG_OPTIONS.find((item) => item.value === serviceSlug)?.label ?? serviceSlug,
    [serviceSlug],
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [priceLabel, setPriceLabel] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: items.length === 0,
  });

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setBadge('');
    setPriceLabel('');
    setImage(null);
  };

  const startEdit = (item: ServiceOffering) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setBadge(item.badge);
    setPriceLabel(item.priceLabel);
    setImage(item.image);
    setFormError(null);
  };

  const onPickImage = async () => {
    try {
      const dataUrl = await pickProfilePhoto('library');
      if (dataUrl) setImage(dataUrl);
    } catch (error) {
      Alert.alert('Image', error instanceof Error ? error.message : 'Unable to pick image.');
    }
  };

  const onSave = () => {
    const cleanedTitle = title.trim();
    if (!cleanedTitle) {
      setFormError('Enter a title.');
      return;
    }
    setFormError(null);
    const payload = {
      serviceSlug,
      title: cleanedTitle,
      description: description.trim(),
      badge: badge.trim(),
      priceLabel: priceLabel.trim(),
      image,
    };
    if (editingId) {
      updateItem.mutate(
        { id: editingId, ...payload },
        {
          onSuccess: () => resetForm(),
          onError: (error) => setFormError(getAdminErrorMessage(error)),
        },
      );
      return;
    }
    createItem.mutate(payload, {
      onSuccess: () => resetForm(),
      onError: (error) => setFormError(getAdminErrorMessage(error)),
    });
  };

  return (
    <AdminScreen
      title={`${serviceLabel} items`}
      subtitle="These items appear on the member service screen. Upload an image per item."
    >
      <AdminFilterChips
        label="Service"
        value={serviceSlug}
        options={SLUG_OPTIONS}
        onChange={(next) => {
          if (!next) return;
          setServiceSlug(next);
          resetForm();
          router.replace(`/(admin)/catalog/offerings/${next}` as Href);
        }}
        allowAll={false}
      />

      {formError ? <Text style={styles.error}>{formError}</Text> : null}

      <Text style={styles.section}>{editingId ? 'Edit item' : 'Add item'}</Text>
      <TextField label="Title" value={title} onChangeText={setTitle} />
      <TextField label="Description" value={description} onChangeText={setDescription} multiline />
      <TextField label="Badge (e.g. helpers, specialty)" value={badge} onChangeText={setBadge} />
      <TextField label="Price / slot label" value={priceLabel} onChangeText={setPriceLabel} />
      <View style={styles.imageRow}>
        {image ? <Image source={{ uri: image }} style={styles.thumb} accessibilityLabel="Item image preview" /> : null}
        <PrimaryButton label={image ? 'Change image' : 'Upload image'} onPress={() => void onPickImage()} />
        {image ? (
          <Pressable onPress={() => setImage(null)} accessibilityRole="button" accessibilityLabel="Remove image">
            <Text style={styles.link}>Remove</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.formActions}>
        <PrimaryButton
          label={editingId ? 'Save item' : 'Add item'}
          loading={createItem.isPending || updateItem.isPending}
          onPress={onSave}
        />
        {editingId ? <SecondaryButton label="Cancel edit" onPress={resetForm} /> : null}
      </View>

      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading items..."
        emptyTitle="No items yet"
        emptyMessage="Add the first catalogue item for this service."
      >
        <AdminCollection
          items={items}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => item.title}
          columns={[
            {
              key: 'image',
              label: 'Image',
              flex: 0.7,
              render: (item) =>
                item.image ? (
                  <Image source={{ uri: item.image }} style={styles.thumbSm} accessibilityLabel={`${item.title} image`} />
                ) : (
                  <Text style={cell}>—</Text>
                ),
            },
            { key: 'title', label: 'Item', render: (item) => <Text style={cell}>{item.title}</Text> },
            {
              key: 'meta',
              label: 'Badge / price',
              render: (item) => (
                <Text style={cell}>
                  {item.badge || '—'} · {item.priceLabel || '—'}
                </Text>
              ),
            },
            {
              key: 'active',
              label: 'Shown',
              render: (item) => (
                <Pressable
                  onPress={() =>
                    updateItem.mutate(
                      { id: item.id, isActive: !item.isActive },
                      { onError: (error) => setFormError(getAdminErrorMessage(error)) },
                    )
                  }
                  accessibilityRole="button"
                >
                  <Text style={styles.link}>{item.isActive ? 'Active' : 'Hidden'}</Text>
                </Pressable>
              ),
            },
            {
              key: 'actions',
              label: 'Actions',
              flex: 1.2,
              render: (item) => (
                <View style={styles.rowActions}>
                  <Pressable onPress={() => startEdit(item)} accessibilityRole="button">
                    <Text style={styles.link}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setPendingDelete({ id: item.id, name: item.title })}
                    accessibilityRole="button"
                  >
                    <Text style={styles.danger}>Delete</Text>
                  </Pressable>
                </View>
              ),
            },
          ]}
        />
      </AdminQueryView>

      <ConfirmDialog
        visible={Boolean(pendingDelete)}
        title="Delete this item?"
        message={pendingDelete ? `Remove ${pendingDelete.name}?` : ''}
        confirmLabel={deleteItem.isPending ? 'Working…' : 'Delete'}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          const id = pendingDelete.id;
          setPendingDelete(null);
          deleteItem.mutate(id, { onError: (error) => setFormError(getAdminErrorMessage(error)) });
        }}
      />
    </AdminScreen>
  );
}

const cell = { ...typography.body, color: colors.text };

const styles = StyleSheet.create({
  section: {
    ...typography.subtitle,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
    marginBottom: spacing.md,
  },
  formActions: { gap: spacing.sm, marginBottom: spacing.md },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  thumbSm: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  link: { ...typography.captionStrong, color: colors.primary },
  danger: { ...typography.captionStrong, color: colors.emergency },
  hubList: { gap: spacing.sm },
  hubSection: {
    ...typography.subtitle,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  hubRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.surfaceElevated,
  },
  hubTitle: { ...typography.bodyStrong, color: colors.text },
  hubSlug: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
