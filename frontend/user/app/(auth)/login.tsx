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
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast, Toast } from "@/components/ui/Toast";
import { parseApiError } from "@/utils/api";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuthStore();
  const { toast, show, hide } = useToast();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!phone.trim()) e.phone = "Nomor HP wajib diisi";
    if (!password) e.password = "Password wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authService.login({ phone: phone.trim(), password });
      await login(res.data.access_token);
      router.replace("/(tabs)");
    } catch (err: any) {
      show(parseApiError(err, "Login gagal. Periksa nomor HP dan password kamu."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas-soft"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero band */}
        <View
          style={{ paddingTop: insets.top + 48, paddingBottom: 40 }}
          className="px-xl bg-canvas-soft"
        >
          <View className="mb-xs">
            <Text className="text-5xl font-sans-black text-ink leading-none tracking-tight">
              Cicilin.
            </Text>
          </View>
          <Text className="text-base text-body mt-sm">
            Pinjaman cepat, skor kredit membaik.
          </Text>
        </View>

        {/* Form card */}
        <View className="flex-1 bg-canvas rounded-t-3xl px-xl pt-2xl pb-xl">
          <Text className="text-2xl font-sans-black text-ink mb-xs">Masuk</Text>
          <Text className="text-sm text-mute mb-2xl">Selamat datang kembali.</Text>

          <View className="gap-lg">
            <Input
              label="Nomor HP"
              placeholder="08xx xxxx xxxx"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              error={errors.phone}
            />
            <Input
              label="Password"
              placeholder="Password kamu"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />
          </View>

          <Button
            label="Masuk"
            loading={loading}
            onPress={handleLogin}
            className="mt-2xl"
          />

          <View className="flex-row justify-center mt-xl gap-xs">
            <Text className="text-sm text-body">Belum punya akun?</Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text className="text-sm font-sans-semibold text-ink underline">
                Daftar sekarang
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Toast {...toast} onHide={hide} />
    </KeyboardAvoidingView>
  );
}
