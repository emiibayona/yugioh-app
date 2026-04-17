const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ADD THIS LINE: Tell Metro to recognize .db and .sqlite files
config.resolver.assetExts.push('db', 'sqlite');

module.exports = config;