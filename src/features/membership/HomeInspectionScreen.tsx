import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import {
  filterOfferingsByKind,
  parseInspectionAreas,
  parseOfferingMeta,
} from './catalogTypes';
import { MembershipServiceHero } from './MembershipServiceHero';
import { gatedMembershipScreen } from './MembershipServiceGate';
import { useServiceOfferings } from './useCatalog';

export const HomeInspectionScreen = gatedMembershipScreen(
  'home-inspection',
  'Home Inspection',
  HomeInspectionLive,
);

function HomeInspectionLive() {
  const insets = useSafeAreaInsets();
  const catalog = useServiceOfferings('home-inspection');
  const reports = useMemo(
    () => filterOfferingsByKind(catalog.data ?? [], 'report'),
    [catalog.data],
  );
  const [reportId, setReportId] = useState('');

  useEffect(() => {
    if (!reportId && reports[0]) setReportId(reports[0].id);
  }, [reports, reportId]);

  const report = reports.find((item) => item.id === reportId) ?? reports[0];
  const meta = parseOfferingMeta(report?.metaJson);
  const areas = parseInspectionAreas(report?.metaJson);
  const overall = meta.overall === 'Needs attention' ? 'Needs attention' : 'All clear';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Home Inspection" showBack showProfile={false} showBell={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MembershipServiceHero slug="home-inspection" />
        <Text style={styles.hint}>
          Optional monthly general home safety check — washroom, bedroom, entrance and more
        </Text>

        {catalog.isPending ? <Text style={styles.hint}>Loading reports…</Text> : null}
        {catalog.isError ? (
          <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
            <Text style={styles.retry}>Unable to load · Tap to retry</Text>
          </Pressable>
        ) : null}

        {reports.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.months}>
            {reports.map((item) => {
              const active = item.id === reportId;
              const label = parseOfferingMeta(item.metaJson).monthLabel || item.title;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setReportId(item.id)}
                  style={[styles.monthChip, active ? styles.monthChipActive : null]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.monthLabel, active ? styles.monthLabelActive : null]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {report ? (
          <View style={styles.reportCard}>
            <View style={styles.reportTop}>
              <Text style={styles.reportTitle}>
                {meta.monthLabel || report.title}
              </Text>
              <View
                style={[
                  styles.overallBadge,
                  overall === 'Needs attention' ? styles.attentionBadge : null,
                ]}
              >
                <Text style={styles.overallText}>{overall}</Text>
              </View>
            </View>
            {meta.inspectedOn ? (
              <Text style={styles.meta}>Inspected on {meta.inspectedOn}</Text>
            ) : null}

            <View style={styles.areaList}>
              {areas.map((area) => (
                <View key={`${report.id}-${area.name}`} style={styles.areaRow}>
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
              {areas.length === 0 ? (
                <Text style={styles.meta}>{report.description || 'Report details will appear here.'}</Text>
              ) : null}
            </View>
          </View>
        ) : !catalog.isPending ? (
          <Text style={styles.hint}>No inspection reports yet. Your first report will appear here after a visit.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
  hint: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  retry: { ...typography.captionStrong, color: familyHome.blue },
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
