import { useState } from 'react';
import { Alert, Linking, StyleSheet, Switch, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { PrimaryButton, SecondaryButton, StatusBadge, TextField } from '@/components';
import { cardSurface, colors, spacing, tones, typography } from '@/constants/theme';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import {
  emergencyStatusLabel,
  formatEmergencyWhen,
  recipientStatusLabel,
  triggerSourceLabel,
} from '@/features/emergency/selectors';
import { useAcknowledgeEmergency, useEmergencyCase, useUpdateEmergencyReport } from '@/features/emergency/hooks';
import { CareQueryView } from './components/CareQueryView';
import { CareSubScreen } from './components/CareSubScreen';

export function StaffEmergencyRespondScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const caseQuery = useEmergencyCase(id);
  const acknowledge = useAcknowledgeEmergency();
  const report = useUpdateEmergencyReport();
  const emergency = caseQuery.data;
  const state = getSectionState({
    isPending: caseQuery.isPending,
    isError: caseQuery.isError,
    isEmpty: caseQuery.isSuccess && !caseQuery.data,
  });

  const [whatHappened, setWhatHappened] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [hospitalRequired, setHospitalRequired] = useState(false);
  const [hospitalDetails, setHospitalDetails] = useState('');
  const [familyCommunication, setFamilyCommunication] = useState('');
  const [notes, setNotes] = useState('');
  const [followUp, setFollowUp] = useState(false);

  const onRespond = async () => {
    if (!emergency) {
      return;
    }
    try {
      await acknowledge.mutateAsync(emergency.id);
      Alert.alert('Responding', 'You are marked as responding to this SOS.');
    } catch {
      Alert.alert('Update failed', 'Could not update this emergency. Please try again.');
    }
  };

  const onSaveReport = async (resolve: boolean) => {
    if (!emergency) {
      return;
    }
    try {
      await report.mutateAsync({
        id: emergency.id,
        payload: {
          what_happened: whatHappened.trim() || null,
          action_taken: actionTaken.trim() || null,
          hospital_required: hospitalRequired,
          hospital_details: hospitalRequired ? hospitalDetails.trim() || null : null,
          family_communication: familyCommunication.trim() || null,
          notes: notes.trim() || null,
          follow_up_required: followUp,
          mark_resolved: resolve,
        },
      });
      Alert.alert(resolve ? 'Emergency resolved' : 'Details saved', 'The emergency record is updated for everyone.');
    } catch {
      Alert.alert('Update failed', 'Could not save the emergency report. Please try again.');
    }
  };

  return (
    <CareSubScreen title="SOS Alert">
      <CareQueryView
        state={state}
        error={caseQuery.error}
        onRetry={() => void caseQuery.refetch()}
        loadingMessage="Loading emergency..."
        emptyIcon="alert-circle-outline"
        emptyTitle="Alert not found"
        emptyMessage="This emergency request is not available."
      >
        {emergency ? (
          <View style={styles.form}>
            <View style={styles.sosCard}>
              <Text style={styles.sosEyebrow}>SOS</Text>
              <Text style={styles.sosTitle}>{emergency.caseNumber ? `#${emergency.caseNumber}` : 'Emergency alert'}</Text>
              <StatusBadge
                presentation={{
                  label: emergencyStatusLabel(emergency.status),
                  color: tones.emergency.fg,
                  background: tones.emergency.bg,
                }}
              />
              <Text style={styles.sosMeta}>
                {emergency.seniorName ?? 'Assigned senior'} · {formatEmergencyWhen(emergency.triggeredAt ?? emergency.createdAt) ?? 'Time not on file'}
              </Text>
              <Text style={styles.sosMeta}>
                {triggerSourceLabel(emergency.triggerSource)}
                {emergency.locationText ? ` · ${emergency.locationText}` : ''}
              </Text>
            </View>

            <Text style={styles.section}>Recipient status</Text>
            {emergency.recipients.map((item) => (
              <Text key={item.id} style={styles.recipientLine}>
                {item.label} — {recipientStatusLabel(item.status, item.respondedAt, item.notifiedAt)}
              </Text>
            ))}

            <View style={styles.actions}>
              <PrimaryButton
                label="Respond / Acknowledge"
                onPress={() => void onRespond()}
                loading={acknowledge.isPending}
                disabled={emergency.status === 'RESOLVED' || emergency.status === 'CANCELLED'}
              />
              <SecondaryButton
                label="Call"
                onPress={() => void Linking.openURL('tel:')}
              />
              <SecondaryButton
                label="Navigate"
                onPress={() =>
                  void Linking.openURL(
                    emergency.locationText
                      ? `https://maps.google.com/?q=${encodeURIComponent(emergency.locationText)}`
                      : 'https://maps.google.com',
                  )
                }
              />
            </View>

            <Text style={styles.section}>Emergency handling</Text>
            <TextField
              label="What happened"
              value={whatHappened}
              onChangeText={setWhatHappened}
              placeholder="Describe the situation"
              multiline
            />
            <TextField
              label="How it was handled"
              value={actionTaken}
              onChangeText={setActionTaken}
              placeholder="Assistance provided"
              multiline
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Hospital assistance required</Text>
              <Switch value={hospitalRequired} onValueChange={setHospitalRequired} />
            </View>
            {hospitalRequired ? (
              <TextField
                label="Hospital details"
                value={hospitalDetails}
                onChangeText={setHospitalDetails}
                placeholder="Hospital name and notes"
                multiline
              />
            ) : null}
            <TextField
              label="Family communication"
              value={familyCommunication}
              onChangeText={setFamilyCommunication}
              placeholder="What the family was told"
              multiline
            />
            <TextField
              label="Additional notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Follow-up or coordinator notes"
              multiline
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Follow-up required</Text>
              <Switch value={followUp} onValueChange={setFollowUp} />
            </View>
            <PrimaryButton
              label={report.isPending ? 'Saving…' : 'Save handling details'}
              onPress={() => void onSaveReport(false)}
              loading={report.isPending}
            />
            <SecondaryButton
              label="Mark resolved"
              onPress={() => void onSaveReport(true)}
              disabled={report.isPending || emergency.status === 'RESOLVED'}
            />
          </View>
        ) : null}
      </CareQueryView>
    </CareSubScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  sosCard: {
    ...cardSurface,
    padding: spacing.xxl,
    backgroundColor: colors.emergencySoft,
    borderColor: colors.emergencySoft,
    gap: spacing.md,
  },
  sosEyebrow: {
    ...typography.captionStrong,
    color: colors.emergency,
    letterSpacing: 1,
  },
  sosTitle: {
    ...typography.title,
    color: colors.text,
  },
  sosMeta: {
    ...typography.body,
    color: colors.textSecondary,
  },
  section: {
    ...typography.subtitle,
    color: colors.text,
    marginTop: spacing.sm,
  },
  recipientLine: {
    ...typography.body,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  switchLabel: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    paddingRight: spacing.md,
  },
});
