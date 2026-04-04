const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ADD THIS LINE: Tell Metro to recognize .db files
config.resolver.assetExts.push('db');

module.exports = config;