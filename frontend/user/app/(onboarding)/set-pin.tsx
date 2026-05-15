import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { userService } from "@/services/users";
import { useAuthStore } from "@/store/auth";
import { OtpInput } from "@/components/ui/OtpInput";
import { Button } from "@/components/ui/Button";
import { useToast, Toast } from "@/components/ui/Toast";

export default function SetPinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setNewUser } = useAuthStore();
  const { toast, show, hide } = useToast();

  const [pin, setPin] = useState("      ");
  const [confirmPin, setConfirmPin] = useState("      ");
  const [step, setStep] = useState<"set" | "confirm">("set");
  const [loading, setLoading] = useState(false);

  const handleSetPin = () => {
    const trimmed = pin.trim();
    if (trimmed.length < 6) {
      show("Masukkan PIN 6 digit", "error");
      return;
    }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (pin.trim() !== confirmPin.trim()) {
      show("PIN tidak cocok", "error");
      setConfirmPin("      ");
      return;
    }
    setLoading(true);
    try {
      await userService.setPin(pin.trim());
      setNewUser(false);
      show("PIN berhasil dibuat! Selamat datang di Cicilin.", "success");
      setTimeout(() => router.replace("/(tabs)"), 800);
    } catch (err: any) {
      show(err?.response?.data?.detail ?? "Gagal membuat PIN", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas-soft"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ paddingTop: insets.top + 24 }} className="flex-1 px-xl">
        <TouchableOpacity
          onPress={() => step === "confirm" ? setStep("set") : router.back()}
          className="mb-xl"
        >
          <Ionicons name="chevron-back" size={24} color="#e8ebe6" />
        </TouchableOpacity>

        <View className="flex-row gap-xs mb-2xl">
          {[1, 2, 3, 4, 5].map((s) => (
            <View
              key={s}
              className="h-1 flex-1 rounded-pill bg-ink"
            />
          ))}
        </View>

        <Text className="text-2xl font-sans-black text-ink mb-xs">
          {step === "set" ? "Buat PIN" : "Konfirmasi PIN"}
        </Text>
        <Text className="text-sm text-body mb-3xl">
          {step === "set"
            ? "Langkah 5 dari 5 — PIN mengamankan pengajuan pinjaman"
            : "Masukkan ulang PIN kamu untuk konfirmasi"}
        </Text>

        {step === "set" ? (
          <>
            <OtpInput
              value={pin}
              onChange={setPin}
              length={6}
              secureTextEntry
            />
            <Button
              label="Buat PIN"
              onPress={handleSetPin}
              className="mt-2xl"
            />
          </>
        ) : (
          <>
            <OtpInput
              value={confirmPin}
              onChange={setConfirmPin}
              length={6}
              secureTextEntry
            />
            <Button
              label="Konfirmasi & Selesai"
              loading={loading}
              onPress={handleConfirm}
              className="mt-2xl"
            />
          </>
        )}
      </View>

      <Toast {...toast} onHide={hide} />
    </KeyboardAvoidingView>
  );
}
