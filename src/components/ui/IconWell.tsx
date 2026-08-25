import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, type ColorTone, tones } from '@/constants/theme';

interface IconWellProps {
  children: ReactNode;
  tone?: ColorTone;
  size?: number;
  rounded?: 'full' | 'lg';
}

export function IconWell({ children, tone = 'primary', size = 44, rounded = 'lg' }: IconWellProps) {
  const palette = tones[tone];
  return (
    <View
      style={[
        styles.well,
        {
          width: size,
          height: size,
          borderRadius: rounded === 'full' ? size / 2 : radius.md,
          backgroundColor: palette.bg,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  well: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
