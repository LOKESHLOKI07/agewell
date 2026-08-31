import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { brandGreen } from '@/components/AgeWellLogo';
import { Icon } from '@/components/ui';

export function AuthMethodButtons({
  onGoogle,
  onMobile,
  onEmail,
  googleDisabled = false,
}: {
  onGoogle: () => void;
  onMobile: () => void;
  onEmail: () => void;
  googleDisabled?: boolean;
}) {
  return (
    <View style={styles.methods}>
      <AuthMethodButton
        label="Continue with Google"
        icon={<GoogleGlyph />}
        onPress={onGoogle}
        disabled={googleDisabled}
      />
      <AuthMethodButton
        label="Continue with Mobile Number"
        icon={
          <View style={styles.phoneWell}>
            <Icon name="call-outline" size={16} color="#FFFFFF" />
          </View>
        }
        onPress={onMobile}
      />
      <AuthMethodButton
        label="Continue with Email"
        icon={
          <View style={styles.mailWell}>
            <Icon name="mail-outline" size={16} color="#FFFFFF" />
          </View>
        }
        onPress={onEmail}
      />
    </View>
  );
}

function AuthMethodButton({
  label,
  icon,
  onPress,
  disabled = false,
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.method,
        pressed && !disabled ? styles.methodPressed : null,
        disabled ? styles.methodDisabled : null,
      ]}
    >
      <View style={styles.methodIcon}>{icon}</View>
      <Text style={styles.methodLabel}>{label}</Text>
      <View style={styles.methodIcon} />
    </Pressable>
  );
}

function GoogleGlyph() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  methods: {
    gap: 14,
  },
  method: {
    minHeight: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    ...Platform.select({
      web: { boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.08)' },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
      },
    }),
  },
  methodPressed: {
    opacity: 0.92,
  },
  methodDisabled: {
    opacity: 0.55,
  },
  methodIcon: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  phoneWell: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mailWell: {
    width: 28,
    height: 24,
    borderRadius: 6,
    backgroundColor: brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
