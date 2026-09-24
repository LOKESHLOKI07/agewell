import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '@/components/KeyboardAwareScrollView';
import type { IconName } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { useServiceRequests, useServices } from '@/features/home/hooks/queries';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import {
  AboutServiceCard,
  CallSupportCard,
  OfferingCategoryGrid,
  RecentRequestsList,
} from './components/LiveServiceParts';
import { MembershipServiceGate } from './MembershipServiceGate';
import { MembershipServiceHero } from './MembershipServiceHero';
import { filterRequestsBySlug, toLiveRequestViews } from './liveServiceRequests';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useServiceOfferings } from './useCatalog';

type Props = {
  title: string;
  subtitle: string;
  defaultHours: string;
  callEyebrow: string;
  callTitle: string;
  callBody: string;
  callCta: string;
  categoryHint: string;
  icon: IconName;
  accent: string;
  accentSoft: string;
  slug: string;
  showNotes?: boolean;
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
  defaultHours,
  callEyebrow,
  callTitle,
  callBody,
  callCta,
  categoryHint,
  icon,
  accent,
  accentSoft,
  slug,
  showNotes = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const services = useServices();
  const catalog = useServiceOfferings(slug);
  const requestsQuery = useServiceRequests();
  const offerings = catalog.data ?? [];
  const [selectedId, setSelectedId] = useState('');
  const [notes, setNotes] = useState('');
  const selected = offerings.find((item) => item.id === selectedId);
  const { submitting, submit } = useMembershipSubmit(slug);

  const service = useMemo(
    () => (services.data ?? []).find((item) => item.slug === slug) ?? null,
    [services.data, slug],
  );

  const recent = useMemo(() => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], slug);
    return toLiveRequestViews(mine, { fallbackTitle: title });
  }, [requestsQuery.data?.items, slug, title]);

  useEffect(() => {
    if (!selectedId && offerings[0]) setSelectedId(offerings[0].id);
  }, [offerings, selectedId]);

  const hours = service?.callHoursText?.trim() || defaultHours;
  const about = service?.description?.trim() || subtitle;

  const onRaise = () => {
    const topic = selected?.title ?? title;
    void submit(`${topic}. ${notes.trim() || 'No extra notes'}`, `${title} request sent`).then((ok) => {
      if (ok) setNotes('');
    });
  };

  const onCall = () => {
    void submit(
      `Call requested for ${title}. Topic: ${selected?.title ?? 'General'}. ${notes.trim()}`.trim(),
      'Support call requested',
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ServicePageHeader />
      <KeyboardAwareScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MembershipServiceHero slug={slug} />
        <Text style={styles.hint}>{subtitle}</Text>

        <CallSupportCard
          eyebrow={callEyebrow}
          title={callTitle}
          body={callBody}
          hoursText={hours}
          phone={service?.supportPhone}
          ctaLabel={callCta}
          submitting={submitting}
          onCallFallback={onCall}
        />

        <Text style={styles.section}>{categoryHint}</Text>
        {catalog.isPending ? <Text style={styles.muted}>Loading categories…</Text> : null}
        {catalog.isError ? (
          <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
            <Text style={styles.retry}>Unable to load · Tap to retry</Text>
          </Pressable>
        ) : null}
        {offerings.length > 0 ? (
          <OfferingCategoryGrid
            items={offerings}
            selectedId={selectedId}
            onSelect={setSelectedId}
            accent={accent}
            accentSoft={accentSoft}
            icon={icon}
          />
        ) : null}

        {showNotes ? (
          <>
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Share a short note for support"
              placeholderTextColor={familyHome.muted}
              style={styles.notes}
              multiline
              textAlignVertical="top"
              accessibilityLabel="Notes"
            />
          </>
        ) : null}

        <Pressable
          style={[styles.primaryCta, submitting ? styles.disabled : null]}
          onPress={onRaise}
          disabled={submitting}
          accessibilityRole="button"
        >
          <Text style={styles.primaryCtaText}>{submitting ? 'Sending…' : 'Raise a Request'}</Text>
        </Pressable>

        <RecentRequestsList items={recent} />
        <AboutServiceCard text={about} />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
  hint: { ...typography.body, color: familyHome.muted, lineHeight: 22 },
  section: { ...typography.subtitle, color: familyHome.text, marginTop: spacing.sm },
  muted: { ...typography.caption, color: familyHome.muted },
  retry: { ...typography.captionStrong, color: familyHome.green },
  label: { ...typography.captionStrong, color: familyHome.text },
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
  disabled: { opacity: 0.6 },
});
