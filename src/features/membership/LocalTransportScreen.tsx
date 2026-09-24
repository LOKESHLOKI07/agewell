import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '@/components/KeyboardAwareScrollView';
import { LoadingState, PrimaryButton, SecondaryButton } from '@/components';
import type { IconName } from '@/components/ui';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { useSeniorProfile, useServiceRequests } from '@/features/home/hooks/queries';
import { ServicePageHeader } from '@/features/home/components/ServicePageHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { ServiceHelpBanner } from '@/features/membership/ServiceHelpBanner';
import { MarketplaceServiceIcon } from '@/features/services/components/MarketplaceServiceIcon';
import { readDevicePosition } from '@/utils/deviceLocation';
import { useTabScreenBottomPad } from '@/utils/safeBottom';
import type { ServiceOffering } from './catalogTypes';
import {
  filterLocalTransportPlaces,
  type LocalTransportSuggestion,
} from './localTransportPlaces';
import { MEMBERSHIP_SERVICE_AREA_LINE } from './membershipServicePageVariant';
import { membershipPurchaseHref } from './planCatalog';
import { SERVICE_HERO_IMAGES } from './serviceHeroes';
import {
  filterRequestsBySlug,
  liveRequestToneMeta,
  toLiveRequestViews,
} from './liveServiceRequests';
import { useMembershipServicePageVariant } from './useMembershipServicePageVariant';
import { useMembershipSubmit } from './useMembershipSubmit';
import { useServiceOfferings } from './useCatalog';
const heroImage = SERVICE_HERO_IMAGES['local-transport'];

const SLUG = 'local-transport';
const LEAD = 'Companion supported coordination between cabs and rikshaws.';
const DEFAULT_ABOUT =
  'Our companion supports pick-up and drop coordination for local cab and rikshaw travel. Ride charges apply as per the actual trip.';

const ABOUT_FEATURES = [
  'Trusted & known drivers',
  'Safe and reliable travel',
  'Companion support included',
];

const PLEASE_NOTE = [
  'Companion supports pick-up and drop coordination.',
  'Ride charges apply as per the actual trip.',
  'Drivers are verified for safe travel.',
  'Special requests can be shared while booking.',
];

const GATE_FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'car-outline', title: 'Cab Booking Support', body: 'Assistance in booking cabs' },
  { icon: 'bike', title: 'Rikshaw Coordination', body: 'Help in arranging autos/rikshaws' },
  { icon: 'person-outline', title: 'Companion Assistance', body: 'Support during pick-up and drop' },
  { icon: 'location', title: 'Reliable Travel', body: 'For your safe and comfortable local travel' },
];

const FALLBACK_OFFERINGS: ServiceOffering[] = [
  {
    id: 'fallback-cab',
    serviceSlug: SLUG,
    title: 'Cab Assistance',
    description: 'Companion help booking a comfortable cab for local trips.',
    badge: 'Local',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 0,
    isActive: true,
  },
  {
    id: 'fallback-rickshaw',
    serviceSlug: SLUG,
    title: 'Rickshaw Assistance',
    description: 'Companion help arranging an auto/rikshaw for short distances.',
    badge: 'Local',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 1,
    isActive: true,
  },
];

type TripType = 'one-way' | 'two-way';

const SERVICE_LOOKS: { match: RegExp; icon: IconName; color: string; soft: string }[] = [
  { match: /cab|taxi|car/i, icon: 'car-outline', color: familyHome.green, soft: familyHome.greenSoft },
  { match: /rickshaw|rikshaw|auto/i, icon: 'bike', color: familyHome.blue, soft: familyHome.blueSoft },
];

function lookForService(title: string) {
  for (const row of SERVICE_LOOKS) {
    if (row.match.test(title)) return row;
  }
  return {
    icon: 'car-outline' as IconName,
    color: familyHome.green,
    soft: familyHome.greenSoft,
  };
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatPreferredWhen(date: Date): string {
  return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}, ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function parsePreferredWhen(value: string): Date | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:[,\s]+(\d{1,2}):(\d{2}))?$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const hours = match[4] != null ? Number(match[4]) : 10;
  const minutes = match[5] != null ? Number(match[5]) : 0;
  const date = new Date(year, month - 1, day, hours, minutes);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hours ||
    date.getMinutes() !== minutes
  ) {
    return null;
  }
  return date;
}

