import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '@/components/KeyboardAwareScrollView';
import type { IconName } from '@/components/ui';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { MembershipServiceGate } from './MembershipServiceGate';
import { MembershipServiceHero } from './MembershipServiceHero';
import { useMembershipSubmit } from './useMembershipSubmit';

type Props = {
  title: string;
  subtitle: string;
  timingNote: string;
  topics: string[];
  icon: IconName;
  accent: string;
  accentSoft: string;
  slug: string;
};

export function SupportConsultationScreen(props: Props) {
  return (
    <MembershipServiceGate slug={props.slug} title={props.title}>
      <SupportConsultationBody {...props} />
    </MembershipServiceGate>
  );
}

function SupportConsultationBody({
  title,
  subtitle,
  timingNote,
  topics,
  icon,
  accent,
  accentSoft,
  slug,
}: Props) {
  const insets = useSafeAreaInsets();
  const [topic, setTopic] = useState(topics[0] ?? '');
  const [notes, setNotes] = useState('');
  const { submitting, submit } = useMembershipSubmit(slug);

  const onRequest = () => {
    void submit(`${topic}. ${notes.trim() || 'No extra notes'}`, `${title} request sent`);
  };

  const onSupportCall = () => {
    void submit(
      `Customer Support call requested for ${title}. Topic: ${topic}. ${notes.trim()}`.trim(),
      'Support call requested',
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title={title} showBack showProfile={false} showBell={false} />
      <KeyboardAwareScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MembershipServiceHero slug={slug} />
        <Text style={styles.hint}>{subtitle}</Text>
        <Text style={styles.timing}>{timingNote}</Text>

        <Text style={styles.section}>What do you need help with?</Text>
        <View style={styles.list}>
          {topics.map((item) => {
            const active = item === topic;
            return (
              <Pressable
                key={item}
                onPress={() => setTopic(item)}
                style={[styles.row, active ? styles.rowActive : null]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <View style={[styles.iconWell, { backgroundColor: accentSoft }]}>
                  <Icon name={icon} size={18} color={accent} />
                </View>
                <Text style={styles.rowTitle}>{item}</Text>
                {active ? (
                  <Icon name="checkmark-circle-outline" size={20} color={familyHome.green} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>Additional notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Share a short note for support"
          placeholderTextColor={familyHome.muted}
          style={styles.notes}
          multiline
          textAlignVertical="top"
        />

        <Pressable
          style={[styles.primaryCta, submitting ? { opacity: 0.6 } : null]}
          onPress={onRequest}
          disabled={submitting}
          accessibilityRole="button"
        >
          <Text style={styles.primaryCtaText}>{submitting ? 'Sending…' : 'Generate Request'}</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryCta}
          onPress={onSupportCall}
          disabled={submitting}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryCtaText}>Set up Customer Support call</Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

export function LegalAssistanceScreen() {
  return (
    <SupportConsultationScreen
      title="Legal Assistance"
      subtitle="Exclusive access to AgeWell’s lawyer team for consultation."
      timingNote="Service timing: 10 AM–6 PM"
      topics={[
        'Will / estate guidance',
        'Property documents',
        'Family / elder rights',
        'General legal consultation',
      ]}
      icon="document-text-outline"
      accent={familyHome.blue}
      accentSoft={familyHome.blueSoft}
      slug="legal"
    />
  );
}

export function CaAssistanceScreen() {
  return (
    <SupportConsultationScreen
      title="CA Assistance"
      subtitle="Exclusive CA access for financial-assistance consultation."
      timingNote="UI follows the Legal Assistance flow"
      topics={[
        'Tax filing help',
        'Pension / investment queries',
        'Bank and paperwork support',
        'General financial consultation',
      ]}
      icon="card-outline"
      accent={familyHome.green}
      accentSoft={familyHome.greenSoft}
      slug="ca"
    />
  );
}

export function SmallErrandsScreen() {
  return (
    <SupportConsultationScreen
      title="Small Errands Assistance"
      subtitle="Our companion will call before the visit and assist with small errands that can be managed during the visit."
      timingNote="Bundled with companion visits · max ~30 mins as needed"
      topics={[
        'Pharmacy pickup',
        'Nearby shop purchase',
        'Document drop / pickup',
        'Other small errand',
      ]}
      icon="accessibility-outline"
      accent={familyHome.orange}
      accentSoft={familyHome.orangeSoft}
      slug="small-errands"
    />
  );
}

export function ErrandCoordinationScreen() {
  return (
    <SupportConsultationScreen
      title="Coordination for Other Errands"
      subtitle="Our companion will coordinate errands such as ironing, haircut and other personal services as needed."
      timingNote="Coordination support — service provider charges may apply"
      topics={[
        'Ironing / laundry coordination',
        'Haircut / grooming appointment',
        'Personal service booking',
        'Other errand coordination',
      ]}
      icon="clipboard-outline"
      accent={familyHome.purple}
      accentSoft={familyHome.purpleSoft}
      slug="errand-coordination"
    />
  );
}

export function CyberSecurityGuidanceScreen() {
  return (
    <SupportConsultationScreen
      title="Cyber Security Guidance"
      subtitle="Guidance on online scams and awareness by a trained companion. Help before investing or sharing OTPs, and support after fraud."
      timingNote="Companion guidance · complaint follow-up when needed"
      topics={[
        'Online scam / phishing awareness',
        'OTP and password safety',
        'Advice before investing or paying',
        'Help after fraud (complaints / follow-up)',
      ]}
      icon="shield-checkmark-outline"
      accent={familyHome.purple}
      accentSoft={familyHome.purpleSoft}
      slug="cyber-security"
    />
  );
}

export function BankingCompanionScreen() {
  return (
    <SupportConsultationScreen
      title="Banking Companion"
      subtitle="Book a companion for bank visits like pension withdrawal, cheque deposit, passbook update and other banking work."
      timingNote="Paid per visit · prior appointment required"
      topics={[
        'Pension withdrawal',
        'Cheque deposit',
        'Passbook update',
        'Other banking work',
      ]}
      icon="card-outline"
      accent={familyHome.green}
      accentSoft={familyHome.greenSoft}
      slug="banking-companion"
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
  hint: { ...typography.body, color: familyHome.muted, lineHeight: 22 },
  timing: { ...typography.captionStrong, color: familyHome.greenDark },
  section: { ...typography.subtitle, color: familyHome.text, marginTop: spacing.sm },
  list: { gap: spacing.sm },
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { ...typography.bodyStrong, color: familyHome.text, flex: 1 },
  notes: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.lg,
    ...typography.body,
    color: familyHome.text,
    backgroundColor: '#FAFAFA',
  },
  primaryCta: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
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
