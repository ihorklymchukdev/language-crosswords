import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatTime } from './format';
import { font, radius, space, type Palette } from './theme';

export type CardAction = { label: string; onPress: () => void; primary?: boolean };

type Props = {
  palette: Palette;
  timeMs: number;
  revealed: number;
  translated: number;
  message: string;
  actions: readonly CardAction[];
};

export function CompletionCard({ palette, timeMs, revealed, translated, message, actions }: Props) {
  const stats = [
    { value: formatTime(timeMs), label: 'Time' },
    { value: String(revealed), label: revealed === 1 ? 'Letter revealed' : 'Letters revealed' },
    { value: String(translated), label: translated === 1 ? 'Clue translated' : 'Clues translated' },
  ];
  return (
    <View
      style={[styles.card, { backgroundColor: palette.raised }]}
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.title, { color: palette.text }]} accessibilityRole="header">
        ¡Bien hecho!
      </Text>
      <Text style={[styles.message, { color: palette.textMuted }]}>{message}</Text>
      <View style={[styles.stats, { backgroundColor: palette.surface }]}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat}>
            <Text style={[styles.value, { color: palette.text }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: palette.textMuted }]}>{s.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.actions}>
        {actions.map((a) => (
          <Pressable
            key={a.label}
            onPress={a.onPress}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: a.primary ? palette.accent : palette.surface },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.buttonText, { color: a.primary ? palette.accentText : palette.text }]}>{a.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.sheet, padding: space.l + 4, gap: space.m, marginHorizontal: space.xs },
  title: { fontFamily: font.display, fontSize: 28, letterSpacing: -0.4, textAlign: 'center' },
  message: { fontFamily: font.regular, fontSize: 15, textAlign: 'center', marginTop: -space.s },
  stats: { flexDirection: 'row', borderRadius: radius.m, paddingVertical: space.m },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  value: { fontFamily: font.display, fontSize: 22, fontVariant: ['tabular-nums'] },
  statLabel: { fontFamily: font.medium, fontSize: 12, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 10 },
  button: {
    flex: 1,
    minHeight: 54,
    paddingVertical: space.s,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.m,
  },
  pressed: { opacity: 0.8 },
  buttonText: { fontFamily: font.semibold, fontSize: 16 },
});
