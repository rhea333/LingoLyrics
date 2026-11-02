const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// kuromoji ships its dictionary as compressed assets.
config.resolver.assetExts.push('gz');
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  path: require.resolve('path-browserify'),
};

module.exports = config;
