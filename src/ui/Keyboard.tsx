import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { upper } from './format';
import { tapProps, radius, space, type Palette } from './theme';

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
export const KEY_HEIGHT = 46;
const KEY_GAP = 6;

type Props = {
  palette: Palette;
  onLetter: (letter: string) => void;
  onBackspace: () => void;
};

export const Keyboard = memo(function Keyboard({ palette, onLetter, onBackspace }: Props) {
  return (
    <View style={styles.keyboard}>
      {ROWS.map((row, i) => {
        const units = row.reduce((sum, k) => sum + (k === BACKSPACE ? BACKSPACE_UNITS : 1), 0);
        const side = (ROW_UNITS - units) / 2;
        return (
          <View key={i} style={styles.row}>
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
                    {
                      flex: isBack ? BACKSPACE_UNITS : 1,
                      backgroundColor: pressed ? palette.border : palette.surface,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.label, { color: palette.text }, isBack && styles.backLabel]}
                    allowFontScaling={false}
                  >
                    {isBack ? k : upper(k)}
                  </Text>
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
  row: { flexDirection: 'row', gap: KEY_GAP },
  key: {
    height: KEY_HEIGHT,
    minWidth: 0,
    borderRadius: radius.card - 2,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 19, fontWeight: '500' },
  backLabel: { fontSize: 20 },
});
