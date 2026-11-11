import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProgressProvider } from '../src/progress/progress-context';
import { usePalette } from '../src/ui/theme';

export default function RootLayout() {
  const palette = usePalette();
  return (
    <SafeAreaProvider>
      <ProgressProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }} />
      </ProgressProvider>
    </SafeAreaProvider>
  );
}
