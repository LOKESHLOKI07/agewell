import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { MembershipServiceHero } from './MembershipServiceHero';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useServiceOfferings } from './useCatalog';

export function TechAssistanceScreen() {
  const insets = useSafeAreaInsets();
  const catalog = useServiceOfferings('tech-assistance');
  const topics = catalog.data ?? [];
  const [topicId, setTopicId] = useState('');
  const selected = topics.find((item) => item.id === topicId);
  const { submitting, submit } = useMembershipSubmit('tech-assistance');

  useEffect(() => {
    if (!topicId && topics[0]) setTopicId(topics[0].id);
  }, [topics, topicId]);

  const onRequest = () => {
    void submit(
      `Tech help: ${selected?.title ?? 'General'}. ${selected?.description ?? ''}`.trim(),
      'Help requested',
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Tech Assistance" showBack showProfile={false} showBell={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MembershipServiceHero slug="tech-assistance" />
        <Text style={styles.hint}>Digital help through your AgeWell companion</Text>
        {catalog.isPending ? <Text style={styles.hint}>Loading topics…</Text> : null}
        {catalog.isError ? (
          <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
            <Text style={styles.retry}>Unable to load · Tap to retry</Text>
          </Pressable>
        ) : null}

        <View style={styles.list}>
          {topics.map((topic) => {
            const active = topic.id === topicId;
            return (
              <Pressable
                key={topic.id}
                onPress={() => setTopicId(topic.id)}
                style={[styles.row, active ? styles.rowActive : null]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                {topic.image ? (
                  <Image source={{ uri: topic.image }} style={styles.thumb} accessibilityLabel={topic.title} />
                ) : (
                  <View style={styles.iconWell}>
                    <Icon name="phone-portrait-outline" size={18} color={familyHome.purple} />
                  </View>
                )}
                <View style={styles.body}>
                  <Text style={styles.title}>{topic.title}</Text>
                  <Text style={styles.desc}>{topic.description}</Text>
                </View>
                {active ? (
                  <Icon name="checkmark-circle-outline" size={20} color={familyHome.green} />
                ) : (
                  <Icon name="chevron-forward" size={18} color={familyHome.muted} />
                )}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.primaryCta, submitting ? styles.disabled : null]}
          onPress={onRequest}
          disabled={submitting}
          accessibilityRole="button"
        >
          <Text style={styles.primaryCtaText}>{submitting ? 'Sending…' : 'Request Help'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
  hint: { ...typography.caption, color: familyHome.muted },
  retry: { ...typography.captionStrong, color: familyHome.green },
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
  thumb: { width: 40, height: 40, borderRadius: 12, backgroundColor: familyHome.border },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: familyHome.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  title: { ...typography.bodyStrong, color: familyHome.text },
  desc: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  primaryCta: {
    marginTop: spacing.sm,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.6 },
  primaryCtaText: { ...typography.bodyStrong, color: familyHome.white },
});
