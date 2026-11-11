import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { upper } from './format';
import { Icon } from './Icon';
import { font, radius, space, tapProps, type Palette } from './theme';

const BACKSPACE = '⌫';
const ROWS: readonly (readonly string[])[] = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', BACKSPACE],
  ['á', 'é', 'í', 'ó', 'ú', 'ü'],
];
// Every row is laid out on the same 10-unit width so keys line up between rows.
const ROW_UNITS = 10;
const BACKSPACE_UNITS = 1.5;
const KEY_HEIGHT = 48;
const KEY_GAP = 6;
const COMPACT_KEY_HEIGHT = 40;
const COMPACT_KEY_GAP = 5;

type Props = {
  palette: Palette;
  compact: boolean;
  onLetter: (letter: string) => void;
  onBackspace: () => void;
};

export const Keyboard = memo(function Keyboard({ palette, compact, onLetter, onBackspace }: Props) {
  return (
    <View style={[styles.keyboard, compact && styles.keyboardCompact]}>
      {ROWS.map((row, i) => {
        const units = row.reduce((sum, k) => sum + (k === BACKSPACE ? BACKSPACE_UNITS : 1), 0);
        const side = (ROW_UNITS - units) / 2;
        return (
          <View key={i} style={[styles.row, compact && styles.rowCompact]}>
            {side > 0 && <View style={{ flex: side }} />}
            {row.map((k) => {
              const isBack = k === BACKSPACE;
              return (
                <Pressable
                  key={k}
                  {...tapProps(() => (isBack ? onBackspace() : onLetter(k)))}
                  accessibilityRole="button"
                  accessibilityLabel={isBack ? 'Delete' : upper(k)}
                  style={({ pressed }) => [
                    styles.key,
                    compact && styles.keyCompact,
                    {
                      flex: isBack ? BACKSPACE_UNITS : 1,
                      backgroundColor: pressed ? palette.keyAlt : isBack ? palette.keyAlt : palette.raised,
                    },
                  ]}
                >
                  {isBack ? (
                    <Icon name="backspace" size={22} strokeWidth={2} color={palette.text} />
                  ) : (
                    <Text style={[styles.label, { color: palette.text }]} allowFontScaling={false}>
                      {upper(k)}
                    </Text>
                  )}
                </Pressable>
              );
            })}
            {side > 0 && <View style={{ flex: side }} />}
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  keyboard: { gap: KEY_GAP + 2, paddingHorizontal: space.xs, userSelect: 'none' },
  keyboardCompact: { gap: COMPACT_KEY_GAP },
  row: { flexDirection: 'row', gap: KEY_GAP },
  rowCompact: { gap: COMPACT_KEY_GAP },
  key: {
    height: KEY_HEIGHT,
    minWidth: 0,
    borderRadius: radius.s,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#101319',
    shadowOpacity: 0.16,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  keyCompact: { height: COMPACT_KEY_HEIGHT },
  label: { fontFamily: font.medium, fontSize: 18 },
});
