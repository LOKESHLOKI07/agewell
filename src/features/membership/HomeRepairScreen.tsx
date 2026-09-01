import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { MembershipServiceHero } from './MembershipServiceHero';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useServiceOfferings } from './useCatalog';

export function HomeRepairScreen() {
  const insets = useSafeAreaInsets();
  const catalog = useServiceOfferings('home-repair');
  const categories = catalog.data ?? [];
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const selected = categories.find((item) => item.id === categoryId);
  const { submitting, submit } = useMembershipSubmit('home-repair');

  useEffect(() => {
    if (!categoryId && categories[0]) setCategoryId(categories[0].id);
  }, [categories, categoryId]);

  const onRaise = () => {
    void submit(
      `Repair: ${selected?.title ?? 'Other'}. ${notes.trim() || 'No extra notes'}`,
      'Repair request raised',
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="House Repair" showBack showProfile={false} showBell={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MembershipServiceHero slug="home-repair" />
        {catalog.isPending ? <Text style={styles.hint}>Loading categories…</Text> : null}
        {catalog.isError ? (
          <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
            <Text style={styles.retry}>Unable to load · Tap to retry</Text>
          </Pressable>
        ) : null}

        <View style={styles.list}>
          {categories.map((item) => {
            const active = item.id === categoryId;
            return (
              <Pressable
                key={item.id}
                onPress={() => setCategoryId(item.id)}
                style={[styles.row, active ? styles.rowActive : null]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.thumb} accessibilityLabel={item.title} />
                ) : (
                  <View style={styles.iconWell}>
                    <Icon name="settings-outline" size={18} color={familyHome.orange} />
                  </View>
                )}
                <View style={styles.body}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.desc}>{item.description}</Text>
                </View>
                {active ? <Icon name="checkmark-circle-outline" size={20} color={familyHome.green} /> : null}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Describe the issue (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="What needs fixing?"
          placeholderTextColor={familyHome.muted}
          style={styles.notes}
          multiline
          textAlignVertical="top"
          accessibilityLabel="Repair notes"
        />

        <Pressable
          style={[styles.primaryCta, submitting ? { opacity: 0.6 } : null]}
          onPress={onRaise}
          disabled={submitting}
          accessibilityRole="button"
        >
          <Text style={styles.primaryCtaText}>{submitting ? 'Sending…' : 'Raise a Request'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
  hint: { ...typography.caption, color: familyHome.muted },
  retry: { ...typography.captionStrong, color: familyHome.green },
  list: { gap: spacing.sm },
  thumb: { width: 40, height: 40, borderRadius: 12, backgroundColor: familyHome.border },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.lg,
  },
  rowActive: { borderColor: familyHome.green, backgroundColor: familyHome.greenSoft },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: familyHome.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  title: { ...typography.bodyStrong, color: familyHome.text },
  desc: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  label: { ...typography.captionStrong, color: familyHome.text },
  notes: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.lg,
    ...typography.body,
    color: familyHome.text,
    backgroundColor: '#FAFAFA',
  },
  primaryCta: {
    marginTop: spacing.sm,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: { ...typography.bodyStrong, color: familyHome.white },
});
