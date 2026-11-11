import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DocumentTitle } from './DocumentTitle';
import { MAX_CONTENT_WIDTH, MIN_TOUCH, radius, space, usePalette, type Palette } from './theme';

// Deep links on web open with no history to go back to.
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

type HeaderProps = { title: string; palette: Palette; right?: ReactNode };

export function Header({ title, palette, right }: HeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={6}
        style={({ pressed }) => [styles.back, pressed && { backgroundColor: palette.surfaceAlt }]}
      >
        <Text style={[styles.backGlyph, { color: palette.text }]}>‹</Text>
      </Pressable>
      <Text style={[styles.title, { color: palette.text }]} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

// `padBottom: false` lets a bottom panel paint under the home indicator and pad itself.
type FrameProps = { children: ReactNode; padBottom?: boolean };

export function ScreenFrame({ children, padBottom = true }: FrameProps) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
      <DocumentTitle />
      <View style={[styles.column, { paddingBottom: padBottom ? insets.bottom : 0 }]}>{children}</View>
    </View>
  );
}

type Action = { label: string; onPress: () => void };

type MessageProps = { title: string; heading?: string; body?: string; actions?: readonly Action[]; loading?: boolean };

export function MessageScreen({ title, heading, body, actions = [], loading }: MessageProps) {
  const palette = usePalette();
  return (
    <ScreenFrame>
      <Header title={title} palette={palette} />
      <View style={styles.message}>
        {loading ? (
          <ActivityIndicator color={palette.accent} accessibilityLabel="Loading" />
        ) : (
          <>
            {heading !== undefined && <Text style={[styles.heading, { color: palette.text }]}>{heading}</Text>}
            {body !== undefined && <Text style={[styles.body, { color: palette.textMuted }]}>{body}</Text>}
            <View style={styles.actions}>
              {actions.map((a, i) => (
                <Pressable
                  key={a.label}
                  onPress={a.onPress}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.button,
                    i === 0
                      ? { backgroundColor: palette.accent, borderColor: palette.accent }
                      : { borderColor: palette.border },
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <Text style={[styles.buttonText, { color: i === 0 ? palette.accentText : palette.text }]}>
                    {a.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  column: { flex: 1, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: space.xs, gap: space.xs },
  back: { width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: radius.card, alignItems: 'center', justifyContent: 'center' },
  backGlyph: { fontSize: 34, lineHeight: 38, fontWeight: '300', marginTop: -3 },
  title: { flex: 1, fontSize: 17, fontWeight: '600' },
  right: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingEnd: space.s },
  message: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: space.xl, gap: space.m },
  heading: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 21, textAlign: 'center', maxWidth: 340 },
  actions: { gap: space.m, marginTop: space.s, alignSelf: 'stretch', alignItems: 'center' },
  button: {
    minHeight: MIN_TOUCH + 4,
    minWidth: 200,
    borderRadius: radius.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
});
