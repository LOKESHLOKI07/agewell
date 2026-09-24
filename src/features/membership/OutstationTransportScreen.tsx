import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
import type { LocalTransportSuggestion } from './localTransportPlaces';
import { MEMBERSHIP_SERVICE_AREA_LINE } from './membershipServicePageVariant';
import { filterOutstationPlaces } from './outstationTransportPlaces';
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

const heroImage = SERVICE_HERO_IMAGES.transport;

const SLUG = 'transport';
const VIDEO_URL =
  'https://www.youtube.com/results?search_query=Outstation+Travel+Made+Easy+for+Seniors+AgeWell';
const LEAD = 'Well-trained driver assistance for outstation trips. Cost as per trip need.';
const HERO_BODY =
  'Safe, comfortable outstation travel with well-trained drivers and care coordination.';
const DEFAULT_ABOUT =
  'Our companion supports safe outstation travel with verified drivers and trip coordination. Charges apply as per the actual trip.';

const ABOUT_FEATURES = ['Trusted drivers', 'Companion support', 'Safe travel'];

const PLEASE_NOTE = [
  'Charges apply as per trip need.',
  'Verified drivers only.',
  'Companion support included for coordination.',
  'Driver stay charges apply if overnight stay is required.',
  'Special requests can be shared while booking.',
];

const GATE_FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'car-outline', title: 'Well-trained Drivers', body: 'Experienced and verified drivers' },
  {
    icon: 'shield-checkmark-outline',
    title: 'Safe & Comfortable Travel',
    body: 'For a worry-free journey',
  },
  { icon: 'route', title: 'Flexible Destinations', body: 'Assistance for your outstation travel needs' },
  {
    icon: 'people-outline',
    title: 'Companion Coordination',
    body: 'Support with planning and arrangements',
  },
];

const FALLBACK_OFFERINGS: ServiceOffering[] = [
  {
    id: 'fallback-hatchback',
    serviceSlug: SLUG,
    title: 'Hatchback',
    description: '1-3 people',
    badge: '1-3 people',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 0,
    isActive: true,
  },
  {
    id: 'fallback-sedan',
    serviceSlug: SLUG,
    title: 'Sedan',
    description: '3-4 people',
    badge: '3-4 people',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'fallback-suv',
    serviceSlug: SLUG,
    title: 'SUV',
    description: '4-6 people',
    badge: '4-6 people',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'fallback-innova',
    serviceSlug: SLUG,
    title: 'Innova / Crysta',
    description: '4-6 people',
    badge: '4-6 people',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'fallback-tempo',
    serviceSlug: SLUG,
    title: 'Tempo Traveller',
    description: '7-12 people',
    badge: '7-12 people',
    priceLabel: '',
    image: null,
    metaJson: null,
    sortOrder: 4,
    isActive: true,
  },
];

type TripType = 'one-way' | 'two-way';

const VEHICLE_LOOKS: { match: RegExp; icon: IconName; color: string; soft: string }[] = [
  { match: /hatchback/i, icon: 'car-outline', color: familyHome.green, soft: familyHome.greenSoft },
  { match: /sedan/i, icon: 'car-outline', color: familyHome.blue, soft: familyHome.blueSoft },
  { match: /suv/i, icon: 'car-outline', color: familyHome.orange, soft: familyHome.orangeSoft },
  { match: /innova|crysta/i, icon: 'car-outline', color: familyHome.purple, soft: familyHome.purpleSoft },
  { match: /tempo|traveller/i, icon: 'bus', color: familyHome.greenDark, soft: familyHome.greenSoft },
];

function lookForVehicle(title: string) {
  for (const row of VEHICLE_LOOKS) {
    if (row.match.test(title)) return row;
  }
  return {
    icon: 'car-outline' as IconName,
    color: familyHome.purple,
    soft: familyHome.purpleSoft,
  };
}