async function resolveCurrentLocationLabel(): Promise<string | null> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    return null;
  }
  try {
    const point = await readDevicePosition();
    const results = await Location.reverseGeocodeAsync({
      latitude: point.latitude,
      longitude: point.longitude,
    });
    const first = results[0];
    if (!first) {
      return 'Current location';
    }
    const label = [first.name, first.street, first.district || first.subregion, first.city]
      .filter(Boolean)
      .join(', ');
    return label || 'Current location';
  } catch {
    return null;
  }
}

export function LocalTransportScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabScreenBottomPad(spacing.xxl);
  const variant = useMembershipServicePageVariant(true);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ServicePageHeader />

      {variant === 'serviceable_with_membership' ? (
        <MemberLiveBody />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.gateContent, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {variant === 'loading' ? <LoadingState message="Loading Local Area Transportation..." /> : null}
          {variant === 'non_serviceable' ? <OutsideAreaBody /> : null}
          {variant === 'serviceable_no_membership' ? <NoMembershipBody /> : null}
        </ScrollView>
      )}
    </View>
  );
}

function TitleBlock() {
  return (
    <View style={styles.titleRow}>
      <MarketplaceServiceIcon
        serviceId={SLUG}
        fallbackIcon="car-outline"
        fallbackColor={familyHome.green}
        size={48}
      />
      <View style={styles.flex}>
        <Text style={styles.title}>Local Transport</Text>
        <Text style={styles.lead}>{LEAD}</Text>
      </View>
    </View>
  );
}

function GateHero({ tone }: { tone: 'outside' | 'membership' }) {
  const headline =
    tone === 'outside' ? (
      <>
        Getting You Where You{'\n'}
        <Text style={styles.heroFullAccent}>Need to Be</Text>
      </>
    ) : (
      <>
        Get Around Your Area{'\n'}
        <Text style={styles.heroFullAccent}>with Ease</Text>
      </>
    );
  const body =
    tone === 'outside'
      ? 'Companion-supported cab and rikshaw coordination for your local trips.'
      : 'Safe, reliable local travel with companion-supported cab and rikshaw help.';

  return (
    <View style={styles.heroFull} accessibilityLabel="Local area transportation">
      <Image source={heroImage} style={styles.heroFullImage} resizeMode="cover" />
      <View style={styles.heroScrim} />
      <View style={styles.heroFullContent}>
        <View style={styles.heroFullCopy}>
          <Text style={styles.heroFullHeadline}>{headline}</Text>
          <Text style={styles.heroFullBody}>{body}</Text>
        </View>
      </View>
    </View>
  );
}

function FeaturesGrid() {
  return (
    <View style={styles.featuresCard}>
      {GATE_FEATURES.map((item) => (
        <View key={item.title} style={styles.featureCol}>
          <View style={styles.featureIcon}>
            <Icon name={item.icon} size={18} color={familyHome.green} />
          </View>
          <Text style={styles.featureTitle}>{item.title}</Text>
          <Text style={styles.featureBody}>{item.body}</Text>
        </View>
      ))}
    </View>
  );
}

function OutsideAreaBody() {
  const { submitting, submit } = useMembershipSubmit(SLUG);

  const onNotify = () => {
    void submit(
      'Notify me when Local Area Transportation is available in my area.',
      'We will notify you',
    );
  };

  return (
    <View style={styles.stack}>
      <TitleBlock />
      <GateHero tone="outside" />
      <FeaturesGrid />
      <View style={styles.soonBanner}>
        <View style={styles.soonIcon}>
          <Icon name="location" size={18} color={familyHome.red} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.soonTitle}>Service coming soon to your area</Text>
          <Text style={styles.soonBody}>
            {MEMBERSHIP_SERVICE_AREA_LINE} Local Area Transportation will become available in your area as we
            expand our services.
          </Text>
        </View>
      </View>
      <View style={styles.notifyCard}>
        <View style={styles.notifyLeft}>
          <View style={styles.notifyIcon}>
            <Icon name="notifications-outline" size={16} color={familyHome.white} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.helpTitle}>Get Notified</Text>
            <Text style={styles.helpBody}>
              We’ll notify you as soon as this service is available in your area.
            </Text>
          </View>
        </View>
        <Pressable
          onPress={onNotify}
          disabled={submitting}
          style={[styles.notifyBtn, submitting ? styles.disabled : null]}
          accessibilityRole="button"
          accessibilityLabel="Notify Me"
        >
          <Text style={styles.notifyBtnText}>{submitting ? 'Saving…' : 'Notify Me'}</Text>
        </Pressable>
      </View>
      <ServiceHelpBanner tone="green" />
    </View>
  );
}

