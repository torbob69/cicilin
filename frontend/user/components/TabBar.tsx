import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

const TAB_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  index: 'home',
  apply: 'plus',
  status: 'bar-chart-2',
  quests: 'refresh-cw',
  profile: 'user',
};

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 16) }]}>
      <BlurView intensity={60} tint="dark" style={styles.blur}>
        <View style={styles.inner}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const iconName = TAB_ICONS[route.name] || 'circle';

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const isHome = route.name === 'index';

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.tab}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconWrap,
                    isFocused && styles.iconWrapActive,
                    isHome && isFocused && styles.homeActiveWrap,
                  ]}
                >
                  <Feather
                    name={iconName}
                    size={22}
                    color={isFocused ? Colors.green : '#a7a7a7'}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 24,
    right: 24,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  blur: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    height: 70,
    alignItems: 'center',
    backgroundColor: Platform.OS === 'android' ? 'rgba(40,39,39,0.95)' : 'rgba(40,39,39,0.34)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  iconWrapActive: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  homeActiveWrap: {
    backgroundColor: Colors.greenGlass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
});
