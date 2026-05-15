import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { LOAN_TENURES, RANK_RATE } from "@/constants/config";

function monthlyInstallment(principal: number, annualRate: number, months: number) {
  if (annualRate === 0) return principal / months;
  const r = annualRate / 100 / 12;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

export default function TenureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { amount, intent } = useLocalSearchParams<{ amount: string; intent: string }>();
  const { user } = useAuthStore();

  const rank = user?.rank ?? "Gold";
  const rate = RANK_RATE[rank] ?? 15;
  const principal = Number(amount ?? "0");

  const [tenure, setTenure] = useState<number | null>(null);
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!tenure) { setError("Pilih tenor pinjaman"); return; }
    router.push({
      pathname: "/(tabs)/apply/confirm",
      params: { amount, intent, tenure: String(tenure) },
    });
  };

  return (
    <View className="flex-1 bg-canvas-soft">
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 120 }}
        className="px-xl"
      >
        <TouchableOpacity onPress={() => router.back()} className="mb-xl">
          <Ionicons name="chevron-back" size={24} color="#e8ebe6" />
        </TouchableOpacity>

        <View className="flex-row gap-xs mb-2xl">
          {[1, 2, 3].map((s) => (
            <View key={s} className={`h-1 flex-1 rounded-pill ${s <= 2 ? "bg-ink" : "bg-ink/20"}`} />
          ))}
        </View>

        <Text className="text-2xl font-sans-black text-ink mb-xs">Tenor Pinjaman</Text>
        <Text className="text-sm text-body mb-2xl">
          Rp {principal.toLocaleString("id-ID")} · {rate}% p.a.
        </Text>

        <View className="gap-sm">
          {LOAN_TENURES.map((t) => {
            const monthly = monthlyInstallment(principal, rate, t);
            const selected = tenure === t;

            return (
              <TouchableOpacity
                key={t}
                onPress={() => { setTenure(t); setError(""); }}
                activeOpacity={0.85}
                className={`rounded-xl p-lg border ${selected ? "bg-canvas border-primary" : "bg-canvas border-white/[0.06]"}`}
              >
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className={`text-lg font-sans-bold ${selected ? "text-primary" : "text-ink"}`}>
                      {t} bulan
                    </Text>
                    <Text className={`text-xs mt-xxs ${selected ? "text-primary/70" : "text-mute"}`}>
                      {t >= 12 ? `${t / 12} tahun` : `${t} bulan`}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className={`text-base font-sans-semibold ${selected ? "text-primary" : "text-ink"}`}>
                      Rp {Math.round(monthly * t).toLocaleString("id-ID")}
                    </Text>
                    <Text className={`text-xs ${selected ? "text-primary/70" : "text-mute"}`}>total tagihan</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {error && <Text className="text-xs text-negative mt-sm">{error}</Text>}

        <Button label="Lanjut" onPress={handleNext} className="mt-2xl" />
      </ScrollView>
    </View>
  );
}
