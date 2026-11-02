const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const defaultResolveRequest = config.resolver.resolveRequest;

// Treat .svg as static image assets so they can be used with <Image source={require(...)} />.
const { assetExts, sourceExts } = config.resolver;
config.resolver.assetExts = assetExts.includes('svg') ? assetExts : [...assetExts, 'svg'];
config.resolver.sourceExts = sourceExts.filter((ext) => ext !== 'svg');

// Keep Metro from crawling deploy output and the Python API. Watching those
// trees is what made Fast Refresh / Android reloads stall after large UI work.
const extraBlockList = [/[\\/]dist-vps[\\/].*/, /[\\/]apps[\\/]api[\\/].*/];
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(existingBlockList ? (Array.isArray(existingBlockList) ? existingBlockList : [existingBlockList]) : []),
  ...extraBlockList,
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && (moduleName === 'react-native-maps' || moduleName.startsWith('react-native-maps/'))) {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'src/features/tracking/react-native-maps.web.ts'),
    };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
