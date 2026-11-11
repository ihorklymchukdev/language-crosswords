import type { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DocumentTitle } from './DocumentTitle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { Header } from './ScreenFrame';
import { MAX_CONTENT_WIDTH, MIN_TOUCH, font, radius, space, usePalette } from './theme';

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

type TabPageProps = {
  title: string;
  eyebrow: string;
  eyebrowAside?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

// The tab bar pads the bottom safe area, so tab pages don't.
export function TabPage({ title, eyebrow, eyebrowAside, children, footer }: TabPageProps) {
  const palette = usePalette();
  return (
    <PageFrame padBottom={false}>
      <DocumentTitle title={eyebrow} />
      <ScrollView contentContainerStyle={[styles.column, styles.tabContent]}>
        <View style={styles.titleBlock}>
          <View style={styles.eyebrowRow}>
            <Text style={[styles.label, { color: palette.textMuted }]}>{eyebrow.toUpperCase()}</Text>
            {eyebrowAside}
          </View>
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
  return <Text style={[styles.label, { color: palette.textMuted }]}>{children.toUpperCase()}</Text>;
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
      onPress={() => void Linking.openURL(url).catch(() => {})}
      style={[styles.link, { color: palette.accentStrong }]}
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
        pressed && { backgroundColor: palette.border },
      ]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: palette.text }]}>{label}</Text>
        {detail !== undefined && <Text style={[styles.rowDetail, { color: palette.textMuted }]}>{detail}</Text>}
      </View>
      <Icon name="forward" color={palette.textMuted} />
    </Pressable>
  );
}

export function Card({ children }: { children: ReactNode }) {
  const palette = usePalette();
  return <View style={[styles.card, { backgroundColor: palette.surface }]}>{children}</View>;
}

const styles = StyleSheet.create({
  frame: { flex: 1 },
  column: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  tabContent: { paddingHorizontal: space.l + 4, paddingTop: 28, paddingBottom: space.xxl, gap: space.xl },
  titleBlock: { gap: space.m },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 30 },
  label: { fontFamily: font.semibold, fontSize: 13, letterSpacing: 1 },
  title: { fontFamily: font.display, fontSize: 34, lineHeight: 37, letterSpacing: -0.7 },
  textContent: { paddingHorizontal: space.l + 4, paddingTop: space.s, paddingBottom: space.xxl, gap: space.m },
  textTitle: { marginBottom: space.xs },
  h2: { fontFamily: font.display, fontSize: 19, lineHeight: 24, marginTop: space.m },
  p: { fontFamily: font.regular, fontSize: 15, lineHeight: 22 },
  link: { textDecorationLine: 'underline' },
  bullets: { gap: space.s },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.m },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  bulletText: { flex: 1 },
  card: { borderRadius: radius.card, overflow: 'hidden' },
  row: {
    minHeight: MIN_TOUCH + 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.l,
    paddingVertical: space.m,
    gap: space.m,
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontFamily: font.semibold, fontSize: 16 },
  rowDetail: { fontFamily: font.medium, fontSize: 13 },
});
