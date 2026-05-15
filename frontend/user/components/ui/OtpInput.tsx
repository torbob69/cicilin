import React, { useRef, useState } from "react";
import { View, TextInput, TouchableOpacity, Text } from "react-native";

interface Props {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  secureTextEntry?: boolean;
}

export function OtpInput({ length = 6, value, onChange, secureTextEntry = false }: Props) {
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, idx: number) => {
    if (text.length > 1) {
      // handle paste
      const pasted = text.replace(/\D/g, "").slice(0, length);
      onChange(pasted.padEnd(length, "").slice(0, length));
      inputs.current[Math.min(pasted.length, length - 1)]?.focus();
      return;
    }
    const arr = value.split("");
    arr[idx] = text.replace(/\D/g, "");
    const next = arr.join("").slice(0, length);
    onChange(next.padEnd(length, "").slice(0, length).trimEnd() + next.slice(value.replace(/\s/g, "").length));
    // simpler approach:
    const newVal = value.slice(0, idx) + (text.replace(/\D/g, "") || "") + value.slice(idx + 1);
    onChange(newVal.slice(0, length));
    if (text && idx < length - 1) inputs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (key: string, idx: number) => {
    if (key === "Backspace" && !value[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
      const newVal = value.slice(0, idx - 1) + " " + value.slice(idx);
      onChange(newVal);
    }
  };

  return (
    <View className="flex-row gap-sm justify-center">
      {Array.from({ length }).map((_, i) => (
        <TextInput
          key={i}
          ref={(r) => { inputs.current[i] = r; }}
          className={`
            w-12 h-14 rounded-lg border text-center text-xl font-sans-bold text-ink
            ${value[i] && value[i] !== " " ? "border-ink bg-canvas" : "border-ink/30 bg-canvas"}
          `}
          maxLength={1}
          keyboardType="number-pad"
          secureTextEntry={secureTextEntry}
          value={value[i] && value[i] !== " " ? value[i] : ""}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
          onFocus={() => {}}
        />
      ))}
    </View>
  );
}
