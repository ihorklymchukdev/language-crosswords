import { Platform, useColorScheme } from 'react-native';
import type { Level } from '../domain/levels';
import { useHydrated } from './useHydrated';

export type Gradient = readonly string[];
type Tint = { bg: string; text: string };

export type Palette = {
  scheme: 'light' | 'dark';
  // Solid stand-in for the gradient: under the tab bar's rounded corners and behind the web page.
  bg: string;
  // Top-to-bottom screen background, stops at BACKDROP_STOPS.
  backdrop: Gradient;
  // Translucent cards that sit on the backdrop.
  glass: string;
  glassBorder: string;
  glassShadow: string;
  // Modal sheets, and the rows and pressed states inside them.
  sheet: string;
  surface: string;
  // The keyboard panel; keys and action buttons sit on it in `raised`.
  panel: string;
  raised: string;
  tabBar: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  accentTint: string;
  // Accent-coloured text and icons that sit on `accentTint` or `bg`.
  accentStrong: string;
  // Main call to action (Continue, Play, the picked theme).
  hero: Gradient;
  heroShadow: string;
  inverseText: string;
  inverseMuted: string;
  streakBg: string;
  flameOuter: string;
  flameInner: string;
  level: Record<Level, Tint>;
  segment: string;
  cell: string;
  slotTint: string;
  cursorText: string;
  keyAlt: string;
  correctBg: string;
  correctText: string;
  revealedText: string;
};

export const BACKDROP_STOPS = [0, 0.24, 0.52, 1] as const;

export const palettes: Record<'light' | 'dark', Palette> = {
  light: {
    scheme: 'light',
    bg: '#ECEAFB',
    backdrop: ['#B9D5FB', '#DCE9FD', '#EEF2FD', '#ECEAFB'],
    glass: 'rgba(255,255,255,0.66)',
    glassBorder: 'rgba(255,255,255,0.9)',
    glassShadow: '0px 8px 24px rgba(70,90,170,0.10)',
    sheet: '#F7F8FE',
    surface: '#E9EDFB',
    panel: 'rgba(255,255,255,0.56)',
    raised: '#FFFFFF',
    tabBar: '#FAF9FE',
    border: '#DDE2F2',
    text: '#0E1220',
    textMuted: '#3D4663',
    accent: '#2F5BEA',
    accentText: '#FFFFFF',
    accentTint: '#CFE1FC',
    accentStrong: '#1A3FA8',
    hero: ['#131831', '#1A2150', '#3B2F8F'],
    heroShadow: '0px 10px 24px rgba(26,33,80,0.30)',
    inverseText: '#FFFFFF',
    inverseMuted: '#C9CEE6',
    streakBg: '#2B3A73',
    flameOuter: '#FF8A1F',
    flameInner: '#FFD15C',
    level: {
      A2: { bg: '#C9EFD8', text: '#0B6B3A' },
      B1: { bg: '#CFE1FC', text: '#1A3FA8' },
      B2: { bg: '#DCD6FA', text: '#3A22A0' },
    },
    segment: 'rgba(255,255,255,0.5)',
    cell: 'rgba(255,255,255,0.84)',
    slotTint: '#B7CBFF',
    cursorText: '#FFFFFF',
    keyAlt: '#CDD1D9',
    correctBg: '#D7F2E1',
    correctText: '#17703D',
    revealedText: '#804C00',
  },
  dark: {
    scheme: 'dark',
    bg: '#15132A',
    backdrop: ['#13213F', '#111A33', '#0F1529', '#15132A'],
    glass: 'rgba(255,255,255,0.07)',
    glassBorder: 'rgba(255,255,255,0.10)',
    glassShadow: '0px 8px 24px rgba(0,0,0,0.25)',
    sheet: '#161B2E',
    surface: '#222943',
    panel: 'rgba(255,255,255,0.05)',
    raised: '#2A3150',
    tabBar: '#1A1830',
    border: '#2C3452',
    text: '#F2F4FA',
    textMuted: '#A5ADC6',
    accent: '#5B82FF',
    accentText: '#0E1116',
    accentTint: '#22305C',
    accentStrong: '#A9BEFF',
    hero: ['#2D45B8', '#3A3CB0', '#5A3FC4'],
    heroShadow: '0px 10px 24px rgba(0,0,0,0.35)',
    inverseText: '#FFFFFF',
    inverseMuted: '#D3D8F0',
    streakBg: '#2B3A73',
    flameOuter: '#FF8A1F',
    flameInner: '#FFD15C',
    level: {
      A2: { bg: '#163824', text: '#6FD69A' },
      B1: { bg: '#22305C', text: '#A9BEFF' },
      B2: { bg: '#2E2560', text: '#C6B9FF' },
    },
    segment: 'rgba(255,255,255,0.06)',
    cell: 'rgba(255,255,255,0.12)',
    slotTint: '#2D427E',
    cursorText: '#0E1116',
    keyAlt: '#3A425F',
    correctBg: '#163824',
    correctText: '#6FD69A',
    revealedText: '#E6B450',
  },
};

// Custom fonts carry their weight in the family name; fontWeight would make Android fall back.
// Web gets a CSS fallback stack in case the font files fail to load.
const family = (name: string) => (Platform.OS === 'web' ? `${name}, system-ui, sans-serif` : name);

export const font = {
  regular: family('Onest_400Regular'),
  medium: family('Onest_500Medium'),
  semibold: family('Onest_600SemiBold'),
  bold: family('Onest_700Bold'),
  displaySemibold: family('Gabarito_600SemiBold'),
  display: family('Gabarito_700Bold'),
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

export function glass(p: Palette) {
  return { backgroundColor: p.glass, borderWidth: 1, borderColor: p.glassBorder, boxShadow: p.glassShadow } as const;
}
