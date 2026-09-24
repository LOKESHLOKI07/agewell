import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { filterOfferingsByKind, parseOfferingMeta } from './catalogTypes';
import { MembershipServiceHero } from './MembershipServiceHero';
import { gatedMembershipScreen } from './MembershipServiceGate';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useServiceOfferings } from './useCatalog';

export const LabTestingScreen = gatedMembershipScreen(
  'lab-testing',
  'Lab Testing',
  LabTestingLive,
);

function LabTestingLive() {
  const insets = useSafeAreaInsets();
  const catalog = useServiceOfferings('lab-testing');
  const allOfferings = catalog.data ?? [];
  const tests = useMemo(
    () => allOfferings.filter((item) => parseOfferingMeta(item.metaJson).kind !== 'slot'),
    [allOfferings],
  );
  const slots = useMemo(() => filterOfferingsByKind(allOfferings, 'slot'), [allOfferings]);
  const [testId, setTestId] = useState('');
  const [slotId, setSlotId] = useState('');
  const [homeVisit, setHomeVisit] = useState(true);
  const { submitting, submit } = useMembershipSubmit('lab-testing');

  useEffect(() => {
    if (!testId && tests[0]) setTestId(tests[0].id);
  }, [tests, testId]);

  useEffect(() => {
    if (!slotId && slots[0]) setSlotId(slots[0].id);
  }, [slots, slotId]);

  const selected = tests.find((item) => item.id === testId) ?? tests[0];
  const selectedSlot = slots.find((item) => item.id === slotId) ?? slots[0];

  const onBook = () => {
    if (!selected || !selectedSlot) return;
    void submit(
      `Lab: ${selected.title} · ${selectedSlot.title} · ${homeVisit ? 'Home visit' : 'Lab visit'} · ${selected.priceLabel}`,
      'Appointment requested',
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ServicePageHeader />
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
        {slots.length > 0 ? (
          <View style={styles.list}>
            {slots.map((item) => {
              const active = item.id === slotId;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSlotId(item.id)}
                  style={[styles.slotChip, active ? styles.slotChipActive : null]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Icon
                    name="calendar-outline"
                    size={16}
                    color={active ? familyHome.white : familyHome.blue}
                  />
                  <Text style={[styles.slotLabel, active ? styles.slotLabelActive : null]}>
                    {item.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={styles.hint}>No appointment slots available yet. Contact support to schedule.</Text>
        )}

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

        <Pressable
          onPress={onBook}
          disabled={submitting || !selected || !selectedSlot}
          style={[styles.bookBtn, submitting || !selected || !selectedSlot ? styles.bookBtnDisabled : null]}
          accessibilityRole="button"
          accessibilityLabel="Request appointment"
        >
          <Text style={styles.bookLabel}>{submitting ? 'Sending…' : 'Request appointment'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
  hint: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  retry: { ...typography.captionStrong, color: familyHome.blue },
  section: { ...typography.subtitle, color: familyHome.text, marginTop: spacing.sm },
  list: { gap: spacing.sm },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  optionRowActive: { borderColor: familyHome.green, backgroundColor: familyHome.greenSoft },
  thumb: { width: 44, height: 44, borderRadius: 8 },
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
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  slotChipActive: { backgroundColor: familyHome.blue, borderColor: familyHome.blue },
  slotLabel: { ...typography.captionStrong, color: familyHome.blue },
  slotLabelActive: { color: familyHome.white },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  toggleText: { flex: 1, gap: 2, paddingRight: spacing.md },
  bookBtn: {
    backgroundColor: familyHome.green,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  bookBtnDisabled: { opacity: 0.5 },
  bookLabel: { ...typography.bodyStrong, color: familyHome.white },
});
