import { Tabs } from 'expo-router/js-tabs';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabIcon, type TabIconName } from '../../src/ui/TabIcon';
import { MAX_CONTENT_WIDTH, usePalette } from '../../src/ui/theme';

// The default height clips labels under a 22px drawn icon.
const TAB_BAR_HEIGHT = 62;

const TABS: readonly { name: string; title: string; icon: TabIconName }[] = [
  { name: 'index', title: 'Today', icon: 'today' },
  { name: 'practice', title: 'Practice', icon: 'practice' },
  { name: 'about', title: 'About', icon: 'about' },
];

export default function TabsLayout() {
  const palette = usePalette();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // The bar spans the window but its items line up with the centred content column.
  const inset = Math.max(0, (width - MAX_CONTENT_WIDTH) / 2);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: palette.bg },
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          paddingHorizontal: inset,
          paddingTop: 4,
          height: TAB_BAR_HEIGHT + insets.bottom,
        },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{ title: t.title, tabBarIcon: ({ color }) => <TabIcon name={t.icon} color={color} /> }}
        />
      ))}
    </Tabs>
  );
}
