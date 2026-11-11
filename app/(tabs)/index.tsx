import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { dailyPuzzleId, getDailySpec } from '../../src/daily/daily';
import { LEVEL_NAMES, type Level } from '../../src/domain/levels';
import { getThemes } from '../../src/catalogue/catalogue';
import {
  latestUnfinishedPractice,
  missedDailies,
  streakLine,
  todaysDailies,
  type DailyRef,
  type DailyStatus,
} from '../../src/home/today';
import { useLocalToday } from '../../src/home/useLocalToday';
import { useProgress } from '../../src/progress/progress-context';
import { currentStreak } from '../../src/progress/streak';
import { useHydrated } from '../../src/ui/useHydrated';
import { formatLongDate, formatShortDate, formatTime } from '../../src/ui/format';
import { NewPuzzleSheet } from '../../src/ui/NewPuzzleSheet';
import { Card, LinkRow, SectionLabel, TabPage } from '../../src/ui/Page';
import { MIN_TOUCH, radius, space, usePalette, type Palette } from '../../src/ui/theme';

const STATUS_LABEL: Record<DailyStatus, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  solved: 'Solved ✓',
};

function openDaily(date: string, level: Level) {
  router.push({ pathname: '/puzzle/daily/[level]/[date]', params: { level, date } });
}

function openPractice(params: { level: Level; id?: string }) {
  router.push({ pathname: '/puzzle/practice/[level]', params });
}

export default function TodayScreen() {
  const palette = usePalette();
  const today = useLocalToday();
  const hydrated = useHydrated();
  const { state, ready } = useProgress();
  const [sheetOpen, setSheetOpen] = useState(false);

  const { cards, missed, streak } = useMemo(() => {
    // A daily that was opened keeps its stored spec, so it stays playable even if lookup fails.
    const hasSpec = (date: string, level: Level) =>
      state.plays[dailyPuzzleId(date, level)] !== undefined || getDailySpec(date, level) !== undefined;
    return {
      cards: todaysDailies(today, state.dailyCompletions, state.plays, hasSpec),
      missed: missedDailies(today, state.dailyCompletions, state.plays, hasSpec),
      streak: currentStreak(state.dailyCompletions, today),
    };
  }, [today, state.dailyCompletions, state.plays]);
  const unfinished = useMemo(() => latestUnfinishedPractice(state.plays), [state.plays]);
  const unfinishedTheme = getThemes().find((t) => t.id === unfinished?.spec.themeId)?.nameEn;

  const solvedToday = cards.some((c) => c.status === 'solved');

  return (
    // The static HTML was rendered on another day; a non-breaking space keeps the heading's height.
    <TabPage eyebrow="Today" title={hydrated ? formatLongDate(today) : '\u00a0'}>
      {!ready ? (
        <ActivityIndicator color={palette.accent} accessibilityLabel="Loading" style={styles.loading} />
      ) : (
        <>
          <View style={styles.streakRow}>
            <View style={[styles.streakMark, { backgroundColor: streak > 0 ? palette.accent : palette.border }]} />
            <Text style={[styles.streak, { color: streak > 0 ? palette.text : palette.textMuted }]}>
              {streakLine(streak, solvedToday)}
            </Text>
          </View>

          <View style={styles.cards}>
            {cards.map((ref) => (
              <DailyCard key={ref.level} daily={ref} palette={palette} />
            ))}
            {cards.length === 0 && (
              <Text style={[styles.note, { color: palette.textMuted }]}>
                No daily crossword today. Practice is always open.
              </Text>
            )}
          </View>

          <View style={styles.playButtons}>
            {unfinished && (
              <Pressable
                onPress={() => openPractice({ level: unfinished.spec.level, id: unfinished.spec.id })}
                accessibilityRole="button"
                style={({ pressed }) => [styles.bigButton, { backgroundColor: palette.accent }, pressed && styles.dimmed]}
              >
                <Text style={[styles.bigButtonText, { color: palette.accentText }]}>Continue</Text>
                <Text style={[styles.bigButtonDetail, { color: palette.accentText }]}>
                  {[formatTime(unfinished.elapsedMs), unfinished.spec.level, unfinishedTheme].filter(Boolean).join(' · ')}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => setSheetOpen(true)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.bigButton,
                unfinished
                  ? { backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1 }
                  : { backgroundColor: palette.accent },
                pressed && styles.dimmed,
              ]}
            >
              <Text style={[styles.bigButtonText, { color: unfinished ? palette.text : palette.accentText }]}>
                New crossword
              </Text>
            </Pressable>
          </View>

          {missed.length > 0 && (
            <View style={styles.missed}>
              <SectionLabel>Missed</SectionLabel>
              <Card>
                {missed.map((m, i) => (
                  <LinkRow
                    key={`${m.date}-${m.level}`}
                    first={i === 0}
                    label={`${formatShortDate(m.date)} · ${m.level}`}
                    detail={m.status === 'in-progress' ? 'In progress' : undefined}
                    onPress={() => openDaily(m.date, m.level)}
                  />
                ))}
              </Card>
              <Text style={[styles.note, { color: palette.textMuted }]}>
                Catching up is welcome. Only today's puzzles add to your streak.
              </Text>
            </View>
          )}
        </>
      )}
      <NewPuzzleSheet
        visible={sheetOpen}
        onPick={(level) => {
          setSheetOpen(false);
          openPractice({ level });
        }}
        onThemes={() => {
          setSheetOpen(false);
          router.push('/practice');
        }}
        onClose={() => setSheetOpen(false)}
      />
    </TabPage>
  );
}

