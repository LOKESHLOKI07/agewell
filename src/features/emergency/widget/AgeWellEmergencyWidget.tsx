'use no memo';

import { FlexWidget, TextWidget } from 'react-native-android-widget';
import {
  EMERGENCY_WIDGET_COLORS,
  EMERGENCY_WIDGET_COPY,
  EMERGENCY_WIDGET_URI,
} from './widgetLink';

/**
 * Android home-screen widget. RemoteViews cannot do a 3-second hold, so a tap
 * only opens the in-app confirmation screen via deep link. No tokens or PII.
 */
export function AgeWellEmergencyWidget() {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: EMERGENCY_WIDGET_URI }}
      accessibilityLabel={EMERGENCY_WIDGET_COPY.accessibilityLabel}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: EMERGENCY_WIDGET_COLORS.red,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        flexGap: 0,
      }}
    >
      <TextWidget text="📞" style={{ fontSize: 14, textAlign: 'center' }} />
      <TextWidget
        text={EMERGENCY_WIDGET_COPY.widgetAction}
        style={{
          color: EMERGENCY_WIDGET_COLORS.white,
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.5,
          textAlign: 'center',
        }}
      />
    </FlexWidget>
  );
}
