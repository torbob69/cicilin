import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs, useRouter } from 'expo-router';
import { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Shadow } from '../../constants/theme';

type RouteName = 'index' | 'history' | 'profile';

const TAB_CONFIG: Record<RouteName, { title: string; icon: keyof typeof Feather.glyphMap }> = {
  index: { title: 'Home', icon: 'home' },
  history: { title: 'History', icon: 'clock' },
  profile: { title: 'Profile', icon: 'user' },
};

function TabButton({
  config,
  focused,
  onPress,
}: {
  config: { title: string; icon: keyof typeof Feather.glyphMap };
  focused: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.22, useNativeDriver: true, speed: 80, bounciness: 4 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 25, bounciness: 14 }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.tab} activeOpacity={1}>
      <Animated.View style={[styles.tabInner, { transform: [{ scale }] }]}>
        <Feather name={config.icon} size={21} color={focused ? Colors.mint : Colors.ink400} />
        <Text style={[styles.tabLabel, { color: focused ? Colors.mint : Colors.ink400 }]}>
          {config.title}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function FloatingTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomPad = Math.max(insets.bottom, 8) + 12;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* Mint FAB */}
      <TouchableOpacity
        style={[styles.fab, Shadow.card, { bottom: 64 + bottomPad + 16 }]}
        onPress={() => router.push('/apply')}
        activeOpacity={0.85}
        pointerEvents="auto"
      >
        <Feather name="plus" size={24} color={Colors.black} />
      </TouchableOpacity>

      {/* Pill */}
      <View style={[styles.pillOuter, { paddingBottom: bottomPad }]} pointerEvents="box-none">
        <View style={[styles.pill, Shadow.card]} pointerEvents="box-none">
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.pillSpecular} />
          <View style={[StyleSheet.absoluteFill, styles.pillBorder]} />
          <View style={styles.pillInner} pointerEvents="box-none">
            {state.routes
              .filter((route: any) => route.name in TAB_CONFIG)
              .map((route: any) => {
                const focused = state.routes[state.index]?.name === route.name;
                const config = TAB_CONFIG[route.name as RouteName];
                return (
                  <TabButton
                    key={route.key}
                    config={config}
                    focused={focused}
                    onPress={() => navigation.navigate(route.name)}
                  />
                );
              })}
          </View>
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  fab: {
    position: 'absolute',
    right: 28,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pillOuter: {
    paddingHorizontal: 20,
  },
  pill: {
    height: 64,
    borderRadius: Radius.full,
    overflow: 'hidden',
    backgroundColor: 'rgba(18,18,18,0.85)',
  },
  pillSpecular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    zIndex: 1,
  },
  pillBorder: {
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  pillInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabInner: {
    alignItems: 'center',
  },
  tabLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.3,
    marginTop: 3,
  },
});