function DailyCard({ daily, palette }: { daily: DailyRef; palette: Palette }) {
  const solved = daily.status === 'solved';
  const statusColor =
    daily.status === 'solved' ? palette.correctText : daily.status === 'in-progress' ? palette.accent : palette.textMuted;
  return (
    <Pressable
      onPress={() => openDaily(daily.date, daily.level)}
      accessibilityRole="button"
      accessibilityLabel={`${daily.level} ${LEVEL_NAMES[daily.level]} daily, ${STATUS_LABEL[daily.status]}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: palette.surface, borderColor: palette.border },
        pressed && { backgroundColor: palette.surfaceAlt },
      ]}
    >
      <View
        style={[
          styles.badge,
          solved
            ? { backgroundColor: palette.correctBg, borderColor: palette.correctBg }
            : { backgroundColor: palette.surfaceAlt, borderColor: palette.border },
        ]}
      >
        <Text style={[styles.badgeText, { color: solved ? palette.correctText : palette.text }]}>{daily.level}</Text>
      </View>
      <View style={styles.cardText}>
        <Text style={[styles.cardTitle, { color: palette.text }]}>{LEVEL_NAMES[daily.level]}</Text>
        <Text style={[styles.cardStatus, { color: statusColor }]}>{STATUS_LABEL[daily.status]}</Text>
      </View>
      <Text style={[styles.chevron, { color: palette.textMuted }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: space.xxl },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: space.s, marginTop: -space.s },
  streakMark: { width: 8, height: 8, borderRadius: 2 },
  streak: { fontSize: 15, fontWeight: '600' },
  cards: { gap: space.m },
  card: {
    minHeight: MIN_TOUCH + 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.l,
    padding: space.l,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: radius.cell + 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  cardText: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 17, fontWeight: '600' },
  cardStatus: { fontSize: 14, fontWeight: '500' },
  chevron: { fontSize: 26, lineHeight: 28, fontWeight: '300' },
  playButtons: { gap: space.m },
  bigButton: {
    minHeight: MIN_TOUCH + 16,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.s,
  },
  bigButtonText: { fontSize: 18, fontWeight: '700' },
  bigButtonDetail: { fontSize: 13, fontWeight: '500', opacity: 0.9, fontVariant: ['tabular-nums'] },
  dimmed: { opacity: 0.85 },
  missed: { gap: space.m },
  note: { fontSize: 13, lineHeight: 18 },
});
