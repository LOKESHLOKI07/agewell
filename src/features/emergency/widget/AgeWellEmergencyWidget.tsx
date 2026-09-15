'use no memo';

import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';
import {
  EMERGENCY_WIDGET_COLORS,
  EMERGENCY_WIDGET_COPY,
  EMERGENCY_WIDGET_URI,
} from './widgetLink';

const logo = require('../../../../assets/logo_splash.png');

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
        backgroundColor: EMERGENCY_WIDGET_COLORS.white,
        borderRadius: 28,
        padding: 14,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexGap: 10,
      }}
    >
      <ImageWidget image={logo} imageWidth={44} imageHeight={44} resizeMode="contain" />
      <FlexWidget
        style={{
          height: 92,
          width: 92,
          borderRadius: 46,
          backgroundColor: EMERGENCY_WIDGET_COLORS.red,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          flexGap: 2,
        }}
      >
        <TextWidget text="📞" style={{ fontSize: 22, textAlign: 'center' }} />
        <TextWidget
          text={EMERGENCY_WIDGET_COPY.widgetAction}
          style={{
            color: EMERGENCY_WIDGET_COLORS.white,
            fontSize: 18,
            fontWeight: '700',
            letterSpacing: 1,
            textAlign: 'center',
          }}
        />
      </FlexWidget>
      <TextWidget
        text={EMERGENCY_WIDGET_COPY.widgetHint}
        style={{
          color: EMERGENCY_WIDGET_COLORS.muted,
          fontSize: 14,
          fontWeight: '600',
          textAlign: 'center',
        }}
      />
    </FlexWidget>
  );
}
