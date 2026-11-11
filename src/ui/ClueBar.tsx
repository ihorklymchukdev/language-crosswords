import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import type { Slot } from '../play/puzzle';
import { Icon, type IconName } from './Icon';
import { MIN_TOUCH, font, radius, space, type Palette } from './theme';

export const CLUE_BAR_MIN_HEIGHT = 68;

export const directionLabel = (d: Slot['direction']) => (d === 'across' ? 'Across' : 'Down');

type Props = {
  slot: Slot | undefined;
  translated: boolean;
  minHeight: number;
  palette: Palette;
  onPrev: () => void;
  onNext: () => void;
  onToggle: () => void;
};

export const ClueBar = memo(function ClueBar({ slot, translated, minHeight, palette, onPrev, onNext, onToggle }: Props) {
  const chevron = (label: string, icon: IconName, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [styles.chevron, pressed && { backgroundColor: palette.border }]}
    >
      <Icon name={icon} color={palette.textMuted} />
    </Pressable>
  );

  return (
    <View style={[styles.bar, { minHeight, backgroundColor: palette.surface }]}>
      {chevron('Previous clue', 'back', onPrev)}
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityHint="Switches between across and down"
        style={styles.body}
      >
        {slot && <ClueText slot={slot} translated={translated} palette={palette} />}
      </Pressable>
      {chevron('Next clue', 'forward', onNext)}
    </View>
  );
});

function ClueText({ slot, translated, palette }: { slot: Slot; translated: boolean; palette: Palette }) {
  return (
    <>
      <Text style={[styles.label, { color: palette.accentStrong }]}>
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
  );
}

type SizerProps = { slots: readonly Slot[]; width: number; palette: Palette; onHeight: (h: number) => void };

// Invisible, non-interactive copies of the bar, one per clue and all translated, laid side by side:
// the row's height is the tallest the bar can get in this puzzle at this width and font scale.
export const ClueBarSizer = memo(function ClueBarSizer({ slots, width, palette, onHeight }: SizerProps) {
  const onLayout = useCallback((e: LayoutChangeEvent) => onHeight(Math.ceil(e.nativeEvent.layout.height)), [onHeight]);
  return (
    <View
      style={[styles.sizer, { width: width * slots.length }]}
      onLayout={onLayout}
      pointerEvents="none"
      aria-hidden
    >
      {slots.map((slot) => (
        <View key={slot.index} style={[styles.bar, { width, minHeight: CLUE_BAR_MIN_HEIGHT }]}>
          <View style={styles.chevron} />
          <View style={styles.body}>
            <ClueText slot={slot} translated palette={palette} />
          </View>
          <View style={styles.chevron} />
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  sizer: { position: 'absolute', top: 0, left: 0, flexDirection: 'row', alignItems: 'flex-start', opacity: 0 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: radius.card,
    paddingVertical: space.s,
    paddingHorizontal: space.xs,
  },
  chevron: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0, justifyContent: 'center', minHeight: MIN_TOUCH },
  label: { fontFamily: font.bold, fontSize: 11, letterSpacing: 0.9, marginBottom: 3 },
  clue: { fontFamily: font.medium, fontSize: 15, lineHeight: 19 },
  translation: { fontFamily: font.regular, fontSize: 14, lineHeight: 19, fontStyle: 'italic', marginTop: 3 },
});
