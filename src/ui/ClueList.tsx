import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Direction } from '../domain/types';
import type { Slot } from '../play/puzzle';
import { directionLabel } from './ClueBar';
import { MIN_TOUCH, font, radius, space, type Palette } from './theme';

type Props = {
  slots: readonly Slot[];
  activeIndex: number | undefined;
  translated: readonly number[];
  solved: readonly boolean[];
  palette: Palette;
  onSelect: (index: number) => void;
};

const DIRECTIONS: readonly Direction[] = ['across', 'down'];

export const ClueList = memo(function ClueList({ slots, activeIndex, translated, solved, palette, onSelect }: Props) {
  return (
    <View style={styles.list}>
      {DIRECTIONS.map((d) => {
        const group = slots.filter((s) => s.direction === d);
        if (group.length === 0) return null;
        return (
          <View key={d}>
            <Text style={[styles.heading, { color: palette.textMuted }]}>{directionLabel(d).toUpperCase()}</Text>
            {group.map((s) => {
              const active = s.index === activeIndex;
              const done = solved[s.index] ?? false;
              return (
                <Pressable
                  key={s.index}
                  onPress={() => onSelect(s.index)}
                  accessibilityRole="button"
                  accessibilityLabel={`${s.number} ${directionLabel(d)}: ${s.entry.clue}${done ? ', solved' : ''}`}
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [
                    styles.item,
                    (active || pressed) && { backgroundColor: active ? palette.accentTint : palette.surface },
                  ]}
                >
                  <Text style={[styles.number, { color: done ? palette.correctText : palette.text }]}>{s.number}</Text>
                  <View style={styles.texts}>
                    <Text style={[styles.clue, { color: done ? palette.textMuted : palette.text }]}>{s.entry.clue}</Text>
                    {translated.includes(s.index) && (
                      <Text style={[styles.translation, { color: palette.textMuted }]}>{s.entry.clueEn}</Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  list: { gap: space.m },
  heading: { fontFamily: font.semibold, fontSize: 12, letterSpacing: 1, marginBottom: space.xs, paddingHorizontal: space.s },
  item: {
    flexDirection: 'row',
    gap: space.s,
    minHeight: MIN_TOUCH,
    paddingVertical: space.s,
    paddingHorizontal: space.s,
    borderRadius: radius.s,
  },
  number: { width: 24, fontFamily: font.display, fontSize: 15, lineHeight: 20, textAlign: 'right' },
  texts: { flex: 1 },
  clue: { fontFamily: font.regular, fontSize: 15, lineHeight: 20 },
  translation: { fontFamily: font.regular, fontSize: 13, lineHeight: 18, fontStyle: 'italic', marginTop: 2 },
});
