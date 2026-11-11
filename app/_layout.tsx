import { Gabarito_600SemiBold, Gabarito_700Bold } from '@expo-google-fonts/gabarito';
import { Onest_400Regular, Onest_500Medium, Onest_600SemiBold, Onest_700Bold } from '@expo-google-fonts/onest';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProgressProvider } from '../src/progress/progress-context';
import { usePalette } from '../src/ui/theme';

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const palette = usePalette();
  const [loaded, error] = useFonts({
    Onest_400Regular,
    Onest_500Medium,
    Onest_600SemiBold,
    Onest_700Bold,
    Gabarito_600SemiBold,
    Gabarito_700Bold,
  });
  const ready = loaded || error !== null;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Native keeps the splash up until fonts load; web must render the static HTML right away.
  if (!ready && Platform.OS !== 'web') return null;

  return (
    <SafeAreaProvider>
      <ProgressProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }} />
      </ProgressProvider>
    </SafeAreaProvider>
  );
}
