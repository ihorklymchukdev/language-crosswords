import { useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { dailyPuzzleId, getDailySpec } from '../../../../src/daily/daily';
import { localDateKey } from '../../../../src/daily/dates';
import type { PlayState } from '../../../../src/play/play-state';
import { resolvePuzzle } from '../../../../src/play/puzzle';
import { restorePlay } from '../../../../src/play/restore';
import { parseDateKey, parseLevel } from '../../../../src/play/route-params';
import { useProgress } from '../../../../src/progress/progress-context';
import { formatDayMonth } from '../../../../src/ui/format';
import { PlayScreen } from '../../../../src/ui/PlayScreen';
import { MessageScreen, goBack } from '../../../../src/ui/ScreenFrame';

export default function DailyPuzzleScreen() {
  const params = useLocalSearchParams<{ level: string; date: string }>();
  const level = parseLevel(params.level);
  const date = parseDateKey(params.date);
  const { state, ready, savePlay, recordDailyCompletion } = useProgress();

  // Read the stored play once: a daily that was ever opened keeps its stored spec, and later saves
  // from this screen must not restart the session.
  const session = useMemo(() => {
    if (!ready) return undefined;
    if (!level || !date) return null;
    const stored = state.plays[dailyPuzzleId(date, level)];
    const spec = stored?.spec.kind === 'daily' ? stored.spec : getDailySpec(date, level);
    const puzzle = spec && resolvePuzzle(spec);
    if (!puzzle) return null;
    return { puzzle, initial: restorePlay(puzzle, stored) };
  }, [ready, level, date]);

  const onChange = useCallback(
    (play: PlayState) => {
      if (session) savePlay(session.puzzle.spec.id, { ...play, spec: session.puzzle.spec });
    },
    [session, savePlay],
  );
  const onComplete = useCallback(() => {
    if (level && date) recordDailyCompletion({ date, level, completedOn: localDateKey() });
  }, [level, date, recordDailyCompletion]);

  if (session === undefined) return <MessageScreen title="Daily" loading />;
  if (session === null || !level || !date) {
    return (
      <MessageScreen
        title="Daily"
        heading="This puzzle isn't available"
        body="There's no daily crossword for this day and level. Today's puzzles are waiting on the home screen."
        actions={[{ label: 'Back', onPress: goBack }]}
      />
    );
  }

  return (
    <PlayScreen
      key={session.puzzle.spec.id}
      puzzle={session.puzzle}
      initial={session.initial}
      title={`Daily · ${formatDayMonth(date)}`}
      badge={level}
      doneMessage={`You solved the ${level} daily for ${formatDayMonth(date)}.`}
      onChange={onChange}
      onComplete={onComplete}
    />
  );
}
