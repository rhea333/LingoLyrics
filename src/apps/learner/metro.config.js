// expo default, monorepo paths are picked up automatically
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Dictionary files are decompressed during the build to avoid slow JS gunzip.
config.resolver.assetExts.push('dat');

// kuromoji's loader does require('path'), no node core in react native
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  path: require.resolve('path-browserify'),
};

module.exports = config;
