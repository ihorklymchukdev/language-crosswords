import type { ColorValue } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

export type TabIconName = 'today' | 'practice' | 'about';

type Props = { name: TabIconName; color: ColorValue };

// Drawn from views: no icon font ships with this build.
export function TabIcon({ name, color }: Props) {
  if (name === 'today') {
    return (
      <View aria-hidden style={[styles.box, styles.calendar, { borderColor: color }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
      </View>
    );
  }
  if (name === 'practice') {
    return (
      <View aria-hidden style={styles.grid}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.cell, { borderColor: color }, i === 1 && { backgroundColor: color }]}
          />
        ))}
      </View>
    );
  }
  return (
    <View aria-hidden style={[styles.box, styles.circle, { borderColor: color }]}>
      <Text style={[styles.i, { color }]}>i</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: 22, height: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  calendar: { borderRadius: 5, borderTopWidth: 6 },
  dot: { width: 5, height: 5, borderRadius: 1, marginTop: 1 },
  grid: { width: 22, height: 22, flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  cell: { width: 10, height: 10, borderWidth: 2, borderRadius: 2 },
  circle: { borderRadius: 11 },
  i: { fontSize: 13, lineHeight: 15, fontWeight: '800' },
});
