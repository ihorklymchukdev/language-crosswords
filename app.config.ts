import type { ExpoConfig } from 'expo/config';

const DISPLAY_NAME = 'Crossword Spanish';

const config: ExpoConfig = {
  name: DISPLAY_NAME,
  slug: 'language-crosswords',
  scheme: 'crosswords',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  ios: {
    bundleIdentifier: 'com.ihorklymchuk.crosswords',
    supportsTablet: false,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    package: 'com.ihorklymchuk.crosswords',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#C8553D',
    },
  },
  web: { output: 'static', bundler: 'metro', favicon: './assets/favicon.png' },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 130,
        backgroundColor: '#FBF7F0',
        dark: { backgroundColor: '#14161B' },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    ...(process.env.WEB_BASE === '1' ? { baseUrl: '/language-crosswords' } : {}),
  },
};

export default config;
