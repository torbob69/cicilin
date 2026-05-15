import React from "react";
import { View, TouchableOpacity, Text, Platform } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_CONFIG: Record<string, { icon: IconName; iconActive: IconName; label: string }> = {
  index: { icon: "home-outline", iconActive: "home", label: "Home" },
  status: { icon: "receipt-outline", iconActive: "receipt", label: "Status" },
  apply: { icon: "add", iconActive: "add", label: "" },
  quests: { icon: "star-outline", iconActive: "star", label: "Quest" },
  profile: { icon: "person-outline", iconActive: "person", label: "Profil" },
};

function TabItem({
  route,
  active,
  onPress,
}: {
  route: string;
  active: boolean;
  onPress: () => void;
}) {
  const cfg = TAB_CONFIG[route];
  const isCenter = route === "apply";

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.85, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 15 });
    });
    onPress();
  };

  if (isCenter) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9} className="items-center justify-center">
        <Animated.View
          style={[animStyle, { width: 48, height: 48, borderRadius: 24 }]}
          className="bg-primary items-center justify-center"
        >
          <Ionicons name="add" size={32} color="#0e0f0c" />
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className="flex-1 items-center justify-center py-sm gap-xxs"
    >
      <Animated.View style={animStyle} className="items-center">
        <Ionicons
          name={active ? cfg.iconActive : cfg.icon}
          size={22}
          color={active ? "#9fe870" : "#868685"}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute bottom-0 left-0 right-0"
    >
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.06)",
          backgroundColor: "#080a07",
        }}
      >
        <View className="flex-row items-center px-sm pt-sm" style={{ height: 60 }}>
          {state.routes.map((route, idx) => {
            if (!TAB_CONFIG[route.name]) return null;
            const active = state.index === idx;
            return (
              <TabItem
                key={route.key}
                route={route.name}
                active={active}
                onPress={() => {
                  const event = navigation.emit({
                    type: "tabPress",
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!active && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}