function NoMembershipBody() {
  return (
    <View style={styles.stack}>
      <TitleBlock />
      <GateHero tone="membership" />
      <FeaturesGrid />
      <View style={styles.membershipCard}>
        <View style={styles.membershipHead}>
          <View style={styles.lockWell}>
            <Icon name="lock-closed-outline" size={16} color="#B45309" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.membershipTitle}>Membership Required</Text>
            <Text style={styles.membershipBody}>
              Local Area Transportation is available only for AgeWell members.
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push(membershipPurchaseHref())}
          style={({ pressed }) => [styles.joinPromo, pressed ? styles.pressed : null]}
          accessibilityRole="button"
        >
          <View style={styles.flex}>
            <Text style={styles.joinPromoTitle}>Join AgeWell Membership</Text>
            <Text style={styles.joinPromoBody}>
              Get access to Local Area Transportation and many other services for a safer, healthier and
              happier life.
            </Text>
          </View>
          <Icon name="chevron-forward" size={16} color="#B45309" />
        </Pressable>
        <PrimaryButton label="Join Membership  →" onPress={() => router.push(membershipPurchaseHref())} />
        <SecondaryButton
          label="View Membership Plans"
          onPress={() => router.push(membershipPurchaseHref())}
        />
      </View>
      <ServiceHelpBanner />
    </View>
  );
}

