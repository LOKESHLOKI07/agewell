import type { WidgetTaskHandler } from 'react-native-android-widget';
import { AgeWellEmergencyWidget } from './AgeWellEmergencyWidget';
import { EMERGENCY_WIDGET_NAME } from './widgetLink';

export const widgetTaskHandler: WidgetTaskHandler = async ({ renderWidget, widgetInfo }) => {
  if (widgetInfo.widgetName !== EMERGENCY_WIDGET_NAME) {
    return;
  }
  renderWidget(<AgeWellEmergencyWidget />);
};
