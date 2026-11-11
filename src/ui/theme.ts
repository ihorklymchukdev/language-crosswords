import { Platform, useColorScheme } from 'react-native';
import { useHydrated } from './useHydrated';

export type Palette = {
  scheme: 'light' | 'dark';
  bg: string;
  // Soft fill for cards, chips and secondary buttons.
  surface: string;
  // The keyboard panel; keys and action buttons sit on it in `raised`.
  panel: string;
  raised: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  accentTint: string;
  // Accent-coloured text and icons that sit on `accentTint` or `bg`.
  accentStrong: string;
  // High-contrast fill for the main call to action.
  inverse: string;
  inverseText: string;
  inverseMuted: string;
  segment: string;
  cell: string;
  slotTint: string;
  cursorText: string;
  keyAlt: string;
  correctBg: string;
  correctText: string;
  revealedText: string;
};

export const palettes: Record<'light' | 'dark', Palette> = {
  light: {
    scheme: 'light',
    bg: '#FFFFFF',
    surface: '#F3F4F6',
    panel: '#ECEEF2',
    raised: '#FFFFFF',
    border: '#E5E7EB',
    text: '#101319',
    textMuted: '#5B616E',
    accent: '#2F5BEA',
    accentText: '#FFFFFF',
    accentTint: '#E8EEFF',
    accentStrong: '#1E3FAE',
    inverse: '#101319',
    inverseText: '#FFFFFF',
    inverseMuted: '#C5CAD3',
    segment: '#E5E7EB',
    cell: '#E9ECF1',
    slotTint: '#C9D8FF',
    cursorText: '#FFFFFF',
    keyAlt: '#CDD1D9',
    correctBg: '#D7F2E1',
    correctText: '#17703D',
    revealedText: '#9A5B00',
  },
  dark: {
    scheme: 'dark',
    bg: '#0E1116',
    surface: '#1A1E26',
    panel: '#161A21',
    raised: '#262B35',
    border: '#2A303B',
    text: '#F2F4F7',
    textMuted: '#A0A7B4',
    accent: '#5B82FF',
    accentText: '#FFFFFF',
    accentTint: '#1C2747',
    accentStrong: '#A9BEFF',
    inverse: '#F2F4F7',
    inverseText: '#101319',
    inverseMuted: '#4A505C',
    segment: '#262B35',
    cell: '#232833',
    slotTint: '#28396A',
    cursorText: '#FFFFFF',
    keyAlt: '#3A414F',
    correctBg: '#163824',
    correctText: '#6FD69A',
    revealedText: '#E6B450',
  },
};

// Custom fonts carry their weight in the family name; fontWeight would make Android fall back.
export const font = {
  regular: 'Onest_400Regular',
  medium: 'Onest_500Medium',
  semibold: 'Onest_600SemiBold',
  bold: 'Onest_700Bold',
  displaySemibold: 'Gabarito_600SemiBold',
  display: 'Gabarito_700Bold',
} as const;

export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;
export const radius = { s: 12, m: 16, card: 20, sheet: 24, pill: 999 } as const;
export const MAX_CONTENT_WIDTH = 480;
export const MIN_TOUCH = 44;

// The static web HTML is rendered light; dark applies once hydrated.
export function usePalette(): Palette {
  const hydrated = useHydrated();
  const scheme = useColorScheme();
  return hydrated && scheme === 'dark' ? palettes.dark : palettes.light;
}

// Web: RN Web holds onPressIn back 50 ms and drops it on a faster tap, so press-in with no delay
// (keyboard Enter/Space also arrives as press-in there). Native: onPress, so screen-reader
// activation works and a touch that turns into the back swipe types nothing.
// One handler per platform: wiring both would fire twice. delayPressIn is web-only, hence the spread.
export function tapProps(handler: () => void): { onPress?: () => void; onPressIn?: () => void } {
  return Platform.OS === 'web' ? { onPressIn: handler, ...{ delayPressIn: 0 } } : { onPress: handler };
}
