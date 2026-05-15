import React, { useEffect, useRef } from "react";
import { Animated, View, ViewStyle } from "react-native";

interface Props {
  width?: number | string;
  height?: number;
  rounded?: "sm" | "md" | "lg" | "xl" | "pill" | "full";
  style?: ViewStyle;
}

const radiusMap = {
  sm: 8, md: 12, lg: 16, xl: 24, pill: 9999, full: 9999,
};

export function Skeleton({ width = "100%", height = 16, rounded = "md", style }: Props) {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radiusMap[rounded],
          backgroundColor: "#2a2d28",
          opacity: anim,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View className="bg-canvas rounded-xl p-xl gap-sm">
      <Skeleton height={20} width="60%" rounded="md" />
      <Skeleton height={14} rounded="md" />
      <Skeleton height={14} width="80%" rounded="md" />
    </View>
  );
}
