import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { LOAN_INTENTS, RANK_LIMIT } from "@/constants/config";
import { Ionicons } from "@expo/vector-icons";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];
const INTENT_ICON: Record<string, IoniconName> = {
  EDUCATION:         "school-outline",
  MEDICAL:           "medkit-outline",
  VENTURE:           "business-outline",
  PERSONAL:          "person-outline",
  DEBTCONSOLIDATION: "refresh-outline",
  HOMEIMPROVEMENT:   "home-outline",
};

export default function ApplyAmountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const rank = user?.rank ?? "Gold";
  const limit = RANK_LIMIT[rank] ?? 0;

  const [rawAmount, setRawAmount] = useState("");
  const [intent, setIntent] = useState("");
  const [errors, setErrors] = useState<{ amount?: string; intent?: string }>({});

  // Reset form every time this screen comes into focus (fresh apply flow)
  useFocusEffect(
    useCallback(() => {
      setRawAmount("");
      setIntent("");
      setErrors({});
    }, [])
  );

  const numericAmount = Number(rawAmount.replace(/\./g, ""));

  const validate = () => {
    const e: typeof errors = {};
    if (!numericAmount || numericAmount < 100_000) e.amount = "Minimal Rp 100.000";
    else if (numericAmount > limit) e.amount = `Melebihi limit Rp ${limit.toLocaleString("id-ID")}`;
    if (!intent) e.intent = "Pilih tujuan pinjaman";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    router.push({ pathname: "/(tabs)/apply/tenure", params: { amount: String(numericAmount), intent } });
  };

  const handleAmountChange = (val: string) => {
    const digits = val.replace(/\D/g, "");
    if (!digits) { setRawAmount(""); return; }
    setRawAmount(Number(digits).toLocaleString("id-ID"));
  };

  const pct = limit > 0 ? Math.min(numericAmount / limit, 1) : 0;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas-soft"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 120 }}
        className="px-xl"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-2xl">
          <TouchableOpacity onPress={() => router.back()} className="p-sm -ml-sm">
            <Ionicons name="close" size={22} color="#e8ebe6" />
          </TouchableOpacity>
          <View className="flex-row gap-xs">
            {[1, 2, 3].map((s) => (
              <View key={s} className={`h-1 w-8 rounded-pill ${s === 1 ? "bg-primary" : "bg-white/20"}`} />
            ))}
          </View>
          <View className="w-8" />
        </View>

        <Text className="text-2xl font-sans-black text-ink mb-xs">Jumlah Pinjaman</Text>
        <Text className="text-sm text-mute mb-2xl">
          Limit kamu: <Text className="font-sans-semibold text-ink">Rp {limit.toLocaleString("id-ID")}</Text> ({rank})
        </Text>

        {/* Amount input */}
        <View className="mb-xl">
          <View className={`bg-canvas rounded-xl border-2 px-xl py-lg flex-row items-center ${
            errors.amount ? "border-negative" : numericAmount ? "border-ink" : "border-ink/20"
          }`}>
            <Text className="text-xl font-sans-semibold text-mute mr-sm">Rp</Text>
            <TextInput
              className="flex-1 text-2xl font-sans-black text-ink"
              placeholder="0"
              placeholderTextColor="#868685"
              keyboardType="number-pad"
              value={rawAmount}
              onChangeText={handleAmountChange}
            />
          </View>
          {errors.amount ? (
            <Text className="text-xs text-negative mt-xs">{errors.amount}</Text>
          ) : numericAmount > 0 && (
            <View className="mt-sm gap-xs">
              <View className="h-1.5 bg-ink/10 rounded-pill overflow-hidden">
                <View style={{ width: `${pct * 100}%` }} className="h-full bg-primary rounded-pill" />
              </View>
              <Text className="text-xs text-mute">
                {(pct * 100).toFixed(0)}% dari limit bulananmu
              </Text>
            </View>
          )}
        </View>

        {/* Intent */}
        <Text className="text-sm font-sans-semibold text-ink mb-sm">Tujuan Pinjaman</Text>
        <View className="flex-row flex-wrap gap-sm mb-xs">
          {LOAN_INTENTS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => { setIntent(opt.value); setErrors((e) => ({ ...e, intent: undefined })); }}
              activeOpacity={0.8}
              className={`flex-row items-center gap-sm px-lg py-md rounded-xl border ${
                intent === opt.value ? "bg-canvas border-primary" : "bg-canvas border-white/[0.06]"
              }`}
            >
              <Ionicons
                name={INTENT_ICON[opt.value] ?? "ellipse-outline"}
                size={16}
                color={intent === opt.value ? "#9fe870" : "#525550"}
              />
              <Text className={`text-sm font-sans-semibold ${intent === opt.value ? "text-primary" : "text-mute"}`}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.intent && <Text className="text-xs text-negative mb-md">{errors.intent}</Text>}

        <Button label="Lanjut" onPress={handleNext} className="mt-lg" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
