import 'expo-router/entry';
import { Platform } from 'react-native';

if (Platform.OS === 'android') {
  try {
    const { registerWidgetTaskHandler } = require('react-native-android-widget');
    const { widgetTaskHandler } = require('./src/features/emergency/widget/widgetTaskHandler');
    registerWidgetTaskHandler(widgetTaskHandler);
  } catch {
    // Expo Go and web builds do not include the native widget module.
  }
}
