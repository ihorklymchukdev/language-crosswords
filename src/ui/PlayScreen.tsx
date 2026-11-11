import { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lettersMatch } from '../play/matching';
import { activeSlot, displayLetter, type PlayState } from '../play/play-state';
import type { Puzzle } from '../play/puzzle';
import { usePlay } from '../play/usePlay';
import { CLUE_BAR_MIN_HEIGHT, ClueBar, ClueBarSizer } from './ClueBar';
import { ClueList } from './ClueList';
import { CompletionCard, type CardAction } from './CompletionCard';
import { formatTime } from './format';
import { GRID_GAP, GRID_PAD, Grid, gridExtent } from './Grid';
import { Keyboard } from './Keyboard';
import { Header, ScreenFrame, goBack } from './ScreenFrame';
import { MAX_CONTENT_WIDTH, MIN_TOUCH, radius, space, usePalette, type Palette } from './theme';

const MAX_GRID_WIDTH = 420;
const MAX_CELL = 60;
// Below this much spare height the inline clue list would be a sliver; the Clues sheet covers it.
const MIN_INLINE_LIST = 150;
// Shorter windows get a tighter keyboard and spacing so the grid keeps a usable size.
const SHORT_SCREEN = 720;
const NO_CELLS: readonly number[] = [];

type Props = {
  puzzle: Puzzle;
  initial: PlayState;
  title: string;
  doneMessage: string;
  onChange: (s: PlayState) => void;
  onComplete: (s: PlayState) => void;
  // Daily offers "Play again"; practice offers "Next puzzle".
  onNext?: () => void;
};

type Area = { w: number; h: number };
type Fit = { cellSize: number; heightBound: boolean };

const fit = (extent: number, n: number) => (extent - GRID_PAD * 2 - (n - 1) * GRID_GAP) / n;

// The clue bar's tallest (translated) height is held back, so translating never pushes it off screen.
function fitGrid(area: Area, rows: number, cols: number, barHeight: number, gap: number): Fit {
  const byWidth = Math.min(fit(Math.min(area.w - space.l * 2, MAX_GRID_WIDTH), cols), MAX_CELL);
  const byHeight = fit(area.h - space.s - gap - barHeight, rows);
  return { cellSize: Math.max(16, Math.floor(Math.min(byWidth, byHeight))), heightBound: byHeight < byWidth };
}

