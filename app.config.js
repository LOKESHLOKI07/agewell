const appJson = require('./app.json');

const androidGoogleMapsApiKey =
  process.env.ANDROID_GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_ANDROID_GOOGLE_MAPS_API_KEY || '';
const iosGoogleMapsApiKey =
  process.env.IOS_GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_IOS_GOOGLE_MAPS_API_KEY || '';

module.exports = {
  ...appJson.expo,
  plugins: [
    ...(appJson.expo.plugins ?? []),
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey,
        iosGoogleMapsApiKey,
      },
    ],
  ],
};
