import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '@/constants/theme';

export function MapUnavailable() {
  return (
    <View style={styles.fallback} accessibilityLabel="Map is unavailable right now.">
      <Text style={styles.fallbackTitle}>Map is unavailable right now.</Text>
      <Text style={styles.fallbackBody}>
        Live location details are still shown below. Check your connection and open this screen again.
      </Text>
    </View>
  );
}

const fill = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const styles = StyleSheet.create({
  fallback: {
    ...fill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  fallbackTitle: {
    ...typography.heading,
    color: colors.text,
    textAlign: 'center',
  },
  fallbackBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
