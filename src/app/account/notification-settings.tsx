import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { AppHeader, Screen } from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { getApiErrorMessage } from '@/api/errors';
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from '@/features/notifications/api';

export default function NotificationSettingsScreen() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const next = await fetchNotificationPreferences();
        if (active) {
          setPrefs(next);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(getApiErrorMessage(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setPushEnabled = async (pushEnabled: boolean) => {
    if (!prefs || saving) {
      return;
    }
    const previous = prefs;
    setPrefs({ ...prefs, pushEnabled });
    setSaving(true);
    setError(null);
    try {
      const next = await updateNotificationPreferences({ pushEnabled });
      setPrefs(next);
    } catch (err) {
      setPrefs(previous);
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Notifications" subtitle="How EldCare alerts work" showBack />
      <View style={[styles.card, shadows.card]}>
        <Text style={styles.body}>
          Emergency SOS alerts are delivered as phone push notifications (Android via FCM, iPhone via APNs through
          Expo). When you allow notifications, they can sound and vibrate even if EldCare is closed or your phone is
          locked — subject to your device notification settings.
        </Text>
        <Text style={styles.body}>
          In-app notifications also appear in the Notifications screen. SMS and WhatsApp are not connected yet.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View style={styles.row}>
            <View style={styles.rowCopy}>
              <Text style={styles.label}>Phone push alerts</Text>
              <Text style={styles.hint}>Includes emergency SOS when your device has allowed notifications.</Text>
            </View>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary }}
              value={prefs?.pushEnabled ?? true}
              disabled={!prefs || saving}
              onValueChange={(value) => {
                void setPushEnabled(value);
              }}
            />
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  label: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
  },
});
