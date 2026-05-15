import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { OtpInput } from "@/components/ui/OtpInput";
import { Button } from "@/components/ui/Button";
import { useToast, Toast } from "@/components/ui/Toast";

export default function OtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone, purpose } = useLocalSearchParams<{ phone: string; purpose: string }>();
  const { setNewUser } = useAuthStore();
  const { toast, show, hide } = useToast();

  const [code, setCode] = useState("      ");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleVerify = async () => {
    const trimmed = code.trim();
    if (trimmed.length < 6) {
      show("Masukkan kode OTP 6 digit", "error");
      return;
    }
    setLoading(true);
    try {
      await authService.verifyOtp({ phone, code: trimmed, purpose });
      if (purpose === "register") {
        setNewUser(true);
        router.replace("/(onboarding)/personal");
      } else {
        router.back();
      }
    } catch (err: any) {
      show(err?.response?.data?.detail ?? "Kode OTP tidak valid", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await authService.resendOtp({ phone, purpose });
      setResendCooldown(60);
      show("OTP telah dikirim ulang ke WhatsApp kamu", "success");
    } catch {
      show("Gagal mengirim ulang OTP", "error");
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas-soft"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={{ paddingTop: insets.top + 32 }}
        className="flex-1 px-xl"
      >
        <TouchableOpacity onPress={() => router.back()} className="mb-2xl">
          <Ionicons name="chevron-back" size={24} color="#e8ebe6" />
        </TouchableOpacity>

        <Text className="text-4xl font-sans-black text-ink leading-tight mb-sm">
          Verifikasi{"\n"}nomormu.
        </Text>
        <Text className="text-base text-body mb-3xl">
          Kami mengirim kode 6 digit ke{"\n"}
          <Text className="font-sans-semibold text-ink">{phone}</Text> via WhatsApp.
        </Text>

        <OtpInput
          value={code}
          onChange={setCode}
          length={6}
        />

        <Button
          label="Verifikasi"
          loading={loading}
          onPress={handleVerify}
          className="mt-2xl"
        />

        <View className="flex-row justify-center mt-lg gap-xs">
          <Text className="text-sm text-body">Tidak menerima kode?</Text>
          <TouchableOpacity onPress={handleResend} disabled={resendCooldown > 0}>
            <Text
              className={`text-sm font-sans-semibold ${resendCooldown > 0 ? "text-mute" : "text-ink"
                }`}
            >
              {resendCooldown > 0 ? `Kirim ulang dalam ${resendCooldown}d` : "Kirim Ulang OTP"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Toast {...toast} onHide={hide} />
    </KeyboardAvoidingView>
  );
}
