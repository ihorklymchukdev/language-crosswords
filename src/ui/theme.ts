import { useColorScheme } from 'react-native';

export type Palette = {
  scheme: 'light' | 'dark';
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  block: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  slotTint: string;
  cursorTint: string;
  correctBg: string;
  correctText: string;
  revealedText: string;
};

export const palettes: Record<'light' | 'dark', Palette> = {
  light: {
    scheme: 'light',
    bg: '#FBF7F0',
    surface: '#FFFFFF',
    surfaceAlt: '#F2ECE2',
    border: '#D9D0C3',
    block: '#2B2F38',
    text: '#1F2430',
    textMuted: '#6B6F7A',
    accent: '#C8553D',
    accentText: '#FFFFFF',
    slotTint: '#F6E1D7',
    cursorTint: '#EDB8A3',
    correctBg: '#DDF1E3',
    correctText: '#237A45',
    revealedText: '#8A5A00',
  },
  dark: {
    scheme: 'dark',
    bg: '#14161B',
    surface: '#1F232B',
    surfaceAlt: '#191C22',
    border: '#343A45',
    block: '#0B0C0F',
    text: '#F2EEE6',
    textMuted: '#9AA0AB',
    accent: '#F08A5D',
    accentText: '#14161B',
    slotTint: '#3A2A24',
    cursorTint: '#6B3D2B',
    correctBg: '#1E3A2A',
    correctText: '#6FD69A',
    revealedText: '#E6B450',
  },
};

export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;
export const radius = { card: 10, cell: 4 } as const;
export const MAX_CONTENT_WIDTH = 480;
export const MIN_TOUCH = 44;

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? palettes.dark : palettes.light;
}

// RN Web holds onPressIn back 50 ms and drops it for a faster tap; native fires it at once.
// The prop is web-only, hence passed by spread.
export const instantPressIn = { delayPressIn: 0 };
