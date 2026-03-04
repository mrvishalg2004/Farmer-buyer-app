const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ignore macOS resource fork files (._*) which cause syntax errors 
// when the project is on an external drive.
config.resolver.blockList = [
    /.*\/(\._.*|.*\.DS_Store)$/,
];

module.exports = config;
