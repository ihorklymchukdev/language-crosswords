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
import { Icon, type IconName } from './Icon';
import { Header, ScreenFrame, goBack } from './ScreenFrame';
import { MAX_CONTENT_WIDTH, MIN_TOUCH, font, radius, space, usePalette, type Palette } from './theme';

const MAX_GRID_WIDTH = MAX_CONTENT_WIDTH;
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
  badge?: string;
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
// The grid runs edge to edge; only the clue bar and list are inset.
function fitGrid(area: Area, rows: number, cols: number, barHeight: number, gap: number): Fit {
  const byWidth = Math.min(fit(Math.min(area.w, MAX_GRID_WIDTH), cols), MAX_CELL);
  const byHeight = fit(area.h - space.s - gap - barHeight, rows);
  return { cellSize: Math.max(16, Math.floor(Math.min(byWidth, byHeight))), heightBound: byHeight < byWidth };
}

export function PlayScreen({ puzzle, initial, title, badge, doneMessage, onChange, onComplete, onNext }: Props) {
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
        badge={badge}
        palette={palette}
        right={
          <>
            <View style={styles.timer} accessible accessibilityLabel={`Time ${formatTime(state.completedAt ?? state.elapsedMs)}`}>
              <Icon name="clock" size={16} color={palette.textMuted} />
              <Text style={styles.timerText}>{formatTime(state.completedAt ?? state.elapsedMs)}</Text>
            </View>
            <Pressable
              onPress={() => setCluesOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Clues"
              style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
            >
              <Icon name="list" size={16} color={palette.text} />
              <Text style={styles.headerButtonText}>Clues</Text>
            </Pressable>
          </>
        }
      />

      <View style={[styles.middle, { gap }]} onLayout={onLayout}>
        {area && (
          <ClueBarSizer slots={puzzle.slots} width={area.w - INSET * 2} palette={palette} onHeight={setBarHeight} />
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
            <View style={styles.inset}>
              <ClueBar
                slot={slot}
                translated={translated}
                minHeight={barMin}
                palette={palette}
                onPrev={onPrev}
                onNext={onNextSlot}
                onToggle={onToggle}
              />
            </View>
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
                icon="bulb"
                palette={palette}
                disabled={cursorLocked}
                onPress={() => dispatch({ type: 'reveal' })}
              />
              <ActionButton
                label={translated ? 'Translated' : 'Translate'}
                icon="translate"
                palette={palette}
                disabled={translated || slot === undefined}
                onPress={() => dispatch({ type: 'translate' })}
              />
              <ActionButton icon="swap" a11yLabel="Switch direction" palette={palette} narrow onPress={onToggle} />
            </View>
            <Keyboard palette={palette} compact={compact} onLetter={onLetter} onBackspace={onBackspace} />
          </>
        )}
      </View>

      <Modal visible={cluesOpen} transparent animationType="slide" onRequestClose={() => setCluesOpen(false)}>
        <View style={styles.sheetRoot}>
          <Pressable style={styles.backdrop} onPress={() => setCluesOpen(false)} accessibilityLabel="Close clues" />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + space.l }]}>
            <View style={styles.grabber} />
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
  label?: string;
  icon: IconName;
  a11yLabel?: string;
  palette: Palette;
  disabled?: boolean;
  narrow?: boolean;
  onPress: () => void;
};

function ActionButton({ label, icon, a11yLabel, palette, disabled = false, narrow = false, onPress }: ActionProps) {
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
        { backgroundColor: pressed ? palette.keyAlt : palette.raised },
        disabled && actionStyles.disabled,
      ]}
    >
      <Icon name={icon} size={narrow ? 18 : 16} color={narrow ? palette.text : palette.accent} />
      {label !== undefined && <Text style={[actionStyles.text, { color: palette.text }]}>{label}</Text>}
    </Pressable>
  );
}

const actionStyles = StyleSheet.create({
  button: {
    height: MIN_TOUCH,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s,
    paddingHorizontal: space.m,
  },
  wide: { flex: 1 },
  narrow: { width: 52 },
  disabled: { opacity: 0.45 },
  text: { fontFamily: font.semibold, fontSize: 14 },
});

const INSET = space.l;

function makeStyles(p: Palette) {
  return StyleSheet.create({
    timer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    timerText: {
      color: p.textMuted,
      fontFamily: font.displaySemibold,
      fontSize: 15,
      fontVariant: ['tabular-nums'],
      minWidth: 34,
    },
    headerButton: {
      height: MIN_TOUCH,
      paddingHorizontal: space.l,
      borderRadius: MIN_TOUCH / 2,
      backgroundColor: p.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.s,
    },
    headerButtonText: { color: p.text, fontFamily: font.semibold, fontSize: 14 },
    pressed: { backgroundColor: p.border },
    middle: { flex: 1, paddingTop: space.xs, overflow: 'hidden' },
    inset: { paddingHorizontal: INSET },
    inlineList: { flex: 1, paddingHorizontal: INSET - space.s },
    inlineListContent: { paddingBottom: space.l },
    bottom: {
      backgroundColor: p.panel,
      paddingTop: space.m,
      paddingHorizontal: space.s,
      gap: space.s,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
    },
    bottomCompact: { paddingTop: space.s, gap: 6 },
    actions: { flexDirection: 'row', gap: space.s, paddingHorizontal: space.xs, paddingBottom: space.xs },
    sheetRoot: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(16,19,25,0.4)' },
    sheet: {
      maxHeight: '75%',
      width: '100%',
      maxWidth: MAX_CONTENT_WIDTH,
      alignSelf: 'center',
      backgroundColor: p.bg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: space.s,
    },
    grabber: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', backgroundColor: p.border },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: space.l + 4,
      paddingVertical: space.s,
    },
    sheetTitle: { color: p.text, fontFamily: font.display, fontSize: 22, letterSpacing: -0.3 },
    sheetContent: { paddingHorizontal: space.s, paddingBottom: space.s },
  });
}
