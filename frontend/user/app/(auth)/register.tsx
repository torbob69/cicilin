import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { authService } from "@/services/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast, Toast } from "@/components/ui/Toast";
import { parseApiError } from "@/utils/api";

const TOTAL_STEPS = 2;

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast, show, hide } = useToast();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", password: "", confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validateStep1 = () => {
    const e: Partial<typeof form> = {};
    if (!form.full_name.trim()) e.full_name = "Nama wajib diisi";
    if (!form.phone.trim()) e.phone = "Nomor HP wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Partial<typeof form> = {};
    if (!form.email.trim()) e.email = "Email wajib diisi";
    if (form.password.length < 8) e.password = "Min. 8 karakter";
    if (form.password !== form.confirm) e.confirm = "Password tidak sama";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validateStep1()) return;
    setErrors({});
    setStep(2);
  };

  const handleBack = () => {
    setErrors({});
    setStep(1);
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      await authService.register({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      router.push({
        pathname: "/(auth)/otp",
        params: { phone: form.phone.trim(), purpose: "registration" },
      });
    } catch (err: any) {
      show(parseApiError(err, "Pendaftaran gagal."), "error");
    } finally {
      setLoading(false);
    }
  };

  const stepConfig = {
    1: {
      title: "Siapa\nkamu?",
      subtitle: "Masukkan identitas dasarmu untuk memulai.",
    },
    2: {
      title: "Buat\nakun.",
      subtitle: "Lengkapi email dan password untuk mengamankan akunmu.",
    },
  } as const;

  const { title, subtitle } = stepConfig[step as 1 | 2];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#1a1c18" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero band */}
        <View style={{ paddingTop: insets.top + 32, paddingBottom: 32 }} className="px-xl">
          <TouchableOpacity
            onPress={step === 1 ? () => router.back() : handleBack}
            className="mb-xl"
          >
            <Ionicons name="chevron-back" size={24} color="#e8ebe6" />
          </TouchableOpacity>

          {/* Step dots */}
          <View className="flex-row gap-xs mb-xl">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={{ width: i + 1 === step ? 20 : 8, height: 8, borderRadius: 4 }}
                className={i + 1 <= step ? "bg-primary" : "bg-white/30"}
              />
            ))}
          </View>

          <Text className="text-4xl font-sans-black text-white leading-tight">
            {title}
          </Text>
          <Text className="text-sm text-white/60 mt-sm">{subtitle}</Text>
        </View>

        <View style={{ flex: 1 }} />

        {/* Form card */}
        <View className="bg-canvas rounded-t-3xl px-xl pt-2xl pb-xl">
          {step === 1 ? (
            <View className="gap-lg">
              <Input
                label="Nama Lengkap"
                placeholder="Sesuai KTP"
                value={form.full_name}
                onChangeText={set("full_name")}
                error={errors.full_name}
              />
              <Input
                label="Nomor HP"
                placeholder="08xx xxxx xxxx"
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={set("phone")}
                error={errors.phone}
              />
            </View>
          ) : (
            <View className="gap-lg">
              <Input
                label="Email"
                placeholder="kamu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={set("email")}
                error={errors.email}
              />
              <Input
                label="Password"
                placeholder="Min. 8 karakter"
                secureTextEntry
                value={form.password}
                onChangeText={set("password")}
                error={errors.password}
              />
              <Input
                label="Konfirmasi Password"
                placeholder="Ulangi password"
                secureTextEntry
                value={form.confirm}
                onChangeText={set("confirm")}
                error={errors.confirm}
              />
            </View>
          )}

          <Button
            label={step === 1 ? "Lanjut" : "Daftar"}
            loading={loading}
            onPress={step === 1 ? handleNext : handleRegister}
            className="mt-2xl"
          />

          <View className="flex-row justify-center mt-xl gap-xs">
            <Text className="text-sm text-body">Sudah punya akun?</Text>
            <TouchableOpacity style={{ flexShrink: 0 }} onPress={() => router.back()}>
              <Text className="text-sm font-sans-semibold text-ink underline pr-1">
                Masuk
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Toast {...toast} onHide={hide} />
    </KeyboardAvoidingView>
  );
}
