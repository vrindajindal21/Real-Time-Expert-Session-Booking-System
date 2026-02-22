const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add asset resolution patterns
config.resolver.assetExts.push(
  // Add any additional asset extensions here
);

module.exports = config;
