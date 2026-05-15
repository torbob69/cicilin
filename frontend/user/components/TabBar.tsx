import React from "react";
import { View, TouchableOpacity, Text, Platform } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_CONFIG: Record<string, { icon: IconName; iconActive: IconName; label: string }> = {
  index: { icon: "home-outline", iconActive: "home", label: "Home" },
  status: { icon: "time-outline", iconActive: "time", label: "Status" },
  apply: { icon: "add", iconActive: "add", label: "" },
  quests: { icon: "ribbon-outline", iconActive: "ribbon", label: "Quest" },
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
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        style={{ flex: 1, alignItems: "center", justifyContent: "center", marginTop: -32 }}
      >
        <Animated.View
          style={[animStyle, {
            width: 52, height: 52, borderRadius: 26,
            backgroundColor: "#9fe870",
            alignItems: "center", justifyContent: "center",
            shadowColor: "#9fe870",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.75,
            shadowRadius: 16,
            elevation: 16,
          }]}
        >
          <Ionicons name="add" size={28} color="#0e0f0c" />
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
  const router = useRouter();

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
        <View className="flex-row items-center px-sm pt-sm" style={{ height: 60, overflow: "visible" }}>
          {state.routes.map((route, idx) => {
            if (!TAB_CONFIG[route.name]) return null;
            const active = state.index === idx;
            return (
              <TabItem
                key={route.key}
                route={route.name}
                active={active}
                onPress={() => {
                  if (route.name === "apply") {
                    router.push("/(tabs)/apply");
                    return;
                  }
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
