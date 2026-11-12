import type { ExpoConfig } from 'expo/config';

const DISPLAY_NAME = 'Palabrix';

const config: ExpoConfig = {
  name: DISPLAY_NAME,
  owner: 'ihorklymchuk',
  slug: 'language-crosswords',
  extra: { eas: { projectId: '0813f745-457f-468a-b1c6-508376815f1c' } },
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
      backgroundColor: '#2F5BEA',
    },
    blockedPermissions: [
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.VIBRATE',
    ],
  },
  web: { output: 'static', bundler: 'metro', favicon: './assets/favicon.png' },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 130,
        backgroundColor: '#FFFFFF',
        dark: { backgroundColor: '#0E1116' },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    ...(process.env.WEB_BASE === '1' ? { baseUrl: '/language-crosswords' } : {}),
  },
};

export default config;
