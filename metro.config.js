const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase 10+ requires package exports to be disabled in Metro
// so it resolves the React Native build instead of the browser/ESM build.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
