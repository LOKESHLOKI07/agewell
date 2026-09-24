import { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { filterOfferingsByKind, parseOfferingMeta } from './catalogTypes';
import { MembershipServiceHero } from './MembershipServiceHero';
import { gatedMembershipScreen } from './MembershipServiceGate';
import { useServiceOfferings } from './useCatalog';

export const MedicalHistoryScreen = gatedMembershipScreen(
  'medical-history',
  'Medical History',
  MedicalHistoryLive,
);

function MedicalHistoryLive() {
  const insets = useSafeAreaInsets();
  const catalog = useServiceOfferings('medical-history');
  const records = useMemo(
    () => filterOfferingsByKind(catalog.data ?? [], 'record'),
    [catalog.data],
  );
  const categories = useMemo(() => {
    const unique = new Set(records.map((item) => item.badge).filter(Boolean));
    return ['All', ...Array.from(unique).sort()];
  }, [records]);
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    if (category === 'All') return records;
    return records.filter((item) => item.badge === category);
  }, [records, category]);

  const onOpenRecord = (title: string, categoryLabel: string, date: string, summary: string, url?: string) => {
    if (url) {
      void Linking.openURL(url).catch(() => {
        Alert.alert('Unable to open document', 'Please try again or contact support.');
      });
      return;
    }
    Alert.alert(title, `${categoryLabel} · ${date}\n\n${summary}`);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ServicePageHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MembershipServiceHero slug="medical-history" />
        <Text style={styles.hint}>Reports by category and date · companion & support assist uploads</Text>

        {catalog.isPending ? <Text style={styles.hint}>Loading records…</Text> : null}
        {catalog.isError ? (
          <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
            <Text style={styles.retry}>Unable to load · Tap to retry</Text>
          </Pressable>
        ) : null}

        {categories.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats}>
            {categories.map((item) => {
              const active = item === category;
              return (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[styles.catChip, active ? styles.catChipActive : null]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.catLabel, active ? styles.catLabelActive : null]}>{item}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <View style={styles.list}>
          {filtered.map((record) => {
            const meta = parseOfferingMeta(record.metaJson);
            const date = meta.date || '—';
            return (
              <Pressable
                key={record.id}
                style={styles.row}
                onPress={() =>
                  onOpenRecord(record.title, record.badge, date, record.description, meta.url)
                }
                accessibilityRole="button"
                accessibilityLabel={`${record.title}, ${record.badge}`}
              >
                <View style={styles.iconWell}>
                  <Icon name="clipboard-text-outline" size={18} color={familyHome.blue} />
                </View>
                <View style={styles.body}>
                  <Text style={styles.category}>{record.badge}</Text>
                  <Text style={styles.title}>{record.title}</Text>
                  <Text style={styles.meta}>{date}</Text>
                  <Text style={styles.summary}>{record.description}</Text>
                </View>
                <Icon name="chevron-forward" size={18} color={familyHome.muted} />
              </Pressable>
            );
          })}
          {!catalog.isPending && filtered.length === 0 ? (
            <Text style={styles.hint}>No medical records yet. Reports will appear here once uploaded.</Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
  hint: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  retry: { ...typography.captionStrong, color: familyHome.blue },
  cats: { gap: spacing.sm, paddingVertical: spacing.xs },
  catChip: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  catChipActive: { backgroundColor: familyHome.blue, borderColor: familyHome.blue },
  catLabel: { ...typography.captionStrong, color: familyHome.text },
  catLabelActive: { color: familyHome.white },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  iconWell: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: familyHome.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  category: { ...typography.captionStrong, color: familyHome.blue },
  title: { ...typography.bodyStrong, color: familyHome.text },
  meta: { ...typography.caption, color: familyHome.muted },
  summary: { ...typography.caption, color: familyHome.muted, lineHeight: 18, marginTop: 2 },
});
