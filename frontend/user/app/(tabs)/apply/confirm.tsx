import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LOAN_INTENTS, RANK_RATE } from "@/constants/config";

function monthlyInstallment(principal: number, annualRate: number, months: number) {
  if (annualRate === 0) return principal / months;
  const r = annualRate / 100 / 12;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-md border-b border-ink/5">
      <Text className="text-sm text-mute">{label}</Text>
      <Text className="text-sm font-sans-semibold text-ink">{value}</Text>
    </View>
  );
}

export default function ConfirmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { amount, intent, tenure } = useLocalSearchParams<{ amount: string; intent: string; tenure: string }>();
  const { user } = useAuthStore();

  const rank = user?.rank ?? "Gold";
  const rate = RANK_RATE[rank] ?? 15;
  const principal = Number(amount ?? "0");
  const months = Number(tenure ?? "12");
  const monthly = Math.round(monthlyInstallment(principal, rate, months));
  const total = monthly * months;

  const intentLabel = LOAN_INTENTS.find((i) => i.value === intent)?.label ?? intent;

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
            <View key={s} className="h-1 flex-1 rounded-pill bg-ink" />
          ))}
        </View>

        <Text className="text-2xl font-sans-black text-ink mb-xs">Tinjau & Ajukan</Text>
        <Text className="text-sm text-body mb-2xl">Periksa detail pinjaman sebelum melanjutkan</Text>

        <Card variant="white" noPad className="px-lg mb-lg">
          <Row label="Jumlah Pinjaman" value={`Rp ${principal.toLocaleString("id-ID")}`} />
          <Row label="Tujuan" value={intentLabel} />
          <Row label="Tenor" value={`${months} bulan`} />
          <Row label="Bunga" value={`${rate}% p.a. (${rank})`} />
          <View className="flex-row justify-between py-md border-b border-ink/5">
            <Text className="text-sm text-mute">Cicilan/bulan (estimasi)</Text>
            <Text className="text-sm font-sans-semibold text-ink">Rp {monthly.toLocaleString("id-ID")}</Text>
          </View>
          <View className="flex-row justify-between py-md">
            <Text className="text-sm font-sans-semibold text-ink">Total Tagihan</Text>
            <Text className="text-sm font-sans-bold text-ink">Rp {total.toLocaleString("id-ID")}</Text>
          </View>
        </Card>

        <Card variant="sage">
          <Text className="text-xs text-body leading-5">
            Pembayaran dilakukan sekali sebelum jatuh tempo di akhir tenor.
            PIN diperlukan untuk mengotorisasi pengajuan. Model ML akan mengevaluasi secara otomatis.
          </Text>
        </Card>

        <Button
          label="Lanjut ke PIN"
          onPress={() =>
            router.push({
              pathname: "/(tabs)/apply/pin",
              params: { amount, intent, tenure },
            })
          }
          className="mt-2xl"
        />
      </ScrollView>
    </View>
  );
}
