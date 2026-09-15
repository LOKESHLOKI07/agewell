export const EMERGENCY_WIDGET_NAME = 'AgeWellEmergency';
export const EMERGENCY_WIDGET_PATH = '/emergency/widget-sos';
export const EMERGENCY_WIDGET_URI = 'agewell://emergency/widget-sos';
export const EMERGENCY_WIDGET_HOLD_MS = 3000;

export const EMERGENCY_WIDGET_COPY = {
  brand: 'AgeWell',
  emoji: '🆘',
  title: 'EMERGENCY',
  action: 'GET HELP',
  widgetAction: 'SOS',
  widgetHint: 'Tap for Help',
  accessibilityLabel:
    'AgeWell Emergency. SOS. Opens a confirmation before notifying AgeWell support. This does not call emergency services.',
} as const;

export const EMERGENCY_WIDGET_TRIGGER = 'HOME_PANIC_BUTTON' as const;
export const EMERGENCY_WIDGET_TYPE = 'MEDICAL' as const;

export const EMERGENCY_WIDGET_COLORS = {
  red: '#E53935',
  redSoft: '#FDECEC',
  green: '#43A047',
  greenSoft: '#E8F5E9',
  amber: '#F57C00',
  amberSoft: '#FFF3E0',
  text: '#1A1A1A',
  muted: '#6B6B6B',
  white: '#FFFFFF',
  border: '#EDEDED',
} as const;

export function isEmergencyWidgetUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }
  return url.includes('emergency/widget-sos');
}

export function widgetPropsArePublic(props: Record<string, unknown>): boolean {
  const forbidden = /token|password|secret|refresh|email|phone|address|gps|location/i;
  return !Object.keys(props).some((key) => forbidden.test(key));
}
