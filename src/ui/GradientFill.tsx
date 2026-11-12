import { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { BACKDROP_STOPS, type Gradient, type Palette } from './theme';

type Props = {
  colors: Gradient;
  stops?: readonly number[];
  direction?: 'vertical' | 'diagonal';
  radius?: number;
};

// Even stops unless given; 'diagonal' approximates the design's 105° CSS gradient.
export function GradientFill({ colors, stops, direction = 'vertical', radius = 0 }: Props) {
  // useId can contain characters that break url(#…) references on web.
  const id = `g${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;
  const end = direction === 'vertical' ? { x1: '0', y1: '0', x2: '0', y2: '1' } : { x1: '0', y1: '0.35', x2: '1', y2: '0.65' };
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none" aria-hidden>
      <Defs>
        <LinearGradient id={id} {...end}>
          {colors.map((c, i) => (
            <Stop key={i} offset={stops?.[i] ?? (colors.length > 1 ? i / (colors.length - 1) : 0)} stopColor={c} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" rx={radius} ry={radius} fill={`url(#${id})`} />
    </Svg>
  );
}

export function Backdrop({ palette }: { palette: Palette }) {
  return <GradientFill colors={palette.backdrop} stops={BACKDROP_STOPS} />;
}

export function HeroFill({ palette, radius }: { palette: Palette; radius: number }) {
  return <GradientFill colors={palette.hero} direction="diagonal" radius={radius} />;
}