function LocationSuggestField({
  label,
  value,
  onChange,
  placeholder,
  pinColor,
  accessibilityLabel,
  extras,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  pinColor: string;
  accessibilityLabel: string;
  extras: LocalTransportSuggestion[];
}) {
  const [focused, setFocused] = useState(false);
  const [locating, setLocating] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = useMemo(() => {
    if (!focused) return [];
    return filterLocalTransportPlaces(value, extras, 6);
  }, [extras, focused, value]);

  useEffect(() => {
    return () => {
      if (blurTimer.current) clearTimeout(blurTimer.current);
    };
  }, []);

  const onFocus = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setFocused(true);
  };

  const onBlur = () => {
    blurTimer.current = setTimeout(() => setFocused(false), 180);
  };

  const pickSuggestion = (item: LocalTransportSuggestion) => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    onChange(item.label);
    setFocused(false);
  };

  const onUseCurrent = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const label = await resolveCurrentLocationLabel();
      if (label) {
        onChange(label);
        setFocused(false);
      } else {
        Alert.alert(
          'Location unavailable',
          'Allow location access, or type your pickup / drop area manually.',
        );
      }
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputWrap, focused ? styles.inputWrapFocused : null]}>
        <Icon name="location" size={14} color={pinColor} />
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={familyHome.muted}
          style={styles.input}
          accessibilityLabel={accessibilityLabel}
          autoCorrect={false}
          returnKeyType="done"
        />
        {value ? (
          <Pressable
            onPress={() => onChange('')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label}`}
          >
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {focused && suggestions.length > 0 ? (
        <View style={styles.suggestCard}>
          <Pressable
            onPress={() => void onUseCurrent()}
            style={styles.suggestRow}
            accessibilityRole="button"
            accessibilityLabel="Use current location"
          >
            <View style={[styles.suggestIcon, { backgroundColor: familyHome.greenSoft }]}>
              <Icon name="route" size={12} color={familyHome.green} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.suggestTitle}>{locating ? 'Getting location…' : 'Current location'}</Text>
              <Text style={styles.suggestSub}>Use your GPS position</Text>
            </View>
          </Pressable>
          {suggestions.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => pickSuggestion(item)}
              style={styles.suggestRow}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <View
                style={[
                  styles.suggestIcon,
                  {
                    backgroundColor:
                      item.kind === 'home' ? familyHome.yellowSoft : familyHome.blueSoft,
                  },
                ]}
              >
                <Icon
                  name={item.kind === 'home' ? 'home-outline' : 'location'}
                  size={12}
                  color={item.kind === 'home' ? '#B45309' : familyHome.blue}
                />
              </View>
              <View style={styles.flex}>
                <Text style={styles.suggestTitle} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={styles.suggestSub} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function PreferredWhenField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [draft, setDraft] = useState(() => parsePreferredWhen(value) ?? defaultPreferredWhen());

  const openPicker = () => {
    Keyboard.dismiss();
    const next = parsePreferredWhen(value) ?? defaultPreferredWhen();
    setDraft(next);
    if (Platform.OS === 'android') {
      openAndroidDateThenTime(next, (picked) => onChange(formatPreferredWhen(picked)));
      return;
    }
    setShowPicker(true);
  };

  const closePicker = () => setShowPicker(false);

  const commit = (date: Date) => {
    onChange(formatPreferredWhen(date));
  };

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>Preferred Date & Time (Optional)</Text>
      <View style={styles.inputWrap}>
        <Pressable
          onPress={openPicker}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open date and time picker"
        >
          <Icon name="calendar-outline" size={14} color={familyHome.blue} />
        </Pressable>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="DD-MM-YYYY, HH:mm"
          placeholderTextColor={familyHome.muted}
          style={styles.input}
          accessibilityLabel="Preferred date and time"
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
        />
        <Pressable
          onPress={openPicker}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Open date and time picker"
          style={styles.pickerHit}
        >
          <Icon name="chevron-forward" size={14} color={familyHome.muted} />
        </Pressable>
      </View>
      <Text style={styles.fieldHint}>Type manually, or tap the calendar to pick</Text>

      {showPicker && Platform.OS !== 'android' ? (
        <Modal visible={showPicker} transparent animationType="fade" onRequestClose={closePicker}>
          <Pressable style={styles.modalBackdrop} onPress={closePicker}>
            <View style={styles.sheet} onStartShouldSetResponder={() => true}>
              <Text style={styles.sheetTitle}>Preferred date & time</Text>
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={draft}
                  mode="datetime"
                  display="spinner"
                  themeVariant="light"
                  minimumDate={startOfToday()}
                  onChange={(_event: DateTimePickerEvent, selected?: Date) => {
                    if (selected) setDraft(selected);
                  }}
                  style={styles.iosPicker}
                />
              ) : (
                <WebDateTimeInput
                  value={toDatetimeLocalValue(draft)}
                  min={toDatetimeLocalValue(startOfToday())}
                  onChangeLocal={(local) => {
                    const next = dateFromDatetimeLocal(local);
                    if (next) setDraft(next);
                  }}
                />
              )}
              <Pressable
                onPress={() => {
                  commit(draft);
                  closePicker();
                }}
                accessibilityRole="button"
                accessibilityLabel="Use selected date and time"
                style={({ pressed }) => [styles.sheetDone, pressed ? styles.pressed : null]}
              >
                <Text style={styles.sheetDoneText}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

function defaultPreferredWhen() {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return date;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function toDatetimeLocalValue(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function dateFromDatetimeLocal(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

function openAndroidDateThenTime(initial: Date, onPicked: (date: Date) => void) {
  DateTimePickerAndroid.open({
    value: initial,
    mode: 'date',
    display: 'calendar',
    minimumDate: startOfToday(),
    onValueChange: (_event, selectedDate) => {
      const pickedDate = new Date(selectedDate);
      pickedDate.setHours(initial.getHours(), initial.getMinutes(), 0, 0);
      DateTimePickerAndroid.open({
        value: pickedDate,
        mode: 'time',
        display: 'clock',
        is24Hour: true,
        onValueChange: (_timeEvent, selectedTime) => {
          const merged = new Date(pickedDate);
          merged.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
          onPicked(merged);
        },
      });
    },
  });
}

function WebDateTimeInput({
  value,
  min,
  onChangeLocal,
}: {
  value: string;
  min: string;
  onChangeLocal: (local: string) => void;
}) {
  return createElement('input', {
    type: 'datetime-local',
    value,
    min,
    onChange: (event: { target: { value: string } }) => {
      if (event.target.value) {
        onChangeLocal(event.target.value);
      }
    },
    style: {
      fontSize: 16,
      padding: 12,
      borderRadius: 10,
      border: `1px solid ${familyHome.border}`,
      width: '100%',
      boxSizing: 'border-box',
    },
  });
}

function MemberLiveBody() {
  const catalog = useServiceOfferings(SLUG);
  const requestsQuery = useServiceRequests();
  const seniorQuery = useSeniorProfile();
  const { submitting, submit } = useMembershipSubmit(SLUG);
  const [selectedId, setSelectedId] = useState('');
  const [tripType, setTripType] = useState<TripType>('one-way');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [when, setWhen] = useState('');

  const offerings = useMemo(() => {
    const fromApi = catalog.data ?? [];
    const byTitle = new Map<string, ServiceOffering>();
    for (const item of fromApi) {
      const key = item.title.trim().toLowerCase();
      if (!byTitle.has(key)) byTitle.set(key, item);
    }
    return FALLBACK_OFFERINGS.map((fallback) => byTitle.get(fallback.title.toLowerCase()) ?? fallback);
  }, [catalog.data]);

  const selected =
    offerings.find((item) => item.id === selectedId) ?? offerings[0] ?? null;

  const locationExtras = useMemo((): LocalTransportSuggestion[] => {
    const home = seniorQuery.data?.address?.trim();
    if (!home) return [];
    return [
      {
        id: 'home',
        label: home,
        subtitle: 'Saved home address',
        kind: 'home',
      },
    ];
  }, [seniorQuery.data?.address]);

  const recent = useMemo(() => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    return toLiveRequestViews(mine, { fallbackTitle: 'Local ride', limit: 3 });
  }, [requestsQuery.data?.items]);

  const allCount = useMemo(
    () => filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG).length,
    [requestsQuery.data?.items],
  );

  const onViewAllRequests = () => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    const lines = toLiveRequestViews(mine, { fallbackTitle: 'Local ride', limit: 20 })
      .map((item) => `• ${item.title} — ${item.statusLabel} (${item.dateLabel})`)
      .join('\n');
    Alert.alert('Recent Requests', lines || 'No requests yet.');
  };

  const onSelectOption = (item: ServiceOffering) => {
    setSelectedId(item.id);
  };

  const onRequest = () => {
    if (!from.trim() || !to.trim()) {
      Alert.alert('Missing details', 'Please enter both From and To locations.');
      return;
    }
    if (!selected) {
      Alert.alert('Select an option', 'Choose a transport option first.');
      return;
    }
    if (when.trim() && !parsePreferredWhen(when)) {
      Alert.alert('Invalid date', 'Use DD-MM-YYYY, HH:mm or pick from the calendar.');
      return;
    }
    const tripLabel = tripType === 'two-way' ? 'Two Way (Return)' : 'One Way';
    void submit(
      [
        `Local ${selected.title} (${tripLabel}): ${from.trim()} → ${to.trim()}.`,
        when.trim() ? `Preferred: ${when.trim()}.` : null,
      ]
        .filter(Boolean)
        .join(' '),
      'Local transport requested',
    ).then((ok) => {
      if (ok) {
        setFrom('');
        setTo('');
        setWhen('');
      }
    });
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.liveContent} showsVerticalScrollIndicator={false}>
      <View style={styles.liveTitleRow}>
        <MarketplaceServiceIcon
          serviceId={SLUG}
          fallbackIcon="car-outline"
          fallbackColor={familyHome.green}
          size={40}
        />
        <Text style={styles.liveTitle}>Local Transport</Text>
      </View>

      <Text style={styles.sectionTitle}>Select Transport Option</Text>

      {catalog.isPending && !catalog.data?.length ? (
        <Text style={styles.empty}>Loading options…</Text>
      ) : null}
      {catalog.isError && !catalog.data?.length ? (
        <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
          <Text style={styles.viewAll}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}

      <View style={styles.optionRow}>
        {offerings.map((item) => {
          const look = lookForService(item.title);
          const active = item.id === (selectedId || selected?.id);
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelectOption(item)}
              style={[
                styles.optionCard,
                active ? { backgroundColor: look.soft, borderColor: look.color } : null,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.title}
            >
              <Icon name={look.icon} size={18} color={look.color} />
              <Text style={styles.optionTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Trip Type</Text>
      <View style={styles.optionRow}>
        <Pressable
          onPress={() => setTripType('one-way')}
          style={[styles.tripCard, tripType === 'one-way' ? styles.tripCardOn : null]}
          accessibilityRole="radio"
          accessibilityState={{ selected: tripType === 'one-way' }}
          accessibilityLabel="One Way"
        >
          <View style={[styles.radioOuter, tripType === 'one-way' ? styles.radioOuterOn : null]}>
            {tripType === 'one-way' ? <View style={styles.radioInner} /> : null}
          </View>
          <Text style={[styles.tripTitle, tripType === 'one-way' ? styles.tripTitleOn : null]}>
            One Way
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTripType('two-way')}
          style={[styles.tripCard, tripType === 'two-way' ? styles.tripCardOn : null]}
          accessibilityRole="radio"
          accessibilityState={{ selected: tripType === 'two-way' }}
          accessibilityLabel="Two Way (Return)"
        >
          <View style={[styles.radioOuter, tripType === 'two-way' ? styles.radioOuterOn : null]}>
            {tripType === 'two-way' ? <View style={styles.radioInner} /> : null}
          </View>
          <Text style={[styles.tripTitle, tripType === 'two-way' ? styles.tripTitleOn : null]}>
            Two Way (Return)
          </Text>
        </Pressable>
      </View>

      <View style={styles.formCard}>
        <LocationSuggestField
          label="From"
          value={from}
          onChange={setFrom}
          placeholder="Search pickup location"
          pinColor={familyHome.green}
          accessibilityLabel="From"
          extras={locationExtras}
        />
        <LocationSuggestField
          label="To"
          value={to}
          onChange={setTo}
          placeholder="Search destination"
          pinColor={familyHome.blue}
          accessibilityLabel="To"
          extras={locationExtras}
        />
        <PreferredWhenField value={when} onChange={setWhen} />

        <Pressable
          style={({ pressed }) => [
            styles.raiseCta,
            submitting ? styles.disabled : null,
            pressed ? styles.pressed : null,
          ]}
          onPress={onRequest}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Request Ride"
        >
          <Icon name="car-outline" size={16} color={familyHome.white} />
          <Text style={styles.raiseCtaText}>{submitting ? 'Sending…' : 'Request Ride'}</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Requests</Text>
        {allCount > 0 ? (
          <Pressable onPress={onViewAllRequests} accessibilityRole="button">
            <Text style={styles.viewAll}>View All &gt;</Text>
          </Pressable>
        ) : null}
      </View>

      {requestsQuery.isPending ? <Text style={styles.empty}>Loading requests…</Text> : null}
      {!requestsQuery.isPending && recent.length === 0 ? (
        <Text style={styles.empty}>No requests yet. Request a ride above.</Text>
      ) : null}

      {recent.length > 0 ? (
        <View style={styles.activityCard}>
          {recent.map((item, index) => {
            const look = lookForService(item.title);
            const tone = liveRequestToneMeta(item.tone);
            return (
              <View
                key={item.id}
                style={[styles.requestRow, index < recent.length - 1 ? styles.requestDivider : null]}
              >
                <View style={[styles.requestIcon, { backgroundColor: look.soft }]}>
                  <Icon name={look.icon} size={14} color={look.color} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.requestTitle}>{item.title}</Text>
                  <Text style={styles.requestDetail} numberOfLines={1}>
                    {item.detail}
                  </Text>
                  <Text style={styles.requestDate}>{item.dateLabel}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: tone.soft }]}>
                  <Text style={[styles.statusPillText, { color: tone.color }]}>{item.statusLabel}</Text>
                </View>
                <Icon name="chevron-forward" size={14} color={familyHome.muted} />
              </View>
            );
          })}
        </View>
      ) : null}

      <View style={styles.aboutCard}>
        <View style={styles.aboutHead}>
          <View style={styles.aboutIcon}>
            <Icon name="people-outline" size={14} color={familyHome.blue} />
          </View>
          <Text style={styles.aboutTitle}>About This Service</Text>
        </View>
        <View style={styles.aboutBodyRow}>
          <Text style={styles.aboutText}>{DEFAULT_ABOUT}</Text>
          <Image source={heroImage} style={styles.aboutImage} resizeMode="cover" />
        </View>
        <View style={styles.featureChecks}>
          {ABOUT_FEATURES.map((line) => (
            <View key={line} style={styles.featureCheck}>
              <Icon name="checkmark-circle-outline" size={12} color={familyHome.green} />
              <Text style={styles.featureCheckText}>{line}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.noteCard}>
        <View style={styles.aboutHead}>
          <View style={styles.aboutIcon}>
            <Icon name="help-circle-outline" size={14} color={familyHome.blue} />
          </View>
          <Text style={styles.aboutTitle}>Please Note</Text>
        </View>
        {PLEASE_NOTE.map((line) => (
          <Text key={line} style={styles.noteBullet}>
            • {line}
          </Text>
        ))}
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  flex: { flex: 1 },
  stack: { gap: spacing.md },
  gateContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  titleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.title, color: familyHome.text },
  liveTitle: { ...typography.title, color: familyHome.text, fontSize: 22 },
  lead: { ...typography.body, color: familyHome.muted, lineHeight: 22, marginTop: 4 },
  subtitle: { ...typography.body, color: familyHome.muted },
  heroFull: {
    height: 188,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: familyHome.border,
    position: 'relative',
  },
  heroFullImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  heroFullContent: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: spacing.lg,
    gap: spacing.md,
  },
  heroFullCopy: { flex: 1, gap: 6, paddingBottom: 2 },
  heroFullHeadline: {
    ...typography.subtitle,
    color: familyHome.text,
    lineHeight: 28,
    fontSize: 22,
  },
  heroFullAccent: { color: familyHome.greenDark },
  heroFullBody: {
    ...typography.caption,
    color: familyHome.text,
    lineHeight: 18,
    maxWidth: 260,
  },
  featuresCard: {
    flexDirection: 'row',
    backgroundColor: '#EAF6F4',
    borderRadius: 18,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  featureCol: { flex: 1, alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    ...typography.captionStrong,
    color: familyHome.text,
    textAlign: 'center',
    fontSize: 11,
  },
  featureBody: {
    ...typography.caption,
    color: familyHome.muted,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 14,
  },
  soonBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: familyHome.redSoft,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#F5C2C4',
    alignItems: 'flex-start',
  },
  soonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soonTitle: { ...typography.bodyStrong, color: familyHome.red },
  soonBody: { ...typography.caption, color: familyHome.text, marginTop: 4, lineHeight: 18 },
  notifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  notifyLeft: { flex: 1, flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  notifyIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: familyHome.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyBtn: {
    borderWidth: 1,
    borderColor: familyHome.blue,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: familyHome.white,
  },
  notifyBtnText: { ...typography.captionStrong, color: familyHome.blue },
  helpTitle: { ...typography.bodyStrong, color: familyHome.text },
  helpBody: { ...typography.caption, color: familyHome.muted, marginTop: 2, lineHeight: 18 },
  helpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: familyHome.blueSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  helpBannerGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: familyHome.greenSoft,
    borderRadius: 16,
    padding: spacing.lg,
  },
  helpIconGreen: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpTitleGreen: { ...typography.bodyStrong, color: familyHome.greenDark },
  helpBodyGreen: { ...typography.caption, color: familyHome.greenDark, marginTop: 2, lineHeight: 18 },
  contactIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: familyHome.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  membershipCard: {
    backgroundColor: familyHome.yellowSoft,
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.md,
  },
  membershipHead: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  lockWell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  membershipTitle: { ...typography.bodyStrong, color: familyHome.text },
  membershipBody: { ...typography.caption, color: familyHome.muted, marginTop: 2, lineHeight: 18 },
  joinPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: spacing.lg,
  },
  joinPromoTitle: { ...typography.bodyStrong, color: familyHome.text },
  joinPromoBody: { ...typography.caption, color: familyHome.muted, marginTop: 4, lineHeight: 18 },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.6 },
  liveContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: 10,
    paddingTop: 4,
  },
  liveTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveTitle: { ...typography.title, color: familyHome.text, flex: 1, fontSize: 18, lineHeight: 22 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { ...typography.subtitle, color: familyHome.text, fontSize: 14, lineHeight: 18 },
  viewAll: { ...typography.captionStrong, color: familyHome.blue, fontSize: 11 },
  empty: { ...typography.caption, color: familyHome.muted, fontSize: 11 },
  optionRow: { flexDirection: 'row', gap: 8 },
  optionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: familyHome.border,
    borderRadius: 12,
    backgroundColor: familyHome.white,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  optionTitle: {
    ...typography.captionStrong,
    color: familyHome.text,
    flex: 1,
    fontSize: 12,
    lineHeight: 15,
  },
  tripCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: familyHome.border,
    borderRadius: 12,
    backgroundColor: familyHome.white,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  tripCardOn: {
    backgroundColor: familyHome.greenSoft,
    borderColor: familyHome.green,
  },
  tripTitle: { ...typography.captionStrong, color: familyHome.text, fontSize: 12 },
  tripTitleOn: { color: familyHome.greenDark },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: familyHome.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterOn: { borderColor: familyHome.green },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: familyHome.green,
  },
  formCard: {
    borderRadius: 12,
    backgroundColor: familyHome.greenSoft,
    padding: 10,
    gap: 8,
  },
  fieldsRow: { flexDirection: 'row', gap: 8 },
  fieldHalf: { flex: 1, gap: 4 },
  fieldBlock: { gap: 4, zIndex: 1 },
  fieldLabel: { ...typography.captionStrong, color: familyHome.muted, fontSize: 11 },
  fieldHint: { ...typography.caption, color: familyHome.muted, fontSize: 10, marginTop: 2 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 10,
    backgroundColor: familyHome.white,
    paddingHorizontal: 10,
    minHeight: 42,
  },
  inputWrapFocused: {
    borderColor: familyHome.green,
  },
  input: {
    ...typography.body,
    color: familyHome.text,
    flex: 1,
    fontSize: 12,
    paddingVertical: 8,
  },
  clearText: {
    ...typography.captionStrong,
    color: familyHome.muted,
    fontSize: 12,
    paddingHorizontal: 2,
  },
  pickerHit: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestCard: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 10,
    backgroundColor: familyHome.white,
    overflow: 'hidden',
    marginTop: 2,
  },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: familyHome.border,
  },
  suggestIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestTitle: {
    ...typography.captionStrong,
    color: familyHome.text,
    fontSize: 12,
    lineHeight: 15,
  },
  suggestSub: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 10,
    lineHeight: 13,
    marginTop: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: familyHome.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sheetTitle: { ...typography.subtitle, color: familyHome.text, fontSize: 16 },
  sheetDone: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetDoneText: { ...typography.bodyStrong, color: familyHome.white },
  iosPicker: { alignSelf: 'stretch' },
  webWhenRow: { gap: 8 },
  webWhenInput: {
    ...typography.body,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: familyHome.text,
  },
  raiseCta: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: familyHome.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
  },
  raiseCtaText: { ...typography.bodyStrong, color: familyHome.white, fontSize: 14 },
  activityCard: {
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 12,
    backgroundColor: familyHome.white,
    overflow: 'hidden',
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  requestDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: familyHome.border,
  },
  requestIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestTitle: {
    ...typography.bodyStrong,
    color: familyHome.text,
    fontSize: 12,
    lineHeight: 15,
  },
  requestDetail: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 10,
    lineHeight: 13,
    marginTop: 1,
  },
  requestDate: { ...typography.caption, color: familyHome.muted, fontSize: 10, lineHeight: 12, marginTop: 1 },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusPillText: { ...typography.captionStrong, fontSize: 9 },
  aboutCard: {
    borderRadius: 12,
    backgroundColor: familyHome.blueSoft,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },
  noteCard: {
    borderRadius: 12,
    backgroundColor: familyHome.blueSoft,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 4,
  },
  aboutHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aboutIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: familyHome.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutTitle: { ...typography.bodyStrong, color: familyHome.text, fontSize: 13 },
  aboutBodyRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  aboutText: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  aboutImage: {
    width: 64,
    height: 48,
    borderRadius: 8,
    backgroundColor: familyHome.white,
  },
  featureChecks: { gap: 4 },
  featureCheck: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureCheckText: { ...typography.caption, color: familyHome.muted, fontSize: 11 },
  noteBullet: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 11,
    lineHeight: 15,
  },
});

