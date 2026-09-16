import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { IconName } from '@/components/ui';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import {
  liveRequestToneMeta,
  type LiveRequestView,
} from '../liveServiceRequests';
import type { ServiceOffering } from '../catalogTypes';

export function CallSupportCard({
  eyebrow = 'Need help?',
  title = 'Call Support',
  body,
  hoursText,
  phone,
  ctaLabel = 'Call Support',
  submitting,
  onCallFallback,
}: {
  eyebrow?: string;
  title?: string;
  body: string;
  hoursText?: string | null;
  phone?: string | null;
  ctaLabel?: string;
  submitting?: boolean;
  onCallFallback?: () => void;
}) {
  const onPress = () => {
    const digits = phone?.replace(/[^\d+]/g, '') ?? '';
    if (digits.length >= 8) {
      void Linking.openURL(`tel:${digits}`);
      return;
    }
    onCallFallback?.();
  };

  return (
    <View style={styles.callCard}>
      <View style={styles.callIconWell}>
        <Icon name="call-outline" size={28} color={familyHome.white} />
      </View>
      <Text style={styles.callEyebrow}>{eyebrow}</Text>
      <Text style={styles.callTitle}>{title}</Text>
      <Text style={styles.callBody}>{body}</Text>
      <Pressable
        style={[styles.callCta, submitting ? styles.disabled : null]}
        onPress={onPress}
        disabled={submitting}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
      >
        <Icon name="call-outline" size={18} color={familyHome.white} />
        <Text style={styles.callCtaText}>{submitting ? 'Sending…' : ctaLabel}</Text>
      </Pressable>
      {hoursText ? <Text style={styles.callHours}>Call timing: {hoursText}</Text> : null}
    </View>
  );
}

export function OfferingCategoryGrid({
  items,
  selectedId,
  onSelect,
  accent = familyHome.green,
  accentSoft = familyHome.greenSoft,
  icon = 'clipboard-outline',
}: {
  items: ServiceOffering[];
  selectedId: string;
  onSelect: (id: string) => void;
  accent?: string;
  accentSoft?: string;
  icon?: IconName;
}) {
  return (
    <View style={styles.categoryGrid}>
      {items.map((item) => {
        const active = item.id === selectedId;
        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            style={[styles.categoryCard, active ? { borderColor: accent, backgroundColor: accentSoft } : null]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <View style={[styles.categoryIcon, { backgroundColor: accentSoft }]}>
              <Icon name={icon} size={18} color={accent} />
            </View>
            <Text style={styles.categoryTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {item.description ? (
              <Text style={styles.categoryDesc} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function RecentRequestsList({
  title = 'Recent Requests',
  items,
  emptyMessage = 'No requests yet. Raise one above and it will appear here.',
}: {
  title?: string;
  items: LiveRequestView[];
  emptyMessage?: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length === 0 ? <Text style={styles.empty}>{emptyMessage}</Text> : null}
      <View style={styles.requestList}>
        {items.map((item) => {
          const tone = liveRequestToneMeta(item.tone);
          return (
            <View key={item.id} style={styles.requestRow}>
              <View style={[styles.requestIcon, { backgroundColor: tone.soft }]}>
                <Icon name={tone.icon} size={16} color={tone.color} />
              </View>
              <View style={styles.requestBody}>
                <Text style={styles.requestTitle}>{item.title}</Text>
                <Text style={styles.requestMeta}>
                  {item.dateLabel} · {item.detail}
                </Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: tone.soft }]}>
                <Text style={[styles.statusPillText, { color: tone.color }]}>{item.statusLabel}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function AboutServiceCard({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <View style={styles.aboutCard}>
      <View style={styles.aboutIcon}>
        <Icon name="help-circle-outline" size={18} color={familyHome.blue} />
      </View>
      <View style={styles.aboutBody}>
        <Text style={styles.aboutTitle}>About This Service</Text>
        <Text style={styles.aboutText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  callCard: {
    borderRadius: 18,
    backgroundColor: familyHome.greenSoft,
    borderWidth: 1,
    borderColor: '#D7ECD8',
    padding: spacing.xl,
    gap: spacing.sm,
    alignItems: 'center',
  },
  callIconWell: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  callEyebrow: { ...typography.captionStrong, color: familyHome.greenDark },
  callTitle: { ...typography.subtitle, color: familyHome.text, textAlign: 'center' },
  callBody: { ...typography.body, color: familyHome.muted, textAlign: 'center', lineHeight: 22 },
  callCta: {
    marginTop: spacing.sm,
    minHeight: 52,
    alignSelf: 'stretch',
    borderRadius: 14,
    backgroundColor: familyHome.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  callCtaText: { ...typography.bodyStrong, color: familyHome.white },
  callHours: { ...typography.caption, color: familyHome.muted, marginTop: 4 },
  disabled: { opacity: 0.6 },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryCard: {
    width: '47.5%',
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.md,
    gap: 6,
    backgroundColor: familyHome.white,
    minHeight: 108,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: { ...typography.captionStrong, color: familyHome.text },
  categoryDesc: { ...typography.caption, color: familyHome.muted },
  section: { gap: spacing.sm, marginTop: spacing.sm },
  sectionTitle: { ...typography.subtitle, color: familyHome.text },
  empty: { ...typography.caption, color: familyHome.muted },
  requestList: { gap: spacing.sm },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.lg,
  },
  requestIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestBody: { flex: 1, gap: 2 },
  requestTitle: { ...typography.bodyStrong, color: familyHome.text },
  requestMeta: { ...typography.caption, color: familyHome.muted },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: { ...typography.captionStrong },
  aboutCard: {
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: 14,
    backgroundColor: familyHome.blueSoft,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  aboutIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutBody: { flex: 1, gap: 4 },
  aboutTitle: { ...typography.bodyStrong, color: familyHome.text },
  aboutText: { ...typography.body, color: familyHome.muted, lineHeight: 22 },
});