export function PlayScreen({ puzzle, initial, title, doneMessage, onChange, onComplete, onNext }: Props) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const compact = useWindowDimensions().height < SHORT_SCREEN;
  const [cluesOpen, setCluesOpen] = useState(false);
  const [area, setArea] = useState<Area | undefined>(undefined);
  const [barHeight, setBarHeight] = useState<number | undefined>(undefined);
  const { state, dispatch, green } = usePlay({ puzzle, initial, onChange, onComplete, physicalKeys: !cluesOpen });
  const styles = useMemo(() => makeStyles(palette), [palette]);

  const complete = state.completedAt !== undefined;
  const slot = activeSlot(puzzle, state);
  const letters = useMemo(
    () => puzzle.solution.map((_, c) => displayLetter(puzzle, state, c, green)),
    // displayLetter reads only letters, revealed and green.
    [puzzle, state.letters, state.revealed, green],
  );
  const solved = useMemo(
    () =>
      puzzle.slots.map((s) =>
        s.cells.every((c) => {
          const typed = state.letters[c];
          const answer = puzzle.solution[c];
          return typed != null && answer != null && lettersMatch(typed, answer);
        }),
      ),
    [puzzle, state.letters],
  );

  const onSelect = useCallback((cell: number) => dispatch({ type: 'select', cell }), [dispatch]);
  const onLetter = useCallback((letter: string) => dispatch({ type: 'type', letter }), [dispatch]);
  const onBackspace = useCallback(() => dispatch({ type: 'backspace' }), [dispatch]);
  const onPrev = useCallback(() => dispatch({ type: 'nextSlot', delta: -1 }), [dispatch]);
  const onNextSlot = useCallback(() => dispatch({ type: 'nextSlot', delta: 1 }), [dispatch]);
  const onToggle = useCallback(() => dispatch({ type: 'toggleDirection' }), [dispatch]);
  const onFocusSlot = useCallback(
    (index: number) => {
      dispatch({ type: 'focusSlot', index });
      setCluesOpen(false);
    },
    [dispatch],
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea((a) => (a && a.w === width && a.h === height ? a : { w: width, h: height }));
  }, []);

  const { rows, cols } = puzzle.spec;
  const gap = compact ? space.s : space.m;
  const grid = area && barHeight !== undefined ? fitGrid(area, rows, cols, barHeight, gap) : undefined;
  const cellSize = grid?.cellSize ?? 0;
  // When height is what limits the grid, the bar keeps its tallest size so nothing shifts on Translate.
  const barMin = grid?.heightBound && barHeight !== undefined ? barHeight : CLUE_BAR_MIN_HEIGHT;
  const spare = area ? area.h - gridExtent(rows, cellSize) - barMin - space.s - gap * 2 : 0;
  const translated = slot !== undefined && state.translated.includes(slot.index);
  const cursorLocked = (green[state.cursor] ?? false) || (state.revealed[state.cursor] ?? false);
  const revealedCount = state.revealed.filter(Boolean).length;

  const cardActions: CardAction[] = onNext
    ? [
        { label: 'Done', onPress: goBack },
        { label: 'Next puzzle', onPress: onNext, primary: true },
      ]
    : [
        { label: 'Play again', onPress: () => dispatch({ type: 'reset' }) },
        { label: 'Done', onPress: goBack, primary: true },
      ];

  const clueList = (
    <ClueList
      slots={puzzle.slots}
      activeIndex={complete ? undefined : slot?.index}
      translated={state.translated}
      solved={solved}
      palette={palette}
      onSelect={onFocusSlot}
    />
  );

  return (
    <ScreenFrame padBottom={false}>
      <Header
        title={title}
        palette={palette}
        right={
          <>
            <Text style={styles.timer} accessibilityLabel={`Time ${formatTime(state.completedAt ?? state.elapsedMs)}`}>
              {formatTime(state.completedAt ?? state.elapsedMs)}
            </Text>
            <Pressable
              onPress={() => setCluesOpen(true)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
            >
              <Text style={styles.headerButtonText}>Clues</Text>
            </Pressable>
          </>
        }
      />

      <View style={[styles.middle, { gap }]} onLayout={onLayout}>
        {area && (
          <ClueBarSizer slots={puzzle.slots} width={area.w - space.l * 2} palette={palette} onHeight={setBarHeight} />
        )}
        {grid && (
          <>
            <Grid
              puzzle={puzzle}
              letters={letters}
              green={green}
              revealed={state.revealed}
              cursor={complete ? -1 : state.cursor}
              activeCells={complete ? NO_CELLS : (slot?.cells ?? NO_CELLS)}
              cellSize={cellSize}
              palette={palette}
              onSelect={onSelect}
            />
            <ClueBar
              slot={slot}
              translated={translated}
              minHeight={barMin}
              palette={palette}
              onPrev={onPrev}
              onNext={onNextSlot}
              onToggle={onToggle}
            />
            {spare >= MIN_INLINE_LIST && (
              <ScrollView
                style={styles.inlineList}
                contentContainerStyle={styles.inlineListContent}
                showsVerticalScrollIndicator={false}
              >
                {clueList}
              </ScrollView>
            )}
          </>
        )}
      </View>

      <View style={[styles.bottom, compact && styles.bottomCompact, { paddingBottom: insets.bottom + space.s }]}>
        {complete ? (
          <CompletionCard
            palette={palette}
            timeMs={state.completedAt ?? state.elapsedMs}
            revealed={revealedCount}
            translated={state.translated.length}
            message={doneMessage}
            actions={cardActions}
          />
        ) : (
          <>
            <View style={styles.actions}>
              <ActionButton
                label="Reveal letter"
                palette={palette}
                disabled={cursorLocked}
                onPress={() => dispatch({ type: 'reveal' })}
              />
              <ActionButton
                label={translated ? 'Translated' : 'Translate'}
                palette={palette}
                disabled={translated || slot === undefined}
                onPress={() => dispatch({ type: 'translate' })}
              />
              <ActionButton label="⇄" a11yLabel="Switch direction" palette={palette} narrow onPress={onToggle} />
            </View>
            <Keyboard palette={palette} compact={compact} onLetter={onLetter} onBackspace={onBackspace} />
          </>
        )}
      </View>

      <Modal visible={cluesOpen} transparent animationType="slide" onRequestClose={() => setCluesOpen(false)}>
        <View style={styles.sheetRoot}>
          <Pressable style={styles.backdrop} onPress={() => setCluesOpen(false)} accessibilityLabel="Close clues" />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + space.l }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Clues</Text>
              <Pressable
                onPress={() => setCluesOpen(false)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
              >
                <Text style={styles.headerButtonText}>Close</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.sheetContent}>{clueList}</ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenFrame>
  );
}

type ActionProps = {
  label: string;
  a11yLabel?: string;
  palette: Palette;
  disabled?: boolean;
  narrow?: boolean;
  onPress: () => void;
};

function ActionButton({ label, a11yLabel, palette, disabled = false, narrow = false, onPress }: ActionProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        actionStyles.button,
        narrow ? actionStyles.narrow : actionStyles.wide,
        { borderColor: palette.border, backgroundColor: pressed ? palette.border : palette.surface },
        disabled && actionStyles.disabled,
      ]}
    >
      <Text style={[actionStyles.text, { color: palette.text }, narrow && actionStyles.glyph]}>{label}</Text>
    </Pressable>
  );
}

const actionStyles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.m,
  },
  wide: { flex: 1 },
  narrow: { width: 64 },
  disabled: { opacity: 0.45 },
  text: { fontSize: 15, fontWeight: '600' },
  glyph: { fontSize: 20 },
});

function makeStyles(p: Palette) {
  return StyleSheet.create({
    timer: { color: p.textMuted, fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'], minWidth: 40 },
    headerButton: {
      minHeight: MIN_TOUCH,
      paddingHorizontal: space.m,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: p.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerButtonText: { color: p.text, fontSize: 14, fontWeight: '600' },
    pressed: { backgroundColor: p.surfaceAlt },
    middle: { flex: 1, paddingHorizontal: space.l, paddingTop: space.s, overflow: 'hidden' },
    inlineList: { flex: 1 },
    inlineListContent: { paddingBottom: space.l },
    bottom: {
      backgroundColor: p.surfaceAlt,
      paddingTop: space.m,
      paddingHorizontal: space.s,
      gap: space.m,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    bottomCompact: { paddingTop: space.s, gap: space.s },
    actions: { flexDirection: 'row', gap: space.s, paddingHorizontal: space.xs },
    sheetRoot: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.35)' },
    sheet: {
      maxHeight: '75%',
      width: '100%',
      maxWidth: MAX_CONTENT_WIDTH,
      alignSelf: 'center',
      backgroundColor: p.bg,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingTop: space.s,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: space.l,
      paddingVertical: space.s,
    },
    sheetTitle: { color: p.text, fontSize: 18, fontWeight: '700' },
    sheetContent: { paddingHorizontal: space.s, paddingBottom: space.s },
  });
}
