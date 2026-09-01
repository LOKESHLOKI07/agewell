import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ConfirmDialog, PrimaryButton, SecondaryButton, TextField } from '@/components';
import { colors, radius, spacing, typography } from '@/constants/theme';
import type { GroceryCategory, GroceryProduct } from '@/features/membership/catalogTypes';
import { pickProfilePhoto } from '@/features/profile/profilePhoto';
import {
  useCreateGroceryCategory,
  useCreateGroceryProduct,
  useDeleteGroceryCategory,
  useDeleteGroceryProduct,
  useGroceryCatalog,
  useUpdateGroceryCategory,
  useUpdateGroceryProduct,
} from '@/features/membership/useCatalog';
import { AdminCollection } from './components/AdminCollection';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { getAdminErrorMessage, getSectionState } from './selectors';

type PendingDelete =
  | { kind: 'category'; id: string; name: string }
  | { kind: 'product'; id: string; name: string }
  | null;

export function AdminGroceryCatalogScreen() {
  const query = useGroceryCatalog(true);
  const createCategory = useCreateGroceryCategory();
  const updateCategory = useUpdateGroceryCategory();
  const createProduct = useCreateGroceryProduct();
  const updateProduct = useUpdateGroceryProduct();
  const deleteCategory = useDeleteGroceryCategory();
  const deleteProduct = useDeleteGroceryProduct();

  const categories = query.data?.categories ?? [];
  const products = query.data?.products ?? [];

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryActive, setCategoryActive] = useState(true);
  const [productName, setProductName] = useState('');
  const [unit, setUnit] = useState('');
  const [priceLabel, setPriceLabel] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [image, setImage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const categoryOptions = useMemo(
    () => categories.map((item) => ({ value: item.id, label: item.name })),
    [categories],
  );

  const selectedCategoryId = categoryId ?? categories[0]?.id;

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: categories.length === 0 && products.length === 0,
  });

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryActive(true);
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductName('');
    setUnit('');
    setPriceLabel('');
    setImage(null);
  };

  const startEditCategory = (item: GroceryCategory) => {
    setEditingProductId(null);
    resetProductForm();
    setEditingCategoryId(item.id);
    setCategoryName(item.name);
    setCategoryActive(item.isActive);
    setFormError(null);
  };

  const startEditProduct = (item: GroceryProduct) => {
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryActive(true);
    setEditingProductId(item.id);
    setProductName(item.name);
    setUnit(item.unit);
    setPriceLabel(item.priceLabel);
    setCategoryId(item.categoryId);
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

  const onSaveCategory = () => {
    const name = categoryName.trim();
    if (!name) {
      setFormError('Enter a category name.');
      return;
    }
    setFormError(null);
    if (editingCategoryId) {
      updateCategory.mutate(
        { id: editingCategoryId, name, isActive: categoryActive },
        {
          onSuccess: () => resetCategoryForm(),
          onError: (error) => setFormError(getAdminErrorMessage(error)),
        },
      );
      return;
    }
    createCategory.mutate(
      { name, isActive: categoryActive },
      {
        onSuccess: () => resetCategoryForm(),
        onError: (error) => setFormError(getAdminErrorMessage(error)),
      },
    );
  };

  const onSaveProduct = () => {
    const name = productName.trim();
    if (!name || !selectedCategoryId) {
      setFormError('Choose a category and enter a product name.');
      return;
    }
    setFormError(null);
    const payload = {
      categoryId: selectedCategoryId,
      name,
      unit: unit.trim(),
      priceLabel: priceLabel.trim(),
      image,
    };
    if (editingProductId) {
      updateProduct.mutate(
        { id: editingProductId, ...payload },
        {
          onSuccess: () => resetProductForm(),
          onError: (error) => setFormError(getAdminErrorMessage(error)),
        },
      );
      return;
    }
    createProduct.mutate(payload, {
      onSuccess: () => resetProductForm(),
      onError: (error) => setFormError(getAdminErrorMessage(error)),
    });
  };

  const onConfirmDelete = () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    if (target.kind === 'category') {
      deleteCategory.mutate(target.id, {
        onError: (error) => setFormError(getAdminErrorMessage(error)),
      });
      return;
    }
    deleteProduct.mutate(target.id, {
      onError: (error) => setFormError(getAdminErrorMessage(error)),
    });
  };

  return (
    <AdminScreen
      title="Grocery catalog"
      subtitle="Items and images here show on the member Grocery Delivery screen."
    >
      {formError ? <Text style={styles.error}>{formError}</Text> : null}

      <Text style={styles.section}>{editingCategoryId ? 'Edit category' : 'Add category'}</Text>
      <TextField label="Category name" value={categoryName} onChangeText={setCategoryName} />
      <AdminFilterChips
        label="Active"
        value={categoryActive ? 'yes' : 'no'}
        options={[
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ]}
        onChange={(next) => setCategoryActive(next === 'yes')}
        allowAll={false}
      />
      <View style={styles.formActions}>
        <PrimaryButton
          label={editingCategoryId ? 'Save category' : 'Add category'}
          loading={createCategory.isPending || updateCategory.isPending}
          onPress={onSaveCategory}
        />
        {editingCategoryId ? (
          <SecondaryButton label="Cancel edit" onPress={resetCategoryForm} />
        ) : null}
      </View>

      <Text style={styles.section}>{editingProductId ? 'Edit product' : 'Add product'}</Text>
      {categoryOptions.length > 0 ? (
        <AdminFilterChips
          label="Category"
          value={selectedCategoryId}
          options={categoryOptions}
          onChange={(next) => next && setCategoryId(next)}
          allowAll={false}
        />
      ) : (
        <Text style={styles.hint}>Add a category first.</Text>
      )}
      <TextField label="Product name" value={productName} onChangeText={setProductName} />
      <TextField label="Unit (e.g. 1 kg)" value={unit} onChangeText={setUnit} />
      <TextField label="Price label (e.g. ₹180)" value={priceLabel} onChangeText={setPriceLabel} />
      <View style={styles.imageRow}>
        {image ? <Image source={{ uri: image }} style={styles.thumb} accessibilityLabel="Product image preview" /> : null}
        <PrimaryButton label={image ? 'Change image' : 'Upload image'} onPress={() => void onPickImage()} />
        {image ? (
          <Pressable onPress={() => setImage(null)} accessibilityRole="button" accessibilityLabel="Remove image">
            <Text style={styles.link}>Remove</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.formActions}>
        <PrimaryButton
          label={editingProductId ? 'Save product' : 'Add product'}
          loading={createProduct.isPending || updateProduct.isPending}
          onPress={onSaveProduct}
        />
        {editingProductId ? <SecondaryButton label="Cancel edit" onPress={resetProductForm} /> : null}
      </View>

      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading grocery catalog..."
        emptyTitle="No grocery items"
        emptyMessage="Add categories and products to populate the member grocery screen."
      >
        <Text style={styles.section}>Categories</Text>
        <AdminCollection
          items={categories}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => item.name}
          columns={[
            { key: 'name', label: 'Name', render: (item) => <Text style={cell}>{item.name}</Text> },
            {
              key: 'active',
              label: 'Active',
              render: (item) => <Text style={cell}>{item.isActive ? 'Yes' : 'No'}</Text>,
            },
            {
              key: 'actions',
              label: 'Actions',
              flex: 1.2,
              render: (item) => (
                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() => startEditCategory(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${item.name}`}
                  >
                    <Text style={styles.link}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setPendingDelete({ kind: 'category', id: item.id, name: item.name })}
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

        <Text style={styles.section}>Products</Text>
        <AdminCollection
          items={products}
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
            { key: 'name', label: 'Product', render: (item) => <Text style={cell}>{item.name}</Text> },
            {
              key: 'meta',
              label: 'Unit / price',
              render: (item) => (
                <Text style={cell}>
                  {item.unit || '—'} · {item.priceLabel || '—'}
                </Text>
              ),
            },
            {
              key: 'active',
              label: 'Shown',
              render: (item) => (
                <Pressable
                  onPress={() =>
                    updateProduct.mutate(
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
                    onPress={() => startEditProduct(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${item.name}`}
                  >
                    <Text style={styles.link}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setPendingDelete({ kind: 'product', id: item.id, name: item.name })}
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
        title={pendingDelete?.kind === 'category' ? 'Delete this category?' : 'Delete this product?'}
        message={
          pendingDelete
            ? pendingDelete.kind === 'category'
              ? `Remove ${pendingDelete.name} and its products?`
              : `Remove ${pendingDelete.name}?`
            : ''
        }
        confirmLabel={
          deleteCategory.isPending || deleteProduct.isPending ? 'Working…' : 'Delete'
        }
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
