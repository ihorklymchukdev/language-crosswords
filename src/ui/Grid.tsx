import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Puzzle } from '../play/puzzle';
import { upper } from './format';
import { instantPressIn, radius, type Palette } from './theme';

export const GRID_GAP = 2;
export const GRID_PAD = 2;

type Tone = 'plain' | 'slot' | 'cursor';

type CellProps = {
  cell: number;
  row: number;
  col: number;
  letter: string;
  number: number | undefined;
  tone: Tone;
  green: boolean;
  revealed: boolean;
  size: number;
  palette: Palette;
  onSelect: (cell: number) => void;
};

const Cell = memo(function Cell({ cell, row, col, letter, number, tone, green, revealed, size, palette, onSelect }: CellProps) {
  // Green outranks the word tint so a finished word shows at once, even while it is selected.
  const bg =
    tone === 'cursor' ? palette.cursorTint : green ? palette.correctBg : tone === 'slot' ? palette.slotTint : palette.surface;
  const color = revealed ? palette.revealedText : green ? palette.correctText : palette.text;
  const state = green ? ', solved' : revealed ? ', revealed' : '';
  return (
    <Pressable
      onPressIn={() => onSelect(cell)}
      {...instantPressIn}
      accessibilityRole="button"
      accessibilityLabel={`Row ${row + 1}, column ${col + 1}${letter ? `, ${upper(letter)}` : ', empty'}${state}`}
      accessibilityState={{ selected: tone === 'cursor' }}
      style={[styles.cell, { width: size, height: size, backgroundColor: bg }]}
    >
      <View style={styles.letterBox} pointerEvents="none">
        <Text style={[styles.letter, { color, fontSize: Math.round(size * 0.54) }]} allowFontScaling={false}>
          {upper(letter)}
        </Text>
      </View>
      {number !== undefined && (
        <Text
          style={[styles.number, { color: palette.textMuted, fontSize: size < 40 ? 9 : 10 }]}
          allowFontScaling={false}
        >
          {number}
        </Text>
      )}
    </Pressable>
  );
});

type GridProps = {
  puzzle: Puzzle;
  letters: string[];
  green: boolean[];
  revealed: boolean[];
  cursor: number;
  activeCells: readonly number[];
  cellSize: number;
  palette: Palette;
  onSelect: (cell: number) => void;
};

export function gridExtent(count: number, cellSize: number): number {
  return count * cellSize + (count - 1) * GRID_GAP + GRID_PAD * 2;
}

export const Grid = memo(function Grid({
  puzzle,
  letters,
  green,
  revealed,
  cursor,
  activeCells,
  cellSize,
  palette,
  onSelect,
}: GridProps) {
  const { rows, cols } = puzzle.spec;
  const numbers = useMemo(() => {
    const m = new Map<number, number>();
    for (const s of puzzle.slots) m.set(s.cells[0]!, s.number);
    return m;
  }, [puzzle]);
  const active = useMemo(() => new Set(activeCells), [activeCells]);

  return (
    <View
      style={[styles.grid, { backgroundColor: palette.border, width: gridExtent(cols, cellSize) }]}
      accessibilityRole="grid"
    >
      {Array.from({ length: rows }, (_, r) => (
        <View key={r} style={styles.row}>
          {Array.from({ length: cols }, (_, c) => {
            const cell = r * cols + c;
            if (puzzle.solution[cell] == null) {
              return (
                <View
                  key={c}
                  style={[styles.cell, { width: cellSize, height: cellSize, backgroundColor: palette.block }]}
                />
              );
            }
            return (
              <Cell
                key={c}
                cell={cell}
                row={r}
                col={c}
                letter={letters[cell] ?? ''}
                number={numbers.get(cell)}
                tone={cell === cursor ? 'cursor' : active.has(cell) ? 'slot' : 'plain'}
                green={green[cell] ?? false}
                revealed={revealed[cell] ?? false}
                size={cellSize}
                palette={palette}
                onSelect={onSelect}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  grid: { padding: GRID_PAD, gap: GRID_GAP, borderRadius: radius.cell + 2, alignSelf: 'center', userSelect: 'none' },
  row: { flexDirection: 'row', gap: GRID_GAP },
  cell: { borderRadius: radius.cell, overflow: 'hidden' },
  letterBox: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  letter: { textAlign: 'center', fontWeight: '700', includeFontPadding: false },
  number: { alignSelf: 'flex-start', paddingHorizontal: 3, paddingTop: 1, fontWeight: '600', lineHeight: 12 },
});
