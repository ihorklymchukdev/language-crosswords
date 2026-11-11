import type { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DocumentTitle } from './DocumentTitle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from './ScreenFrame';
import { MAX_CONTENT_WIDTH, MIN_TOUCH, radius, space, usePalette } from './theme';

// Unlike ScreenFrame, the scroll view spans the window so on desktop the scrollbar sits at the
// window edge and the wheel works over the side margins; only the content is centred.
function PageFrame({ children, padBottom }: { children: ReactNode; padBottom: boolean }) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.frame,
        { backgroundColor: palette.bg, paddingTop: insets.top, paddingBottom: padBottom ? insets.bottom : 0 },
      ]}
    >
      {children}
    </View>
  );
}

export function ContentColumn({ children }: { children: ReactNode }) {
  return <View style={styles.column}>{children}</View>;
}

type TabPageProps = { title: string; eyebrow: string; children: ReactNode; footer?: ReactNode };

// The tab bar pads the bottom safe area, so tab pages don't.
export function TabPage({ title, eyebrow, children, footer }: TabPageProps) {
  const palette = usePalette();
  return (
    <PageFrame padBottom={false}>
      <DocumentTitle title={eyebrow} />
      <ScrollView contentContainerStyle={[styles.column, styles.tabContent]}>
        <View style={styles.titleBlock}>
          <Text style={[styles.eyebrow, { color: palette.textMuted }]}>{eyebrow}</Text>
          <Text style={[styles.title, { color: palette.text }]} accessibilityRole="header">
            {title}
          </Text>
        </View>
        {children}
      </ScrollView>
      {footer}
    </PageFrame>
  );
}

export function SectionLabel({ children }: { children: string }) {
  const palette = usePalette();
  return <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>{children.toUpperCase()}</Text>;
}

export function TextPage({ title, children }: { title: string; children: ReactNode }) {
  const palette = usePalette();
  return (
    <PageFrame padBottom>
      <DocumentTitle title={title} />
      <ContentColumn>
        <Header title="" palette={palette} />
      </ContentColumn>
      <ScrollView contentContainerStyle={[styles.column, styles.textContent]}>
        <Text style={[styles.title, styles.textTitle, { color: palette.text }]} accessibilityRole="header">
          {title}
        </Text>
        {children}
      </ScrollView>
    </PageFrame>
  );
}

export function H2({ children }: { children: ReactNode }) {
  const palette = usePalette();
  return (
    <Text style={[styles.h2, { color: palette.text }]} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function P({ children, muted }: { children: ReactNode; muted?: boolean }) {
  const palette = usePalette();
  return <Text style={[styles.p, { color: muted ? palette.textMuted : palette.text }]}>{children}</Text>;
}

export function Bullets({ items }: { items: readonly ReactNode[] }) {
  const palette = usePalette();
  return (
    <View style={styles.bullets}>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={[styles.bulletDot, { backgroundColor: palette.accent }]} />
          <Text style={[styles.p, styles.bulletText, { color: palette.text }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// Inline link inside a paragraph.
export function ExternalLink({ url, children }: { url: string; children: string }) {
  const palette = usePalette();
  return (
    <Text
      accessibilityRole="link"
      onPress={() => void Linking.openURL(url)}
      style={[styles.link, { color: palette.accent }]}
    >
      {children}
    </Text>
  );
}

type RowProps = { label: string; detail?: string; onPress: () => void; first?: boolean };

export function LinkRow({ label, detail, onPress, first }: RowProps) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      style={({ pressed }) => [
        styles.row,
        !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border },
        pressed && { backgroundColor: palette.surfaceAlt },
      ]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: palette.text }]}>{label}</Text>
        {detail !== undefined && <Text style={[styles.rowDetail, { color: palette.textMuted }]}>{detail}</Text>}
      </View>
      <Text style={[styles.chevron, { color: palette.textMuted }]}>›</Text>
    </Pressable>
  );
}

export function Card({ children }: { children: ReactNode }) {
  const palette = usePalette();
  return <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>{children}</View>;
}

const styles = StyleSheet.create({
  frame: { flex: 1 },
  column: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  tabContent: { paddingHorizontal: space.l, paddingTop: space.xl, paddingBottom: space.xxl, gap: space.xl },
  titleBlock: { gap: space.xs },
  eyebrow: { fontSize: 15, fontWeight: '500' },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: space.xs },
  textContent: { paddingHorizontal: space.l, paddingTop: space.s, paddingBottom: space.xxl, gap: space.m },
  textTitle: { marginBottom: space.xs },
  h2: { fontSize: 17, lineHeight: 22, fontWeight: '700', marginTop: space.m },
  p: { fontSize: 15, lineHeight: 22 },
  link: { textDecorationLine: 'underline' },
  bullets: { gap: space.s },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.m },
  bulletDot: { width: 5, height: 5, borderRadius: 3, marginTop: 9 },
  bulletText: { flex: 1 },
  card: { borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: {
    minHeight: MIN_TOUCH + 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.l,
    paddingVertical: space.m,
    gap: space.m,
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 16, fontWeight: '500' },
  rowDetail: { fontSize: 13 },
  chevron: { fontSize: 24, lineHeight: 26, fontWeight: '300' },
});
