import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { MembershipServiceHero } from './MembershipServiceHero';
import { INSPECTION_REPORTS } from './mockLifestyle';

export function HomeInspectionScreen() {
  const insets = useSafeAreaInsets();
  const [reportId, setReportId] = useState(INSPECTION_REPORTS[0]?.id ?? '');
  const report = INSPECTION_REPORTS.find((item) => item.id === reportId) ?? INSPECTION_REPORTS[0];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Home Inspection" showBack showProfile={false} showBell={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MembershipServiceHero slug="home-inspection" />
        <Text style={styles.hint}>
          Optional monthly general home safety check — washroom, bedroom, entrance and more
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.months}>
          {INSPECTION_REPORTS.map((item) => {
            const active = item.id === reportId;
            return (
              <Pressable
                key={item.id}
                onPress={() => setReportId(item.id)}
                style={[styles.monthChip, active ? styles.monthChipActive : null]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.monthLabel, active ? styles.monthLabelActive : null]}>
                  {item.monthLabel}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {report ? (
          <View style={styles.reportCard}>
            <View style={styles.reportTop}>
              <Text style={styles.reportTitle}>{report.monthLabel} checkup</Text>
              <View
                style={[
                  styles.overallBadge,
                  report.overall === 'Needs attention' ? styles.attentionBadge : null,
                ]}
              >
                <Text style={styles.overallText}>{report.overall}</Text>
              </View>
            </View>
            <Text style={styles.meta}>Inspected on {report.inspectedOn}</Text>

            <View style={styles.areaList}>
              {report.areas.map((area) => (
                <View key={area.id} style={styles.areaRow}>
                  <View
                    style={[
                      styles.areaIcon,
                      area.status === 'Attention' ? styles.areaIconWarn : null,
                    ]}
                  >
                    <Icon
                      name={
                        area.status === 'Attention' ? 'warning-outline' : 'shield-checkmark-outline'
                      }
                      size={16}
                      color={area.status === 'Attention' ? familyHome.orange : familyHome.green}
                    />
                  </View>
                  <View style={styles.areaBody}>
                    <Text style={styles.areaName}>{area.name}</Text>
                    <Text style={styles.areaNote}>{area.note}</Text>
                  </View>
                  <Text
                    style={[
                      styles.areaStatus,
                      area.status === 'Attention' ? styles.areaStatusWarn : null,
                    ]}
                  >
                    {area.status}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
  hint: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  months: { gap: spacing.sm, paddingVertical: spacing.xs },
  monthChip: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  monthChipActive: { backgroundColor: familyHome.green, borderColor: familyHome.green },
  monthLabel: { ...typography.captionStrong, color: familyHome.text },
  monthLabelActive: { color: familyHome.white },
  reportCard: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  reportTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  reportTitle: { ...typography.subtitle, color: familyHome.text, flex: 1 },
  overallBadge: {
    backgroundColor: familyHome.greenSoft,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  attentionBadge: { backgroundColor: familyHome.orangeSoft },
  overallText: { ...typography.captionStrong, color: familyHome.text },
  meta: { ...typography.caption, color: familyHome.muted },
  areaList: { gap: spacing.sm, marginTop: spacing.sm },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  areaIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaIconWarn: { backgroundColor: familyHome.orangeSoft },
  areaBody: { flex: 1, gap: 2 },
  areaName: { ...typography.bodyStrong, color: familyHome.text },
  areaNote: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  areaStatus: { ...typography.captionStrong, color: familyHome.greenDark },
  areaStatusWarn: { color: familyHome.orange },
});
