import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { addDays, localDateKey } from '../src/daily/dates';
import { LEVELS } from '../src/domain/levels';
import { ScreenFrame } from '../src/ui/ScreenFrame';
import { space, usePalette } from '../src/ui/theme';

// Temporary launcher until the tabbed home screen lands.
export default function HomeScreen() {
  const palette = usePalette();
  const today = localDateKey();
  const link = [styles.link, { color: palette.accent }];
  return (
    <ScreenFrame>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: palette.text }]}>Language Crosswords</Text>
        {[today, addDays(today, -1)].map((date) => (
          <View key={date} style={styles.group}>
            <Text style={[styles.heading, { color: palette.textMuted }]}>Daily {date}</Text>
            {LEVELS.map((level) => (
              <Link key={level} href={{ pathname: '/puzzle/daily/[level]/[date]', params: { level, date } }} style={link}>
                {level} daily
              </Link>
            ))}
          </View>
        ))}
        <View style={styles.group}>
          <Text style={[styles.heading, { color: palette.textMuted }]}>Practice</Text>
          {LEVELS.map((level) => (
            <Link key={level} href={{ pathname: '/puzzle/practice/[level]', params: { level } }} style={link}>
              {level} practice
            </Link>
          ))}
          <Link href={{ pathname: '/puzzle/practice/[level]', params: { level: 'A2', theme: 'food' } }} style={link}>
            A2 practice · Food
          </Link>
        </View>
      </ScrollView>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.xl, gap: space.xl },
  title: { fontSize: 24, fontWeight: '700' },
  group: { gap: space.s },
  heading: { fontSize: 13, fontWeight: '700', letterSpacing: 0.6 },
  link: { fontSize: 17, paddingVertical: space.s },
});
