import type { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'back'
  | 'forward'
  | 'play'
  | 'plus'
  | 'clock'
  | 'list'
  | 'bulb'
  | 'translate'
  | 'swap'
  | 'backspace'
  | 'check'
  | 'today'
  | 'practice'
  | 'about';

type Props = { name: IconName; size?: number; color: ColorValue; strokeWidth?: number };

export function Icon({ name, size = 18, color, strokeWidth = 2.2 }: Props) {
  const stroke = { stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden pointerEvents="none">
      {glyph(name, color, stroke)}
    </Svg>
  );
}

// Two-tone filled flame for the streak pill; viewBox is taller than the stroke icons.
export function FlameIcon({ size, outer, inner }: { size: number; outer: ColorValue; inner: ColorValue }) {
  return (
    <Svg width={size} height={(size * 28) / 24} viewBox="0 0 24 28" aria-hidden pointerEvents="none">
      <Path d="M12 1c1.2 5 7 8 7 15a7 7 0 0 1-14 0c0-2.6 1.1-4.5 2.6-6 .4 2.3 1.7 3.5 2.9 3.8C9.8 9.5 10.5 4.5 12 1z" fill={outer} />
      <Path d="M12 14c.6 2 2.6 3 2.6 5.6a2.6 2.6 0 0 1-5.2 0c0-2.2 1.8-3.4 2.6-5.6z" fill={inner} />
    </Svg>
  );
}

type Stroke = { stroke: ColorValue; strokeWidth: number; strokeLinecap: 'round'; strokeLinejoin: 'round'; fill: 'none' };

function glyph(name: IconName, color: ColorValue, s: Stroke) {
  switch (name) {
    case 'back':
      return <Path d="M15 6l-6 6 6 6" {...s} />;
    case 'forward':
      return <Path d="M9 6l6 6-6 6" {...s} />;
    case 'play':
      return <Path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" fill={color} />;
    case 'plus':
      return <Path d="M12 5v14M5 12h14" {...s} />;
    case 'clock':
      return (
        <>
          <Circle cx="12" cy="13" r="7.5" {...s} />
          <Path d="M12 9v4l2.5 1.5M10 3h4" {...s} />
        </>
      );
    case 'list':
      return <Path d="M5 7h14M5 12h14M5 17h9" {...s} />;
    case 'bulb':
      return (
        <Path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" {...s} />
      );
    case 'translate':
      return <Path d="M4 6h9M8.5 4v2M11 6c-.8 3.5-3.2 6.2-6.5 7.5M6.5 9.5c1 1.8 2.6 3.2 4.5 4M12.5 20l4-9 4 9M14 17h5" {...s} />;
    case 'swap':
      return <Path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" {...s} />;
    case 'backspace':
      return <Path d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7 6-7zM12 9.5l5 5M17 9.5l-5 5" {...s} />;
    case 'check':
      return <Path d="M5 12.5l4.5 4.5L19 7.5" {...s} />;
    case 'today':
      return (
        <>
          <Rect x="4" y="5" width="16" height="15" rx="3" {...s} />
          <Path d="M4 10h16M9 3v4M15 3v4" {...s} />
        </>
      );
    case 'practice':
      return (
        <>
          <Rect x="4" y="4" width="7" height="7" rx="1.5" {...s} />
          <Rect x="13" y="4" width="7" height="7" rx="1.5" {...s} />
          <Rect x="4" y="13" width="7" height="7" rx="1.5" {...s} />
          <Rect x="13" y="13" width="7" height="7" rx="1.5" {...s} />
        </>
      );
    case 'about':
      return (
        <>
          <Circle cx="12" cy="12" r="8.5" {...s} />
          <Path d="M12 11v5M12 7.8v.2" {...s} />
        </>
      );
  }
}
