import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LEVEL_NAMES, LEVELS, type Level } from '../domain/levels';
import { BottomSheet } from './BottomSheet';
import { HeroFill } from './GradientFill';
import { Icon } from './Icon';
import { MAX_CONTENT_WIDTH, font, radius, space, usePalette } from './theme';

type Props = {
  visible: boolean;
  onPick: (level: Level) => void;
  onThemes: () => void;
  onClose: () => void;
};

export function NewPuzzleSheet({ visible, onPick, onThemes, onClose }: Props) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const row = (pressed: boolean) => [styles.row, { backgroundColor: pressed ? palette.border : palette.surface }];

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      closeLabel="Close"
      style={[styles.sheet, { backgroundColor: palette.sheet, paddingBottom: insets.bottom + space.l }]}
    >
      <View style={[styles.grabber, { backgroundColor: palette.border }]} />
      <Text style={[styles.title, { color: palette.text }]} accessibilityRole="header">
        New crossword
      </Text>
      {LEVELS.map((level) => (
        <Pressable
          key={level}
          onPress={() => onPick(level)}
          accessibilityRole="button"
          accessibilityLabel={`New ${level} ${LEVEL_NAMES[level]} crossword`}
          style={({ pressed }) => row(pressed)}
        >
          <View style={[styles.badge, { backgroundColor: palette.level[level].bg }]}>
            <Text style={[styles.badgeText, { color: palette.level[level].text }]}>{level}</Text>
          </View>
          <Text style={[styles.label, { color: palette.text }]}>{LEVEL_NAMES[level]}</Text>
          <Icon name="forward" color={palette.textMuted} />
        </Pressable>
      ))}
      <Pressable onPress={onThemes} accessibilityRole="button" style={({ pressed }) => row(pressed)}>
        <View style={[styles.badge, { backgroundColor: palette.accentTint }]}>
          <Icon name="practice" size={20} strokeWidth={2} color={palette.accentStrong} />
        </View>
        <Text style={[styles.label, { color: palette.text }]}>Pick a theme</Text>
        <Icon name="forward" color={palette.textMuted} />
      </Pressable>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        style={({ pressed }) => [styles.cancel, { boxShadow: palette.heroShadow }, pressed && { opacity: 0.85 }]}
      >
        <HeroFill palette={palette} radius={CANCEL_RADIUS} />
        <Text style={[styles.cancelText, { color: palette.inverseText }]}>Cancel</Text>
      </Pressable>
    </BottomSheet>
  );
}

const CANCEL_RADIUS = 22;

const styles = StyleSheet.create({
  sheet: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: space.s,
    paddingHorizontal: space.l + 4,
    gap: 10,
  },
  grabber: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: space.s },
  title: { fontFamily: font.display, fontSize: 24, letterSpacing: -0.3, marginBottom: space.xs },
  row: {
    minHeight: 68,
    paddingVertical: space.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: space.l,
    borderRadius: radius.card,
  },
  badge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: font.display, fontSize: 16 },
  label: { flex: 1, fontFamily: font.semibold, fontSize: 16 },
  cancel: { minHeight: 56, paddingVertical: space.m, marginTop: space.xs, borderRadius: CANCEL_RADIUS, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: font.semibold, fontSize: 17 },
});
