import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { themesForLevel } from '../../src/catalogue/catalogue';
import { LEVEL_NAMES, LEVELS, type Level } from '../../src/domain/levels';
import type { Theme } from '../../src/domain/types';
import { Icon } from '../../src/ui/Icon';
import { ContentColumn, SectionLabel, TabPage } from '../../src/ui/Page';
import { font, radius, space, usePalette, type Palette } from '../../src/ui/theme';

const MIN_THEME_WORDS = 12;
// Keeps three segments on one line at phone width.
const SHORT_LEVEL_NAMES: Record<Level, string> = { A2: 'Elementary', B1: 'Intermediate', B2: 'Upper-interm.' };

type ChipProps = { title: string; subtitle: string; selected: boolean; onPress: () => void; palette: Palette };

function ThemeChip({ title, subtitle, selected, onPress, palette }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? palette.inverse : pressed ? palette.border : palette.surface },
      ]}
    >
      <View style={styles.chipText}>
        <Text style={[styles.chipTitle, { color: selected ? palette.inverseText : palette.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.chipSubtitle, { color: selected ? palette.inverseMuted : palette.textMuted }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {selected && (
        <View style={[styles.check, { backgroundColor: palette.accent }]}>
          <Icon name="check" size={12} strokeWidth={3.2} color={palette.accentText} />
        </View>
      )}
    </Pressable>
  );
}

function pairs<T>(items: readonly T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
}

export default function PracticeScreen() {
  const palette = usePalette();
  const [level, setLevel] = useState<Level>(LEVELS[0]);
  const [themeId, setThemeId] = useState<string | undefined>(undefined);
  const themes = useMemo(() => themesForLevel(level, MIN_THEME_WORDS), [level]);
  // A theme picked at one level may be too small at another; fall back to Any theme.
  const theme = themes.find((t) => t.id === themeId);

  const options: (Theme | undefined)[] = [undefined, ...themes];

  const play = () =>
    router.push({
      pathname: '/puzzle/practice/[level]',
      params: theme ? { level, theme: theme.id } : { level },
    });

  return (
    <TabPage
      eyebrow="Practice"
      title="A fresh crossword"
      footer={
        <View style={[styles.footer, { backgroundColor: palette.bg, borderTopColor: palette.border }]}>
          <ContentColumn>
            <Pressable
              onPress={play}
              accessibilityRole="button"
              accessibilityLabel={`Play ${level} ${theme?.nameEn ?? 'any theme'}`}
              style={({ pressed }) => [styles.play, { backgroundColor: palette.accent }, pressed && { opacity: 0.85 }]}
            >
              <Icon name="play" size={16} color={palette.accentText} />
              <Text style={[styles.playText, { color: palette.accentText }]}>Play</Text>
              <Text style={[styles.playDetail, { color: palette.accentText }]} numberOfLines={1}>
                {level} · {theme?.nameEn ?? 'Any theme'}
              </Text>
            </Pressable>
          </ContentColumn>
        </View>
      }
    >
      <Text style={[styles.lead, { color: palette.textMuted }]}>
        Pick a level and a theme. Any theme gives a full-size grid of 20+ words; a single theme makes a mini. Every
        puzzle is new.
      </Text>

      <View style={styles.section}>
        <SectionLabel>Level</SectionLabel>
        <View style={[styles.segments, { backgroundColor: palette.segment }]} accessibilityRole="radiogroup">
          {LEVELS.map((l) => {
            const selected = l === level;
            return (
              <Pressable
                key={l}
                onPress={() => setLevel(l)}
                accessibilityRole="radio"
                accessibilityLabel={`${l} ${LEVEL_NAMES[l]}`}
                accessibilityState={{ checked: selected }}
                style={[styles.segment, selected && [styles.segmentOn, { backgroundColor: palette.raised }]]}
              >
                <Text style={[styles.segmentCode, { color: selected ? palette.accentStrong : palette.text }]}>{l}</Text>
                <Text style={[styles.segmentName, { color: palette.textMuted }]} numberOfLines={1}>
                  {SHORT_LEVEL_NAMES[l]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section} accessibilityRole="radiogroup">
        <SectionLabel>Theme</SectionLabel>
        {pairs(options).map((row) => (
          <View key={row[0]?.id ?? 'any'} style={styles.row}>
            {row.map((t) => (
              <ThemeChip
                key={t?.id ?? 'any'}
                title={t?.nameEn ?? 'Any theme'}
                subtitle={t?.nameEs ?? 'Cualquier tema'}
                selected={t === theme}
                onPress={() => setThemeId(t?.id)}
                palette={palette}
              />
            ))}
            {row.length === 1 && <View style={styles.spacer} />}
          </View>
        ))}
      </View>
    </TabPage>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, marginTop: -space.s },
  section: { gap: 10 },
  segments: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 18 },
  segment: { flex: 1, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 1 },
  segmentOn: {
    shadowColor: '#18181B',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentCode: { fontFamily: font.display, fontSize: 16 },
  segmentName: { fontFamily: font.medium, fontSize: 11 },
  row: { flexDirection: 'row', gap: space.s },
  chip: {
    flex: 1,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
    paddingStart: 14,
    paddingEnd: space.m,
    borderRadius: radius.m,
  },
  chipText: { flex: 1, minWidth: 0, gap: 1 },
  chipTitle: { fontFamily: font.semibold, fontSize: 15 },
  chipSubtitle: { fontFamily: font.medium, fontSize: 12 },
  check: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  spacer: { flex: 1 },
  footer: { paddingTop: space.m, paddingBottom: space.l, borderTopWidth: StyleSheet.hairlineWidth },
  play: {
    marginHorizontal: space.l + 4,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    paddingHorizontal: space.l + 4,
    borderRadius: radius.card,
  },
  playText: { flex: 1, fontFamily: font.semibold, fontSize: 17 },
  playDetail: { fontFamily: font.medium, fontSize: 14, flexShrink: 1 },
});
