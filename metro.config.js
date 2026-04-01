const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .db to the list of recognized asset extensions
config.resolver.assetExts.push('db');

module.exports = config;