import type { ColorValue } from 'react-native';
import { colors, iconStroke } from '@/constants/theme';
import { ICONS, type IconName } from './iconCatalog';

interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
  strokeWidth?: number;
}

export function Icon({ name, size = 22, color = colors.text, strokeWidth = iconStroke }: IconProps) {
  const Cmp = ICONS[name];
  const resolved = typeof color === 'string' ? color : colors.text;
  return <Cmp size={size} color={resolved} strokeWidth={strokeWidth} />;
}

export type { IconName };
