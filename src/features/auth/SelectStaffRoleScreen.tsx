import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useNavigation, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { isCareApp } from '@/config/appVariant';
import { STAFF_KIND_LABELS, type StaffKind } from '@/features/care/staffKind';
import { setSelectedStaffKind } from './staffKindPreference';

type RoleCard = {
  kind: StaffKind;
  description: string;
  icon: IconName;
  tint: string;
  accent: string;
};

const OPTIONS: RoleCard[] = [
  {
    kind: 'CARE_MANAGER',
    description: 'Manage care, visits & reports',
    icon: 'person-outline',
    tint: '#E7F7EF',
    accent: '#1F7A4D',
  },
  {
    kind: 'COMPANION',
    description: 'Assist customers & complete tasks',
    icon: 'people-outline',
    tint: '#F3EEFF',
    accent: '#6B4FD8',
  },
  {
    kind: 'DELIVERY_EXECUTIVE',
    description: 'Deliver orders & services',
    icon: 'bike',
    tint: '#FFF1E6',
    accent: '#C45C12',
  },
];

export function SelectStaffRoleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  useEffect(() => {
    if (isCareApp()) {
      router.replace('/(auth)/login' as Href);
    }
  }, []);

  const goBack = () => {
    if (navigation.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(auth)/welcome' as Href);
  };

  const onSelect = (kind: StaffKind) => {
    setSelectedStaffKind(kind);
    router.push('/(auth)/register/care' as Href);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}>
      <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
        <Icon name="arrow-back" size={22} color="#1A1A1A" />
      </Pressable>

      <Text style={styles.title}>Select Your Role</Text>
      <Text style={styles.subtitle}>Choose your role to continue</Text>

      <View style={styles.list}>
        {OPTIONS.map((option) => (
          <Pressable
            key={option.kind}
            onPress={() => onSelect(option.kind)}
            accessibilityRole="button"
            accessibilityLabel={`${STAFF_KIND_LABELS[option.kind]}. ${option.description}`}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: option.tint },
              pressed ? styles.pressed : null,
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#FFFFFF' }]}>
              <Icon name={option.icon} size={26} color={option.accent} />
            </View>
            <View style={styles.textCol}>
              <Text style={[styles.cardTitle, { color: option.accent }]}>{STAFF_KIND_LABELS[option.kind]}</Text>
              <Text style={[styles.cardBody, { color: option.accent }]}>{option.description}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
  },
  back: {
    width: minTouchSize,
    height: minTouchSize,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  subtitle: {
    ...typography.body,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xxxl,
  },
  list: {
    gap: spacing.lg,
  },
  card: {
    minHeight: 96,
    borderRadius: 18,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  pressed: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  cardBody: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
});
