import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Slot } from '../play/puzzle';
import { MIN_TOUCH, radius, space, type Palette } from './theme';

export const CLUE_BAR_MIN_HEIGHT = 84;

export const directionLabel = (d: Slot['direction']) => (d === 'across' ? 'Across' : 'Down');

type Props = {
  slot: Slot | undefined;
  translated: boolean;
  palette: Palette;
  onPrev: () => void;
  onNext: () => void;
  onToggle: () => void;
};

export const ClueBar = memo(function ClueBar({ slot, translated, palette, onPrev, onNext, onToggle }: Props) {
  const chevron = (label: string, glyph: string, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [styles.chevron, pressed && { backgroundColor: palette.border }]}
    >
      <Text style={[styles.chevronText, { color: palette.textMuted }]}>{glyph}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.bar, { backgroundColor: palette.surfaceAlt }]}>
      {chevron('Previous clue', '‹', onPrev)}
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityHint="Switches between across and down"
        style={styles.body}
      >
        {slot && (
          <>
            <Text style={[styles.label, { color: palette.accent }]}>
              {slot.number} {directionLabel(slot.direction).toUpperCase()}
            </Text>
            <Text style={[styles.clue, { color: palette.text }]} numberOfLines={3}>
              {slot.entry.clue}
            </Text>
            {translated && (
              <Text style={[styles.translation, { color: palette.textMuted }]} numberOfLines={2}>
                {slot.entry.clueEn}
              </Text>
            )}
          </>
        )}
      </Pressable>
      {chevron('Next clue', '›', onNext)}
    </View>
  );
});

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: CLUE_BAR_MIN_HEIGHT,
    borderRadius: radius.card,
    paddingVertical: space.s,
  },
  chevron: {
    width: MIN_TOUCH - 4,
    height: MIN_TOUCH + 12,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronText: { fontSize: 30, lineHeight: 34, fontWeight: '300' },
  body: { flex: 1, paddingHorizontal: space.xs, justifyContent: 'center', minHeight: MIN_TOUCH },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 2 },
  clue: { fontSize: 16, lineHeight: 21, fontWeight: '500' },
  translation: { fontSize: 14, lineHeight: 19, fontStyle: 'italic', marginTop: 3 },
});
