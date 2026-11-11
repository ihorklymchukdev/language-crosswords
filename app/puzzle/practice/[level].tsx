import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getThemes } from '../../../src/catalogue/catalogue';
import type { RejectReason } from '../../../src/generator/generate';
import { initialPlayState, type PlayState } from '../../../src/play/play-state';
import { resolvePuzzle, type Puzzle } from '../../../src/play/puzzle';
import { restorePlay } from '../../../src/play/restore';
import { parseLevel, parseString } from '../../../src/play/route-params';
import { makePracticeSpec } from '../../../src/practice/practice';
import { useProgress } from '../../../src/progress/progress-context';
import { PlayScreen } from '../../../src/ui/PlayScreen';
import { MessageScreen, goBack } from '../../../src/ui/ScreenFrame';

type Session = { puzzle: Puzzle; initial: PlayState } | { reason: RejectReason };

const newSeed = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export default function PracticePuzzleScreen() {
  const params = useLocalSearchParams<{ level: string; theme?: string; id?: string }>();
  const level = parseLevel(params.level);
  const { state, ready, savePlay, recordPractice } = useProgress();
  const latest = useRef(state);
  latest.current = state;
  const [theme, setTheme] = useState(() => parseString(params.theme));
  const [session, setSession] = useState<Session | undefined>(undefined);

  const create = useCallback(
    (themeId: string | undefined) => {
      if (!level) return;
      const spec = makePracticeSpec(level, themeId, latest.current.practiceHistory[level], newSeed());
      const puzzle = 'reason' in spec ? undefined : resolvePuzzle(spec);
      if (!puzzle) {
        setSession({ reason: 'reason' in spec ? spec.reason : 'quality-gate-failed' });
        return;
      }
      setSession({ puzzle, initial: initialPlayState(puzzle) });
      // The id in the URL lets a reload resume this exact puzzle.
      router.setParams({ id: puzzle.spec.id, theme: themeId });
    },
    [level],
  );

  const started = useRef(false);
  useEffect(() => {
    if (!ready || !level || started.current) return;
    started.current = true;
    const id = parseString(params.id);
    const stored = id === undefined ? undefined : latest.current.plays[id];
    if (stored?.spec.kind === 'practice' && stored.spec.level === level) {
      const puzzle = resolvePuzzle(stored.spec);
      if (puzzle) {
        setTheme(stored.spec.themeId);
        setSession({ puzzle, initial: restorePlay(puzzle, stored) });
        return;
      }
    }
    create(theme);
  }, [ready, level, params.id, theme, create]);

  const puzzle = session && 'puzzle' in session ? session.puzzle : undefined;
  const onChange = useCallback(
    (play: PlayState) => {
      if (puzzle) savePlay(puzzle.spec.id, { ...play, spec: puzzle.spec });
    },
    [puzzle, savePlay],
  );
  const onComplete = useCallback(() => {
    if (puzzle) recordPractice(puzzle.spec.level, puzzle.spec.placements.map((p) => p.entryId));
  }, [puzzle, recordPractice]);
  const onNext = useCallback(() => create(theme), [create, theme]);

  if (!level) {
    return (
      <MessageScreen
        title="Practice"
        heading="This puzzle isn't available"
        body="Pick a level from the Practice tab to start a new crossword."
        actions={[{ label: 'Back', onPress: goBack }]}
      />
    );
  }
  if (session === undefined) return <MessageScreen title="Practice" loading />;
  if ('reason' in session) {
    const narrow = session.reason === 'theme-too-narrow' && theme !== undefined;
    return narrow ? (
      <MessageScreen
        title="Practice"
        heading="Not enough words here yet"
        body={`This theme doesn't have enough ${level} words for a crossword. Any theme works right away.`}
        actions={[
          {
            label: 'Any theme',
            onPress: () => {
              setTheme(undefined);
              create(undefined);
            },
          },
          { label: 'Back', onPress: goBack },
        ]}
      />
    ) : (
      <MessageScreen
        title="Practice"
        heading="That grid didn't come together"
        body="It happens now and then. A fresh try usually works."
        actions={[
          { label: 'Try again', onPress: () => create(theme) },
          { label: 'Back', onPress: goBack },
        ]}
      />
    );
  }

  const themeName = getThemes().find((t) => t.id === session.puzzle.spec.themeId)?.nameEn;
  return (
    <PlayScreen
      key={session.puzzle.spec.id}
      puzzle={session.puzzle}
      initial={session.initial}
      title={themeName ?? 'Practice'}
      badge={level}
      doneMessage={themeName ? `${themeName} practice, solved.` : `${level} practice, solved.`}
      onChange={onChange}
      onComplete={onComplete}
      onNext={onNext}
    />
  );
}
