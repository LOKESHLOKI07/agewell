const appJson = require('./app.json');

const androidGoogleMapsApiKey =
  process.env.ANDROID_GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_ANDROID_GOOGLE_MAPS_API_KEY || '';
const iosGoogleMapsApiKey =
  process.env.IOS_GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_IOS_GOOGLE_MAPS_API_KEY || '';

const isCare =
  process.env.APP_VARIANT === 'care' || process.env.EXPO_PUBLIC_APP_VARIANT === 'care';
const variant = isCare ? 'care' : 'family';

module.exports = {
  ...appJson.expo,
  name: isCare ? 'AgeWell Care' : appJson.expo.name,
  scheme: isCare ? 'agewell-care' : appJson.expo.scheme,
  ios: {
    ...appJson.expo.ios,
    bundleIdentifier: isCare ? 'in.agewell.care' : appJson.expo.ios.bundleIdentifier,
  },
  android: {
    ...appJson.expo.android,
    package: isCare ? 'in.agewell.care' : appJson.expo.android.package,
  },
  extra: {
    ...(appJson.expo.extra ?? {}),
    appVariant: variant,
  },
  plugins: [
    ...(appJson.expo.plugins ?? []),
    'expo-web-browser',
    '@react-native-community/datetimepicker',
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey,
        iosGoogleMapsApiKey,
      },
    ],
    ...(isCare
      ? []
      : [
          [
            'react-native-android-widget',
            {
              widgets: [
                {
                  name: 'AgeWellEmergency',
                  label: 'AgeWell Emergency',
                  description:
                    'Get AgeWell emergency help from your Home Screen. This does not call 911.',
                  minWidth: '180dp',
                  minHeight: '180dp',
                  targetCellWidth: 3,
                  targetCellHeight: 3,
                  resizeMode: 'none',
                  previewImage: './assets/logo_splash.png',
                },
              ],
            },
          ],
          '@bacons/apple-targets',
        ]),
  ],
};
