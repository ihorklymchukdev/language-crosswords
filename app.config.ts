import type { ExpoConfig } from 'expo/config';

const DISPLAY_NAME = 'Crossword Spanish';

const config: ExpoConfig = {
  name: DISPLAY_NAME,
  slug: 'language-crosswords',
  scheme: 'crosswords',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  ios: { bundleIdentifier: 'com.ihorklymchuk.crosswords' },
  android: { package: 'com.ihorklymchuk.crosswords' },
  web: { output: 'static', bundler: 'metro' },
  plugins: ['expo-router'],
  experiments: {
    typedRoutes: true,
    ...(process.env.WEB_BASE === '1' ? { baseUrl: '/language-crosswords' } : {}),
  },
};

export default config;
