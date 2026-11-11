import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatTime } from './format';
import { MIN_TOUCH, radius, space, type Palette } from './theme';

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
      style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.title, { color: palette.text }]} accessibilityRole="header">
        ¡Bien hecho!
      </Text>
      <Text style={[styles.message, { color: palette.textMuted }]}>{message}</Text>
      <View style={[styles.stats, { borderColor: palette.border }]}>
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
              a.primary
                ? { backgroundColor: palette.accent, borderColor: palette.accent }
                : { borderColor: palette.border, backgroundColor: palette.surface },
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
  card: { borderRadius: radius.card, borderWidth: 1, padding: space.l, gap: space.m },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  message: { fontSize: 15, textAlign: 'center', marginTop: -space.s },
  stats: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: space.m,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  value: { fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 12, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: space.m },
  button: {
    flex: 1,
    minHeight: MIN_TOUCH + 4,
    borderRadius: radius.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.m,
  },
  pressed: { opacity: 0.75 },
  buttonText: { fontSize: 16, fontWeight: '600' },
});
