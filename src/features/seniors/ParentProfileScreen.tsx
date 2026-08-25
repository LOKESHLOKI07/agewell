import { useLocalSearchParams } from 'expo-router';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppHeader, ErrorState, LoadingState, Screen, SectionHeader, StatusBadge } from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { getMembershipById, getSeniorById } from '@/services/seniorService';
import { useLoad } from '@/hooks/useLoad';
import { formatCurrencyInr } from '@/utils/date';
import { fullName } from '@/utils/greeting';
import { careStatusPresentation } from '@/utils/status';

export function ParentProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, loading, error, reload } = useLoad(async () => {
    const senior = await getSeniorById(id);
    if (!senior) {
      throw new Error('Parent profile could not be found.');
    }
    const membership = await getMembershipById(senior.membershipId);
    return { senior, membership };
  }, id);

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Parent profile" showBack />
        <LoadingState message="Loading parent profile..." />
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen>
        <AppHeader title="Parent profile" showBack />
        <ErrorState message={error ?? 'Profile not found'} onRetry={reload} />
      </Screen>
    );
  }

  const { senior, membership } = data;
  const address = `${senior.address.line1}, ${senior.address.area}, ${senior.address.city}, ${senior.address.state} ${senior.address.pincode}`;

  return (
    <Screen>
      <AppHeader title={fullName(senior.firstName, senior.lastName)} subtitle="Parent profile" showBack />
      <StatusBadge presentation={careStatusPresentation(senior.careStatus)} />

      <View style={styles.stack}>
        <InfoCard title="Personal information">
          <InfoRow label="Name" value={fullName(senior.firstName, senior.lastName)} />
          <InfoRow label="Age" value={`${senior.age}`} />
          <InfoRow label="Gender" value={senior.gender === 'female' ? 'Female' : senior.gender === 'male' ? 'Male' : 'Other'} />
          <InfoRow label="Address" value={address} />
        </InfoCard>

        <InfoCard title="Emergency contacts">
          {senior.emergencyContacts.map((contact) => (
            <InfoRow
              key={contact.id}
              label={`${contact.name} · ${contact.relationship}`}
              value={contact.phone}
            />
          ))}
        </InfoCard>

        <InfoCard title="Healthcare">
          <InfoRow label="Primary doctor" value={`${senior.primaryDoctor.name}, ${senior.primaryDoctor.specialty}`} />
          <InfoRow label="Hospital" value={`${senior.hospital.name}, ${senior.hospital.area}`} />
        </InfoCard>

        <InfoCard title="Care plan">
          <InfoRow label="Plan" value={membership?.name ?? 'AgeWell Family'} />
          <InfoRow
            label="Investment"
            value={membership ? `${formatCurrencyInr(membership.priceInrPerMonth)}/month` : '—'}
          />
        </InfoCard>

        <Text style={styles.privacy}>
          Detailed clinical records are not shown on Home. Only the information needed for family coordination
          appears here.
        </Text>
      </View>
    </Screen>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <SectionHeader title={title} />
      <View style={[styles.card, shadows.card]}>{children}</View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    marginTop: spacing.xxl,
    gap: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  row: {
    gap: 4,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  privacy: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
