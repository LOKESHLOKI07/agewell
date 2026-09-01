import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import type { ServiceOffering } from './catalogTypes';
import { parseOfferingMeta } from './catalogTypes';
import { MembershipServiceHero } from './MembershipServiceHero';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useServiceOfferings } from './useCatalog';

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <View style={styles.stars}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Text key={index} style={styles.star}>
          {index < full ? '★' : '☆'}
        </Text>
      ))}
    </View>
  );
}

function DoctorCard({
  doctor,
  submitting,
  onConsult,
}: {
  doctor: ServiceOffering;
  submitting: boolean;
  onConsult: () => void;
}) {
  const meta = parseOfferingMeta(doctor.metaJson);
  const rating = Number(meta.rating ?? '4.5');
  const reviews = meta.reviews ?? '0';
  const experience = meta.experience ?? doctor.description;
  const languages = meta.languages ?? '';
  const nextSlot = meta.nextSlot ?? doctor.priceLabel;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        {doctor.image ? (
          <Image source={{ uri: doctor.image }} style={styles.photo} accessibilityLabel={doctor.title} />
        ) : (
          <Avatar name={doctor.title} size={72} />
        )}
        <View style={styles.cardIntro}>
          <Text style={styles.name}>{doctor.title}</Text>
          <Text style={styles.specialty}>{doctor.badge || 'Doctor'}</Text>
          <View style={styles.ratingRow}>
            <Stars rating={Number.isFinite(rating) ? rating : 4.5} />
            <Text style={styles.ratingText}>
              {(Number.isFinite(rating) ? rating : 4.5).toFixed(1)} · {reviews} reviews
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.metaGrid}>
        {experience ? (
          <View style={styles.metaItem}>
            <Icon name="ribbon-outline" size={16} color={familyHome.blue} />
            <Text style={styles.metaText}>{experience}</Text>
          </View>
        ) : null}
        {nextSlot ? (
          <View style={styles.metaItem}>
            <Icon name="time-outline" size={16} color={familyHome.blue} />
            <Text style={styles.metaText}>{nextSlot}</Text>
          </View>
        ) : null}
        {languages ? (
          <View style={styles.metaItem}>
            <Icon name="people-outline" size={16} color={familyHome.blue} />
            <Text style={styles.metaText}>{languages}</Text>
          </View>
        ) : null}
      </View>

      <Pressable
        style={[styles.primaryCta, submitting ? { opacity: 0.6 } : null]}
        onPress={onConsult}
        disabled={submitting}
        accessibilityRole="button"
      >
        <Text style={styles.primaryCtaText}>{submitting ? 'Sending…' : 'Consult Now'}</Text>
      </Pressable>
    </View>
  );
}

export function DoctorConsultationScreen() {
  const insets = useSafeAreaInsets();
  const catalog = useServiceOfferings('doctor');
  const doctors = catalog.data ?? [];
  const [selectedId, setSelectedId] = useState('');
  const { submitting, submit } = useMembershipSubmit('doctor');

  useEffect(() => {
    if (!selectedId && doctors[0]) {
      setSelectedId(doctors[0].id);
    }
  }, [doctors, selectedId]);

  const onConsult = (doctor: ServiceOffering) => {
    setSelectedId(doctor.id);
    const meta = parseOfferingMeta(doctor.metaJson);
    void submit(
      `Consult: ${doctor.title} (${doctor.badge}) · preferred ${meta.nextSlot ?? doctor.priceLabel}`,
      'Consultation requested',
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Doctor Consultation" showBack showProfile={false} showBell={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MembershipServiceHero slug="doctor" />
        {catalog.isPending ? <Text style={styles.hint}>Loading doctors…</Text> : null}
        {catalog.isError ? (
          <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
            <Text style={styles.retry}>Unable to load · Tap to retry</Text>
          </Pressable>
        ) : null}
        {doctors.map((doctor) => (
          <View key={doctor.id} style={selectedId === doctor.id ? styles.selectedWrap : undefined}>
            <DoctorCard doctor={doctor} submitting={submitting} onConsult={() => onConsult(doctor)} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
  hint: { ...typography.caption, color: familyHome.muted },
  retry: { ...typography.captionStrong, color: familyHome.green },
  selectedWrap: {},
  card: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: familyHome.white,
  },
  cardTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  photo: { width: 72, height: 72, borderRadius: 36, backgroundColor: familyHome.border },
  cardIntro: { flex: 1, gap: 4 },
  name: { ...typography.subtitle, color: familyHome.text },
  specialty: { ...typography.caption, color: familyHome.muted },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  stars: { flexDirection: 'row' },
  star: { color: '#F2C94C', fontSize: 14, marginRight: 1 },
  ratingText: { ...typography.caption, color: familyHome.muted },
  metaGrid: { gap: spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaText: { ...typography.caption, color: familyHome.muted, flex: 1 },
  primaryCta: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: { ...typography.bodyStrong, color: familyHome.white },
});
