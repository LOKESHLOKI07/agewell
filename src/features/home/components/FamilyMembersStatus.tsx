import {
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { FamilyHomeSectionHeader } from './FamilyHomePrimitives';
import { familyHome } from './familyHomeTheme';

type StatusItem = {
  id: string;
  label: string;
  value: string;
  sub: string;
  icon: ImageSourcePropType;
  color: string;
  href: Href;
};

const STATUS_ITEMS: StatusItem[] = [
  {
    id: 'condition',
    label: 'Condition',
    value: 'Good',
    sub: 'Updated today',
    icon: require('../../../../assets/AgeWell_Member_Status/01_condition_good.png'),
    color: familyHome.green,
    href: '/(tabs)/health' as Href,
  },
  {
    id: 'cbc',
    label: 'Latest CBC Report',
    value: 'Normal',
    sub: '15 Sep 2026',
    icon: require('../../../../assets/AgeWell_Member_Status/02_latest_cbc_report_normal.png'),
    color: familyHome.blue,
    href: '/health/labs' as Href,
  },
  {
    id: 'doctor',
    label: 'Doctor Visit',
    value: 'Completed',
    sub: '10 Sep 2026',
    icon: require('../../../../assets/AgeWell_Member_Status/03_doctor_visit_completed.png'),
    color: familyHome.orange,
    href: '/membership/doctor' as Href,
  },
  {
    id: 'meds',
    label: 'Urgent Medication',
    value: 'No pending',
    sub: 'All essential medicines available',
    icon: require('../../../../assets/AgeWell_Member_Status/04_urgent_medication_no_pending.png'),
    color: familyHome.red,
    href: '/membership/medicine' as Href,
  },
];

const CARD_GAP = 8;
const VISIBLE = 3;
const ICON_SIZE = 36;

/**
 * Membership home — health status strip (replaces Family Members Status).
 * Shows exactly 3 cards; swipe to reveal the rest (no cut-off peek).
 */
export function FamilyMembersStatus() {
  const { width: screenWidth } = useWindowDimensions();
  const trackWidth = screenWidth - spacing.xl * 2;
  const cardWidth = (trackWidth - CARD_GAP * (VISIBLE - 1)) / VISIBLE;

  return (
    <View style={styles.section}>
      <FamilyHomeSectionHeader title="Members Status" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        style={styles.scroller}
        contentContainerStyle={styles.row}
      >
        {STATUS_ITEMS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => router.push(item.href)}
            style={({ pressed }) => [
              styles.item,
              { width: cardWidth },
              pressed ? styles.pressed : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${item.label}: ${item.value}. ${item.sub}`}
          >
            <View style={styles.itemTop}>
              <Image
                source={item.icon}
                style={styles.statusIcon}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
              <Icon name="chevron-forward" size={14} color={familyHome.muted} />
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {item.label}
            </Text>
            <Text style={[styles.value, { color: item.color }]} numberOfLines={1}>
              {item.value}
            </Text>
            <Text style={styles.sub} numberOfLines={2}>
              {item.sub}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  scroller: {
    overflow: 'hidden',
  },
  row: {
    gap: CARD_GAP,
  },
  item: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    backgroundColor: familyHome.white,
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 4,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statusIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 10,
  },
  label: {
    ...typography.captionStrong,
    color: familyHome.text,
    fontSize: 11,
    lineHeight: 14,
  },
  value: {
    ...typography.captionStrong,
    fontSize: 13,
    lineHeight: 16,
  },
  sub: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 10,
    lineHeight: 13,
  },
  pressed: {
    opacity: 0.88,
    backgroundColor: familyHome.greenSoft,
  },
});
