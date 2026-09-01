import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import {
  canAvailServices,
  SERVICE_AREA_LOCKED_MESSAGE,
  SERVICE_AREA_LOCKED_TITLE,
} from '@/features/auth/serviceAreaPreference';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { useMembershipSubmit } from '@/features/membership/useMembershipSubmit';
import type { AddonBookNow } from './addonBookCatalog';

export function AddonBookNowScreen({ addon }: { addon: AddonBookNow }) {
  const insets = useSafeAreaInsets();
  const { submitting, submit } = useMembershipSubmit(addon.slug);
  const [optionId, setOptionId] = useState(addon.options?.[0]?.id ?? '');
  const selected = addon.options?.find((item) => item.id === optionId);

  const onBook = () => {
    if (!canAvailServices()) {
      Alert.alert(SERVICE_AREA_LOCKED_TITLE, SERVICE_AREA_LOCKED_MESSAGE);
      return;
    }
    const optionNote = selected ? `${selected.label}: ${selected.price}` : addon.lines.join(' · ');
    void submit(`${addon.title} — ${optionNote}`, 'Booking request submitted');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title={addon.title} showBack showProfile={false} showBell={false} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: addon.color }]}>{addon.title}</Text>
          <View style={[styles.artWrap, { backgroundColor: addon.background }]}>
            <AddonIllustration slug={addon.slug} />
          </View>
          <View style={styles.details}>
            {addon.lines.map((line) => (
              <Text
                key={line}
                style={[
                  styles.line,
                  line.includes('₹') ? styles.priceLine : null,
                ]}
              >
                {line}
              </Text>
            ))}
            {addon.options?.map((option) => {
              const active = option.id === optionId;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setOptionId(option.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${option.label} ${option.price}`}
                  style={[styles.option, active ? styles.optionActive : null]}
                >
                  <Text style={[styles.optionLabel, active ? styles.optionLabelActive : null]}>
                    {option.label}: {option.price}
                  </Text>
                  {active ? <Icon name="checkmark-circle-outline" size={18} color={familyHome.purple} /> : null}
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={onBook}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel={`Book ${addon.title} now`}
            style={({ pressed }) => [
              styles.book,
              pressed && !submitting ? styles.pressed : null,
              submitting ? styles.disabled : null,
            ]}
          >
            <Text style={styles.bookLabel}>{submitting ? 'Sending…' : 'Book Now'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function AddonIllustration({ slug }: { slug: string }) {
  if (slug === 'emergency-companion') {
    return <CompanionArt />;
  }
  if (slug === 'stool-cleaning') {
    return <StoolArt />;
  }
  if (slug === 'maid-assistance') {
    return <MaidArt />;
  }
  return <MassageArt />;
}

function CompanionArt() {
  return (
    <Svg width={180} height={120} viewBox="0 0 180 120">
      <Rect x="18" y="58" width="96" height="42" rx="8" fill="#E8DFF3" />
      <Rect x="26" y="48" width="80" height="18" rx="8" fill="#F4EEF8" />
      <Ellipse cx="66" cy="54" rx="16" ry="10" fill="#F2D4C8" />
      <Circle cx="66" cy="42" r="10" fill="#F2D4C8" />
      <Rect x="108" y="36" width="42" height="64" rx="14" fill="#FFFFFF" />
      <Circle cx="129" cy="28" r="12" fill="#F2D4C8" />
      <Rect x="118" y="48" width="22" height="28" fill="#7B5EA7" />
      <Path d="M40 100h110" stroke="#D9CDE8" strokeWidth="4" />
    </Svg>
  );
}

function StoolArt() {
  return (
    <Svg width={180} height={120} viewBox="0 0 180 120">
      <Rect x="92" y="58" width="48" height="36" rx="8" fill="#C9DFF8" />
      <Circle cx="116" cy="48" r="12" fill="#E8C4B4" />
      <Rect x="38" y="40" width="44" height="60" rx="16" fill="#2F80ED" />
      <Circle cx="60" cy="30" r="12" fill="#E8C4B4" />
      <Path d="M48 100h90" stroke="#D6E6F7" strokeWidth="4" />
    </Svg>
  );
}

function MaidArt() {
  return (
    <Svg width={180} height={120} viewBox="0 0 180 120">
      <Circle cx="90" cy="28" r="14" fill="#E8C4B4" />
      <Rect x="68" y="42" width="44" height="38" rx="10" fill="#FFFFFF" />
      <Path d="M62 52h56v36c0 10-12 18-28 18s-28-8-28-18V52Z" fill="#F3EDF8" />
      <Rect x="78" y="80" width="24" height="20" fill="#7B5EA7" />
      <Path d="M44 104h92" stroke="#E5DBF0" strokeWidth="4" />
    </Svg>
  );
}

function MassageArt() {
  return (
    <Svg width={180} height={120} viewBox="0 0 180 120">
      <Ellipse cx="90" cy="78" rx="58" ry="16" fill="#F6E7C8" />
      <Path d="M48 70c18-22 66-22 84 0" stroke="#E8C4B4" strokeWidth="14" strokeLinecap="round" />
      <Circle cx="48" cy="62" r="10" fill="#E8C4B4" />
      <Circle cx="118" cy="42" r="11" fill="#E8C4B4" />
      <Rect x="108" y="52" width="22" height="28" rx="8" fill="#E67E22" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: familyHome.white,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 18,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  artWrap: {
    height: 140,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  line: {
    ...typography.body,
    color: familyHome.text,
    textAlign: 'center',
  },
  priceLine: {
    ...typography.bodyStrong,
    color: familyHome.text,
  },
  option: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  optionActive: {
    borderColor: familyHome.purple,
    backgroundColor: familyHome.purpleSoft,
  },
  optionLabel: {
    ...typography.bodyStrong,
    color: familyHome.text,
  },
  optionLabelActive: {
    color: familyHome.purpleDark,
  },
  book: {
    marginTop: spacing.sm,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: familyHome.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookLabel: {
    ...typography.bodyStrong,
    color: familyHome.white,
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.7,
  },
});
