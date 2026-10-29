// expo default, monorepo paths are picked up automatically
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// kuromoji dictionary ships as *.dat.gz, bundle them as assets
config.resolver.assetExts.push('gz');

// kuromoji's loader does require('path'), no node core in react native
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  path: require.resolve('path-browserify'),
};

module.exports = config;
