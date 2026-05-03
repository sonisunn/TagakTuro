const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure Metro to use the specific IP address for the dev server
config.server = {
  port: 8081,
  // Bind to the specific IP address
  rejectUnauthorized: false,
};

// Optional: Configure to use the specified IP
config.resolver = {
  ...config.resolver,
};

module.exports = config;
