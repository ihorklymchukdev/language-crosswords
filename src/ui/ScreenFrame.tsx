import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DocumentTitle } from './DocumentTitle';
import { Backdrop } from './GradientFill';
import { Icon } from './Icon';
import { MAX_CONTENT_WIDTH, MIN_TOUCH, font, glass, radius, space, usePalette, type Palette } from './theme';

// Deep links on web open with no history to go back to.
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

type HeaderProps = { title: string; badge?: string; palette: Palette; right?: ReactNode };

export function Header({ title, badge, palette, right }: HeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={6}
        style={({ pressed }) => [styles.back, pressed && { backgroundColor: palette.glass }]}
      >
        <Icon name="back" size={22} color={palette.text} />
      </Pressable>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: palette.text }]} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        {badge !== undefined && (
          <View style={[styles.badge, { backgroundColor: palette.accentTint }]}>
            <Text style={[styles.badgeText, { color: palette.accentStrong }]}>{badge}</Text>
          </View>
        )}
      </View>
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
      <Backdrop palette={palette} />
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
                    i === 0 ? { backgroundColor: palette.accent } : glass(palette),
                    pressed && { opacity: 0.8 },
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
  header: { flexDirection: 'row', alignItems: 'center', height: 60, paddingStart: space.s, paddingEnd: space.m, gap: space.s },
  back: { width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: MIN_TOUCH / 2, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: space.s },
  title: { flexShrink: 1, fontFamily: font.display, fontSize: 18, letterSpacing: -0.2 },
  badge: { height: 24, paddingHorizontal: space.s, borderRadius: 8, justifyContent: 'center' },
  badgeText: { fontFamily: font.display, fontSize: 13 },
  right: { flexDirection: 'row', alignItems: 'center', gap: space.m },
  message: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: space.xl, gap: space.m },
  heading: { fontFamily: font.display, fontSize: 24, textAlign: 'center', letterSpacing: -0.3 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 340 },
  actions: { gap: space.m, marginTop: space.s, alignSelf: 'stretch', alignItems: 'center' },
  button: {
    minHeight: 54,
    minWidth: 220,
    borderRadius: radius.card - 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  buttonText: { fontFamily: font.semibold, fontSize: 16 },
});