function vehicleCapacityLabel(item: ServiceOffering) {
  return item.badge || item.description || '';
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatTravelDate(date: Date): string {
  return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}`;
}

function formatTravelTime(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function parseTravelDate(value: string): Date | null {
  const match = value.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function parseTravelTime(value: string): { hours: number; minutes: number } | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function defaultTravelDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function defaultTravelTime() {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return date;
}

function toIsoDateValue(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function dateFromIsoDate(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

async function resolveCurrentLocationLabel(): Promise<string | null> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') return null;
  try {
    const point = await readDevicePosition();
    const results = await Location.reverseGeocodeAsync({
      latitude: point.latitude,
      longitude: point.longitude,
    });
    const first = results[0];
    if (!first) return 'Current location';
    const label = [first.name, first.street, first.district || first.subregion, first.city]
      .filter(Boolean)
      .join(', ');
    return label || 'Current location';
  } catch {
    return null;
  }
}

export function OutstationTransportScreen() {
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
          {variant === 'loading' ? <LoadingState message="Loading Outstation Transport..." /> : null}
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
        fallbackColor={familyHome.purple}
        size={48}
      />
      <View style={styles.flex}>
        <Text style={styles.title}>Outstation Transport</Text>
        <Text style={styles.lead}>{LEAD}</Text>
      </View>
    </View>
  );
}

function GateHero({ tone }: { tone: 'outside' | 'membership' }) {
  const headline =
    tone === 'outside' ? (
      <>
        Explore More Places{'\n'}
        <Text style={styles.heroFullAccent}>with Confidence</Text>
      </>
    ) : (
      <>
        Travel Further{'\n'}
        <Text style={styles.heroFullAccent}>with Peace of Mind</Text>
      </>
    );

  return (
    <View style={styles.heroFull} accessibilityLabel="Outstation transport">
      <Image source={heroImage} style={styles.heroFullImage} resizeMode="cover" />
      <View style={styles.heroScrim} />
      <View style={styles.heroFullContent}>
        <View style={styles.heroFullCopy}>
          <Text style={styles.heroFullHeadline}>{headline}</Text>
          <Text style={styles.heroFullBody}>{HERO_BODY}</Text>
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
      'Notify me when Outstation Transport is available in my area.',
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
            {MEMBERSHIP_SERVICE_AREA_LINE} Outstation Transport will become available in your area as we
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
              Outstation Transport is available only for AgeWell members.
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
              Get access to Outstation Transport and many other services for a safer, healthier and happier
              life.
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
  kind,
  extras,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  pinColor: string;
  accessibilityLabel: string;
  kind: 'pickup' | 'drop';
  extras: LocalTransportSuggestion[];
}) {
  const [focused, setFocused] = useState(false);
  const [locating, setLocating] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = useMemo(() => {
    if (!focused) return [];
    return filterOutstationPlaces(value, kind, extras, 6);
  }, [extras, focused, kind, value]);

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
      const next = await resolveCurrentLocationLabel();
      if (next) {
        onChange(next);
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
    <View style={styles.fieldHalf}>
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
      </View>
      {focused && suggestions.length > 0 ? (
        <View style={styles.suggestCard}>
          {kind === 'pickup' ? (
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
          ) : null}
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

function TravelDateField({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const [showPicker, setShowPicker] = useState(false);
  const [draft, setDraft] = useState(() => parseTravelDate(value) ?? defaultTravelDate());

  const openPicker = () => {
    Keyboard.dismiss();
    const next = parseTravelDate(value) ?? defaultTravelDate();
    setDraft(next);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: next,
        mode: 'date',
        display: 'calendar',
        minimumDate: startOfToday(),
        onValueChange: (_event, selected) => onChange(formatTravelDate(selected)),
      });
      return;
    }
    setShowPicker(true);
  };

  return (
    <View style={styles.fieldThird}>
      <Text style={styles.fieldLabel}>Travel Date</Text>
      <View style={styles.inputWrap}>
        <Pressable onPress={openPicker} hitSlop={8} accessibilityRole="button" accessibilityLabel="Pick date">
          <Icon name="calendar-outline" size={14} color={familyHome.blue} />
        </Pressable>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Select date"
          placeholderTextColor={familyHome.muted}
          style={styles.inputCompact}
          accessibilityLabel="Travel Date"
          autoCorrect={false}
        />
      </View>
      {showPicker && Platform.OS !== 'android' ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShowPicker(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowPicker(false)}>
            <View style={styles.sheet} onStartShouldSetResponder={() => true}>
              <Text style={styles.sheetTitle}>Travel date</Text>
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={draft}
                  mode="date"
                  display="spinner"
                  themeVariant="light"
                  minimumDate={startOfToday()}
                  onChange={(_e: DateTimePickerEvent, selected?: Date) => {
                    if (selected) setDraft(selected);
                  }}
                  style={styles.iosPicker}
                />
              ) : (
                createElement('input', {
                  type: 'date',
                  value: toIsoDateValue(draft),
                  min: toIsoDateValue(startOfToday()),
                  onChange: (event: { target: { value: string } }) => {
                    const next = dateFromIsoDate(event.target.value);
                    if (next) setDraft(next);
                  },
                  style: {
                    fontSize: 16,
                    padding: 12,
                    borderRadius: 10,
                    border: `1px solid ${familyHome.border}`,
                    width: '100%',
                    boxSizing: 'border-box',
                  },
                })
              )}
              <Pressable
                onPress={() => {
                  onChange(formatTravelDate(draft));
                  setShowPicker(false);
                }}
                style={({ pressed }) => [styles.sheetDone, pressed ? styles.pressed : null]}
                accessibilityRole="button"
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

function TravelTimeField({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const [showPicker, setShowPicker] = useState(false);
  const [draft, setDraft] = useState(() => {
    const parsed = parseTravelTime(value);
    if (!parsed) return defaultTravelTime();
    const date = new Date();
    date.setHours(parsed.hours, parsed.minutes, 0, 0);
    return date;
  });

  const openPicker = () => {
    Keyboard.dismiss();
    const parsed = parseTravelTime(value);
    const next = parsed
      ? (() => {
          const date = new Date();
          date.setHours(parsed.hours, parsed.minutes, 0, 0);
          return date;
        })()
      : defaultTravelTime();
    setDraft(next);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: next,
        mode: 'time',
        display: 'clock',
        is24Hour: true,
        onValueChange: (_event, selected) => onChange(formatTravelTime(selected)),
      });
      return;
    }
    setShowPicker(true);
  };

  return (
    <View style={styles.fieldThird}>
      <Text style={styles.fieldLabel}>Travel Time</Text>
      <View style={styles.inputWrap}>
        <Pressable onPress={openPicker} hitSlop={8} accessibilityRole="button" accessibilityLabel="Pick time">
          <Icon name="time-outline" size={14} color={familyHome.blue} />
        </Pressable>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Select time"
          placeholderTextColor={familyHome.muted}
          style={styles.inputCompact}
          accessibilityLabel="Travel Time"
          autoCorrect={false}
        />
      </View>
      {showPicker && Platform.OS !== 'android' ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShowPicker(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowPicker(false)}>
            <View style={styles.sheet} onStartShouldSetResponder={() => true}>
              <Text style={styles.sheetTitle}>Travel time</Text>
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={draft}
                  mode="time"
                  display="spinner"
                  themeVariant="light"
                  onChange={(_e: DateTimePickerEvent, selected?: Date) => {
                    if (selected) setDraft(selected);
                  }}
                  style={styles.iosPicker}
                />
              ) : (
                createElement('input', {
                  type: 'time',
                  value: formatTravelTime(draft),
                  onChange: (event: { target: { value: string } }) => {
                    const parsed = parseTravelTime(event.target.value);
                    if (!parsed) return;
                    const next = new Date();
                    next.setHours(parsed.hours, parsed.minutes, 0, 0);
                    setDraft(next);
                  },
                  style: {
                    fontSize: 16,
                    padding: 12,
                    borderRadius: 10,
                    border: `1px solid ${familyHome.border}`,
                    width: '100%',
                    boxSizing: 'border-box',
                  },
                })
              )}
              <Pressable
                onPress={() => {
                  onChange(formatTravelTime(draft));
                  setShowPicker(false);
                }}
                style={({ pressed }) => [styles.sheetDone, pressed ? styles.pressed : null]}
                accessibilityRole="button"
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

function MemberLiveBody() {
  const catalog = useServiceOfferings(SLUG);
  const requestsQuery = useServiceRequests();
  const seniorQuery = useSeniorProfile();
  const { submitting, submit } = useMembershipSubmit(SLUG);
  const [selectedId, setSelectedId] = useState('');
  const [tripType, setTripType] = useState<TripType>('one-way');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [passengers, setPassengers] = useState('');
  const [roundTrip, setRoundTrip] = useState(false);
  const [driverStay, setDriverStay] = useState(false);

  const offerings = useMemo(() => {
    const fromApi = catalog.data ?? [];
    const byTitle = new Map<string, ServiceOffering>();
    for (const item of fromApi) {
      const key = item.title.trim().toLowerCase();
      if (!byTitle.has(key)) byTitle.set(key, item);
    }
    return FALLBACK_OFFERINGS.map((fallback) => byTitle.get(fallback.title.toLowerCase()) ?? fallback);
  }, [catalog.data]);

  const selected = offerings.find((item) => item.id === selectedId) ?? offerings[0] ?? null;

  const locationExtras = useMemo((): LocalTransportSuggestion[] => {
    const home = seniorQuery.data?.address?.trim();
    if (!home) return [];
    return [{ id: 'home', label: home, subtitle: 'Saved home address', kind: 'home' }];
  }, [seniorQuery.data?.address]);

  const recent = useMemo(() => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    return toLiveRequestViews(mine, { fallbackTitle: 'Outstation trip', limit: 3 });
  }, [requestsQuery.data?.items]);

  const allCount = useMemo(
    () => filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG).length,
    [requestsQuery.data?.items],
  );

  const onViewAllTrips = () => {
    const mine = filterRequestsBySlug(requestsQuery.data?.items ?? [], SLUG);
    const lines = toLiveRequestViews(mine, { fallbackTitle: 'Outstation trip', limit: 20 })
      .map((item) => `• ${item.title} — ${item.statusLabel} (${item.dateLabel})`)
      .join('\n');
    Alert.alert('Recent Trips', lines || 'No trips yet.');
  };

  const onSelectTripType = (next: TripType) => {
    setTripType(next);
    setRoundTrip(next === 'two-way');
  };

  const onRoundTripChange = (value: boolean) => {
    setRoundTrip(value);
    setTripType(value ? 'two-way' : 'one-way');
  };

  const onRequest = () => {
    if (!from.trim() || !to.trim()) {
      Alert.alert('Missing details', 'Please enter both Pickup and Drop locations.');
      return;
    }
    if (!selected) {
      Alert.alert('Select a vehicle', 'Choose a vehicle category first.');
      return;
    }
    if (date.trim() && !parseTravelDate(date)) {
      Alert.alert('Invalid date', 'Use DD-MM-YYYY or pick from the calendar.');
      return;
    }
    if (time.trim() && !parseTravelTime(time)) {
      Alert.alert('Invalid time', 'Use HH:mm or pick from the clock.');
      return;
    }
    const tripLabel = tripType === 'two-way' || roundTrip ? 'Two Way (Return)' : 'One Way';
    void submit(
      [
        `Outstation ${selected.title} (${tripLabel}): ${from.trim()} → ${to.trim()}.`,
        date.trim() ? `Date: ${date.trim()}.` : null,
        time.trim() ? `Time: ${time.trim()}.` : null,
        passengers.trim() ? `Passengers: ${passengers.trim()}.` : null,
        driverStay ? 'Driver stay: yes.' : null,
      ]
        .filter(Boolean)
        .join(' '),
      'Outstation ride requested',
    ).then((ok) => {
      if (ok) {
        setFrom('');
        setTo('');
        setDate('');
        setTime('');
        setPassengers('');
        setRoundTrip(false);
        setDriverStay(false);
        setTripType('one-way');
      }
    });
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.liveContent} showsVerticalScrollIndicator={false}>
      <View style={styles.liveTitleRow}>
        <MarketplaceServiceIcon
          serviceId={SLUG}
          fallbackIcon="car-outline"
          fallbackColor={familyHome.purple}
          size={40}
        />
        <Text style={styles.liveTitle}>Outstation Transport</Text>
      </View>

      <Text style={styles.sectionTitle}>Select Vehicle Category</Text>

      {catalog.isPending && !catalog.data?.length ? (
        <Text style={styles.empty}>Loading vehicles…</Text>
      ) : null}
      {catalog.isError && !catalog.data?.length ? (
        <Pressable onPress={() => void catalog.refetch()} accessibilityRole="button">
          <Text style={styles.viewAll}>Unable to load · Tap to retry</Text>
        </Pressable>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicesRow}>
        {offerings.map((item) => {
          const look = lookForVehicle(item.title);
          const active = item.id === (selectedId || selected?.id);
          const capacity = vehicleCapacityLabel(item);
          return (
            <Pressable
              key={item.id}
              onPress={() => setSelectedId(item.id)}
              style={[
                styles.vehicleCard,
                active ? { borderColor: look.color, backgroundColor: look.soft } : null,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.title}
            >
              {active ? (
                <View style={[styles.checkBadge, { backgroundColor: look.color }]}>
                  <Icon name="checkmark" size={10} color={familyHome.white} />
                </View>
              ) : null}
              <View style={[styles.vehicleIconWell, { backgroundColor: familyHome.white }]}>
                <Icon name={look.icon} size={22} color={look.color} />
              </View>
              <Text style={styles.vehicleTitle} numberOfLines={2}>
                {item.title}
              </Text>
              {capacity ? (
                <Text style={styles.vehicleDesc} numberOfLines={1}>
                  {capacity}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.sectionTitle}>Trip Type</Text>
      <View style={styles.optionRow}>
        <Pressable
          onPress={() => onSelectTripType('one-way')}
          style={[styles.tripCard, tripType === 'one-way' ? styles.tripCardOn : null]}
          accessibilityRole="radio"
          accessibilityState={{ selected: tripType === 'one-way' }}
          accessibilityLabel="One Way"
        >
          <View style={[styles.radioOuter, tripType === 'one-way' ? styles.radioOuterOn : null]}>
            {tripType === 'one-way' ? <View style={styles.radioInner} /> : null}
          </View>
          <Text style={[styles.tripTitle, tripType === 'one-way' ? styles.tripTitleOn : null]}>One Way</Text>
        </Pressable>
        <Pressable
          onPress={() => onSelectTripType('two-way')}
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
        <View style={styles.fieldsRow}>
          <LocationSuggestField
            label="Pickup Location"
            value={from}
            onChange={setFrom}
            placeholder="Enter pickup location"
            pinColor={familyHome.green}
            accessibilityLabel="Pickup Location"
            kind="pickup"
            extras={locationExtras}
          />
          <LocationSuggestField
            label="Drop Location"
            value={to}
            onChange={setTo}
            placeholder="Enter destination"
            pinColor={familyHome.red}
            accessibilityLabel="Drop Location"
            kind="drop"
            extras={locationExtras}
          />
        </View>

        <View style={styles.fieldsRow}>
          <TravelDateField value={date} onChange={setDate} />
          <TravelTimeField value={time} onChange={setTime} />
          <View style={styles.fieldThird}>
            <Text style={styles.fieldLabel}>No. of Passengers</Text>
            <View style={styles.inputWrap}>
              <Icon name="person-outline" size={14} color={familyHome.blue} />
              <TextInput
                value={passengers}
                onChangeText={setPassengers}
                placeholder="Pax"
                placeholderTextColor={familyHome.muted}
                style={styles.inputCompact}
                keyboardType="number-pad"
                accessibilityLabel="Number of passengers"
              />
            </View>
          </View>
        </View>

        <View style={styles.toggleCard}>
          <View style={[styles.toggleIcon, { backgroundColor: familyHome.greenSoft }]}>
            <Icon name="route" size={14} color={familyHome.green} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.toggleTitle}>Round Trip</Text>
            <Text style={styles.toggleBody}>Return to pickup</Text>
          </View>
          <Switch
            value={roundTrip}
            onValueChange={onRoundTripChange}
            trackColor={{ false: familyHome.border, true: familyHome.green }}
            thumbColor={familyHome.white}
            accessibilityLabel="Round Trip"
          />
        </View>

        <View style={styles.toggleCard}>
          <View style={[styles.toggleIcon, { backgroundColor: familyHome.blueSoft }]}>
            <Icon name="moon" size={14} color={familyHome.blue} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.toggleTitle}>Driver Stay</Text>
            <Text style={styles.toggleBody}>Overnight stay if required</Text>
          </View>
          <Switch
            value={driverStay}
            onValueChange={setDriverStay}
            trackColor={{ false: familyHome.border, true: familyHome.green }}
            thumbColor={familyHome.white}
            accessibilityLabel="Driver Stay"
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.raiseCta,
            submitting ? styles.disabled : null,
            pressed ? styles.pressed : null,
          ]}
          onPress={onRequest}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Request Outstation Ride"
        >
          <Icon name="car-outline" size={16} color={familyHome.white} />
          <Text style={styles.raiseCtaText}>
            {submitting ? 'Sending…' : 'Request Outstation Ride'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Trips</Text>
        {allCount > 0 ? (
          <Pressable onPress={onViewAllTrips} accessibilityRole="button">
            <Text style={styles.viewAll}>View All &gt;</Text>
          </Pressable>
        ) : null}
      </View>

      {requestsQuery.isPending ? <Text style={styles.empty}>Loading trips…</Text> : null}
      {!requestsQuery.isPending && recent.length === 0 ? (
        <Text style={styles.empty}>No trips yet. Request a ride above.</Text>
      ) : null}

      {recent.length > 0 ? (
        <View style={styles.activityCard}>
          {recent.map((item, index) => {
            const look = lookForVehicle(item.title);
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
                <Icon name="chevron-forward" size={14} color={familyHome.blue} />
              </View>
            );
          })}
        </View>
      ) : null}

      <View style={styles.infoRow}>
        <View style={[styles.aboutCard, styles.infoHalf]}>
          <View style={styles.aboutHead}>
            <View style={styles.aboutIcon}>
              <Icon name="people-outline" size={14} color={familyHome.blue} />
            </View>
            <Text style={styles.aboutTitle}>About This Service</Text>
          </View>
          <Text style={styles.aboutText}>{DEFAULT_ABOUT}</Text>
          <View style={styles.featureChecks}>
            {ABOUT_FEATURES.map((line) => (
              <View key={line} style={styles.featureCheck}>
                <Icon name="checkmark-circle-outline" size={12} color={familyHome.green} />
                <Text style={styles.featureCheckText}>{line}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.noteCard, styles.infoHalf]}>
          <View style={styles.aboutHead}>
            <View style={[styles.aboutIcon, { backgroundColor: familyHome.greenSoft }]}>
              <Icon name="shield-checkmark-outline" size={14} color={familyHome.green} />
            </View>
            <Text style={styles.aboutTitle}>Please Note</Text>
          </View>
          {PLEASE_NOTE.map((line) => (
            <View key={line} style={styles.featureCheck}>
              <Icon name="checkmark-circle-outline" size={12} color={familyHome.green} />
              <Text style={styles.featureCheckText}>{line}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Learn with Video</Text>
      <Pressable
        onPress={() => void Linking.openURL(VIDEO_URL)}
        accessibilityRole="button"
        accessibilityLabel="Watch on YouTube: Outstation Travel Made Easy for Seniors"
        style={({ pressed }) => [styles.videoCard, pressed ? styles.pressed : null]}
      >
        <View style={styles.videoThumb}>
          <Image source={heroImage} style={styles.videoThumbImage} resizeMode="cover" />
          <View style={styles.videoThumbPlay}>
            <Icon name="play" size={14} color={familyHome.white} />
          </View>
          <Text style={styles.videoThumbDuration}>7:12</Text>
        </View>
        <View style={styles.videoCopy}>
          <Text style={styles.videoTitle}>Tips for a Safe & Comfortable Outstation Journey with AgeWell</Text>
          <View style={styles.watchRow}>
            <Icon name="play" size={11} color={familyHome.red} />
            <Text style={styles.watchLabel}>YouTube Video</Text>
          </View>
        </View>
        <Icon name="chevron-forward" size={14} color={familyHome.blue} />
      </Pressable>
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
  title: { ...typography.title, color: familyHome.text },
  lead: { ...typography.body, color: familyHome.muted, lineHeight: 22, marginTop: 4 },
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
  servicesRow: { gap: 8, paddingRight: 4 },
  vehicleCard: {
    width: 104,
    borderWidth: 1.5,
    borderColor: familyHome.border,
    borderRadius: 12,
    backgroundColor: familyHome.white,
    padding: 10,
    gap: 6,
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  vehicleIconWell: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleTitle: {
    ...typography.captionStrong,
    color: familyHome.text,
    fontSize: 12,
    lineHeight: 15,
  },
  vehicleDesc: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 10,
    lineHeight: 13,
  },
  optionRow: { flexDirection: 'row', gap: 8 },
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
  fieldsRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  fieldHalf: { flex: 1, gap: 4 },
  fieldThird: { flex: 1, gap: 4 },
  fieldLabel: { ...typography.captionStrong, color: familyHome.muted, fontSize: 11 },
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
  inputWrapFocused: { borderColor: familyHome.green },
  input: {
    ...typography.body,
    color: familyHome.text,
    flex: 1,
    fontSize: 12,
    paddingVertical: 8,
  },
  inputCompact: {
    ...typography.body,
    color: familyHome.text,
    flex: 1,
    fontSize: 11,
    paddingVertical: 8,
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
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: familyHome.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: familyHome.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  toggleIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTitle: { ...typography.captionStrong, color: familyHome.text, fontSize: 12 },
  toggleBody: { ...typography.caption, color: familyHome.muted, fontSize: 10, marginTop: 1 },
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
  infoRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  infoHalf: { flex: 1 },
  aboutCard: {
    borderRadius: 12,
    backgroundColor: familyHome.blueSoft,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },
  noteCard: {
    borderRadius: 12,
    backgroundColor: familyHome.greenSoft,
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
  aboutTitle: { ...typography.bodyStrong, color: familyHome.text, fontSize: 12 },
  aboutText: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 10,
    lineHeight: 14,
  },
  featureChecks: { gap: 4 },
  featureCheck: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  featureCheckText: {
    ...typography.caption,
    color: familyHome.muted,
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: familyHome.border,
    backgroundColor: '#F7F8FA',
    padding: 8,
  },
  videoThumb: {
    width: 72,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#123B7A',
  },
  videoThumbImage: { width: '100%', height: '100%' },
  videoThumbPlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  videoThumbDuration: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    ...typography.caption,
    color: familyHome.white,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    fontSize: 9,
  },
  videoCopy: { flex: 1, gap: 3 },
  videoTitle: { ...typography.bodyStrong, color: familyHome.blueDark, fontSize: 12, lineHeight: 15 },
  watchRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  watchLabel: { ...typography.caption, color: familyHome.muted, fontSize: 10 },
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
});
