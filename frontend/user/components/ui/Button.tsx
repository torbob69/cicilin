import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
} from "react-native";

type Variant = "primary" | "secondary" | "tertiary" | "ghost";

interface Props extends TouchableOpacityProps {
  variant?: Variant;
  label: string;
  loading?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "md";
}

const variantStyles: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: "bg-primary active:bg-primary-active",
    text: "text-on-primary font-sans-semibold",
  },
  secondary: {
    container: "bg-canvas-soft active:bg-primary-neutral",
    text: "text-ink font-sans-semibold",
  },
  tertiary: {
    container: "bg-canvas border border-ink/30",
    text: "text-ink font-sans-semibold",
  },
  ghost: {
    container: "bg-transparent",
    text: "text-ink font-sans-semibold",
  },
};

export function Button({
  variant = "primary",
  label,
  loading = false,
  fullWidth = true,
  size = "md",
  disabled,
  ...props
}: Props) {
  const v = variantStyles[variant];
  const sizeClass = size === "sm" ? "px-md py-xs" : "px-xl py-md";

  return (
    <TouchableOpacity
      className={`
        ${v.container} ${sizeClass} rounded-xl items-center justify-center
        ${fullWidth ? "w-full" : ""}
        ${disabled || loading ? "opacity-50" : ""}
      `}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#0e0f0c" : "#9fe870"} />
      ) : (
        <Text className={`text-base leading-6 ${v.text}`}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
