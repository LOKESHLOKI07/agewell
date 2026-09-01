import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ConfirmDialog, PrimaryButton, SecondaryButton, TextField } from '@/components';
import { colors, radius, spacing, typography } from '@/constants/theme';
import type { FoodCuisine, FoodMeal, FoodMenuItem } from '@/features/membership/catalogTypes';
import {
  useCreateFoodCuisine,
  useCreateFoodMenuItem,
  useDeleteFoodCuisine,
  useDeleteFoodMenuItem,
  useFoodCatalog,
  useUpdateFoodCuisine,
  useUpdateFoodMenuItem,
} from '@/features/membership/useCatalog';
import { pickProfilePhoto } from '@/features/profile/profilePhoto';
import { AdminCollection } from './components/AdminCollection';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { getAdminErrorMessage, getSectionState } from './selectors';

const MEALS: { value: FoodMeal; label: string }[] = [
  { value: 'Breakfast', label: 'Breakfast' },
  { value: 'Lunch', label: 'Lunch' },
  { value: 'Dinner', label: 'Dinner' },
];

type PendingDelete =
  | { kind: 'cuisine'; id: string; name: string }
  | { kind: 'item'; id: string; name: string }
  | null;

export function AdminFoodCatalogScreen() {
  const query = useFoodCatalog(true);
  const createCuisine = useCreateFoodCuisine();
  const updateCuisine = useUpdateFoodCuisine();
  const createItem = useCreateFoodMenuItem();
  const updateItem = useUpdateFoodMenuItem();
  const deleteCuisine = useDeleteFoodCuisine();
  const deleteItem = useDeleteFoodMenuItem();

  const cuisines = query.data?.cuisines ?? [];
  const items = query.data?.items ?? [];

  const [editingCuisineId, setEditingCuisineId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [cuisineName, setCuisineName] = useState('');
  const [cuisineDescription, setCuisineDescription] = useState('');
  const [itemName, setItemName] = useState('');
  const [priceLabel, setPriceLabel] = useState('');
  const [cuisineId, setCuisineId] = useState<string | undefined>();
  const [meal, setMeal] = useState<FoodMeal>('Lunch');
  const [image, setImage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const cuisineOptions = useMemo(
    () => cuisines.map((item) => ({ value: item.id, label: item.name })),
    [cuisines],
  );
  const selectedCuisineId = cuisineId ?? cuisines[0]?.id;

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: cuisines.length === 0 && items.length === 0,
  });

  const resetCuisineForm = () => {
    setEditingCuisineId(null);
    setCuisineName('');
    setCuisineDescription('');
  };

  const resetItemForm = () => {
    setEditingItemId(null);
    setItemName('');
    setPriceLabel('');
    setMeal('Lunch');
    setImage(null);
  };

  const startEditCuisine = (item: FoodCuisine) => {
    setEditingItemId(null);
    resetItemForm();
    setEditingCuisineId(item.id);
    setCuisineName(item.name);
    setCuisineDescription(item.description ?? '');
    setFormError(null);
  };

  const startEditItem = (item: FoodMenuItem) => {
    setEditingCuisineId(null);
    setCuisineName('');
    setCuisineDescription('');
    setEditingItemId(item.id);
    setItemName(item.name);
    setPriceLabel(item.priceLabel);
    setCuisineId(item.cuisineId);
    setMeal(item.meal);
    setImage(item.image);
    setFormError(null);
  };

  const onPickImage = async () => {
    try {
      const dataUrl = await pickProfilePhoto('library');
      if (dataUrl) {
        setImage(dataUrl);
      }
    } catch (error) {
      Alert.alert('Image', error instanceof Error ? error.message : 'Unable to pick image.');
    }
  };

  const onSaveCuisine = () => {
    const name = cuisineName.trim();
    if (!name) {
      setFormError('Enter a cuisine name.');
      return;
    }
    setFormError(null);
    const payload = { name, description: cuisineDescription.trim() };
    if (editingCuisineId) {
      updateCuisine.mutate(
        { id: editingCuisineId, ...payload },
        {
          onSuccess: () => resetCuisineForm(),
          onError: (error) => setFormError(getAdminErrorMessage(error)),
        },
      );
      return;
    }
    createCuisine.mutate(payload, {
      onSuccess: () => resetCuisineForm(),
      onError: (error) => setFormError(getAdminErrorMessage(error)),
    });
  };

  const onSaveItem = () => {
    const name = itemName.trim();
    if (!name || !selectedCuisineId) {
      setFormError('Choose a cuisine and enter a menu item name.');
      return;
    }
    setFormError(null);
    const payload = {
      cuisineId: selectedCuisineId,
      meal,
      name,
      priceLabel: priceLabel.trim(),
      image,
    };
    if (editingItemId) {
      updateItem.mutate(
        { id: editingItemId, ...payload },
        {
          onSuccess: () => resetItemForm(),
          onError: (error) => setFormError(getAdminErrorMessage(error)),
        },
      );
      return;
    }
    createItem.mutate(payload, {
      onSuccess: () => resetItemForm(),
      onError: (error) => setFormError(getAdminErrorMessage(error)),
    });
  };

  const onConfirmDelete = () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    if (target.kind === 'cuisine') {
      deleteCuisine.mutate(target.id, {
        onError: (error) => setFormError(getAdminErrorMessage(error)),
      });
      return;
    }
    deleteItem.mutate(target.id, {
      onError: (error) => setFormError(getAdminErrorMessage(error)),
    });
  };

  return (
    <AdminScreen
      title="Food catalog"
      subtitle="Cuisines and menu items here show on the member Food Delivery screen."
    >
      {formError ? <Text style={styles.error}>{formError}</Text> : null}

      <Text style={styles.section}>{editingCuisineId ? 'Edit cuisine' : 'Add cuisine'}</Text>
      <TextField label="Cuisine name" value={cuisineName} onChangeText={setCuisineName} />
      <TextField
        label="Description"
        value={cuisineDescription}
        onChangeText={setCuisineDescription}
        multiline
      />
      <View style={styles.formActions}>
        <PrimaryButton
          label={editingCuisineId ? 'Save cuisine' : 'Add cuisine'}
          loading={createCuisine.isPending || updateCuisine.isPending}
          onPress={onSaveCuisine}
        />
        {editingCuisineId ? <SecondaryButton label="Cancel edit" onPress={resetCuisineForm} /> : null}
      </View>

      <Text style={styles.section}>{editingItemId ? 'Edit menu item' : 'Add menu item'}</Text>
      {cuisineOptions.length > 0 ? (
        <AdminFilterChips
          label="Cuisine"
          value={selectedCuisineId}
          options={cuisineOptions}
          onChange={(next) => next && setCuisineId(next)}
          allowAll={false}
        />
      ) : (
        <Text style={styles.hint}>Add a cuisine first.</Text>
      )}
      <AdminFilterChips label="Meal" value={meal} options={MEALS} onChange={(next) => next && setMeal(next)} allowAll={false} />
      <TextField label="Item name" value={itemName} onChangeText={setItemName} />
      <TextField label="Price label (e.g. ₹180)" value={priceLabel} onChangeText={setPriceLabel} />
      <View style={styles.imageRow}>
        {image ? <Image source={{ uri: image }} style={styles.thumb} accessibilityLabel="Menu item image preview" /> : null}
        <PrimaryButton label={image ? 'Change image' : 'Upload image'} onPress={() => void onPickImage()} />
        {image ? (
          <Pressable onPress={() => setImage(null)} accessibilityRole="button" accessibilityLabel="Remove image">
            <Text style={styles.link}>Remove</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.formActions}>
        <PrimaryButton
          label={editingItemId ? 'Save menu item' : 'Add menu item'}
          loading={createItem.isPending || updateItem.isPending}
          onPress={onSaveItem}
        />
        {editingItemId ? <SecondaryButton label="Cancel edit" onPress={resetItemForm} /> : null}
      </View>

      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading food catalog..."
        emptyTitle="No food items"
        emptyMessage="Add cuisines and menu items to populate the member food screen."
      >
        <Text style={styles.section}>Cuisines</Text>
        <AdminCollection
          items={cuisines}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => item.name}
          columns={[
            { key: 'name', label: 'Name', render: (item) => <Text style={cell}>{item.name}</Text> },
            {
              key: 'desc',
              label: 'Description',
              flex: 1.4,
              render: (item) => (
                <Text style={cell} numberOfLines={2}>
                  {item.description || '—'}
                </Text>
              ),
            },
            {
              key: 'actions',
              label: 'Actions',
              flex: 1.2,
              render: (item) => (
                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() => startEditCuisine(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${item.name}`}
                  >
                    <Text style={styles.link}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setPendingDelete({ kind: 'cuisine', id: item.id, name: item.name })}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${item.name}`}
                  >
                    <Text style={styles.danger}>Delete</Text>
                  </Pressable>
                </View>
              ),
            },
          ]}
        />

        <Text style={styles.section}>Menu items</Text>
        <AdminCollection
          items={items}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => item.name}
          columns={[
            {
              key: 'image',
              label: 'Image',
              flex: 0.7,
              render: (item) =>
                item.image ? (
                  <Image source={{ uri: item.image }} style={styles.thumbSm} accessibilityLabel={`${item.name} image`} />
                ) : (
                  <Text style={cell}>—</Text>
                ),
            },
            { key: 'name', label: 'Item', render: (item) => <Text style={cell}>{item.name}</Text> },
            {
              key: 'meal',
              label: 'Meal / price',
              render: (item) => (
                <Text style={cell}>
                  {item.meal} · {item.priceLabel || '—'}
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
                  accessibilityLabel={item.isActive ? `Hide ${item.name}` : `Show ${item.name}`}
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
                  <Pressable
                    onPress={() => startEditItem(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${item.name}`}
                  >
                    <Text style={styles.link}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setPendingDelete({ kind: 'item', id: item.id, name: item.name })}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${item.name}`}
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
        title={pendingDelete?.kind === 'cuisine' ? 'Delete this cuisine?' : 'Delete this menu item?'}
        message={
          pendingDelete
            ? pendingDelete.kind === 'cuisine'
              ? `Remove ${pendingDelete.name} and its menu items?`
              : `Remove ${pendingDelete.name}?`
            : ''
        }
        confirmLabel={deleteCuisine.isPending || deleteItem.isPending ? 'Working…' : 'Delete'}
        onCancel={() => setPendingDelete(null)}
        onConfirm={onConfirmDelete}
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
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  formActions: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
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
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  link: {
    ...typography.captionStrong,
    color: colors.primary,
  },
  danger: {
    ...typography.captionStrong,
    color: colors.emergency,
  },
});
