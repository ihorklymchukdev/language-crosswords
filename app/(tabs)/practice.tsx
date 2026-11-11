import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { themesForLevel } from '../../src/catalogue/catalogue';
import { LEVEL_NAMES, LEVELS, type Level } from '../../src/domain/levels';
import type { Theme } from '../../src/domain/types';
import { ContentColumn, SectionLabel, TabPage } from '../../src/ui/Page';
import { MIN_TOUCH, radius, space, usePalette, type Palette } from '../../src/ui/theme';

const MIN_THEME_WORDS = 12;

type ChipProps = { title: string; subtitle?: string; selected: boolean; onPress: () => void; palette: Palette };

function Chip({ title, subtitle, selected, onPress, palette }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.chip,
        selected
          ? { backgroundColor: palette.slotTint, borderColor: palette.accent }
          : { backgroundColor: palette.surface, borderColor: palette.border },
        pressed && !selected && { backgroundColor: palette.surfaceAlt },
      ]}
    >
      <Text style={[styles.chipTitle, { color: palette.text }]} numberOfLines={1}>
        {title}
      </Text>
      {subtitle !== undefined && (
        <Text style={[styles.chipSubtitle, { color: palette.textMuted }]} numberOfLines={2}>
          {subtitle}
        </Text>
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
        <View style={[styles.footer, { borderTopColor: palette.border, backgroundColor: palette.bg }]}>
          <ContentColumn>
            <Pressable
              onPress={play}
              accessibilityRole="button"
              accessibilityLabel={`Play ${level} ${theme?.nameEn ?? 'any theme'}`}
              style={({ pressed }) => [styles.play, { backgroundColor: palette.accent }, pressed && { opacity: 0.85 }]}
            >
              <Text style={[styles.playText, { color: palette.accentText }]}>Play</Text>
              <Text style={[styles.playDetail, { color: palette.accentText }]}>
                {level} · {theme?.nameEn ?? 'Any theme'}
              </Text>
            </Pressable>
          </ContentColumn>
        </View>
      }
    >
      <Text style={[styles.lead, { color: palette.textMuted }]}>
        Pick a level and a theme. Any theme gives a full-size grid of 20+ words; a single theme makes a mini. Every puzzle is new.
      </Text>

      <View style={styles.section} accessibilityRole="radiogroup">
        <SectionLabel>Level</SectionLabel>
        <View style={styles.row}>
          {LEVELS.map((l) => (
            <Chip
              key={l}
              title={l}
              subtitle={LEVEL_NAMES[l]}
              selected={l === level}
              onPress={() => setLevel(l)}
              palette={palette}
            />
          ))}
        </View>
      </View>

      <View style={styles.section} accessibilityRole="radiogroup">
        <SectionLabel>Theme</SectionLabel>
        {pairs(options).map((row) => (
          <View key={row[0]?.id ?? 'any'} style={styles.row}>
            {row.map((t) => (
              <Chip
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
  lead: { fontSize: 15, lineHeight: 21, marginTop: -space.m },
  section: { gap: space.s },
  row: { flexDirection: 'row', gap: space.s },
  chip: {
    flex: 1,
    minHeight: MIN_TOUCH + 12,
    justifyContent: 'center',
    paddingHorizontal: space.m,
    paddingVertical: space.s,
    borderRadius: radius.card,
    borderWidth: 1.5,
    gap: 2,
  },
  chipTitle: { fontSize: 16, fontWeight: '600' },
  chipSubtitle: { fontSize: 12 },
  spacer: { flex: 1 },
  footer: { paddingVertical: space.m, borderTopWidth: StyleSheet.hairlineWidth },
  play: {
    marginHorizontal: space.l,
    minHeight: MIN_TOUCH + 12,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.s,
  },
  playText: { fontSize: 18, fontWeight: '700' },
  playDetail: { fontSize: 13, fontWeight: '500', opacity: 0.9 },
});
