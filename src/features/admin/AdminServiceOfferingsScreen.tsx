import { Alert, Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ConfirmDialog, PrimaryButton, SecondaryButton, StatusPill, TextField } from '@/components';
import { Icon, IconWell, type IconName } from '@/components/ui';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import {
  OFFERING_SERVICE_SLUGS,
  parseOfferingMeta,
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
import { AdminSearchPicker } from './components/AdminSearchPicker';
import { getAdminErrorMessage, getSectionState } from './selectors';
import { ADDON_SLUG_ORDER, EXTRA_CATALOG_SLUGS, adminCatalogPath } from './servicesAdminModel';
import { useAdminLayout } from './useAdminLayout';

const EXTRA_LABELS: Record<(typeof EXTRA_CATALOG_SLUGS)[number], string> = {
  'lab-testing': 'Lab Testing',
  'medical-history': 'Medical History',
  'tech-assistance': 'Tech Assistance',
};

/** Badge / kind options shown in the edit dropdown. */
const KIND_OPTIONS = [
  { id: 'Included', title: 'Included', subtitle: 'Free for members' },
  { id: 'Extra', title: 'Extra', subtitle: 'Charges apply' },
  { id: 'Plan', title: 'Plan', subtitle: 'Priced plan / package' },
  { id: 'Option', title: 'Option', subtitle: 'Bookable choice' },
  { id: 'Feature', title: 'Feature', subtitle: 'Highlight on service page' },
  { id: 'Benefit', title: 'Benefit', subtitle: 'Benefit list item' },
  { id: 'Interest', title: 'Interest', subtitle: 'Events & trips interest' },
  { id: 'Event', title: 'Event', subtitle: 'Local event' },
  { id: 'Trip', title: 'Trip', subtitle: 'Trip package' },
] as const;

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
    dedicated: false,
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

/** Keep meta.kind in sync with Badge so Plan/Option rows show on member booking screens. */
function metaJsonWithKindFromBadge(badge: string, existing: string | null | undefined): string | null {
  const kind = badge.trim().toLowerCase();
  if (!kind) return existing ?? null;
  const meta = parseOfferingMeta(existing);
  meta.kind = kind;
  return JSON.stringify(meta);
}

function resolveKindLabel(item: ServiceOffering): string {
  const fromMeta = parseOfferingMeta(item.metaJson).kind?.trim();
  const raw = (fromMeta || item.badge || '').trim();
  if (!raw) return '';
  const match = KIND_OPTIONS.find((option) => option.id.toLowerCase() === raw.toLowerCase());
  return match?.id ?? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function openCatalog(slug: string) {
  router.replace(adminCatalogPath(slug) as Href);
}

export function AdminServiceOfferingsHubScreen() {
  return (
    <AdminScreen
      title="Service Catalog"
      subtitle="Pick a service to edit its plans, prices, and catalogue items. Changes reflect on the member app."
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
  const [editingMetaJson, setEditingMetaJson] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.92)).current;
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSuccess = useCallback(
    (message: string) => {
      if (successTimer.current) clearTimeout(successTimer.current);
      setSuccessMessage(message);
      successOpacity.setValue(0);
      successScale.setValue(0.92);
      Animated.parallel([
        Animated.timing(successOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(successScale, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
      ]).start();
      Alert.alert('Saved successfully', 'Your changes have been saved.');
      successTimer.current = setTimeout(() => {
        Animated.timing(successOpacity, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => {
          setSuccessMessage(null);
        });
      }, 2800);
    },
    [successOpacity, successScale],
  );

  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

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
    setEditingMetaJson(null);
  };

  const startEdit = (item: ServiceOffering) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setBadge(resolveKindLabel(item));
    setPriceLabel(item.priceLabel);
    setImage(item.image);
    setEditingMetaJson(item.metaJson);
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
    if (chip?.dedicated || slug === 'grocery') {
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
    if (!badge.trim()) {
      setFormError('Select a kind (Included, Extra, Plan…).');
      return;
    }
    setFormError(null);
    const metaJson = metaJsonWithKindFromBadge(badge, editingMetaJson);
    const payload = {
      serviceSlug,
      title: cleanedTitle,
      description: description.trim(),
      badge: badge.trim(),
      priceLabel: priceLabel.trim(),
      image,
      metaJson,
    };
    if (editingId) {
      updateItem.mutate(
        { id: editingId, ...payload },
        {
          onSuccess: () => {
            resetForm();
            showSuccess('Saved successfully');
          },
          onError: (error) => setFormError(getAdminErrorMessage(error)),
        },
      );
      return;
    }
    createItem.mutate(payload, {
      onSuccess: () => {
        resetForm();
        showSuccess('Saved successfully');
      },
      onError: (error) => setFormError(getAdminErrorMessage(error)),
    });
  };

  const addonSelected = (ADDON_SLUG_ORDER as readonly string[]).includes(serviceSlug);

  return (
    <AdminScreen
      title={`${serviceLabel} items`}
      subtitle={
        addonSelected
          ? 'Add-on plans and prices. Edit a row above — changes show on the member app after save.'
          : 'Membership catalogue items and prices. Edit a row above — changes show on the member app after save.'
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

      <View style={styles.listPanel}>
        <Text style={styles.panelTitle}>Existing plans & prices</Text>
        <Text style={styles.panelHint}>
          Tap the pencil on a row to edit its rate. Changes show on the member service screen after save.
        </Text>
        <AdminQueryView
          state={state}
          error={query.error}
          onRetry={() => void query.refetch()}
          loadingMessage="Loading items..."
          emptyTitle="No items yet"
          emptyMessage="Seed the API or add the first catalogue item for this service."
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
                  <Text style={styles.itemPrice}>{item.priceLabel || 'No price label'}</Text>
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
      </View>

      <View style={isDesktop ? styles.formGrid : styles.stack}>
        <View style={[styles.panel, styles.formCol]}>
          <Text style={styles.panelTitle}>{editingId ? 'Edit item' : 'Add item'}</Text>
          <Text style={styles.panelHint}>
            {editingId
              ? 'Update the price label and save — the member app will show the new rate.'
              : 'Fill in the details to add a new item to this service.'}
          </Text>
          <TextField label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. SOS Helpline" />
          <TextField
            label="Description *"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the item and when it is used."
            multiline
          />
          <AdminSearchPicker
            label="Kind *"
            placeholder="Search Included, Extra, Plan…"
            options={[...KIND_OPTIONS]}
            value={badge || null}
            onChange={(id) => setBadge(id ?? '')}
            confirmLabel="Select kind"
          />
          <TextField
            label="Price / plan label"
            value={priceLabel}
            onChangeText={setPriceLabel}
            placeholder="e.g. ₹3,500 / month"
          />
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
          {successMessage ? (
            <Animated.View
              style={[
                styles.successBanner,
                { opacity: successOpacity, transform: [{ scale: successScale }] },
              ]}
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              <Icon name="checkmark-circle-outline" size={22} color={colors.white} />
              <Text style={styles.successText}>{successMessage}</Text>
            </Animated.View>
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
            <Text style={styles.tipsLine}>Pick Included or Extra from the Kind dropdown (or Plan / Option).</Text>
            <Text style={styles.tipsLine}>Upload a clear icon or image for quick recognition.</Text>
            <Text style={styles.tipsLine}>Keep the price / slot label simple (₹500, Free, Per visit).</Text>
          </View>
        </View>
      </View>

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
  listPanel: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadows.card,
    gap: spacing.md,
    marginBottom: spacing.lg,
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.safe,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  successText: {
    ...typography.bodyStrong,
    color: colors.white,
    flex: 1,
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
  itemPrice: {
    ...typography.captionStrong,
    color: colors.text,
    marginTop: 4,
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
