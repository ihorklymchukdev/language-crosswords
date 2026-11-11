import Constants from 'expo-constants';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { APP_NAME } from '../../src/ui/app-info';
import { Bullets, Card, LinkRow, SectionLabel, TabPage } from '../../src/ui/Page';
import { font, space, usePalette } from '../../src/ui/theme';

const HOW_TO_PLAY = [
  'Tap a square and type with the keyboard below the grid.',
  'Tap the same square again to switch between across and down.',
  'A word turns green when it is right.',
  'Accents are optional: “e” counts for “é”. Only ñ must be typed as ñ.',
  'Stuck? Reveal letter fills in one square. Translate shows the clue in English.',
];

export default function AboutScreen() {
  const palette = usePalette();
  const version = Constants.expoConfig?.version;
  return (
    <TabPage eyebrow="About" title={APP_NAME}>
      <Text style={[styles.lead, { color: palette.textMuted }]}>
        Small Spanish crosswords for learners at A2, B1 and B2. A new daily puzzle at each level, and practice
        whenever you like. The iOS and Android apps work offline.
      </Text>

      <View style={styles.section}>
        <SectionLabel>How to play</SectionLabel>
        <Bullets items={HOW_TO_PLAY} />
      </View>

      <View style={styles.section}>
        <SectionLabel>More</SectionLabel>
        <Card>
          <LinkRow first label="Privacy Policy" detail="No data collected" onPress={() => router.push('/privacy')} />
          <LinkRow label="Support" detail="Questions and feedback" onPress={() => router.push('/support')} />
        </Card>
      </View>

      <View style={styles.meta}>
        {version !== undefined && (
          <Text style={[styles.metaText, { color: palette.textMuted }]}>Version {version}</Text>
        )}
        <Text style={[styles.metaText, { color: palette.textMuted }]}>Word list and clues written for this app.</Text>
      </View>
    </TabPage>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: font.regular, fontSize: 15, lineHeight: 22, marginTop: -space.s },
  section: { gap: 10 },
  meta: { gap: space.xs, alignItems: 'center', marginTop: space.s },
  metaText: { fontFamily: font.regular, fontSize: 13 },
});
