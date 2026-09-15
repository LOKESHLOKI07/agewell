import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { ConfirmDialog, PrimaryButton, SecondaryButton, StatusPill, TextField } from '@/components';
import { Icon, IconWell, type IconName } from '@/components/ui';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import {
  OFFERING_SERVICE_SLUGS,
  type OfferingServiceSlug,
  type ServiceOffering,
} from '@/features/membership/catalogTypes';
import {
  useCreateServiceOffering,
  useDeleteServiceOffering,
  useServiceOfferings,
  useUpdateServiceOffering,
} from '@/features/membership/useCatalog';
import { pickProfilePhoto } from '@/features/profile/profilePhoto';
import { ADD_ON_SERVICES } from '@/features/services/addOnServiceCatalog';
import { MARKETPLACE_SERVICES } from '@/features/services/serviceCatalog';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { getAdminErrorMessage, getSectionState } from './selectors';
import { ADDON_SLUG_ORDER, EXTRA_CATALOG_SLUGS, adminCatalogPath } from './servicesAdminModel';
import { useAdminLayout } from './useAdminLayout';

const EXTRA_LABELS: Record<(typeof EXTRA_CATALOG_SLUGS)[number], string> = {
  'lab-testing': 'Lab Testing',
  'medical-history': 'Medical History',
  'tech-assistance': 'Tech Assistance',
};

type CatalogChip = {
  slug: string;
  title: string;
  icon: IconName;
  color: string;
  background: string;
  dedicated?: boolean;
};

function membershipChips(): CatalogChip[] {
  return MARKETPLACE_SERVICES.map((item) => ({
    slug: item.id,
    title: item.title,
    icon: item.icon,
    color: item.color,
    background: item.background,
    dedicated: item.id === 'grocery',
  }));
}

function addonChips(): CatalogChip[] {
  return ADD_ON_SERVICES.map((item) => ({
    slug: item.id,
    title: item.title,
    icon: item.icon,
    color: item.color,
    background: item.background,
    dedicated: item.id === 'food',
  }));
}

function extraChips(): CatalogChip[] {
  return EXTRA_CATALOG_SLUGS.map((slug) => ({
    slug,
    title: EXTRA_LABELS[slug],
    icon: 'flask-outline' as IconName,
    color: colors.info,
    background: colors.infoSoft,
  }));
}

function allCatalogChips(): CatalogChip[] {
  return [...membershipChips(), ...addonChips(), ...extraChips()];
}

function openCatalog(slug: string) {
  router.replace(adminCatalogPath(slug) as Href);
}

export function AdminServiceOfferingsHubScreen() {
  return (
    <AdminScreen
      title="Service Catalog"
      subtitle="Choose a membership service to add items. Add-ons are listed separately."
    >
      <ChipSection title="Single membership (21)" chips={membershipChips()} selected={null} />
      <ChipSection title="Add-ons" chips={addonChips()} selected={null} />
      <ChipSection title="Other catalogs" chips={extraChips()} selected={null} />
    </AdminScreen>
  );
}

