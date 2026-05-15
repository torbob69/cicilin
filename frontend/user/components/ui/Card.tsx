import React from "react";
import { View, ViewProps } from "react-native";

type Variant = "white" | "sage" | "green" | "dark";

interface Props extends ViewProps {
  variant?: Variant;
  children: React.ReactNode;
  noPad?: boolean;
}

const variantClass: Record<Variant, string> = {
  white: "bg-canvas border border-white/[0.06]",
  sage: "bg-canvas-soft",
  green: "bg-primary-pale",
  dark: "bg-surface border border-white/[0.08]",
};

export function Card({ variant = "white", children, noPad, className = "", ...props }: Props) {
  return (
    <View
      className={`rounded-xl ${noPad ? "" : "p-xl"} ${variantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
