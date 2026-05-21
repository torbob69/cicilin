import React, { useState } from "react";
import {
  View,
  Text,
  TextInput as RNTextInput,
  TextInputProps,
  TouchableOpacity,
} from "react-native";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  suffix?: React.ReactNode;
  prefix?: React.ReactNode;
}

export function Input({ label, error, hint, suffix, prefix, ...props }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="gap-xs">
      {label && (
        <Text className="text-sm font-sans-semibold text-ink">{label}</Text>
      )}
      <View
        className={`
          flex-row items-center bg-canvas rounded-full px-lg
          border
          ${error ? "border-negative" : "border-ink/30"}
        `}
      >
        {prefix && <View className="mr-sm">{prefix}</View>}
        <RNTextInput
          className="flex-1 text-base text-ink py-md"
          placeholderTextColor="#525550"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[{ outlineWidth: 0 } as any]}
          {...props}
        />
        {suffix && <View className="ml-sm">{suffix}</View>}
      </View>
      {error ? (
        <Text className="text-xs text-negative">{error}</Text>
      ) : hint ? (
        <Text className="text-xs text-mute">{hint}</Text>
      ) : null}
    </View>
  );
}
