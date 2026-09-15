import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '@/components/KeyboardAwareScrollView';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { MembershipServiceHero } from './MembershipServiceHero';
import { gatedMembershipScreen } from './MembershipServiceGate';
import { useMembershipSubmit } from './useMembershipSubmit';

const MODES = ['Cab', 'Rickshaw', 'Either — companion decides'] as const;

/** Brochure #18 — companion-supported local cab / rickshaw coordination. */
export const LocalTransportScreen = gatedMembershipScreen(
  'local-transport',
  'Local Area Transportation',
  LocalTransportLive,
);

function LocalTransportLive() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<(typeof MODES)[number]>(MODES[0]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [when, setWhen] = useState('');
  const { submitting, submit } = useMembershipSubmit('local-transport');

  const onRequest = () => {
    if (!from.trim() || !to.trim()) {
      Alert.alert('Missing details', 'Please enter both From and To locations.');
      return;
    }
    void submit(
      `Local ${mode}: ${from.trim()} → ${to.trim()}${when.trim() ? ` · ${when.trim()}` : ''}`,
      'Local transport requested',
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Local Area Transportation" showBack showProfile={false} showBell={false} />
      <KeyboardAwareScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MembershipServiceHero slug="local-transport" />
        <Text style={styles.hint}>Companion-supported coordination between cabs and rickshaws.</Text>

        <Text style={styles.label}>Mode</Text>
        <View style={styles.chipRow}>
          {MODES.map((item) => {
            const active = item === mode;
            return (
              <Pressable
                key={item}
                onPress={() => setMode(item)}
                style={[styles.chip, active ? styles.chipActive : null]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.chipLabel, active ? styles.chipLabelActive : null]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>From</Text>
        <TextInput
          value={from}
          onChangeText={setFrom}
          placeholder="Pickup"
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

        <Text style={styles.label}>Preferred time (optional)</Text>
        <TextInput
          value={when}
          onChangeText={setWhen}
          placeholder="e.g. Tomorrow 10:30 AM"
          placeholderTextColor={familyHome.muted}
          style={styles.input}
          accessibilityLabel="Preferred time"
        />

        <Pressable
          style={[styles.primaryCta, submitting ? { opacity: 0.6 } : null]}
          onPress={onRequest}
          disabled={submitting}
          accessibilityRole="button"
        >
          <Text style={styles.primaryCtaText}>{submitting ? 'Sending…' : 'Request coordination'}</Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
  hint: { ...typography.body, color: familyHome.muted, lineHeight: 22 },
  label: { ...typography.captionStrong, color: familyHome.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: { borderColor: familyHome.green, backgroundColor: familyHome.greenSoft },
  chipLabel: { ...typography.captionStrong, color: familyHome.text },
  chipLabelActive: { color: familyHome.greenDark },
  input: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
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
