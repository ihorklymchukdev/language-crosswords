import { Tabs } from 'expo-router/js-tabs';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../../src/ui/Icon';
import { MAX_CONTENT_WIDTH, font, usePalette } from '../../src/ui/theme';
import { useHydrated } from '../../src/ui/useHydrated';

// Room for the active pill around a 22px icon and its label.
const TAB_BAR_HEIGHT = 76;

const TABS: readonly { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Today', icon: 'today' },
  { name: 'practice', title: 'Practice', icon: 'practice' },
  { name: 'about', title: 'About', icon: 'about' },
];

export default function TabsLayout() {
  const palette = usePalette();
  const dims = useWindowDimensions();
  const width = useHydrated() ? dims.width : 0;
  const insets = useSafeAreaInsets();
  // The bar spans the window but its items line up with the centred content column.
  const inset = Math.max(0, (width - MAX_CONTENT_WIDTH) / 2);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: palette.bg },
        tabBarActiveTintColor: palette.accentStrong,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarActiveBackgroundColor: palette.accentTint,
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16 },
        tabBarItemStyle: { borderRadius: 16, overflow: 'hidden', marginHorizontal: 4, marginVertical: 8 },
        tabBarStyle: {
          backgroundColor: palette.bg,
          borderTopColor: palette.border,
          paddingHorizontal: inset + 16,
          paddingTop: 0,
          height: TAB_BAR_HEIGHT + insets.bottom,
        },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{ title: t.title, tabBarIcon: ({ color }) => <Icon name={t.icon} size={22} strokeWidth={2} color={color} /> }}
        />
      ))}
    </Tabs>
  );
}
