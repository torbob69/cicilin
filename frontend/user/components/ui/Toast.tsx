import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

type ToastType = "success" | "error" | "info";

interface Props {
  message: string;
  type?: ToastType;
  visible: boolean;
  onHide?: () => void;
}

const typeClass: Record<ToastType, string> = {
  success: "bg-positive",
  error:   "bg-negative",
  info:    "bg-ink",
};

export function Toast({ message, type = "info", visible, onHide }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide?.());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{ opacity }}
      className={`absolute bottom-24 left-6 right-6 rounded-xl px-lg py-md shadow-lg z-50 ${typeClass[type]}`}
    >
      <Text className="text-white text-sm font-sans-semibold">{message}</Text>
    </Animated.View>
  );
}

export function useToast() {
  const [state, setState] = React.useState<{
    visible: boolean;
    message: string;
    type: ToastType;
  }>({ visible: false, message: "", type: "info" });

  const show = (message: string, type: ToastType = "info") =>
    setState({ visible: true, message, type });

  const hide = () => setState((s) => ({ ...s, visible: false }));

  return { toast: state, show, hide };
}
