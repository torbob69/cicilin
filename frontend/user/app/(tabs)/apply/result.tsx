import React from "react";
import { View, Text } from "react-native";
import { useRouter, useLocalSearchParams, router as staticRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface ResultConfig {
  icon: IoniconName;
  iconColor: string;
  title: string;
  subtitle: string;
  bg: string;
  titleColor: string;
}

export default function ResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, confidence, loanId, message } =
    useLocalSearchParams<{ status: string; confidence: string; loanId: string; message: string }>();

  const isApproved = status === "approved";
  const isManualReview = status === "manual_review";
  const isRejected = status === "rejected";

  const config: ResultConfig = isApproved
    ? { icon: "checkmark-circle-outline", iconColor: "#4ade80", title: "Disetujui", subtitle: "Pinjaman kamu telah disetujui.", bg: "bg-primary-pale border border-positive/20", titleColor: "text-positive-deep" }
    : isManualReview
    ? { icon: "time-outline", iconColor: "#ffd11a", title: "Dalam Peninjauan", subtitle: "Aplikasi kamu memerlukan tinjauan manual dari tim kami.", bg: "bg-canvas border border-white/[0.06]", titleColor: "text-warning-content" }
    : isRejected
    ? { icon: "close-circle-outline", iconColor: "#f87171", title: "Tidak Disetujui", subtitle: "Aplikasi kamu tidak disetujui saat ini.", bg: "bg-canvas border border-white/[0.06]", titleColor: "text-negative" }
    : { icon: "warning-outline", iconColor: "#fde68a", title: "Terjadi Kesalahan", subtitle: message ?? "Sesuatu berjalan tidak semestinya.", bg: "bg-canvas border border-white/[0.06]", titleColor: "text-ink" };

  return (
    <View
      style={{ paddingTop: insets.top + 48 }}
      className="flex-1 bg-canvas-soft items-center px-xl"
    >
      <View className={`w-full rounded-xl p-2xl items-center gap-lg ${config.bg}`}>
        <View className="w-16 h-16 rounded-full bg-canvas-soft items-center justify-center">
          <Ionicons name={config.icon} size={36} color={config.iconColor} />
        </View>
        <View className="items-center gap-xs">
          <Text className={`text-xl font-sans-bold ${config.titleColor}`}>{config.title}</Text>
          <Text className="text-sm text-body text-center leading-5">{config.subtitle}</Text>
        </View>

        {confidence && (
          <View className="bg-canvas/60 rounded-pill px-xl py-sm">
            <Text className="text-sm font-sans-semibold text-mute">
              Skor: {Math.round(Number(confidence) * 100)}%
            </Text>
          </View>
        )}
      </View>

      <View className="w-full mt-2xl gap-sm">
        {(isApproved || isManualReview) && loanId && (
          <Button
            label="Lihat Detail Pinjaman"
            onPress={() => {
              staticRouter.dismissAll();
              router.replace("/(tabs)/status");
              router.push({ pathname: "/loan-detail", params: { id: loanId } });
            }}
          />
        )}
        <Button
          variant="secondary"
          label="Kembali ke Beranda"
          onPress={() => {
            staticRouter.dismissAll();
            router.replace("/(tabs)");
          }}
        />
      </View>
    </View>
  );
}
