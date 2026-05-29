const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Support Drizzle ORM migration .sql files
config.resolver.sourceExts.push('sql');

module.exports = config;
