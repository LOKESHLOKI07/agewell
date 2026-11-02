import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useQueryClient } from '@tanstack/react-query';
import { AppHeader, PrimaryButton } from '@/components';
import { Icon } from '@/components/ui';
import { colors, minTouchSize, radius, spacing, typography } from '@/constants/theme';
import { getApiErrorMessage } from '@/api/errors';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';
import { updateSeniorMeHomeAddress } from '@/features/home/api/homeApi';
import { useSeniorProfile } from '@/features/home/hooks/queries';
import { requestOnboardingLocation } from '@/features/auth/onboardingLocation';
import { HOME_PIN_MAP_HTML } from './homePinMapHtml';
import { reverseGeocodeLabel, searchPlaces, type PlaceSearchHit } from './placeSearch';

type MapCenter = { latitude: number; longitude: number };

const DEFAULT_CENTER: MapCenter = { latitude: 19.076, longitude: 72.8777 };
const SEARCH_DEBOUNCE_MS = 400;

export function HomeAddressPinScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const seniorQuery = useSeniorProfile();
  const webRef = useRef<WebView>(null);
  /** Exact pin the user chose — never overwritten by profile refetch. */
  const pinRef = useRef<MapCenter>(DEFAULT_CENTER);
  const profileSeededRef = useRef(false);
  const mapSeededRef = useRef(false);
  const searchSeq = useRef(0);
  const reverseSeq = useRef(0);
  const typingRef = useRef(false);

  const [mapReady, setMapReady] = useState(Platform.OS === 'web');
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [center, setCenter] = useState<MapCenter>(DEFAULT_CENTER);
  const [address, setAddress] = useState('');
  const [search, setSearch] = useState('');
  const [hits, setHits] = useState<PlaceSearchHit[]>([]);
  const [searching, setSearching] = useState(false);

  const setPin = useCallback((next: MapCenter) => {
    pinRef.current = next;
    setCenter(next);
  }, []);

  const injectSetView = useCallback((next: MapCenter, zoom = 17) => {
    if (Platform.OS === 'web') return;
    webRef.current?.injectJavaScript(
      `window.setHomePin && window.setHomePin(${next.latitude}, ${next.longitude}, ${zoom}); true;`,
    );
  }, []);

  const applyPin = useCallback(
    (next: MapCenter, label?: string | null, opts?: { moveMap?: boolean; fromUserDrag?: boolean }) => {
      setPin(next);
      if (label?.trim()) {
        setAddress(label.trim());
        setSearch(label.trim());
      }
      if (opts?.moveMap !== false && !opts?.fromUserDrag) {
        injectSetView(next, 17);
      }
    },
    [injectSetView, setPin],
  );

  // Seed once from saved profile — do not re-apply after the user moves the pin.
  useEffect(() => {
    const senior = seniorQuery.data;
    if (!senior || profileSeededRef.current) return;
    profileSeededRef.current = true;
    const label = senior.address?.trim() || senior.locationQuery?.trim() || '';
    if (label) {
      setAddress(label);
      setSearch(label);
    }
    if (senior.locationLat != null && senior.locationLng != null) {
      const next = { latitude: senior.locationLat, longitude: senior.locationLng };
      setPin(next);
    }
  }, [seniorQuery.data, setPin]);

  useEffect(() => {
    if (!mapReady || mapSeededRef.current || Platform.OS === 'web') return;
    mapSeededRef.current = true;
    injectSetView(pinRef.current, 17);
  }, [mapReady, injectSetView]);

  const fillAddressFromPin = useCallback(async (next: MapCenter) => {
    if (typingRef.current) return;
    const seq = ++reverseSeq.current;
    try {
      const label = await reverseGeocodeLabel(next.latitude, next.longitude);
      if (seq !== reverseSeq.current || typingRef.current) return;
      if (label) {
        setAddress(label);
        setSearch(label);
      }
    } catch {
      // Keep whatever the user typed.
    }
  }, []);

  const onMapMessage = useCallback(
    (raw: string) => {
      try {
        const data = JSON.parse(raw) as {
          type?: string;
          lat?: number;
          lng?: number;
          reason?: string;
        };
        if (data.type === 'ready') {
          setMapReady(true);
          return;
        }
        if (data.type === 'user-drag') {
          typingRef.current = false;
          setHits([]);
          return;
        }
        if (data.type === 'center' && Number.isFinite(data.lat) && Number.isFinite(data.lng)) {
          const next = { latitude: data.lat as number, longitude: data.lng as number };
          // Only treat user pans as the new saved pin. Programmatic moves already set pinRef.
          if (data.reason === 'user') {
            setPin(next);
            void fillAddressFromPin(next);
          }
        }
      } catch {
        // ignore
      }
    },
    [fillAddressFromPin, setPin],
  );

  // Debounced place search (Zepto / Zomato style).
  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setHits([]);
      setSearching(false);
      return undefined;
    }
    const seq = ++searchSeq.current;
    setSearching(true);
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const results = await searchPlaces(q);
          if (seq !== searchSeq.current) return;
          setHits(results);
        } catch {
          if (seq !== searchSeq.current) return;
          setHits([]);
        } finally {
          if (seq === searchSeq.current) setSearching(false);
        }
      })();
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const useCurrentLocation = async () => {
    setLocating(true);
    typingRef.current = false;
    setHits([]);
    try {
      const result = await requestOnboardingLocation();
      if (!result.ok) {
        Alert.alert('Location', 'Turn on location permission to place the pin at your current spot.');
        return;
      }
      const next = { latitude: result.latitude, longitude: result.longitude };
      applyPin(next, null, { moveMap: true });
      void fillAddressFromPin(next);
    } finally {
      setLocating(false);
    }
  };

  const onPickHit = (hit: PlaceSearchHit) => {
    typingRef.current = false;
    setHits([]);
    applyPin(
      { latitude: hit.latitude, longitude: hit.longitude },
      hit.label,
      { moveMap: true },
    );
  };

  const onSave = async () => {
    const label = address.trim() || search.trim();
    if (!label) {
      Alert.alert('Address needed', 'Search a place or type a landmark for this pin.');
      return;
    }
    const pin = pinRef.current;
    setSaving(true);
    try {
      const updated = await updateSeniorMeHomeAddress({
        address: label,
        locationLat: pin.latitude,
        locationLng: pin.longitude,
        locationQuery: label,
        locationSource: 'gps',
      });
      queryClient.setQueryData(homeQueryKeys.seniorMe, updated);
      Alert.alert('Saved', 'Your home pin is saved exactly where you placed it.');
      if (router.canGoBack()) {
        router.back();
      }
    } catch (error) {
      Alert.alert('Could not save', getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AppHeader title="Home address" subtitle="Search or drag the map — we save the pin you place" showBack />
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Icon name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={(text) => {
              typingRef.current = true;
              setSearch(text);
              setAddress(text);
            }}
            placeholder="Search area, landmark, society…"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="search"
            accessibilityLabel="Search location"
          />
          {searching ? <ActivityIndicator color={colors.primary} /> : null}
          {search.length > 0 && !searching ? (
            <Pressable
              onPress={() => {
                setSearch('');
                setHits([]);
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={8}
            >
              <Text style={styles.clearLabel}>Clear</Text>
            </Pressable>
          ) : null}
        </View>
        {hits.length > 0 ? (
          <View style={styles.suggestPanel}>
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={hits}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => onPickHit(item)}
                  style={({ pressed }) => [styles.suggestRow, pressed ? styles.pressed : null]}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                >
                  <Icon name="location" size={16} color={colors.primary} />
                  <Text style={styles.suggestText} numberOfLines={2}>
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        ) : null}
      </View>
      <View style={styles.mapWrap}>
        {Platform.OS === 'web' ? (
          <View style={styles.webFallback}>
            <Text style={styles.webFallbackTitle}>Map pin</Text>
            <Text style={styles.webFallbackBody}>
              Use search above to pick a place, or open this screen on your phone to drag the map pin.
            </Text>
            <Text style={styles.coords}>
              {center.latitude.toFixed(5)}, {center.longitude.toFixed(5)}
            </Text>
          </View>
        ) : (
          <WebView
            ref={webRef}
            style={styles.map}
            originWhitelist={['*']}
            source={{ html: HOME_PIN_MAP_HTML, baseUrl: 'https://tile.openstreetmap.org' }}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            setSupportMultipleWindows={false}
            onMessage={(event) => onMapMessage(event.nativeEvent.data)}
          />
        )}
        {Platform.OS !== 'web' ? (
          <View pointerEvents="none" style={styles.pinOverlay}>
            <Icon name="location" size={36} color={colors.emergency} />
            <View style={styles.pinShadow} />
          </View>
        ) : null}
        {Platform.OS !== 'web' && !mapReady ? (
          <View style={styles.mapLoading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}
        <Pressable
          onPress={() => void useCurrentLocation()}
          style={({ pressed }) => [styles.locateBtn, pressed ? styles.pressed : null]}
          accessibilityRole="button"
          accessibilityLabel="Use current location"
        >
          {locating ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Icon name="navigate" size={20} color={colors.primary} />
          )}
        </Pressable>
      </View>
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Text style={styles.hint}>Drag the map to fine-tune. We save the pin under the marker — not your live GPS.</Text>
        <Text style={styles.coords}>
          Pin {center.latitude.toFixed(5)}, {center.longitude.toFixed(5)}
        </Text>
        <Text style={styles.addressPreview} numberOfLines={3}>
          {address.trim() || 'Move the pin or pick a search result'}
        </Text>
        <PrimaryButton label={saving ? 'Saving…' : 'Save home pin'} onPress={() => void onSave()} loading={saving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchWrap: {
    zIndex: 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: minTouchSize,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  clearLabel: {
    ...typography.captionStrong,
    color: colors.textMuted,
  },
  suggestPanel: {
    maxHeight: 220,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  suggestText: {
    flex: 1,
    ...typography.caption,
    color: colors.text,
  },
  mapWrap: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.border,
  },
  map: {
    flex: 1,
  },
  webFallback: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
  },
  webFallbackTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  webFallbackBody: {
    ...typography.body,
    color: colors.textSecondary,
  },
  pinOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
  },
  pinShadow: {
    width: 10,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(28,31,51,0.35)',
    marginTop: 2,
  },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  locateBtn: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: minTouchSize,
    height: minTouchSize,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  coords: {
    ...typography.captionStrong,
    color: colors.primary,
  },
  addressPreview: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
  },
});
