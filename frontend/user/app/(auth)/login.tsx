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
      style={{ flex: 1, backgroundColor: "#1a1c18" }}
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
          className="px-2xl"
        >
          <View className="flex flex-col gap-16">
            <View className="mb-xs">
              <Text className="text-4xl font-sans-black text-white leading-none tracking-tight" style={{ fontFamily: "PixelifySans_400Regular" }}>
                cicil.<Text className="text-primary">in</Text>
              </Text>
            </View>
            <View className="flex flex-col">
              <Text className="text-5xl text-white tracking-tight font-semibold leading-tight">
                Pinjaman <Text className="text-primary">cepat</Text>, dengan cicilan <Text className="text-primary">ringan</Text>.
              </Text>
              <Text className="text-ink/70 text-xs mt-md">Dapatkan keputusan pinjaman dalam hitungan detik dengan AI scoring.</Text>
            </View>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* Form card */}
        <View className="bg-canvas rounded-t-3xl px-xl pt-2xl pb-xl">
          <Text className="text-2xl font-sans-black text-ink mb-xl pr-1">Masuk</Text>

          <View className="gap-lg flex flex-col">
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
            <TouchableOpacity style={{ flexShrink: 0 }} onPress={() => router.push("/(auth)/register")}>
              <Text className="text-sm font-sans-semibold text-ink underline pr-1">
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
