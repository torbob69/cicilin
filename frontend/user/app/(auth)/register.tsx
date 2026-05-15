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

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast, show, hide } = useToast();

  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", password: "", confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.full_name.trim()) e.full_name = "Nama wajib diisi";
    if (!form.phone.trim()) e.phone = "Nomor HP wajib diisi";
    if (!form.email.trim()) e.email = "Email wajib diisi";
    if (form.password.length < 8) e.password = "Min. 8 karakter";
    if (form.password !== form.confirm) e.confirm = "Password tidak sama";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
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
        {/* Hero */}
        <View style={{ paddingTop: insets.top + 32, paddingBottom: 32 }} className="px-xl">
          <TouchableOpacity onPress={() => router.back()} className="mb-xl">
            <Ionicons name="chevron-back" size={24} color="#e8ebe6" />
          </TouchableOpacity>
          <Text className="text-4xl font-sans-black text-ink leading-tight">
            Buat akun{"\n"}baru.
          </Text>
          <Text className="text-sm text-body mt-sm">
            Mulai perjalanan kreditmu bersama Cicilin.
          </Text>
        </View>

        {/* Form */}
        <View className="flex-1 bg-canvas rounded-t-3xl px-xl pt-2xl pb-xl">
          <View className="gap-lg">
            <Input label="Nama Lengkap" placeholder="Sesuai KTP" value={form.full_name} onChangeText={set("full_name")} error={errors.full_name} />
            <Input label="Nomor HP" placeholder="08xx xxxx xxxx" keyboardType="phone-pad" value={form.phone} onChangeText={set("phone")} error={errors.phone} />
            <Input label="Email" placeholder="kamu@email.com" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={set("email")} error={errors.email} />
            <Input label="Password" placeholder="Min. 8 karakter" secureTextEntry value={form.password} onChangeText={set("password")} error={errors.password} />
            <Input label="Konfirmasi Password" placeholder="Ulangi password" secureTextEntry value={form.confirm} onChangeText={set("confirm")} error={errors.confirm} />
          </View>

          <Button label="Daftar" loading={loading} onPress={handleRegister} className="mt-2xl" />

          <View className="flex-row justify-center mt-xl gap-xs">
            <Text className="text-sm text-body">Sudah punya akun?</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-sm font-sans-semibold text-ink underline">Masuk</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Toast {...toast} onHide={hide} />
    </KeyboardAvoidingView>
  );
}