export function AdminServiceOfferingsScreen() {
  const { slug: slugParam } = useLocalSearchParams<{ slug?: string }>();
  const { isDesktop } = useAdminLayout();
  const chips = allCatalogChips();
  const initialSlug =
    typeof slugParam === 'string' && OFFERING_SERVICE_SLUGS.includes(slugParam as OfferingServiceSlug)
      ? slugParam
      : OFFERING_SERVICE_SLUGS[0];

  const [serviceSlug, setServiceSlug] = useState(initialSlug);
  const query = useServiceOfferings(serviceSlug, true);
  const createItem = useCreateServiceOffering();
  const updateItem = useUpdateServiceOffering();
  const deleteItem = useDeleteServiceOffering();

  const items = query.data ?? [];
  const selectedChip = chips.find((item) => item.slug === serviceSlug);
  const serviceLabel = selectedChip?.title ?? serviceSlug;

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

  const previewTitle = title.trim() || 'Item title';
  const previewDescription = description.trim() || 'Describe the item and when it is used.';
  const previewBadge = badge.trim();
  const previewPrice = priceLabel.trim() || 'Price / slot';

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

  const selectService = (slug: string) => {
    const chip = chips.find((item) => item.slug === slug);
    if (chip?.dedicated || slug === 'grocery' || slug === 'food') {
      openCatalog(slug);
      return;
    }
    setServiceSlug(slug);
    resetForm();
    router.replace(`/(admin)/catalog/offerings/${slug}` as Href);
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

  const addonSelected = (ADDON_SLUG_ORDER as readonly string[]).includes(serviceSlug);

  return (
    <AdminScreen
      title={`${serviceLabel} items`}
      subtitle={
        addonSelected
          ? 'Add-on catalogue items. These are not part of the 21 membership services.'
          : 'These items appear on the member service screen.'
      }
    >
      <Pressable
        onPress={() => router.replace('/(admin)/catalog/offerings' as Href)}
        accessibilityRole="button"
        accessibilityLabel="Back to Service Catalog"
        style={({ pressed }) => [styles.backLink, pressed ? styles.pressed : null]}
      >
        <Icon name="chevron-back" size={16} color={colors.sidebarActive} />
        <Text style={styles.backLinkLabel}>Back to Service Catalog</Text>
      </Pressable>

      <ChipSection title="Single membership (21)" chips={membershipChips()} selected={serviceSlug} onSelect={selectService} />
      <ChipSection title="Add-ons" chips={addonChips()} selected={serviceSlug} onSelect={selectService} />
      <ChipSection title="Other catalogs" chips={extraChips()} selected={serviceSlug} onSelect={selectService} />

      {formError ? <Text style={styles.error}>{formError}</Text> : null}

      <View style={isDesktop ? styles.formGrid : styles.stack}>
        <View style={[styles.panel, styles.formCol]}>
          <Text style={styles.panelTitle}>{editingId ? 'Edit item' : 'Add item'}</Text>
          <Text style={styles.panelHint}>
            Fill in the details to {editingId ? 'update this' : 'add a new'} item to {serviceLabel}.
          </Text>
          <TextField label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. SOS Helpline" />
          <TextField
            label="Description *"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the item and when it is used."
            multiline
          />
          <TextField
            label="Badge (e.g. helpers, specialty)"
            value={badge}
            onChangeText={setBadge}
            placeholder="e.g. 24x7, Urgent, Priority"
          />
          <TextField label="Price / slot label" value={priceLabel} onChangeText={setPriceLabel} placeholder="e.g. 500 or Free" />
          <Text style={styles.uploadLabel}>Upload image</Text>
          <Pressable
            onPress={() => void onPickImage()}
            accessibilityRole="button"
            accessibilityLabel={image ? 'Change image' : 'Upload image'}
            style={({ pressed }) => [styles.upload, pressed ? styles.pressed : null]}
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.uploadPreview} accessibilityLabel="Item image preview" />
            ) : (
              <>
                <IconWell tone="primary" size={44}>
                  <Icon name="camera-outline" size={20} color={colors.primary} />
                </IconWell>
                <Text style={styles.uploadTitle}>PNG, JPG</Text>
                <Text style={styles.uploadHint}>Tap to upload a clear icon or photo</Text>
              </>
            )}
          </Pressable>
          {image ? (
            <Pressable onPress={() => setImage(null)} accessibilityRole="button" accessibilityLabel="Remove image">
              <Text style={styles.link}>Remove image</Text>
            </Pressable>
          ) : null}
          <View style={styles.formActions}>
            {editingId ? <SecondaryButton label="Cancel" fullWidth={false} onPress={resetForm} /> : null}
            <PrimaryButton
              label={editingId ? 'Save item' : 'Add item'}
              fullWidth={false}
              loading={createItem.isPending || updateItem.isPending}
              onPress={onSave}
            />
          </View>
        </View>

        <View style={styles.sideCol}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Item preview</Text>
            <View style={styles.previewRow}>
              {image ? (
                <Image source={{ uri: image }} style={styles.previewThumb} accessibilityLabel="Preview image" />
              ) : (
                <View style={[styles.previewIcon, { backgroundColor: selectedChip?.background ?? colors.primarySoft }]}>
                  <Icon name={selectedChip?.icon ?? 'grid-outline'} size={22} color={selectedChip?.color ?? colors.primary} />
                </View>
              )}
              <View style={styles.flex}>
                <View style={styles.previewTitleRow}>
                  <Text style={styles.previewTitle}>{previewTitle}</Text>
                  {previewBadge ? <StatusPill label={previewBadge} tone="emergency" /> : null}
                </View>
                <Text style={styles.previewBody}>{previewDescription}</Text>
              </View>
              <Text style={styles.previewPrice}>{previewPrice}</Text>
            </View>
          </View>
          <View style={styles.tips}>
            <View style={styles.tipsHead}>
              <Icon name="sparkles" size={16} color={colors.primaryDark} />
              <Text style={styles.tipsTitle}>Tips</Text>
            </View>
            <Text style={styles.tipsLine}>Use a clear and concise title.</Text>
            <Text style={styles.tipsLine}>Add a short, helpful description.</Text>
            <Text style={styles.tipsLine}>Use a relevant badge (e.g. Urgent, 24x7).</Text>
            <Text style={styles.tipsLine}>Upload a clear icon or image for quick recognition.</Text>
            <Text style={styles.tipsLine}>Keep the price / slot label simple (₹500, Free, Per visit).</Text>
          </View>
        </View>
      </View>

      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading items..."
        emptyTitle="No items yet"
        emptyMessage="Add the first catalogue item for this service."
      >
        <View style={styles.itemList}>
          {items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.itemThumb} accessibilityLabel={`${item.title} image`} />
              ) : (
                <View style={[styles.itemThumb, styles.itemThumbEmpty]}>
                  <Icon name="document-outline" size={18} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.flex}>
                <View style={styles.previewTitleRow}>
                  <Text style={styles.serviceName}>{item.title}</Text>
                  {item.badge ? <StatusPill label={item.badge} tone="info" /> : null}
                </View>
                <Text style={styles.itemMeta} numberOfLines={2}>
                  {item.description || 'No description'}
                </Text>
                <Text style={styles.itemMeta}>{item.priceLabel || 'No price label'}</Text>
              </View>
              <View style={styles.itemActions}>
                <Pressable
                  onPress={() =>
                    updateItem.mutate(
                      { id: item.id, isActive: !item.isActive },
                      { onError: (error) => setFormError(getAdminErrorMessage(error)) },
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel={item.isActive ? `Hide ${item.title}` : `Show ${item.title}`}
                >
                  <Text style={styles.link}>{item.isActive ? 'Active' : 'Hidden'}</Text>
                </Pressable>
                <Pressable onPress={() => startEdit(item)} accessibilityRole="button" accessibilityLabel={`Edit ${item.title}`}>
                  <Icon name="create-outline" size={18} color={colors.sidebarActive} />
                </Pressable>
                <Pressable
                  onPress={() => setPendingDelete({ id: item.id, name: item.title })}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${item.title}`}
                >
                  <Icon name="trash-outline" size={18} color={colors.emergency} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
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

function ChipSection({
  title,
  chips,
  selected,
  onSelect,
}: {
  title: string;
  chips: CatalogChip[];
  selected: string | null;
  onSelect?: (slug: string) => void;
}) {
  const handlePress = onSelect ?? openCatalog;
  return (
    <View style={styles.chipSection}>
      <Text style={styles.chipSectionTitle}>{title}</Text>
      <View style={styles.chipWrap}>
        {chips.map((chip) => {
          const on = selected === chip.slug;
          return (
            <Pressable
              key={chip.slug}
              onPress={() => handlePress(chip.slug)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={chip.title}
              style={({ pressed }) => [styles.chip, on ? styles.chipOn : null, pressed ? styles.pressed : null]}
            >
              <View style={[styles.chipIcon, { backgroundColor: chip.background }]}>
                <Icon name={chip.icon} size={14} color={chip.color} />
              </View>
              <Text style={[styles.chipLabel, on ? styles.chipLabelOn : null]}>{chip.title}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: minTouchSize,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  backLinkLabel: {
    ...typography.bodyStrong,
    color: colors.sidebarActive,
  },
  chipSection: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  chipSectionTitle: {
    ...typography.captionStrong,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  chipIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    ...typography.captionStrong,
    color: colors.text,
  },
  chipLabelOn: {
    color: colors.primaryDark,
  },
  formGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  stack: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  formCol: {
    flex: 1.2,
    minWidth: 280,
  },
  sideCol: {
    flex: 1,
    minWidth: 260,
    gap: spacing.lg,
  },
  panel: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadows.card,
    gap: spacing.md,
  },
  panelTitle: {
    ...typography.heading,
    color: colors.text,
  },
  panelHint: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  uploadLabel: {
    ...typography.captionStrong,
    color: colors.text,
  },
  upload: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radius.lg,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.primarySoft,
  },
  uploadPreview: {
    width: '100%',
    height: 120,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  uploadTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  uploadHint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  formActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewThumb: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
  },
  previewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  previewTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  previewBody: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  previewPrice: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  tips: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  tipsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  tipsTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  tipsLine: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
    marginBottom: spacing.md,
  },
  itemList: {
    gap: spacing.md,
  },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
  },
  itemThumbEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  serviceName: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  link: {
    ...typography.captionStrong,
    color: colors.primary,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.85,
  },
});
