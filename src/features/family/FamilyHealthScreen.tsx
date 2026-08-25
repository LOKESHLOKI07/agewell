import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography } from '@/constants/theme';
import { NavCard } from '@/components/ui';
import { seniorDisplayName } from '@/features/home/api/mappers';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { FamilyQueryView } from './components/FamilyQueryView';
import { FamilySubScreen } from './components/FamilySubScreen';
import { SeniorSelector } from './components/SeniorSelector';
import { useFamilyScope, useSelectFamilySenior } from './hooks';
import { FAMILY_HEALTH_LINKS, familyHealthHref } from './selectors';

export function FamilyHealthScreen() {
  const { seniorsQuery, selectedSeniorId, selectedSenior } = useFamilyScope();
  const selectSenior = useSelectFamilySenior();
  const parentName = selectedSenior ? seniorDisplayName(selectedSenior) : null;
  const seniorsState = getSectionState({
    isPending: seniorsQuery.isPending,
    isError: seniorsQuery.isError,
    isEmpty: (seniorsQuery.data?.length ?? 0) === 0,
  });

  return (
    <FamilySubScreen title="Health" showBack={false}>
      <FamilyQueryView
        state={seniorsState}
        error={seniorsQuery.error}
        onRetry={() => void seniorsQuery.refetch()}
        loadingMessage="Loading connected seniors..."
        emptyIcon="people-outline"
        emptyTitle="No connected seniors"
        emptyMessage="Seniors you are authorized to support will appear here."
      >
        <SeniorSelector
          seniors={seniorsQuery.data ?? []}
          selectedSeniorId={selectedSeniorId}
          onSelect={(seniorId) => void selectSenior.mutateAsync(seniorId)}
          disabled={selectSenior.isPending}
        />
      </FamilyQueryView>

      {selectedSeniorId ? (
        <>
          <Text style={styles.intro}>
            Health records for {parentName ?? 'the selected senior'}. Choose a section to review.
          </Text>
          <View style={styles.links}>
          {FAMILY_HEALTH_LINKS.map((item) => (
            <NavCard
              key={item.key}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              onPress={() => router.push(familyHealthHref(item.href))}
              accessibilityHint={item.accessibilityHint}
            />
          ))}
          </View>
        </>
      ) : null}
    </FamilySubScreen>
  );
}

const styles = StyleSheet.create({
  intro: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  links: {
    gap: spacing.md,
  },
});
