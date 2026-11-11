import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LEVEL_NAMES, LEVELS, type Level } from '../domain/levels';
import { MAX_CONTENT_WIDTH, MIN_TOUCH, radius, space, usePalette } from './theme';

type Props = {
  visible: boolean;
  onPick: (level: Level) => void;
  onThemes: () => void;
  onClose: () => void;
};

export function NewPuzzleSheet({ visible, onPick, onThemes, onClose }: Props) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const option = (pressed: boolean) => [
    styles.option,
    { backgroundColor: pressed ? palette.surfaceAlt : palette.surface, borderColor: palette.border },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { backgroundColor: palette.bg, paddingBottom: insets.bottom + space.l }]}>
          <Text style={[styles.title, { color: palette.text }]} accessibilityRole="header">
            New crossword
          </Text>
          {LEVELS.map((level) => (
            <Pressable
              key={level}
              onPress={() => onPick(level)}
              accessibilityRole="button"
              accessibilityLabel={`New ${level} ${LEVEL_NAMES[level]} crossword`}
              style={({ pressed }) => option(pressed)}
            >
              <Text style={[styles.level, { color: palette.text }]}>{level}</Text>
              <Text style={[styles.levelName, { color: palette.textMuted }]}>{LEVEL_NAMES[level]}</Text>
            </Pressable>
          ))}
          <Pressable onPress={onThemes} accessibilityRole="button" style={({ pressed }) => option(pressed)}>
            <Text style={[styles.themes, { color: palette.text }]}>Pick a theme…</Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.cancel, { backgroundColor: palette.accent }, pressed && { opacity: 0.85 }]}
          >
            <Text style={[styles.cancelText, { color: palette.accentText }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: space.l,
    paddingHorizontal: space.l,
    gap: space.s,
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: space.xs },
  option: {
    minHeight: MIN_TOUCH + 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    paddingHorizontal: space.l,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  level: { fontSize: 17, fontWeight: '800', minWidth: 30 },
  levelName: { fontSize: 16, fontWeight: '500' },
  themes: { fontSize: 16, fontWeight: '600' },
  cancel: {
    minHeight: MIN_TOUCH + 12,
    marginTop: space.s,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: 17, fontWeight: '700' },
});
