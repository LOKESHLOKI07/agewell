import { colors } from '@/constants/theme';
import { Icon, IconWell, type IconName } from '@/components/ui';
import type { ColorTone } from '@/constants/theme';

type ServiceIconProps = {
  name: IconName;
  tone?: ColorTone;
  size?: number;
};

export function ServiceIcon({ name, tone = 'primary', size = 48 }: ServiceIconProps) {
  const fg =
    tone === 'emergency'
      ? colors.emergency
      : tone === 'safe'
        ? colors.safe
        : tone === 'accent'
          ? colors.accent
          : tone === 'warning'
            ? colors.warning
            : colors.primary;

  return (
    <IconWell tone={tone} size={size} rounded="full">
      <Icon name={name} size={Math.round(size * 0.42)} color={fg} />
    </IconWell>
  );
}
