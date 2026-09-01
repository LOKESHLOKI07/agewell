import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { familyHome } from '@/features/home/components/familyHomeTheme';

type SosTabButtonProps = {
  accessibilityState?: { selected?: boolean } | null;
  onPress?: ((event: GestureResponderEvent) => void) | null;
  onLongPress?: ((event: GestureResponderEvent) => void) | null;
};

/** Raised center SOS control for the member tab bar. */
export function SosTabButton({ accessibilityState, onPress, onLongPress }: SosTabButtonProps) {
  const focused = Boolean(accessibilityState?.selected);

  return (
    <Pressable
      onPress={onPress ?? undefined}
      onLongPress={onLongPress ?? undefined}
      accessibilityRole="button"
      accessibilityLabel="SOS"
      accessibilityState={accessibilityState ?? undefined}
      style={styles.wrap}
    >
      <View style={[styles.button, focused ? styles.buttonFocused : null]}>
        <Text style={styles.label}>SOS</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: familyHome.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    borderWidth: 4,
    borderColor: familyHome.white,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  buttonFocused: {
    transform: [{ scale: 1.04 }],
  },
  label: {
    color: familyHome.white,
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    letterSpacing: 1,
  },
});
