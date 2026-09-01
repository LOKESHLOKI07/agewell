import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { MembershipServiceHero } from './MembershipServiceHero';
import { TRANSPORT_DURATIONS, TRANSPORT_PEOPLE } from './mockCoordination';
import { useMembershipSubmit } from './useMembershipSubmit';

type TripType = 'one-way' | 'round-trip';

export function OutstationTransportScreen() {
  const insets = useSafeAreaInsets();
  const [tripType, setTripType] = useState<TripType>('one-way');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [duration, setDuration] = useState(TRANSPORT_DURATIONS[0] ?? '');
  const [people, setPeople] = useState(TRANSPORT_PEOPLE[0] ?? '');
  const { submitting, submit } = useMembershipSubmit('transport');

  const onRequest = () => {
    if (!from.trim() || !to.trim()) {
      Alert.alert('Missing details', 'Please enter both From and To locations.');
      return;
    }
    void submit(
      `${tripType === 'one-way' ? 'One way' : 'Round trip'}: ${from.trim()} → ${to.trim()} · ${duration} · ${people}`,
      'Cab request submitted',
    );
  };

  const onSupportCall = () => {
    void submit(
      `Customer Support call requested for transport. Trip draft: ${from.trim() || '?'} → ${to.trim() || '?'}`,
      'Support call requested',
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Outstation Transport" showBack showProfile={false} showBell={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MembershipServiceHero slug="transport" />
        <Text style={styles.hint}>Trained driver assistance · cost based on trip needs</Text>

        <View style={styles.tripTabs}>
          {(
            [
              { id: 'one-way' as const, label: 'One way' },
              { id: 'round-trip' as const, label: 'Round trip' },
            ] as const
          ).map((tab) => {
            const active = tab.id === tripType;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setTripType(tab.id)}
                style={[styles.tripTab, active ? styles.tripTabActive : null]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.tripTabLabel, active ? styles.tripTabLabelActive : null]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>From</Text>
        <TextInput
          value={from}
          onChangeText={setFrom}
          placeholder="Pickup location"
          placeholderTextColor={familyHome.muted}
          style={styles.input}
          accessibilityLabel="From"
        />

        <Text style={styles.label}>To</Text>
        <TextInput
          value={to}
          onChangeText={setTo}
          placeholder="Destination"
          placeholderTextColor={familyHome.muted}
          style={styles.input}
          accessibilityLabel="To"
        />

        <Text style={styles.label}>Duration</Text>
        <View style={styles.chipRow}>
          {TRANSPORT_DURATIONS.map((item) => {
            const active = item === duration;
            return (
              <Pressable
                key={item}
                onPress={() => setDuration(item)}
                style={[styles.chip, active ? styles.chipActive : null]}
              >
                <Text style={[styles.chipLabel, active ? styles.chipLabelActive : null]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Number of people</Text>
        <View style={styles.chipRow}>
          {TRANSPORT_PEOPLE.map((item) => {
            const active = item === people;
            return (
              <Pressable
                key={item}
                onPress={() => setPeople(item)}
                style={[styles.chip, active ? styles.chipActive : null]}
              >
                <Text style={[styles.chipLabel, active ? styles.chipLabelActive : null]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.primaryCta, submitting ? { opacity: 0.6 } : null]}
          onPress={onRequest}
          disabled={submitting}
          accessibilityRole="button"
        >
          <Icon name="car-outline" size={18} color={familyHome.white} />
          <Text style={styles.primaryCtaText}>{submitting ? 'Sending…' : 'Request a Driver'}</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryCta}
          onPress={onSupportCall}
          disabled={submitting}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryCtaText}>Call Customer Support</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.sm },
  hint: { ...typography.caption, color: familyHome.muted, marginBottom: spacing.sm },
  tripTabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  tripTab: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: familyHome.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripTabActive: { backgroundColor: familyHome.green, borderColor: familyHome.green },
  tripTabLabel: { ...typography.captionStrong, color: familyHome.text },
  tripTabLabelActive: { color: familyHome.white },
  label: { ...typography.captionStrong, color: familyHome.text, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    ...typography.body,
    color: familyHome.text,
    backgroundColor: '#FAFAFA',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipActive: { backgroundColor: familyHome.greenSoft, borderColor: familyHome.green },
  chipLabel: { ...typography.captionStrong, color: familyHome.text },
  chipLabelActive: { color: familyHome.greenDark },
  primaryCta: {
    marginTop: spacing.lg,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryCtaText: { ...typography.bodyStrong, color: familyHome.white },
  secondaryCta: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCtaText: { ...typography.bodyStrong, color: familyHome.green },
});
