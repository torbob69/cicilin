import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams, router as staticRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { useLoanSheet } from "@/store/loanSheet";

type ShapFeature = { feature: string; label: string; shap_value: number };

function ShapChart({ data }: { data: ShapFeature[] }) {
  if (!data || data.length === 0) return null;
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.shap_value)), 0.001);

  return (
    <View className="w-full mt-lg">
      <Text className="text-sm font-sans-semibold text-ink mb-md">
        Rincian
      </Text>
      <View className="gap-sm">
        {data.map((item) => {
          const pct = Math.abs(item.shap_value) / maxAbs;
          const isPositive = item.shap_value >= 0;
          return (
            <View key={item.feature}>
              <View className="flex-row justify-between mb-xs">
                <Text className="text-xs text-body flex-1 mr-sm" numberOfLines={1}>
                  {item.label}
                </Text>
                <Text
                  className={`text-xs font-sans-semibold ${isPositive ? "text-primary" : "text-negative"}`}
                >
                  {isPositive ? "+" : ""}{item.shap_value.toFixed(3)}
                </Text>
              </View>
              <View className="h-1.5 bg-ink/10 rounded-full overflow-hidden">
                <View
                  style={{ width: `${Math.round(pct * 100)}%` }}
                  className={`h-full rounded-full ${isPositive ? "bg-primary" : "bg-negative"}`}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

interface ResultConfig {
  title: string;
  subtitle: string;
  bg: string;
  titleColor: string;
}

export default function ResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { open: openLoanSheet } = useLoanSheet();
  const { status, confidence, loanId, message, shap } =
    useLocalSearchParams<{ status: string; confidence: string; loanId: string; message: string; shap: string }>();

  const shapData: ShapFeature[] = React.useMemo(() => {
    try { return shap ? JSON.parse(shap) : []; }
    catch { return []; }
  }, [shap]);

  const isApproved = status === "approved";
  const isManualReview = status === "manual_review";
  const isRejected = status === "rejected";

  const config: ResultConfig = isApproved
    ? { title: "Diterima", subtitle: "Pinjaman kamu telah disetujui.", bg: "bg-primary-pale border border-positive/20", titleColor: "text-primary" }
    : isManualReview
    ? { title: "Dalam Peninjauan", subtitle: "Aplikasi kamu memerlukan tinjauan manual dari tim kami.", bg: "bg-canvas border border-white/[0.06]", titleColor: "text-warning-content" }
    : isRejected
    ? { title: "Ditolak", subtitle: "Aplikasi kamu tidak disetujui saat ini.", bg: "bg-canvas border border-white/[0.06]", titleColor: "text-negative" }
    : { title: "Terjadi Kesalahan", subtitle: message ?? "Sesuatu berjalan tidak semestinya.", bg: "bg-canvas border border-white/[0.06]", titleColor: "text-ink" };

  const gifSource = isApproved
    ? require("@/assets/approved.gif")
    : isManualReview
    ? require("@/assets/inreview.gif")
    : isRejected
    ? require("@/assets/rejected.gif")
    : null;

  return (
    <View className="flex-1 bg-canvas-soft">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 48,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className={`w-full rounded-xl p-2xl items-center gap-lg`}>
          {gifSource ? (
            <Image
              source={gifSource}
              style={{ width: 240, height: 240 }}
              contentFit="contain"
            />
          ) : (
            <View className="w-16 h-16 rounded-full bg-canvas-soft items-center justify-center">
              <Ionicons name="warning-outline" size={36} color="#fde68a" />
            </View>
          )}

          <View className="items-center gap-xs">
            <Text className={`text-xl font-sans-bold ${config.titleColor}`}>{config.title}</Text>
            <Text className="text-sm text-body text-center leading-5">{config.subtitle}</Text>
          </View>

          {confidence && (() => {
            const pct = Math.round(Number(confidence) * 100);
            const high = pct >= 75;
            return (
              <View style={{ backgroundColor: high ? "#9fe870" : "#ffd11a", borderRadius: 999, paddingHorizontal: 20, paddingVertical: 6 }}>
                <Text style={{ fontSize: 13, fontFamily: "DMSans_600SemiBold", color: "#0e0f0c" }}>
                  Confidence: {pct}%
                </Text>
              </View>
            );
          })()}

          {shapData.length > 0 && <ShapChart data={shapData} />}
        </View>

        <View className="items-center mt-2xl gap-sm">
          {(isApproved || isManualReview) && loanId && (
            <Button
              label="Lihat Detail Pinjaman"
              onPress={() => {
                staticRouter.dismissAll();
                router.replace("/(tabs)/status");
                openLoanSheet(Number(loanId));
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
      </ScrollView>
    </View>
  );
}
