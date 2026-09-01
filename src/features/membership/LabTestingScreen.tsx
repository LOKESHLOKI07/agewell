import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { LAB_SLOTS } from './mockHealth';
import { MembershipServiceHero } from './MembershipServiceHero';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useServiceOfferings } from './useCatalog';

export function LabTestingScreen() {
  const insets = useSafeAreaInsets();
  const catalog = useServiceOfferings('lab-testing');
  const tests = catalog.data ?? [];
  const [testId, setTestId] = useState('');
  const [slot, setSlot] = useState(LAB_SLOTS[0] ?? '');
  const [homeVisit, setHomeVisit] = useState(true);
  const { submitting, submit } = useMembershipSubmit('lab-testing');

  useEffect(() => {
    if (!testId && tests[0]) setTestId(tests[0].id);
  }, [tests, testId]);

  const selected = tests.find((item) => item.id === testId) ?? tests[0];

  const onBook = () => {
    if (!selected) return;
    void submit(
      `Lab: ${selected.title} · ${slot} · ${homeVisit ? 'Home visit' : 'Lab visit'} · ${selected.priceLabel}`,
      'Appointment requested',
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Lab Testing" showBack showProfile={false} showBell={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MembershipServiceHero slug="lab-testing" />
        <Text style={styles.hint}>Nearby diagnostic labs · reminders and reports in AgeWell</Text>
        {catalog.isPending ? <Text style={styles.hint}>Loading tests…</Text> : null}
        {catalog.isError ? (
          <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
            <Text style={styles.retry}>Unable to load · Tap to retry</Text>
          </Pressable>
        ) : null}

        <Text style={styles.section}>Select test</Text>
        <View style={styles.list}>
          {tests.map((test) => {
            const active = test.id === testId;
            return (
              <Pressable
                key={test.id}
                onPress={() => setTestId(test.id)}
                style={[styles.optionRow, active ? styles.optionRowActive : null]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                {test.image ? (
                  <Image source={{ uri: test.image }} style={styles.thumb} accessibilityLabel={test.title} />
                ) : null}
                <View style={styles.optionBody}>
                  <Text style={styles.optionTitle}>{test.title}</Text>
                  <Text style={styles.optionMeta}>{test.priceLabel || '—'}</Text>
                </View>
                {active ? (
                  <Icon name="checkmark-circle-outline" size={20} color={familyHome.green} />
                ) : (
                  <View style={styles.radio} />
                )}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>Preferred date / time</Text>
        <View style={styles.list}>
          {LAB_SLOTS.map((item) => {
            const active = item === slot;
            return (
              <Pressable
                key={item}
                onPress={() => setSlot(item)}
                style={[styles.slotChip, active ? styles.slotChipActive : null]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Icon
                  name="calendar-outline"
                  size={16}
                  color={active ? familyHome.white : familyHome.blue}
                />
                <Text style={[styles.slotLabel, active ? styles.slotLabelActive : null]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={styles.optionTitle}>Home visit</Text>
            <Text style={styles.optionMeta}>Sample collection at home</Text>
          </View>
          <Switch
            value={homeVisit}
            onValueChange={setHomeVisit}
            trackColor={{ false: familyHome.border, true: familyHome.green }}
            thumbColor={familyHome.white}
            accessibilityLabel="Home visit"
          />
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Booking summary</Text>
          <Text style={styles.summaryLine}>{selected?.title}</Text>
          <Text style={styles.summaryLine}>{slot}</Text>
          <Text style={styles.summaryLine}>
            {homeVisit ? 'Home visit' : 'Lab visit'} · Amount payable {selected?.priceLabel}
          </Text>
        </View>

        <Pressable
          style={[styles.primaryCta, submitting ? { opacity: 0.6 } : null]}
          onPress={onBook}
          disabled={submitting}
          accessibilityRole="button"
        >
          <Text style={styles.primaryCtaText}>{submitting ? 'Sending…' : 'Book Appointment'}</Text>
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
  section: { ...typography.subtitle, color: familyHome.text, marginTop: spacing.sm },
  list: { gap: spacing.sm },
  thumb: { width: 40, height: 40, borderRadius: 8, backgroundColor: familyHome.border },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.lg,
  },
  optionRowActive: { borderColor: familyHome.green, backgroundColor: familyHome.greenSoft },
  optionBody: { flex: 1, gap: 2 },
  optionTitle: { ...typography.bodyStrong, color: familyHome.text },
  optionMeta: { ...typography.caption, color: familyHome.muted },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: familyHome.border,
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  slotChipActive: { backgroundColor: familyHome.green, borderColor: familyHome.green },
  slotLabel: { ...typography.captionStrong, color: familyHome.text },
  slotLabelActive: { color: familyHome.white },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.lg,
  },
  toggleText: { flex: 1, gap: 2, paddingRight: spacing.md },
  summary: {
    borderRadius: 16,
    backgroundColor: familyHome.blueSoft,
    padding: spacing.lg,
    gap: 4,
  },
  summaryTitle: { ...typography.bodyStrong, color: familyHome.text, marginBottom: 4 },
  summaryLine: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
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
