import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { getThemes } from '../../src/catalogue/catalogue';
import { dailyPuzzleId, getDailySpec } from '../../src/daily/daily';
import { LEVEL_NAMES, type Level } from '../../src/domain/levels';
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
import { formatLongDate, formatShortDate, formatTime } from '../../src/ui/format';
import { Icon } from '../../src/ui/Icon';
import { NewPuzzleSheet } from '../../src/ui/NewPuzzleSheet';
import { Card, ContentColumn, LinkRow, SectionLabel, TabPage } from '../../src/ui/Page';
import { font, radius, space, usePalette, type Palette } from '../../src/ui/theme';
import { useHydrated } from '../../src/ui/useHydrated';

const STATUS_LABEL: Record<DailyStatus, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  solved: 'Solved',
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

  const streakPill = ready && (
    <View
      style={[styles.pill, { backgroundColor: palette.surface }]}
      accessible
      accessibilityLabel={streakLine(streak, solvedToday)}
    >
      <Icon name="flame" size={14} color={solvedToday ? palette.accent : palette.textMuted} />
      <Text style={[styles.pillText, { color: palette.textMuted }]}>
        {streak === 0 ? 'Start your streak today' : `${streak}-day streak`}
      </Text>
    </View>
  );

  const footer = ready && (
    <View style={[styles.footer, { backgroundColor: palette.bg }]}>
      <ContentColumn>
        <View style={styles.footerButtons}>
          {unfinished && (
            <Pressable
              onPress={() => openPractice({ level: unfinished.spec.level, id: unfinished.spec.id })}
              accessibilityRole="button"
              accessibilityLabel={`Continue ${[unfinished.spec.level, unfinishedTheme].filter(Boolean).join(' ')} crossword, ${formatTime(unfinished.elapsedMs)}`}
              style={({ pressed }) => [styles.continue, { backgroundColor: palette.inverse }, pressed && styles.pressed]}
            >
              <View style={[styles.playCircle, { backgroundColor: palette.accent }]}>
                <Icon name="play" size={16} color={palette.accentText} />
              </View>
              <View style={styles.continueText}>
                <Text style={[styles.continueTitle, { color: palette.inverseText }]}>Continue</Text>
                <Text style={[styles.continueDetail, { color: palette.inverseMuted }]} numberOfLines={1}>
                  {[unfinished.spec.level, unfinishedTheme ?? 'Any theme'].join(' · ')}
                </Text>
              </View>
              <Text style={[styles.continueTime, { color: palette.inverseText }]}>
                {formatTime(unfinished.elapsedMs)}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => setSheetOpen(true)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.newButton,
              { backgroundColor: unfinished ? palette.surface : palette.inverse },
              pressed && styles.pressed,
            ]}
          >
            <Icon name="plus" color={unfinished ? palette.text : palette.inverseText} />
            <Text style={[styles.newText, { color: unfinished ? palette.text : palette.inverseText }]}>New crossword</Text>
          </Pressable>
        </View>
      </ContentColumn>
    </View>
  );

  return (
    // The static HTML was rendered on another day; blank lines keep the heading's two-line height.
    <TabPage
      eyebrow="Today"
      eyebrowAside={streakPill}
      title={hydrated ? formatLongDate(today).replace(', ', ',\n') : ' \n '}
      footer={footer}
    >
      {!ready ? (
        <ActivityIndicator color={palette.accent} accessibilityLabel="Loading" style={styles.loading} />
      ) : (
        <>
          <View style={styles.section}>
            <SectionLabel>Daily crosswords</SectionLabel>
            {cards.map((ref) => (
              <DailyCard key={ref.level} daily={ref} palette={palette} />
            ))}
            {cards.length === 0 && (
              <Text style={[styles.note, { color: palette.textMuted }]}>
                No daily crossword today. A new crossword is always open.
              </Text>
            )}
          </View>

          {missed.length > 0 && (
            <View style={styles.section}>
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
  const started = daily.status !== 'not-started';
  const solved = daily.status === 'solved';
  const statusColor = solved ? palette.correctText : started ? palette.accentStrong : palette.textMuted;
  return (
    <Pressable
      onPress={() => openDaily(daily.date, daily.level)}
      accessibilityRole="button"
      accessibilityLabel={`${daily.level} ${LEVEL_NAMES[daily.level]} daily, ${STATUS_LABEL[daily.status]}`}
      style={({ pressed }) => [styles.card, { backgroundColor: pressed ? palette.border : palette.surface }]}
    >
      <View
        style={[
          styles.badge,
          { backgroundColor: solved ? palette.correctBg : started ? palette.accentTint : palette.segment },
        ]}
      >
        <Text style={[styles.badgeText, { color: solved ? palette.correctText : started ? palette.accentStrong : palette.text }]}>
          {daily.level}
        </Text>
      </View>
      <View style={styles.cardText}>
        <Text style={[styles.cardTitle, { color: palette.text }]}>{LEVEL_NAMES[daily.level]}</Text>
        <View style={styles.statusRow}>
          {solved ? (
            <Icon name="check" size={14} strokeWidth={3} color={statusColor} />
          ) : (
            started && <View style={[styles.dot, { backgroundColor: palette.accent }]} />
          )}
          <Text style={[styles.cardStatus, { color: statusColor }]}>{STATUS_LABEL[daily.status]}</Text>
        </View>
      </View>
      <Icon name="forward" color={palette.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: space.xxl },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: space.m,
    borderRadius: radius.pill,
  },
  pillText: { fontFamily: font.medium, fontSize: 13 },
  section: { gap: 10 },
  card: {
    minHeight: 76,
    paddingVertical: space.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: space.l,
    borderRadius: radius.card,
  },
  badge: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: font.display, fontSize: 17 },
  cardText: { flex: 1, gap: 3 },
  cardTitle: { fontFamily: font.semibold, fontSize: 17 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  cardStatus: { fontFamily: font.medium, fontSize: 13 },
  note: { fontFamily: font.regular, fontSize: 13, lineHeight: 18 },
  footer: { paddingTop: space.s, paddingBottom: space.l },
  footerButtons: { paddingHorizontal: space.l + 4, gap: 10 },
  continue: {
    minHeight: 68,
    paddingVertical: space.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: space.l + 4,
    borderRadius: 22,
  },
  playCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  continueText: { flex: 1, minWidth: 0, gap: 2 },
  continueTitle: { fontFamily: font.semibold, fontSize: 17 },
  continueDetail: { fontFamily: font.medium, fontSize: 13 },
  continueTime: { fontFamily: font.displaySemibold, fontSize: 15, fontVariant: ['tabular-nums'] },
  newButton: {
    minHeight: 54,
    paddingVertical: space.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s,
    borderRadius: 18,
  },
  newText: { fontFamily: font.semibold, fontSize: 16 },
  pressed: { opacity: 0.85 },
});
