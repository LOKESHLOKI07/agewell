import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import {
  HISTORY_CATEGORIES,
  MEDICAL_HISTORY,
  type HistoryCategory,
} from './mockHealth';
import { MembershipServiceHero } from './MembershipServiceHero';

export function MedicalHistoryScreen() {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<HistoryCategory | 'All'>('All');

  const records = useMemo(() => {
    if (category === 'All') {
      return MEDICAL_HISTORY;
    }
    return MEDICAL_HISTORY.filter((item) => item.category === category);
  }, [category]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Medical History" showBack showProfile={false} showBell={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MembershipServiceHero slug="medical-history" />
        <Text style={styles.hint}>Reports by category and date · companion & support assist uploads</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats}>
          {(['All', ...HISTORY_CATEGORIES] as const).map((item) => {
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

        <View style={styles.list}>
          {records.map((record) => (
            <Pressable
              key={record.id}
              style={styles.row}
              onPress={() =>
                Alert.alert(record.title, `${record.date}\n\n${record.summary}\n\nDocument viewer will open here when files are connected.`)
              }
              accessibilityRole="button"
              accessibilityLabel={`${record.title}, ${record.category}`}
            >
              <View style={styles.iconWell}>
                <Icon name="clipboard-text-outline" size={18} color={familyHome.blue} />
              </View>
              <View style={styles.body}>
                <Text style={styles.category}>{record.category}</Text>
                <Text style={styles.title}>{record.title}</Text>
                <Text style={styles.meta}>{record.date}</Text>
                <Text style={styles.summary}>{record.summary}</Text>
              </View>
              <Icon name="chevron-forward" size={18} color={familyHome.muted} />
            </Pressable>
          ))}
          {records.length === 0 ? (
            <Text style={styles.empty}>No records in this category yet.</Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
  hint: { ...typography.caption, color: familyHome.muted },
  cats: { gap: spacing.sm, paddingVertical: spacing.xs },
  catChip: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: familyHome.white,
  },
  catChipActive: { backgroundColor: familyHome.green, borderColor: familyHome.green },
  catLabel: { ...typography.captionStrong, color: familyHome.text },
  catLabelActive: { color: familyHome.white },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.lg,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: familyHome.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  category: {
    ...typography.captionStrong,
    color: familyHome.blue,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: { ...typography.bodyStrong, color: familyHome.text },
  meta: { ...typography.caption, color: familyHome.muted },
  summary: { ...typography.caption, color: familyHome.muted, marginTop: 2, lineHeight: 18 },
  empty: { ...typography.body, color: familyHome.muted, textAlign: 'center', marginTop: spacing.xl },
});
