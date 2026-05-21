import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loanService } from "@/services/loans";
import { OtpInput } from "@/components/ui/OtpInput";
import { Button } from "@/components/ui/Button";
import { useToast, Toast } from "@/components/ui/Toast";

export default function PinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { amount, intent, tenure } = useLocalSearchParams<{
    amount: string; intent: string; tenure: string;
  }>();
  const { toast, show, hide } = useToast();

  const [pin, setPin] = useState("      ");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = pin.trim();
    if (trimmed.length < 6) {
      show("Masukkan PIN 6 digit kamu", "error");
      return;
    }
    setLoading(true);
    try {
      router.replace({
        pathname: "/(tabs)/apply/waiting",
        params: { amount, intent, tenure, pin: trimmed },
      });
    } catch {
      show("Terjadi kesalahan", "error");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas-soft"
      behavior={Platform.OS === "android" ? "height" : "padding"}
    >
      <View style={{ paddingTop: insets.top + 24 }} className="flex-1 px-xl">
        <TouchableOpacity onPress={() => router.back()} className="mb-xl">
          <Ionicons name="chevron-back" size={24} color="#e8ebe6" />
        </TouchableOpacity>

        <Text className="text-2xl font-sans-black text-ink mb-xs">Masukkan PIN</Text>
        <Text className="text-sm text-body mb-3xl">
          Otorisasi pengajuan pinjaman{"\n"}
          <Text className="font-sans-semibold text-ink">
            Rp {Number(amount).toLocaleString("id-ID")}
          </Text>
        </Text>

        <OtpInput value={pin} onChange={setPin} length={6} secureTextEntry />

        <Button label="Ajukan Pinjaman" loading={loading} onPress={handleSubmit} className="mt-2xl" />
      </View>

      <Toast {...toast} onHide={hide} />
    </KeyboardAvoidingView>
  );
}
