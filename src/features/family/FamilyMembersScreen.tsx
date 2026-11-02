import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '@/api/errors';
import { Screen, TextField } from '@/components';
import { Icon } from '@/components/ui';
import { colors, minTouchSize, radius, spacing, typography } from '@/constants/theme';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';
import { useSeniorProfile } from '@/features/home/hooks/queries';
import {
  createFamilyInvite,
  fetchFamilyCircle,
  revokeFamilyAccess,
} from './api/familyInviteApi';
import {
  membershipInviteSuggestions,
  type MembershipInviteSuggestion,
} from './membershipInviteSuggestions';

const CIRCLE_KEY = ['families', 'circle'] as const;

export function FamilyMembersScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const seniorQuery = useSeniorProfile();
  const circleQuery = useQuery({
    queryKey: CIRCLE_KEY,
    queryFn: fetchFamilyCircle,
  });

  const [adding, setAdding] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [sendingSuggestionKey, setSendingSuggestionKey] = useState<string | null>(null);

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: CIRCLE_KEY });
  }, [queryClient]);

  const members = circleQuery.data?.members ?? [];
  const suggestions = useMemo(
    () => membershipInviteSuggestions(seniorQuery.data, members),
    [seniorQuery.data, members],
  );

  const createMutation = useMutation({
    mutationFn: createFamilyInvite,
    onSuccess: (invite) => {
      invalidate();
      setAdding(false);
      setFirstName('');
      setLastName('');
      setRelationship('');
      setEmail('');
      setPhone('');
      setFormError(null);
      setSendingSuggestionKey(null);

      if (invite.alreadyLinked) {
        Alert.alert('Already linked', `${invite.firstName} is already in your family circle.`);
        return;
      }

      const loginHint = invite.email || invite.phone || 'their mobile';
      const passwordHint = invite.initialPassword
        ? `\n\nTemporary password: ${invite.initialPassword}\n(They can change it with Forgot password.)`
        : '\n\nThey can sign in with their existing EldCare password (or Forgot password).';

      Alert.alert(
        invite.accountCreated ? 'Family account created' : 'Family linked',
        `${invite.firstName} can sign in with ${loginHint}.${passwordHint}`,
      );
    },
    onError: (error) => {
      setSendingSuggestionKey(null);
      setFormError(getApiErrorMessage(error));
      Alert.alert('Could not add family', getApiErrorMessage(error));
    },
  });

  const onSubmitInvite = () => {
    setFormError(null);
    if (!firstName.trim() || !relationship.trim()) {
      setFormError('Name and relationship are required.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) {
      setFormError('Mobile number is required (it becomes their login password).');
      return;
    }
    createMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      relationship: relationship.trim(),
      email: email.trim() || undefined,
      phone: phone.trim(),
    });
  };

  const onInviteSuggestion = (suggestion: MembershipInviteSuggestion) => {
    Alert.alert(
      'Add family member?',
      `Create a login for ${suggestion.firstName} (${suggestion.phone}). Temporary password = their mobile number.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: () => {
            setSendingSuggestionKey(suggestion.key);
            createMutation.mutate({
              firstName: suggestion.firstName,
              lastName: suggestion.lastName,
              relationship: suggestion.relationship,
              phone: suggestion.phone,
            });
          },
        },
      ],
    );
  };

  const onRevokeMember = (accessId: string, name: string) => {
    Alert.alert('Remove access?', `${name} will no longer see your care information.`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void revokeFamilyAccess(accessId)
            .then(() => invalidate())
            .catch((error) => Alert.alert('Could not remove', getApiErrorMessage(error)));
        },
      },
    ]);
  };

  const onRefresh = () => {
    void Promise.all([
      circleQuery.refetch(),
      queryClient.invalidateQueries({ queryKey: homeQueryKeys.seniorMe }),
    ]);
  };

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.back}
        >
          <Icon name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Family members</Text>
        <Text style={styles.subtitle}>
          Add family from your membership contacts. They sign in with email or mobile; temporary password is their
          mobile number.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.xl) + spacing.xxl }]}
        refreshControl={
          <RefreshControl
            refreshing={circleQuery.isRefetching || seniorQuery.isRefetching}
            onRefresh={onRefresh}
            tintColor={familyHome.green}
          />
        }
      >
        {circleQuery.isLoading ? (
          <ActivityIndicator color={familyHome.green} style={{ marginTop: spacing.xl }} />
        ) : null}

        {circleQuery.isError ? (
          <Text style={styles.error}>{getApiErrorMessage(circleQuery.error)}</Text>
        ) : null}

        {suggestions.length > 0 ? (
          <>
            <Text style={styles.sectionFirst}>From your membership form</Text>
            <Text style={styles.hint}>Tap Add to create their EldCare login and link them to you.</Text>
            {suggestions.map((suggestion) => {
              const busy = sendingSuggestionKey === suggestion.key && createMutation.isPending;
              const name = `${suggestion.firstName} ${suggestion.lastName}`.trim();
              return (
                <View key={suggestion.key} style={styles.card}>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{name}</Text>
                    <Text style={styles.cardMeta}>
                      {suggestion.label} · {suggestion.phone}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => onInviteSuggestion(suggestion)}
                    disabled={createMutation.isPending}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${name}`}
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      createMutation.isPending ? styles.disabled : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={styles.secondaryBtnLabel}>{busy ? 'Adding…' : 'Add'}</Text>
                  </Pressable>
                </View>
              );
            })}
          </>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed ? styles.pressed : null]}
          onPress={() => setAdding((value) => !value)}
          accessibilityRole="button"
        >
          <Text style={styles.primaryBtnLabel}>{adding ? 'Close form' : 'Add someone else'}</Text>
        </Pressable>

        {adding ? (
          <View style={styles.form}>
            <TextField label="First name" value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
            <TextField label="Last name" value={lastName} onChangeText={setLastName} autoCapitalize="words" />
            <TextField
              label="Relationship"
              placeholder="Daughter, son, caregiver…"
              value={relationship}
              onChangeText={setRelationship}
              autoCapitalize="sentences"
            />
            <TextField
              label="Mobile (required — login password)"
              placeholder="10-digit mobile"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <TextField
              label="Email (optional)"
              placeholder="family@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            {formError ? <Text style={styles.error}>{formError}</Text> : null}
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                createMutation.isPending ? styles.disabled : null,
                pressed ? styles.pressed : null,
              ]}
              onPress={onSubmitInvite}
              disabled={createMutation.isPending}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnLabel}>
                {createMutation.isPending && !sendingSuggestionKey ? 'Creating…' : 'Create family login'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.section}>Linked now</Text>
        {members.length === 0 ? (
          <Text style={styles.empty}>No family linked yet.</Text>
        ) : (
          members.map((member) => {
            const name = `${member.firstName} ${member.lastName}`.trim();
            return (
              <View key={member.accessId} style={styles.card}>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{name}</Text>
                  <Text style={styles.cardMeta}>{member.relationship || 'Family'}</Text>
                  {member.email && !member.email.endsWith('@phone.eldcare.local') ? (
                    <Text style={styles.cardMeta}>{member.email}</Text>
                  ) : null}
                  {member.phone ? <Text style={styles.cardMeta}>{member.phone}</Text> : null}
                </View>
                <Pressable
                  onPress={() => onRevokeMember(member.accessId, name)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${name}`}
                  style={styles.dangerLink}
                >
                  <Text style={styles.dangerLinkText}>Remove</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  back: {
    width: minTouchSize,
    height: minTouchSize,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  primaryBtn: {
    backgroundColor: familyHome.green,
    borderRadius: radius.md,
    minHeight: minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primaryBtnLabel: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  secondaryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: familyHome.greenSoft,
    borderRadius: radius.sm,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnLabel: {
    ...typography.bodyStrong,
    color: familyHome.greenDark,
    fontSize: 14,
  },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.6 },
  form: { gap: spacing.sm },
  sectionFirst: {
    ...typography.subtitle,
    color: colors.text,
  },
  section: {
    ...typography.subtitle,
    color: colors.text,
    marginTop: spacing.md,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: -spacing.sm,
  },
  empty: {
    ...typography.body,
    color: colors.textMuted,
  },
  card: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: familyHome.surfaceMuted,
    gap: spacing.sm,
  },
  cardBody: { gap: 2 },
  cardTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  cardMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  dangerLink: {
    alignSelf: 'flex-start',
  },
  dangerLinkText: {
    ...typography.body,
    color: colors.emergency,
    fontWeight: '600',
  },
  error: {
    ...typography.body,
    color: colors.emergency,
  },
});
